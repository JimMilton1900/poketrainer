import { Router } from 'express';
import  db  from '../config/db.js';
import { wrap, paging, sortClause } from '../utils.js';

const router = Router();

router.get('/types', wrap(async (req, res) => {
  const [rows] = await db.query('SELECT id, name FROM types ORDER BY name');
  res.json(rows);
}));

// GET /api/moves?search=fire&type=fire&min_power=80&sort=power&order=desc
router.get('/moves', wrap(async (req, res) => {
  const { search = '', type, min_power } = req.query;
  const { page, limit, offset } = paging(req.query, 30);
  const SORTS = { id: 'm.id', name: 'm.name', power: 'm.power', accuracy: 'm.accuracy', pp: 'm.pp', type: 't.name' };

  const where = ['m.name LIKE ?'];
  const params = [`%${search}%`];
  if (type)      { where.push('t.name = ?');    params.push(type); }
  if (min_power) { where.push('m.power >= ?');  params.push(min_power); }

  const [data] = await db.query(
    `SELECT m.id, m.name, t.name AS type, m.power, m.accuracy, m.pp
     FROM moves m JOIN types t ON t.id = m.type_id
     WHERE ${where.join(' AND ')}
     ORDER BY ${sortClause(req.query, SORTS, 'id')} LIMIT ? OFFSET ?`,
    [...params, limit, offset]);
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM moves m JOIN types t ON t.id = m.type_id WHERE ${where.join(' AND ')}`, params);

  res.json({ page, limit, total, data });
}));

// Dashboard cards + the "10+ rows in each table" proof
router.get('/stats', wrap(async (req, res) => {
  const [[row]] = await db.query(
    `SELECT (SELECT COUNT(*) FROM types)             AS types,
            (SELECT COUNT(*) FROM pokemon)           AS pokemon,
            (SELECT COUNT(*) FROM pokemon_types)     AS pokemon_types,
            (SELECT COUNT(*) FROM moves)             AS moves,
            (SELECT COUNT(*) FROM trainers)          AS trainers,
            (SELECT COUNT(*) FROM teams)             AS teams,
            (SELECT COUNT(*) FROM team_members)      AS team_members,
            (SELECT COUNT(*) FROM team_member_moves) AS team_member_moves,
            (SELECT COUNT(*) FROM battles)           AS battles`);
  res.json(row);
}));

export default router;