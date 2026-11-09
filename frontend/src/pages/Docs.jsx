import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch.js';
import { pretty } from '../utils/format.js';

const FDS = [
  ['types', 'id', ['id → name', 'name → id (candidate key)']],
  ['pokemon', 'id', ['id → name, height_dm, weight_hg, base_hp, base_attack, base_defense, base_sp_attack, base_sp_defense, base_speed, sprite_url', 'name → id (candidate key)']],
  ['pokemon_types', '(pokemon_id, type_id)', ['(pokemon_id, type_id) → type_slot', '(pokemon_id, type_slot) → type_id (second candidate key)']],
  ['moves', 'id', ['id → name, type_id, power, accuracy, pp', 'name → id (candidate key)']],
  ['trainers', 'id', ['id → name, hometown, favorite_type_id, joined_at', 'name → id (candidate key)']],
  ['teams', 'id', ['id → trainer_id, name, created_at', '(trainer_id, name) → id (candidate key)']],
  ['team_members', 'id', ['id → team_id, pokemon_id, slot, nickname, level', '(team_id, slot) → id (candidate key)']],
  ['team_member_moves', '(team_member_id, move_slot)', ['(team_member_id, move_slot) → move_id', '(team_member_id, move_id) → move_slot (second candidate key)']],
  ['battles', 'id', ['id → team1_id, team2_id, winner_team_id, battled_at']],
];

const CONSTRAINTS = [
  ['PRIMARY KEY', 'Every table (composite on pokemon_types and team_member_moves)'],
  ['FOREIGN KEY', '12 relationships. CASCADE down trainer → team → member → moves; RESTRICT on pokemon, moves, and anything with battle history; SET NULL on trainers.favorite_type_id'],
  ['NOT NULL', 'names, stats, trainer_id, team_id, pokemon_id, slot, level and more'],
  ['UNIQUE', 'trainers.name, pokemon.name, moves.name, types.name, (trainer_id, name), (team_id, slot), (team_member_id, move_id), (pokemon_id, type_slot)'],
  ['CHECK', 'level 1–100, slot 1–6, move_slot 1–4, type_slot 1–2, stats ≥ 1, pp > 0, battle teams differ and winner is a participant'],
  ['DEFAULT', "hometown 'Pallet Town', level 50, pp 10, type_slot 1, all created/joined/battled timestamps"],
  ['VIEW', 'v_team_summary'],
];

const CHECKLIST = [
  ['5+ related tables', '9 tables, see the ER diagram and the live row counts below', '/docs'],
  ['Keys and constraints', 'Run each one live', '/playground'],
  ['Normalization to 3NF', 'Functional dependencies and justification on this page', '/docs'],
  ['10+ rows in main tables', 'Live counts below', '/docs'],
  ['10+ queries (WHERE, ORDER BY, GROUP BY/HAVING, aggregates, joins, subquery)', '14 queries with SQL and live results', '/reports'],
  ['View', 'Definition from SHOW CREATE VIEW and its rows', '/reports'],
  ['Add / view / update / delete', 'Trainers, teams, team members, moves, battles', '/trainers'],
  ['Search and report', 'Pokédex search and filters; Reports page', '/pokedex'],
];

export default function Docs() {
  const stats = useFetch('/stats');
  return (
    <div className="prose-sm max-w-none space-y-10">
      <h1 className="font-pixel text-sm">Documentation</h1>

      <section className="space-y-3">
        <h2 className="font-pixel text-xs">1. Requirements checklist</h2>
        <div className="overflow-x-auto rounded-box border-2 border-base-content/20 bg-base-100">
          <table className="table table-sm">
            <thead><tr><th>Requirement</th><th>Where to see it</th><th /></tr></thead>
            <tbody>
              {CHECKLIST.map(([a, b, to]) => (
                <tr key={a}><td>{a}</td><td>{b}</td><td><Link className="link" to={to}>Open</Link></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-pixel text-xs">2. ER diagram</h2>
        <img src="/er-diagram.png" alt="Entity relationship diagram"
             className="max-w-full rounded-box border-2 border-base-content/20 bg-white"
             onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block'; }} />
        <p style={{ display: 'none' }} className="text-sm opacity-70">
          Export your diagram from dbdiagram.io as PNG and save it as <code>client/public/er-diagram.png</code>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-pixel text-xs">3. Live row counts</h2>
        {stats.data && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(stats.data).map(([k, v]) => (
              <div key={k} className="rounded-box border-2 border-base-content/20 bg-base-100 p-3">
                <div className="text-xs opacity-60">{pretty(k)}</div>
                <div className="font-pixel text-sm text-primary">{v}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-pixel text-xs">4. Functional dependencies</h2>
        <div className="overflow-x-auto rounded-box border-2 border-base-content/20 bg-base-100">
          <table className="table table-sm align-top">
            <thead><tr><th>Table</th><th>Primary key</th><th>Functional dependencies</th></tr></thead>
            <tbody>
              {FDS.map(([t, k, fds]) => (
                <tr key={t}>
                  <td className="font-mono font-semibold">{t}</td>
                  <td className="whitespace-nowrap font-mono text-xs">{k}</td>
                  <td><ul className="space-y-1 font-mono text-xs">{fds.map((f) => <li key={f}>{f}</li>)}</ul></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="font-pixel text-xs">5. Normalization to 3NF</h2>
        <p><b>1NF: atomic values, no repeating groups.</b> A Pokémon can have two types, but they are not stored as a "fire, flying" string or as type1/type2 columns. They live in <code>pokemon_types</code>, one row per type. A team's six Pokémon are rows in <code>team_members</code>, and a Pokémon's four moves are rows in <code>team_member_moves</code>, instead of columns like move1…move4. Every table has a primary key.</p>
        <p><b>2NF: no partial dependencies.</b> Only two tables have composite keys. In <code>pokemon_types</code> the only non-key attribute, <code>type_slot</code>, depends on the whole key (pokemon_id, type_id). In <code>team_member_moves</code>, <code>move_slot</code> and <code>move_id</code> are likewise determined by the whole key. Every other table uses a single-column surrogate key, so a partial dependency is impossible.</p>
        <p><b>3NF: no transitive dependencies.</b> Facts are stored once, where they belong. A team member stores <code>pokemon_id</code> but not the Pokémon's name or stats, since pokemon_id → name would be transitive. A team stores <code>trainer_id</code>, not the trainer's name. A battle stores team ids, and the winner's trainer is found through a join. Move and type names live in <code>moves</code> and <code>types</code>. Team size, average level and power are derived on demand by the view <code>v_team_summary</code> instead of being stored, so they can never go stale.</p>
        <p><b>BCNF note.</b> In every table, each determinant listed above is a candidate key, so the schema also satisfies BCNF.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-pixel text-xs">6. Constraint inventory</h2>
        <div className="overflow-x-auto rounded-box border-2 border-base-content/20 bg-base-100">
          <table className="table table-sm align-top">
            <tbody>
              {CONSTRAINTS.map(([a, b]) => (
                <tr key={a}><td className="whitespace-nowrap font-semibold">{a}</td><td>{b}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm opacity-70">Every item can be triggered on the <Link className="link" to="/playground">playground</Link>.</p>
      </section>
    </div>
  );
}