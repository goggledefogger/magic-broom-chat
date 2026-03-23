import { Router } from 'express';
import { requireAuth } from '../middleware.js';

export const channelRouter = Router();

channelRouter.use(requireAuth);

channelRouter.get('/', (req, res) => {
  const db = req.app.locals.db;
  const channels = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM channel_members WHERE channel_id = c.id) as member_count,
      EXISTS(SELECT 1 FROM channel_members WHERE channel_id = c.id AND user_id = ?) as is_member
    FROM channels c
    ORDER BY c.name
  `).all(req.session.userId);
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
