-- @@ Fast Pokémon | WHERE + ORDER BY: base speed of 100 or more, fastest first
SELECT id, name, base_speed
FROM pokemon
WHERE base_speed >= 100
ORDER BY base_speed DESC, name;

-- @@ Search by name | WHERE with LIKE: the Pokédex search box (here: names containing "char")
SELECT id, name, base_hp, base_attack
FROM pokemon
WHERE name LIKE '%char%'
ORDER BY id;

-- @@ Fire-type Pokémon | JOIN across the many-to-many tables, filtered by type
SELECT p.id, p.name, t.name AS type, pt.type_slot
FROM pokemon p
JOIN pokemon_types pt ON pt.pokemon_id = p.id
JOIN types t ON t.id = pt.type_id
WHERE t.name = 'fire'
ORDER BY p.id;

-- @@ Pokémon per type | GROUP BY + COUNT: how many Pokémon carry each type
SELECT t.name AS type, COUNT(*) AS pokemon_count
FROM types t
JOIN pokemon_types pt ON pt.type_id = t.id
GROUP BY t.id, t.name
ORDER BY pokemon_count DESC;

-- @@ Strongest types on average | GROUP BY + HAVING + AVG: average base stat total per type, types with 5+ Pokémon only
SELECT t.name AS type, COUNT(*) AS pokemon_count,
       ROUND(AVG(p.base_hp + p.base_attack + p.base_defense +
                 p.base_sp_attack + p.base_sp_defense + p.base_speed), 1) AS avg_total
FROM types t
JOIN pokemon_types pt ON pt.type_id = t.id
JOIN pokemon p ON p.id = pt.pokemon_id
GROUP BY t.id, t.name
HAVING COUNT(*) >= 5
ORDER BY avg_total DESC;

-- @@ Trainers with multiple teams | JOIN + GROUP BY + HAVING: trainers who own more than one team
SELECT tr.name AS trainer, COUNT(te.id) AS team_count
FROM trainers tr
JOIN teams te ON te.trainer_id = tr.id
GROUP BY tr.id, tr.name
HAVING COUNT(te.id) > 1;

-- @@ Team sizes (including empty teams) | LEFT JOIN + COUNT: members per team, 0 for empty teams
SELECT te.name AS team, tr.name AS trainer, COUNT(tm.id) AS members
FROM teams te
JOIN trainers tr ON tr.id = te.trainer_id
LEFT JOIN team_members tm ON tm.team_id = te.id
GROUP BY te.id, te.name, tr.name
ORDER BY members DESC, team;

-- @@ Pokémon on no team | Subquery (NOT IN): Pokémon that nobody has picked
SELECT id, name
FROM pokemon
WHERE id NOT IN (SELECT pokemon_id FROM team_members)
ORDER BY id
LIMIT 30;

-- @@ Above-average Pokémon | Scalar subquery: base stat total above the overall average
SELECT id, name,
       (base_hp + base_attack + base_defense + base_sp_attack + base_sp_defense + base_speed) AS total
FROM pokemon
WHERE (base_hp + base_attack + base_defense + base_sp_attack + base_sp_defense + base_speed) >
      (SELECT AVG(base_hp + base_attack + base_defense + base_sp_attack + base_sp_defense + base_speed)
       FROM pokemon)
ORDER BY total DESC
LIMIT 20;

-- @@ Trainer win rates | Multi-table JOIN + SUM/COUNT: battles, wins and win % per trainer
SELECT tr.name AS trainer,
       COUNT(b.id) AS battles,
       SUM(b.winner_team_id = te.id) AS wins,
       ROUND(100 * SUM(b.winner_team_id = te.id) / COUNT(b.id), 1) AS win_pct
FROM trainers tr
JOIN teams te ON te.trainer_id = tr.id
JOIN battles b ON te.id IN (b.team1_id, b.team2_id)
GROUP BY tr.id, tr.name
ORDER BY win_pct DESC, battles DESC;

-- @@ Most popular Pokémon | GROUP BY + HAVING: Pokémon used on 2+ teams
SELECT p.name, COUNT(*) AS times_used, ROUND(AVG(tm.level), 1) AS avg_level
FROM team_members tm
JOIN pokemon p ON p.id = tm.pokemon_id
GROUP BY p.id, p.name
HAVING COUNT(*) >= 2
ORDER BY times_used DESC, p.name;

-- @@ Trainers above the average level | HAVING with a subquery: trainers whose average level beats the global average
SELECT tr.name AS trainer, ROUND(AVG(tm.level), 1) AS avg_level
FROM trainers tr
JOIN teams te ON te.trainer_id = tr.id
JOIN team_members tm ON tm.team_id = te.id
GROUP BY tr.id, tr.name
HAVING AVG(tm.level) > (SELECT AVG(level) FROM team_members)
ORDER BY avg_level DESC;

-- @@ Movesets | JOIN + GROUP_CONCAT: each Pokémon's chosen moves, in slot order
SELECT tm.id AS member_id, p.name AS pokemon, COALESCE(tm.nickname, '-') AS nickname,
       GROUP_CONCAT(m.name ORDER BY tmm.move_slot SEPARATOR ', ') AS moves
FROM team_members tm
JOIN pokemon p ON p.id = tm.pokemon_id
JOIN team_member_moves tmm ON tmm.team_member_id = tm.id
JOIN moves m ON m.id = tmm.move_id
GROUP BY tm.id, p.name, tm.nickname
ORDER BY tm.id;

-- @@ Team summary view | Querying the view v_team_summary like a normal table
SELECT * FROM v_team_summary
ORDER BY total_base_stats DESC;