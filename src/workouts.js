import express from 'express';
import { v4 as uuid } from 'uuid';
import { getDB } from './db.js';

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'auth required' });
  next();
}

// LIST workouts for logged-in user
router.get('/', requireAuth, async (req, res) => {
  const db = await getDB();
  const rows = await db.all(
    'SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC',
    [req.session.userId]
  );
  res.json(rows);
});

// CREATE workout
router.post('/', requireAuth, async (req, res) => {
  const { date, exercise, weight, reps, notes } = req.body || {};
  if (!date || !exercise) return res.status(400).json({ error: 'date and exercise required' });
  if (weight && isNaN(Number(weight))) return res.status(400).json({ error: 'weight must be a number' });
  if (reps && isNaN(Number(reps))) return res.status(400).json({ error: 'reps must be a number' });

  const db = await getDB();
  const id = uuid();
  await db.run(
    `INSERT INTO workouts (id, user_id, date, exercise, weight, reps, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, req.session.userId, date, exercise, weight ?? null, reps ?? null, notes ?? null]
  );
  res.status(201).json({ ok: true, id });
});

// UPDATE workout
router.put('/:id', requireAuth, async (req, res) => {
  const { date, exercise, weight, reps, notes } = req.body || {};
  if (!date || !exercise) return res.status(400).json({ error: 'date and exercise required' });
  if (weight && isNaN(Number(weight))) return res.status(400).json({ error: 'weight must be a number' });
  if (reps && isNaN(Number(reps))) return res.status(400).json({ error: 'reps must be a number' });

  const db = await getDB();
  const result = await db.run(
    `UPDATE workouts
       SET date = ?, exercise = ?, weight = ?, reps = ?, notes = ?
     WHERE id = ? AND user_id = ?`,
    [date, exercise, weight ?? null, reps ?? null, notes ?? null, req.params.id, req.session.userId]
  );
  if (result.changes === 0) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

// DELETE workout
router.delete('/:id', requireAuth, async (req, res) => {
  const db = await getDB();
  await db.run('DELETE FROM workouts WHERE id = ? AND user_id = ?', [
    req.params.id,
    req.session.userId,
  ]);
  res.json({ ok: true });
});

export default router;
