import { Router } from 'express';
import { requireAuth } from '../middleware.js';

export const messageRouter = Router();

messageRouter.use(requireAuth);

messageRouter.get('/:channelId', (req, res) => {
  const db = req.app.locals.db;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const before = req.query.before;

  let query = `
    SELECT m.*, u.username, u.display_name
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.channel_id = ?
  `;
  const params = [req.params.channelId];

  if (before) {
    query += ' AND m.id < ?';
    params.push(before);
  }

  query += ' ORDER BY m.created_at DESC LIMIT ?';
  params.push(limit);

  const messages = db.prepare(query).all(...params);
  res.json(messages.reverse());
});

messageRouter.get('/search/all', (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }

  const db = req.app.locals.db;
  const messages = db.prepare(`
    SELECT m.*, u.username, u.display_name, c.name as channel_name
    FROM messages m
    JOIN users u ON m.user_id = u.id
    JOIN channels c ON m.channel_id = c.id
    WHERE m.content LIKE ?
    ORDER BY m.created_at DESC
    LIMIT 50
  `).all(`%${q.trim()}%`);

  res.json(messages);
});
