import { Router } from 'express';
import { requireAuth } from '../middleware.js';

export const channelRouter = Router();

channelRouter.use(requireAuth);

channelRouter.get('/', (req, res) => {
  const db = req.app.locals.db;
  const channels = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM channel_members WHERE channel_id = c.id) as member_count,
      EXISTS(SELECT 1 FROM channel_members WHERE channel_id = c.id AND user_id = ?) as is_member,
      (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.channel_id = c.id
          AND m.id > COALESCE(
            (SELECT last_read_message_id FROM channel_reads WHERE channel_id = c.id AND user_id = ?),
            -1
          )
          AND m.user_id != ?
      ) as unread_count
    FROM channels c
    ORDER BY c.name
  `).all(req.session.userId, req.session.userId, req.session.userId);
  res.json(channels);
});

channelRouter.post('/', (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Channel name required' });
  }

  const channelName = name.trim().toLowerCase().replace(/\s+/g, '-');
  const db = req.app.locals.db;

  const existing = db.prepare('SELECT id FROM channels WHERE name = ?').get(channelName);
  if (existing) {
    return res.status(409).json({ error: 'Channel already exists' });
  }

  const result = db.prepare(
    'INSERT INTO channels (name, description, created_by) VALUES (?, ?, ?)'
  ).run(channelName, description || '', req.session.userId);

  // Auto-join creator
  db.prepare('INSERT INTO channel_members (channel_id, user_id) VALUES (?, ?)').run(
    result.lastInsertRowid,
    req.session.userId
  );

  // Mark channel as read at creation time so creator starts with 0 unread
  _markRead(db, result.lastInsertRowid, req.session.userId);

  const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(channel);
});

channelRouter.post('/:id/join', (req, res) => {
  const db = req.app.locals.db;
  const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(req.params.id);
  if (!channel) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  db.prepare('INSERT OR IGNORE INTO channel_members (channel_id, user_id) VALUES (?, ?)').run(
    channel.id,
    req.session.userId
  );

  // Mark as read at join time so users don't get flooded with "unread" backlog
  _markRead(db, channel.id, req.session.userId);

  res.json({ ok: true });
});

channelRouter.post('/:id/leave', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('DELETE FROM channel_members WHERE channel_id = ? AND user_id = ?').run(
    req.params.id,
    req.session.userId
  );
  res.json({ ok: true });
});

// Mark all current messages in a channel as read for the requesting user
channelRouter.post('/:id/read', (req, res) => {
  const db = req.app.locals.db;
  _markRead(db, req.params.id, req.session.userId);
  res.json({ ok: true });
});

/**
 * Upserts channel_reads with the latest message ID in the channel.
 * If the channel has no messages, sets last_read_message_id = 0 (meaning nothing to read).
 */
function _markRead(db, channelId, userId) {
  const latest = db.prepare(
    'SELECT COALESCE(MAX(id), 0) as max_id FROM messages WHERE channel_id = ?'
  ).get(channelId);

  db.prepare(`
    INSERT INTO channel_reads (channel_id, user_id, last_read_message_id, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(channel_id, user_id) DO UPDATE SET
      last_read_message_id = MAX(last_read_message_id, excluded.last_read_message_id),
      updated_at = excluded.updated_at
  `).run(channelId, userId, latest.max_id);
}
