import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

const POKEMON_COUNT = 151;   // raise if you want more
const MOVE_COUNT = 165;      // Gen 1 moves
const BASE = 'https://pokeapi.co/api/v2'; // API
const CACHE_DIR = './seed/cache';
fs.mkdirSync(CACHE_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Fetch once, cache the trimmed result so re-runs never hit the API
async function cached(key, url, pick) {
  const file = path.join(CACHE_DIR, `${key}.json`);
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  const data = pick(await res.json());
  fs.writeFileSync(file, JSON.stringify(data));
  await sleep(100); // be polite to the free API :)
  return data;
}

const stat = (stats, name) => stats.find((s) => s.stat.name === name).base_stat;

async function main() {
  // Same as Aiven connection settings
  const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: {
            ca: fs.readFileSync(
                new URL("../src/config/ca.pem", import.meta.url)
            )
        },
  });

  // ---- 1. Fetch everything first (so a failure doesn't leave half-written data) LIMIT CAP = 18
  const typeList = await cached('types', `${BASE}/type?limit=18`, (d) =>
    d.results.map((t, i) => ({ id: i + 1, name: t.name }))
  ); 
  const typeIdByName = Object.fromEntries(typeList.map((t) => [t.name, t.id]));

  const pokemon = [];
  for (let id = 1; id <= POKEMON_COUNT; id++) {
    pokemon.push(
      await cached(`pokemon-${id}`, `${BASE}/pokemon/${id}`, (d) => ({
        id: d.id,
        name: d.name,
        height: d.height,
        weight: d.weight,
        hp: stat(d.stats, 'hp'),
        atk: stat(d.stats, 'attack'),
        def: stat(d.stats, 'defense'),
        spa: stat(d.stats, 'special-attack'),
        spd: stat(d.stats, 'special-defense'),
        spe: stat(d.stats, 'speed'),
        sprite: d.sprites.front_default,
        //pushes slot , and type name from API
        types: d.types.map((t) => ({ slot: t.slot, name: t.type.name })),
      }))
    );
    if (id % 25 === 0) console.log(`pokemon ${id} of /${POKEMON_COUNT} collected`);
  }

  const moves = [];
  for (let id = 1; id <= MOVE_COUNT; id++) {
    moves.push(
      await cached(`move-${id}`, `${BASE}/move/${id}`, (d) => ({
        id: d.id,
        name: d.name,
        type: d.type.name,
        power: d.power,
        accuracy: d.accuracy,
        pp: d.pp,
      }))
    );
  }

  // ---- 2. Write everything in one transaction, parents before children
  await db.beginTransaction();
  try {
    await db.query(
      'INSERT INTO types (id, name) VALUES ? ON DUPLICATE KEY UPDATE name = VALUES(name)',
      [typeList.map((t) => [t.id, t.name])]
    );

    await db.query(
      `INSERT INTO pokemon (id, name, height_dm, weight_hg, base_hp, base_attack, base_defense,
         base_sp_attack, base_sp_defense, base_speed, sprite_url) VALUES ?
       ON DUPLICATE KEY UPDATE name=VALUES(name), height_dm=VALUES(height_dm), weight_hg=VALUES(weight_hg),
         base_hp=VALUES(base_hp), base_attack=VALUES(base_attack), base_defense=VALUES(base_defense),
         base_sp_attack=VALUES(base_sp_attack), base_sp_defense=VALUES(base_sp_defense),
         base_speed=VALUES(base_speed), sprite_url=VALUES(sprite_url)`,
      [pokemon.map((p) => [p.id, p.name, p.height, p.weight, p.hp, p.atk, p.def, p.spa, p.spd, p.spe, p.sprite])]
    );

    const links = pokemon.flatMap((p) =>
      p.types.map((t) => [p.id, typeIdByName[t.name], t.slot])
    );
    await db.query(
      'INSERT INTO pokemon_types (pokemon_id, type_id, type_slot) VALUES ? ON DUPLICATE KEY UPDATE type_slot = VALUES(type_slot)',
      [links]
    );

    await db.query(
      `INSERT INTO moves (id, name, type_id, power, accuracy, pp) VALUES ?
       ON DUPLICATE KEY UPDATE name=VALUES(name), type_id=VALUES(type_id), power=VALUES(power),
         accuracy=VALUES(accuracy), pp=VALUES(pp)`,
      [moves.map((m) => [m.id, m.name, typeIdByName[m.type], m.power, m.accuracy, m.pp])]
    );
    await db.commit();
    console.log(`Done: ${typeList.length} types, ${pokemon.length} pokemon, ${links.length} type links, ${moves.length} moves`);
  } catch (err) {
    await db.rollback();
    throw err;
  } finally {
    await db.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});