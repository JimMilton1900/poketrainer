import { Router } from 'express';
import  db  from '../config/db.js';
import { wrap, HttpError } from '../utils.js';
import { explainMysqlError } from '../middleware/errHand.js';
import { DEMOS } from '../constraintDemos.js';

const router = Router();

const summarize = (r) =>
  Array.isArray(r) ? { rows: r } : { affectedRows: r.affectedRows, insertId: r.insertId || null };

async function runDemo(demo) {
  const conn = await db.getConnection();
  const steps = [];
  let error = null;
  try {
    await conn.beginTransaction();
    for (const sql of demo.steps) {
      try {
        const [result] = await conn.query(sql);
        steps.push({ sql, ok: true, ...summarize(result) });
      } catch (e) {
        steps.push({ sql, ok: false });
        const info = explainMysqlError(e);
        if (info) { const { status, ...rest } = info; error = rest; }
        else error = { error: 'Unexpected database error', mysql: { code: e.code, message: e.sqlMessage || e.message } };
        break; // stop at the first failing statement
      }
    }
  } finally {
    try { await conn.rollback(); } catch { /* connection already gone */ }
    conn.release();
  }

  const outcome = error ? 'error' : 'success';
  return {
    id: demo.id, constraint: demo.constraint, title: demo.title, why: demo.why,
    expect: demo.expect, outcome, matched: outcome === demo.expect,
    error, steps, rolledBack: true,
  };
}

// GET /api/constraints  -> the catalog (nothing is executed)
router.get('/', (req, res) => res.json(DEMOS));

// POST /api/constraints/run-all  -> runs every demo; handy as a self-test
router.post('/run-all', wrap(async (req, res) => {
  const results = [];
  for (const d of DEMOS) results.push(await runDemo(d));
  const failed = results.filter((r) => !r.matched).map((r) => r.id);
  res.json({ total: results.length, matched: results.length - failed.length, failed, results });
}));

// POST /api/constraints/check-level/run
router.post('/:id/run', wrap(async (req, res) => {
  const demo = DEMOS.find((d) => d.id === req.params.id);
  if (!demo) throw new HttpError(404, 'No such demo');
  res.json(await runDemo(demo));
}));

export default router;