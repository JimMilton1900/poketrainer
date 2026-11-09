import { Router } from 'express';
import db  from '../config/db.js';

const router = Router();

const TOTAL = '(p.base_hp + p.base_attack + p.base_defense + p.base_sp_attack + p.base_sp_defense + p.base_speed)';
const SORTS = { id: 'p.id', name: 'p.name', hp: 'p.base_hp', attack: 'p.base_attack',
                defense: 'p.base_defense', speed: 'p.base_speed', total: 'total' };
// GET /api/pokemon?search=char&type=fire&sort=total&order=desc&page=1&limit=24
router.get('/', async (req, res, next) => {
  try {
    const { search = '', type = '', sort = 'id', order = 'asc' } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 24));
    const orderBy = `${SORTS[sort] || 'p.id'} ${order === 'desc' ? 'DESC' : 'ASC'}`;

    const where = ['p.name LIKE ?'];
    const params = [`%${search}%`];
    if (type) {
      where.push(`p.id IN (SELECT pt2.pokemon_id FROM pokemon_types pt2
                           JOIN types t2 ON t2.id = pt2.type_id WHERE t2.name = ?)`);
      params.push(type);
    }

    const [rows] = await db.query(
      `SELECT p.id, p.name, p.sprite_url, p.base_hp, p.base_attack, p.base_defense,
              p.base_sp_attack, p.base_sp_defense, p.base_speed, ${TOTAL} AS total,
              GROUP_CONCAT(t.name ORDER BY pt.type_slot) AS types
       FROM pokemon p
       JOIN pokemon_types pt ON pt.pokemon_id = p.id
       JOIN types t ON t.id = pt.type_id
       WHERE ${where.join(' AND ')}
       GROUP BY p.id
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    );

    const [[{ count }]] = await db.query(
      `SELECT COUNT(*) AS count FROM pokemon p WHERE ${where.join(' AND ')}`, params
    );

    res.json({ page, limit, total: count,
               data: rows.map((r) => ({ ...r, types: r.types.split(',') })) });
  } catch (e) { next(e); }
});

// GET /api/pokemon/25
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, GROUP_CONCAT(t.name ORDER BY pt.type_slot) AS types
       FROM pokemon p
       JOIN pokemon_types pt ON pt.pokemon_id = p.id
       JOIN types t ON t.id = pt.type_id
       WHERE p.id = ? GROUP BY p.id`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Pokémon not found' });
    res.json({ ...rows[0], types: rows[0].types.split(',') });
  } catch (e) { next(e); }
});
export default router;