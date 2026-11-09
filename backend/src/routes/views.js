import { Router } from 'express';
import  db  from '../config/db.js';
import { wrap, HttpError } from '../utils.js';

const router = Router();

const listViews = async () => {
  const [rows] = await db.query(
    `SELECT TABLE_NAME AS name, IS_UPDATABLE AS is_updatable
     FROM information_schema.VIEWS
     WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME`);
  return rows;
};

// GET /api/views -> every view in the database
router.get('/', wrap(async (req, res) => {
  const views = await listViews();
  res.json(views.map((v) => ({ name: v.name, updatable: v.is_updatable === 'YES' })));
}));

// GET /api/views/v_team_summary -> definition + columns + rows
router.get('/:name', wrap(async (req, res) => {
  // Whitelist: the name must be a real view, so it is safe to use as an identifier below
  const view = (await listViews()).find((v) => v.name === req.params.name);
  if (!view) throw new HttpError(404, 'No such view');

  const [[def]] = await db.query('SHOW CREATE VIEW ??', [view.name]);
  const [columns] = await db.query(
    `SELECT COLUMN_NAME AS name, DATA_TYPE AS type
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`, [view.name]);
  const [rows] = await db.query('SELECT * FROM ?? LIMIT 100', [view.name]);

  res.json({
    name: view.name,
    type: 'VIEW',
    updatable: view.is_updatable === 'YES',
    createStatement: def['Create View'],
    columns,
    rows,
  });
}));

export default router;