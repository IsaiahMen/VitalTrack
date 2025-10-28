import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { getDB } from './db.js';   // <-- SQLite helper

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  try {
    const db = await getDB();
    const hash = await bcrypt.hash(password, 10);
    const id = uuid();

    await db.run(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      [id, email, hash]
    );

    req.session.userId = id;
    res.json({ ok: true, userId: id });
  } catch (e) {
    if (String(e).includes('UNIQUE')) return res.status(409).json({ error: 'email already exists' });
    res.status(500).json({ error: 'server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const db = await getDB();
  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) return res.status(401).json({ error: 'invalid credentials' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });

  req.session.userId = user.id;
  res.json({ ok: true, userId: user.id });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'not logged in' });
  res.json({ userId: req.session.userId });
});

export default router;
