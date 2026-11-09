import { Router } from 'express';
import  db  from '../config/db.js';
import { membersOfTeam } from './teamMembers.js';
import { wrap, HttpError, paging, sortClause, buildInsert, buildUpdate, validateId } from '../utils.js';

const router = Router();
router.param('id', validateId);

const SORTS = { id: 'v.team_id', name: 'v.team_name', trainer: 'v.trainer', members: 'v.members',
                avg_level: 'v.avg_level', power: 'v.total_base_stats', created: 'te.created_at' };
const FIELDS = ['trainer_id', 'name'];

const COLS = `v.team_id AS id, v.team_name AS name, te.trainer_id, v.trainer,
              v.members, v.avg_level, v.total_base_stats, te.created_at`;
const FROM = 'FROM v_team_summary v JOIN teams te ON te.id = v.team_id';

// different get one to the one in teamMembers
// this simply selects the team details from the view , whereas the one in teamMembers is responsible for
// selecting team_members id and their corresponding moves...here we simply obtain
// the row corresponding to a particular id , and attach the party associated to that team.
const getOne = async (id) => {
  const [rows] = await db.query(`SELECT ${COLS} ${FROM} WHERE v.team_id = ?`, [id]);
  return rows[0];
};

// GET /api/teams?search=water&trainer_id=1&min_members=3&sort=power&order=desc
router.get('/', wrap(async (req, res) => {
  const { search = '', trainer_id, min_members } = req.query;
  const { page, limit, offset } = paging(req.query);

  const where = ['(v.team_name LIKE ? OR v.trainer LIKE ?)'];
  const params = [`%${search}%`, `%${search}%`];
  if (trainer_id)  { where.push('te.trainer_id = ?'); params.push(trainer_id); }
  if (min_members) { where.push('v.members >= ?');    params.push(min_members); }

  const [data] = await db.query(
    `SELECT ${COLS} ${FROM} WHERE ${where.join(' AND ')}
     ORDER BY ${sortClause(req.query, SORTS, 'id')} LIMIT ? OFFSET ?`,
    [...params, limit, offset]);
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total ${FROM} WHERE ${where.join(' AND ')}`, params);

  res.json({ page, limit, total, data });
}));

// GET /api/teams/1 -> team + full party (pokemon, types, moves)
router.get('/:id', wrap(async (req, res) => {
  const team = await getOne(req.params.id);
  if (!team) throw new HttpError(404, 'Team not found');
  res.json({ ...team, party: await membersOfTeam(req.params.id) });
}));

router.post('/', wrap(async (req, res) => {
  const { cols, vals } = buildInsert(req.body, FIELDS);
  const [r] = await db.query(`INSERT INTO teams (${cols.join(', ')}) VALUES (?)`, [vals]);
  res.status(201).json(await getOne(r.insertId));
}));

router.put('/:id', wrap(async (req, res) => {
  const { sets, vals } = buildUpdate(req.body, FIELDS);
  const [r] = await db.query(`UPDATE teams SET ${sets} WHERE id = ?`, [...vals, req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Team not found');
  res.json(await getOne(req.params.id));
}));

// Cascades to members and their moves; blocked (409) if the team appears in a battle , specified in 01_schema.sql
router.delete('/:id', wrap(async (req, res) => {
  const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM team_members WHERE team_id = ?', [req.params.id]);
  const [r] = await db.query('DELETE FROM teams WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Team not found');
  res.json({ deleted: true, id: Number(req.params.id), members_removed: n });
}));

export default router;