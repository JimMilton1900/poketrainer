import { Router } from 'express';
import  db  from '../config/db.js';
import { wrap, HttpError, paging, sortClause, buildInsert, buildUpdate, validateId } from '../utils.js';

const router = Router();
router.param('id', validateId);

const SORTS = { id: 'tr.id', name: 'tr.name', hometown: 'tr.hometown', joined: 'tr.joined_at', teams: 'team_count' };
const FIELDS = ['name', 'hometown', 'favorite_type_id'];

const FROM = `FROM trainers tr
  LEFT JOIN types ty ON ty.id = tr.favorite_type_id`;

const getOne = async (id) => {
  const [rows] = await db.query(
    `SELECT tr.id, tr.name, tr.hometown, tr.favorite_type_id, ty.name AS favorite_type, tr.joined_at,
            (SELECT COUNT(*) FROM teams te WHERE te.trainer_id = tr.id) AS team_count
     ${FROM} WHERE tr.id = ?`, [id]);
  return rows[0];
};

// GET /api/trainers?search=ash&hometown=Pallet Town&favorite_type=water&sort=teams&order=desc&page=1
router.get('/', wrap(async (req, res) => {
  const { search = '', hometown = '', favorite_type = '' } = req.query;
  const { page, limit, offset } = paging(req.query);

  const where = ['(tr.name LIKE ? OR tr.hometown LIKE ?)'];
  const params = [`%${search}%`, `%${search}%`];
  if (hometown)      { where.push('tr.hometown = ?'); params.push(hometown); }
  if (favorite_type) { where.push('ty.name = ?');     params.push(favorite_type); }

  const [data] = await db.query(
    `SELECT tr.id, tr.name, tr.hometown, tr.favorite_type_id, ty.name AS favorite_type, tr.joined_at,
            (SELECT COUNT(*) FROM teams te WHERE te.trainer_id = tr.id) AS team_count
     ${FROM} WHERE ${where.join(' AND ')}
     ORDER BY ${sortClause(req.query, SORTS, 'id')} LIMIT ? OFFSET ?`,
    [...params, limit, offset]);
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total ${FROM} WHERE ${where.join(' AND ')}`, params);

  res.json({ page, limit, total, data });
}));

// GET /api/trainers/1  -> trainer + their teams (read from the v_team_summary view)
router.get('/:id', wrap(async (req, res) => {
  const trainer = await getOne(req.params.id);
  if (!trainer) throw new HttpError(404, 'Trainer not found');
  const [teams] = await db.query(
    `SELECT v.* FROM v_team_summary v JOIN teams te ON te.id = v.team_id
     WHERE te.trainer_id = ? ORDER BY v.team_id`, [req.params.id]);
  res.json({ ...trainer, teams });
}));

router.post('/', wrap(async (req, res) => {
  const { cols, vals } = buildInsert(req.body, FIELDS);
  const [r] = await db.query(`INSERT INTO trainers (${cols.join(', ')}) VALUES (?)`, [vals]);
  res.status(201).json(await getOne(r.insertId));
}));

router.put('/:id', wrap(async (req, res) => {
  const { sets, vals } = buildUpdate(req.body, FIELDS);
  const [r] = await db.query(`UPDATE trainers SET ${sets} WHERE id = ?`, [...vals, req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Trainer not found');
  res.json(await getOne(req.params.id));
}));

// Cascades to teams -> members -> moves, but is blocked (409) if any of their teams has battles
router.delete('/:id', wrap(async (req, res) => {
  const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM teams WHERE trainer_id = ?', [req.params.id]);
  const [r] = await db.query('DELETE FROM trainers WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Trainer not found');
  res.json({ deleted: true, id: Number(req.params.id), teams_removed: n });
}));

export default router;