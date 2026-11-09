import { Router } from 'express';
import  db  from '../config/db.js';
import { wrap, HttpError, paging, sortClause, buildInsert, buildUpdate, validateId } from '../utils.js';

const router = Router();
router.param('id', validateId);

const SORTS = { id: 'b.id', date: 'b.battled_at', team1: 't1.name', team2: 't2.name', winner: 'w.name' };
const FIELDS = ['team1_id', 'team2_id', 'winner_team_id', 'battled_at'];

const COLS = `b.id, b.battled_at,
  b.team1_id, t1.name AS team1, u1.name AS trainer1,
  b.team2_id, t2.name AS team2, u2.name AS trainer2,
  b.winner_team_id, w.name AS winner, uw.name AS winner_trainer`;
const FROM = `FROM battles b
  JOIN teams t1 ON t1.id = b.team1_id   JOIN trainers u1 ON u1.id = t1.trainer_id
  JOIN teams t2 ON t2.id = b.team2_id   JOIN trainers u2 ON u2.id = t2.trainer_id
  JOIN teams w  ON w.id  = b.winner_team_id JOIN trainers uw ON uw.id = w.trainer_id`;

const getOne = async (id) => {
  const [rows] = await db.query(`SELECT ${COLS} ${FROM} WHERE b.id = ?`, [id]);
  return rows[0];
};

// GET /api/battles?team_id=1&trainer_id=1&winner_team_id=1&from=2025-01-01&to=2030-01-01&sort=date&order=desc
router.get('/', wrap(async (req, res) => {
  const { team_id, trainer_id, winner_team_id, from, to } = req.query;
  const { page, limit, offset } = paging(req.query);

  const where = ['1 = 1'];
  const params = [];
  if (team_id)        { where.push('(b.team1_id = ? OR b.team2_id = ?)');       params.push(team_id, team_id); }
  if (trainer_id)     { where.push('(t1.trainer_id = ? OR t2.trainer_id = ?)'); params.push(trainer_id, trainer_id); }
  if (winner_team_id) { where.push('b.winner_team_id = ?');                      params.push(winner_team_id); }
  if (from)           { where.push('b.battled_at >= ?');                         params.push(from); }
  if (to)             { where.push('b.battled_at <= ?');                         params.push(to); }

  const [data] = await db.query(
    `SELECT ${COLS} ${FROM} WHERE ${where.join(' AND ')}
     ORDER BY ${sortClause(req.query, SORTS, 'date')} LIMIT ? OFFSET ?`,
    [...params, limit, offset]);
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${FROM} WHERE ${where.join(' AND ')}`, params);

  res.json({ page, limit, total, data });
}));

router.get('/:id', wrap(async (req, res) => {
  const battle = await getOne(req.params.id);
  if (!battle) throw new HttpError(404, 'Battle not found');
  res.json(battle);
}));

// The CHECK (different teams, winner is one of them) is enforced by MySQL
router.post('/', wrap(async (req, res) => {
  const { cols, vals } = buildInsert(req.body, FIELDS);
  const [r] = await db.query(`INSERT INTO battles (${cols.join(', ')}) VALUES (?)`, [vals]);
  res.status(201).json(await getOne(r.insertId));
}));

router.put('/:id', wrap(async (req, res) => {
  const { sets, vals } = buildUpdate(req.body, FIELDS);
  const [r] = await db.query(`UPDATE battles SET ${sets} WHERE id = ?`, [...vals, req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Battle not found');
  res.json(await getOne(req.params.id));
}));

router.delete('/:id', wrap(async (req, res) => {
  const [r] = await db.query('DELETE FROM battles WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Battle not found');
  res.json({ deleted: true, id: Number(req.params.id) });
}));

export default router;