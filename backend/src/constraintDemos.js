// Every demo runs inside a transaction that is ALWAYS rolled back.
// Rules for adding demos: DML only (INSERT/UPDATE/DELETE/SELECT/SET). DDL such as
// CREATE/ALTER/DROP/TRUNCATE auto-commits in MySQL and would escape the rollback.
// Demos look rows up by name, so they rely on the sample data (Ash, Kanto Journey, Gary Backup...).

const KANTO = `(SELECT id FROM teams WHERE name = 'Kanto Journey')`;
const GARY_BACKUP = `(SELECT id FROM teams WHERE name = 'Gary Backup')`;     // has free slots 3-6
const KANTO_LEAD = `(SELECT tm.id FROM team_members tm JOIN teams te ON te.id = tm.team_id
                     WHERE te.name = 'Kanto Journey' AND tm.slot = 1)`;      // Pikachu, has 3 moves
const MOVE = (name) => `(SELECT id FROM moves WHERE name = '${name}')`;
const TYPE = (name) => `(SELECT id FROM types WHERE name = '${name}')`;

export const DEMOS = [
  // ---------------- PRIMARY KEY ----------------
  {
    id: 'pk-types', constraint: 'PRIMARY KEY', expect: 'error',
    title: 'Duplicate primary key',
    why: 'types.id is the primary key, and type 1 already exists. A primary key must be unique and non-null.',
    steps: [`INSERT INTO types (id, name) VALUES (1, 'shadow')`],
  },
  {
    id: 'pk-composite', constraint: 'PRIMARY KEY', expect: 'error',
    title: 'Duplicate composite key',
    why: 'pokemon_types uses (pokemon_id, type_id) as its key, so Pikachu cannot be linked to Electric twice.',
    steps: [`INSERT INTO pokemon_types (pokemon_id, type_id, type_slot) VALUES (25, ${TYPE('electric')}, 2)`],
  },

  // ---------------- FOREIGN KEY ----------------
  {
    id: 'fk-missing-parent', constraint: 'FOREIGN KEY', expect: 'error',
    title: 'Child row with no parent',
    why: 'teams.trainer_id must point to an existing trainer. Trainer 999999 does not exist.',
    steps: [`INSERT INTO teams (trainer_id, name) VALUES (999999, 'Ghost Team')`],
  },
  {
    id: 'fk-missing-pokemon', constraint: 'FOREIGN KEY', expect: 'error',
    title: 'Team member with an unknown Pokémon',
    why: 'team_members.pokemon_id references pokemon.id. #9999 is not in the Pokédex.',
    steps: [`INSERT INTO team_members (team_id, pokemon_id, slot) VALUES (${GARY_BACKUP}, 9999, 3)`],
  },
  {
    id: 'fk-restrict-pokemon', constraint: 'FOREIGN KEY (RESTRICT)', expect: 'error',
    title: 'Delete a Pokémon that is on teams',
    why: 'team_members -> pokemon is ON DELETE RESTRICT, so Pikachu cannot be deleted while any team uses it.',
    steps: [`DELETE FROM pokemon WHERE id = 25`],
  },
  {
    id: 'fk-restrict-team', constraint: 'FOREIGN KEY (RESTRICT)', expect: 'error',
    title: 'Delete a team that has battles',
    why: 'battles -> teams is ON DELETE RESTRICT, so battle history cannot lose its teams.',
    steps: [`DELETE FROM teams WHERE name = 'Kanto Journey'`],
  },
  {
    id: 'fk-cascade', constraint: 'FOREIGN KEY (CASCADE)', expect: 'success',
    title: 'Deleting a trainer cascades down the chain',
    why: 'Creates a temporary trainer with a team, a member and a move, then deletes only the trainer. The counts show the team, member and move disappearing automatically. Everything is rolled back afterwards.',
    steps: [
      `INSERT INTO trainers (name) VALUES ('Cascade Demo')`,
      `SET @t = LAST_INSERT_ID()`,
      `INSERT INTO teams (trainer_id, name) VALUES (@t, 'Temp Team')`,
      `SET @tm = LAST_INSERT_ID()`,
      `INSERT INTO team_members (team_id, pokemon_id, slot) VALUES (@tm, 25, 1)`,
      `SET @m = LAST_INSERT_ID()`,
      `INSERT INTO team_member_moves (team_member_id, move_id, move_slot) VALUES (@m, ${MOVE('tackle')}, 1)`,
      `SELECT 'before delete' AS moment,
              (SELECT COUNT(*) FROM teams WHERE trainer_id = @t) AS teams,
              (SELECT COUNT(*) FROM team_members WHERE team_id = @tm) AS members,
              (SELECT COUNT(*) FROM team_member_moves WHERE team_member_id = @m) AS moves`,
      `DELETE FROM trainers WHERE id = @t`,
      `SELECT 'after delete' AS moment,
              (SELECT COUNT(*) FROM teams WHERE trainer_id = @t) AS teams,
              (SELECT COUNT(*) FROM team_members WHERE team_id = @tm) AS members,
              (SELECT COUNT(*) FROM team_member_moves WHERE team_member_id = @m) AS moves`,
    ],
  },

  // ---------------- UNIQUE ----------------
  {
    id: 'unique-trainer', constraint: 'UNIQUE', expect: 'error',
    title: 'Duplicate trainer name',
    why: 'trainers.name is UNIQUE, and Ash already exists.',
    steps: [`INSERT INTO trainers (name) VALUES ('Ash')`],
  },
  {
    id: 'unique-team-name', constraint: 'UNIQUE', expect: 'error',
    title: 'Same team name for the same trainer',
    why: 'UNIQUE (trainer_id, name): a trainer cannot have two teams with the same name (other trainers can).',
    steps: [`INSERT INTO teams (trainer_id, name) VALUES ((SELECT id FROM trainers WHERE name = 'Ash'), 'Kanto Journey')`],
  },
  {
    id: 'unique-slot', constraint: 'UNIQUE', expect: 'error',
    title: 'Two Pokémon in one slot',
    why: 'UNIQUE (team_id, slot): slot 1 of Kanto Journey is already taken. Together with CHECK slot BETWEEN 1 AND 6 this caps a team at 6.',
    steps: [`INSERT INTO team_members (team_id, pokemon_id, slot) VALUES (${KANTO}, 1, 1)`],
  },
  {
    id: 'unique-move', constraint: 'UNIQUE', expect: 'error',
    title: 'Same move twice on one Pokémon',
    why: 'UNIQUE (team_member_id, move_id): Pikachu already knows Thunderbolt.',
    steps: [`INSERT INTO team_member_moves (team_member_id, move_id, move_slot) VALUES (${KANTO_LEAD}, ${MOVE('thunderbolt')}, 4)`],
  },

  // ---------------- NOT NULL ----------------
  {
    id: 'notnull-explicit', constraint: 'NOT NULL', expect: 'error',
    title: 'Explicit NULL in a required column',
    why: 'trainers.name is NOT NULL.',
    steps: [`INSERT INTO trainers (name) VALUES (NULL)`],
  },
  {
    id: 'notnull-missing', constraint: 'NOT NULL', expect: 'error',
    title: 'Required column left out entirely',
    why: 'teams.trainer_id is NOT NULL and has no DEFAULT, so leaving it out is rejected.',
    steps: [`INSERT INTO teams (name) VALUES ('Team With No Owner')`],
  },

  // ---------------- CHECK ----------------
  {
    id: 'check-level', constraint: 'CHECK', expect: 'error',
    title: 'Level above 100',
    why: 'chk_level: level BETWEEN 1 AND 100.',
    steps: [`INSERT INTO team_members (team_id, pokemon_id, slot, level) VALUES (${GARY_BACKUP}, 25, 3, 101)`],
  },
  {
    id: 'check-slot', constraint: 'CHECK', expect: 'error',
    title: 'Slot 7 does not exist',
    why: 'chk_slot: slot BETWEEN 1 AND 6.',
    steps: [`INSERT INTO team_members (team_id, pokemon_id, slot) VALUES (${GARY_BACKUP}, 25, 7)`],
  },
  {
    id: 'check-move-slot', constraint: 'CHECK', expect: 'error',
    title: 'A fifth move',
    why: 'chk_move_slot: move_slot BETWEEN 1 AND 4.',
    steps: [`INSERT INTO team_member_moves (team_member_id, move_id, move_slot) VALUES (${KANTO_LEAD}, ${MOVE('tackle')}, 5)`],
  },
  {
    id: 'check-battle-self', constraint: 'CHECK', expect: 'error',
    title: 'A team battling itself',
    why: 'chk_battle: team1_id <> team2_id.',
    steps: [`INSERT INTO battles (team1_id, team2_id, winner_team_id) VALUES (${KANTO}, ${KANTO}, ${KANTO})`],
  },
  {
    id: 'check-battle-winner', constraint: 'CHECK', expect: 'error',
    title: 'Winner is not a participant',
    why: 'chk_battle: the winner must be team1 or team2.',
    steps: [`INSERT INTO battles (team1_id, team2_id, winner_team_id) VALUES (
               ${KANTO}, (SELECT id FROM teams WHERE name = 'Water Squad'), (SELECT id FROM teams WHERE name = 'Rock Solid'))`],
  },
  {
    id: 'check-pokemon-stats', constraint: 'CHECK', expect: 'error',
    title: 'A Pokémon with 0 base HP',
    why: 'chk_pokemon_stats: every base stat must be at least 1.',
    steps: [`INSERT INTO pokemon (id, name, height_dm, weight_hg, base_hp, base_attack, base_defense,
               base_sp_attack, base_sp_defense, base_speed) VALUES (9999, 'testmon', 10, 10, 0, 50, 50, 50, 50, 50)`],
  },
  {
    id: 'check-move-values', constraint: 'CHECK', expect: 'error',
    title: 'A move with 0 PP',
    why: 'chk_move_values: pp > 0 and power is NULL or >= 0.',
    steps: [`INSERT INTO moves (name, type_id, power, accuracy, pp) VALUES ('testmove', ${TYPE('fire')}, 40, 100, 0)`],
  },
  {
    id: 'check-type-slot', constraint: 'CHECK', expect: 'error',
    title: 'A third type',
    why: 'chk_type_slot: type_slot BETWEEN 1 AND 2, since a Pokémon has at most two types.',
    steps: [`INSERT INTO pokemon_types (pokemon_id, type_id, type_slot) VALUES (25, ${TYPE('flying')}, 3)`],
  },

  // ---------------- DEFAULT ----------------
  {
    id: 'default-values', constraint: 'DEFAULT', expect: 'success',
    title: 'Omitted columns get their DEFAULT',
    why: 'Only the names and ids are supplied. hometown, joined_at and level are filled in by their DEFAULTs.',
    steps: [
      `INSERT INTO trainers (name) VALUES ('Default Demo')`,
      `SET @t = LAST_INSERT_ID()`,
      `INSERT INTO teams (trainer_id, name) VALUES (@t, 'Default Team')`,
      `SET @tm = LAST_INSERT_ID()`,
      `INSERT INTO team_members (team_id, pokemon_id, slot) VALUES (@tm, 1, 1)`,
      `SELECT tr.name AS trainer, tr.hometown, tr.joined_at, te.created_at AS team_created, tm.level
       FROM trainers tr JOIN teams te ON te.trainer_id = tr.id JOIN team_members tm ON tm.team_id = te.id
       WHERE tr.id = @t`,
    ],
  },

  // ---------------- VIEW ----------------
  {
    id: 'view-read', constraint: 'VIEW', expect: 'success',
    title: 'Query the view like a table',
    why: 'v_team_summary joins four tables and aggregates them. Queries just see one table.',
    steps: [`SELECT * FROM v_team_summary ORDER BY total_base_stats DESC LIMIT 3`],
  },
  {
    id: 'view-update', constraint: 'VIEW', expect: 'error',
    title: 'Write to an aggregated view',
    why: 'A view with GROUP BY and aggregates is not updatable. MySQL cannot tell which base rows to change.',
    steps: [`UPDATE v_team_summary SET members = 99`],
  },
];