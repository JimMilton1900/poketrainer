import { Router } from 'express';
import  db  from '../config/db.js';
import { wrap, HttpError, paging, sortClause, buildInsert, buildUpdate, validateId } from '../utils.js';

const router = Router();
router.param('id', validateId);

const SORTS = { id: 'tm.id', level: 'tm.level', slot: 'tm.slot', pokemon: 'p.name',
                nickname: 'tm.nickname', team: 'te.name', trainer: 'tr.name' };
const FIELDS = ['team_id', 'pokemon_id', 'slot', 'nickname', 'level'];

const COLS = `tm.id, tm.team_id, te.name AS team, tr.id AS trainer_id, tr.name AS trainer,
  tm.slot, tm.nickname, tm.level, tm.pokemon_id, p.name AS pokemon, p.sprite_url,
  (SELECT GROUP_CONCAT(t.name ORDER BY pt.type_slot)
     FROM pokemon_types pt JOIN types t ON t.id = pt.type_id
     WHERE pt.pokemon_id = p.id) AS types`;
const FROM = `FROM team_members tm
  JOIN teams te    ON te.id = tm.team_id
  JOIN trainers tr ON tr.id = te.trainer_id
  JOIN pokemon p   ON p.id  = tm.pokemon_id`;

const withTypes = (rows) => rows.map((r) => ({ ...r, types: r.types ? r.types.split(',') : [] }));

async function attachMoves(members) {
  members = withTypes(members);
  if (!members.length) return members; 
  const [moves] = await db.query(
    `SELECT tmm.team_member_id, tmm.move_slot, m.id AS move_id, m.name, t.name AS type, m.power, m.accuracy, m.pp
     FROM team_member_moves tmm
     JOIN moves m ON m.id = tmm.move_id
     JOIN types t ON t.id = m.type_id
     WHERE tmm.team_member_id IN (?) ORDER BY tmm.team_member_id, tmm.move_slot`,
    [members.map((m) => m.id)]);
  //for every individual member id , attach only the moves that correspond/belong to the current member id 
  return members.map((m) => ({ ...m, moves: moves.filter((x) => x.team_member_id === m.id) }));
}

export async function membersOfTeam(teamId) {
  const [rows] = await db.query(`SELECT ${COLS} ${FROM} WHERE tm.team_id = ? ORDER BY tm.slot`, [teamId]);
  return attachMoves(rows);
}

const getOne = async (id) => {
  const [rows] = await db.query(`SELECT ${COLS} ${FROM} WHERE tm.id = ?`, [id]);
  return (await attachMoves(rows))[0];
};

// GET /api/team-members?team_id=1&trainer_id=1&pokemon_id=25&type=fire&search=zard&min_level=50&max_level=70&sort=level&order=desc
router.get('/', wrap(async (req, res) => {
  const { search = '', team_id, trainer_id, pokemon_id, type, min_level, max_level } = req.query;
  const { page, limit, offset } = paging(req.query);

  const where = ['(p.name LIKE ? OR tm.nickname LIKE ?)'];
  const params = [`%${search}%`, `%${search}%`];
  if (team_id)    { where.push('tm.team_id = ?');    params.push(team_id); }
  if (trainer_id) { where.push('tr.id = ?');         params.push(trainer_id); }
  if (pokemon_id) { where.push('tm.pokemon_id = ?'); params.push(pokemon_id); }
  if (min_level)  { where.push('tm.level >= ?');     params.push(min_level); }
  if (max_level)  { where.push('tm.level <= ?');     params.push(max_level); }
  if (type) {
    where.push(`p.id IN (SELECT pt2.pokemon_id FROM pokemon_types pt2
                         JOIN types t2 ON t2.id = pt2.type_id WHERE t2.name = ?)`);
    params.push(type);
  }

  const [rows] = await db.query(
    `SELECT ${COLS} ${FROM} WHERE ${where.join(' AND ')}
     ORDER BY ${sortClause(req.query, SORTS, 'id')} LIMIT ? OFFSET ?`,
    [...params, limit, offset]);
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${FROM} WHERE ${where.join(' AND ')}`, params);

  res.json({ page, limit, total, data: withTypes(rows) });
}));

router.get('/:id', wrap(async (req, res) => {
  const member = await getOne(req.params.id);
  if (!member) throw new HttpError(404, 'Team member not found');
  res.json(member);
}));

// Add a Pokémon to a team. If "slot" is omitted, the first free slot (1-6) is used.
// If "slot" is given, the UNIQUE and CHECK constraints judge it.
router.post('/', wrap(async (req, res) => {
  let { slot } = req.body;
  if (slot === undefined || slot === null || slot === '') {
    const [used] = await db.query('SELECT slot FROM team_members WHERE team_id = ?', [req.body.team_id]);
    const taken = new Set(used.map((r) => r.slot));
    slot = [1, 2, 3, 4, 5, 6].find((s) => !taken.has(s));
    if (!slot) throw new HttpError(409, 'Team is full (6 of 6 slots used)');
  }
  const { cols, vals } = buildInsert({ ...req.body, slot }, FIELDS);
  const [r] = await db.query(`INSERT INTO team_members (${cols.join(', ')}) VALUES (?)`, [vals]);
  res.status(201).json(await getOne(r.insertId));
}));

// Edit nickname / level / slot / pokemon. Moving into an occupied slot returns a 409 (UNIQUE team_id+slot).
router.put('/:id', wrap(async (req, res) => {
  const { sets, vals } = buildUpdate(req.body, ['pokemon_id', 'slot', 'nickname', 'level']);
  const [r] = await db.query(`UPDATE team_members SET ${sets} WHERE id = ?`, [...vals, req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Team member not found');
  res.json(await getOne(req.params.id));
}));

// All-or-nothing: a 5th move (CHECK) or a duplicate (UNIQUE) rolls the whole change back.
router.put('/:id/moves', wrap(async (req, res) => {
  const ids = req.body.move_ids;
  if (!Array.isArray(ids)) throw new HttpError(400, 'move_ids must be an array of move ids');
  if (!(await getOne(req.params.id))) throw new HttpError(404, 'Team member not found');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM team_member_moves WHERE team_member_id = ?', [req.params.id]);
    for (let i = 0; i < ids.length; i++) {
      await conn.query(
        'INSERT INTO team_member_moves (team_member_id, move_id, move_slot) VALUES (?, ?, ?)',
        [req.params.id, ids[i], i + 1]);
    }
    await conn.commit();
  } catch (e) {
    // this is where it rollsback , changes are removed , and it is restored to previous state
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  res.json(await getOne(req.params.id));
}));

// "Release" a Pokémon (moves are removed by cascade)
router.delete('/:id', wrap(async (req, res) => {
  const [r] = await db.query('DELETE FROM team_members WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Team member not found');
  res.json({ released: true, id: Number(req.params.id) });
}));

export default router;