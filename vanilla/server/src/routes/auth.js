import { Router } from 'express';
import bcrypt from 'bcrypt';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const { username, password, displayName } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const db = req.app.locals.db;
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const hash = await bcrypt.hash(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)'
  ).run(username, hash, displayName || username);

  // Auto-join #general
  const general = db.prepare("SELECT id FROM channels WHERE name = 'general'").get();
  if (general) {
    db.prepare('INSERT OR IGNORE INTO channel_members (channel_id, user_id) VALUES (?, ?)').run(
      general.id,
      result.lastInsertRowid
    );
  }

  req.session.userId = result.lastInsertRowid;
  res.json({ id: result.lastInsertRowid, username, displayName: displayName || username });
});

authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const db = req.app.locals.db;

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.userId = user.id;
  res.json({ id: user.id, username: user.username, displayName: user.display_name });
});

authRouter.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

authRouter.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const db = req.app.locals.db;
  const user = db.prepare('SELECT id, username, display_name FROM users WHERE id = ?').get(
    req.session.userId
  );
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({ id: user.id, username: user.username, displayName: user.display_name });
});
