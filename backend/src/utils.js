export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export const validateId = (req, res, next, v) =>
  /^\d+$/.test(v) ? next() : res.status(400).json({ error: 'id must be a positive integer' });

export const paging = (q, def = 20) => {
  const page = Math.max(1, parseInt(q.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit) || def));
  return { page, limit, offset: (page - 1) * limit };
};

// allowed = { urlName: 'sql column or alias' }
export const sortClause = (q, allowed, fallback) =>
  `${allowed[q.sort] || allowed[fallback]} ${String(q.order).toLowerCase() === 'desc' ? 'DESC' : 'ASC'}`;

const isBlank = (v) => typeof v === 'string' && v.trim() === '';
const tidy = (v) => (typeof v === 'string' ? v.trim() : v);

// INSERT: skip missing/blank fields so column DEFAULTs apply (or NOT NULL fires)
export function buildInsert(body, fields) {
  const cols = [], vals = [];
  for (const f of fields) {
    const v = body?.[f];
    if (v === undefined || isBlank(v)) continue;
    cols.push(f); vals.push(tidy(v));
  }
  if (!cols.length) throw new HttpError(400, `Request body is empty. Allowed fields: ${fields.join(', ')}`);
  return { cols, vals };
}

// UPDATE: only touch fields that were sent; blank string -> NULL (clears a nickname)
export function buildUpdate(body, fields) {
  const sets = [], vals = [];
  for (const f of fields) {
    if (body?.[f] === undefined) continue;
    sets.push(`${f} = ?`);
    vals.push(isBlank(body[f]) ? null : tidy(body[f]));
  }
  if (!sets.length) throw new HttpError(400, `Nothing to update. Allowed fields: ${fields.join(', ')}`);
  return { sets: sets.join(', '), vals };
}