import express from 'express';
import { v4 as uuid } from 'uuid';
import { getDB } from './db.js';

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'auth required' });
  next();
}

// LIST meals
router.get('/', requireAuth, async (req, res) => {
  const db = await getDB();
  const rows = await db.all(
    'SELECT * FROM meals WHERE user_id = ? ORDER BY date DESC',
    [req.session.userId]
  );
  res.json(rows);
});

// CREATE meal
router.post('/', requireAuth, async (req, res) => {
  const { date, food, calories, protein, carbs, fat, notes } = req.body || {};
  if (!date || !food) return res.status(400).json({ error: 'date and food required' });
  for (const n of ['calories', 'protein', 'carbs', 'fat']) {
    if (req.body[n] && isNaN(Number(req.body[n]))) {
      return res.status(400).json({ error: `${n} must be a number` });
    }
  }
  const db = await getDB();
  const id = uuid();
  await db.run(
    `INSERT INTO meals (id, user_id, date, food, calories, protein, carbs, fat, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, req.session.userId, date, food, calories ?? null, protein ?? null, carbs ?? null, fat ?? null, notes ?? null]
  );
  res.status(201).json({ ok: true, id });
});

// UPDATE meal
router.put('/:id', requireAuth, async (req, res) => {
  const { date, food, calories, protein, carbs, fat, notes } = req.body || {};
  if (!date || !food) return res.status(400).json({ error: 'date and food required' });
  for (const n of ['calories', 'protein', 'carbs', 'fat']) {
    if (req.body[n] && isNaN(Number(req.body[n]))) {
      return res.status(400).json({ error: `${n} must be a number` });
    }
  }
  const db = await getDB();
  const result = await db.run(
    `UPDATE meals
       SET date = ?, food = ?, calories = ?, protein = ?, carbs = ?, fat = ?, notes = ?
     WHERE id = ? AND user_id = ?`,
    [date, food, calories ?? null, protein ?? null, carbs ?? null, fat ?? null, notes ?? null, req.params.id, req.session.userId]
  );
  if (result.changes === 0) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

// DELETE meal
router.delete('/:id', requireAuth, async (req, res) => {
  const db = await getDB();
  await db.run('DELETE FROM meals WHERE id = ? AND user_id = ?', [
    req.params.id,
    req.session.userId,
  ]);
  res.json({ ok: true });
});

export default router;
