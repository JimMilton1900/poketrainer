import { Router } from 'express';
import fs from 'fs';
import  db  from '../config/db.js';

const raw = fs.readFileSync(new URL('../sql/queries.sql', import.meta.url), 'utf8');

// We're Spliting  the "-- @@ " markers into { id, title, purpose, sql }
const reports = raw.split(/^-- @@ /m).slice(1).map((block, i) => {
  const [head, ...rest] = block.split('\n');
  const [title, purpose] = head.split('|').map((s) => s.trim());
  return { id: i + 1, title, purpose, sql: rest.join(' ').trim().replace(/;$/, '') };
});

const router = Router();

router.get('/', (req, res) => res.json(reports));

router.get('/:id', async (req, res, next) => {
  const report = reports.find((r) => r.id === Number(req.params.id));
  if (!report) return res.status(404).json({ error: 'No such report' });
  try {
    const [rows] = await db.query(report.sql); // SQL comes from our file, never from the user
    res.json({ ...report, rows });
  } catch (e) { next(e); }
});

export default router;