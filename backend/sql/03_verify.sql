-- Row counts: expect 18 / 151 / ~200+ / 165
SELECT 'types' t, COUNT(*) n FROM types
UNION ALL SELECT 'pokemon', COUNT(*) FROM pokemon
UNION ALL SELECT 'pokemon_types', COUNT(*) FROM pokemon_types
UNION ALL SELECT 'moves', COUNT(*) FROM moves;

-- Every Pokémon must have 1 or 2 types: expecting 0 rows
SELECT p.id, p.name, COUNT(pt.type_id) AS n
FROM pokemon p LEFT JOIN pokemon_types pt ON pt.pokemon_id = p.id
GROUP BY p.id, p.name HAVING n NOT BETWEEN 1 AND 2;

-- Missing sprites or suspicious values: expecting 0 rows
SELECT id, name FROM pokemon WHERE sprite_url IS NULL OR base_hp > 255 OR height_dm <= 0;

-- Spot-check known values: Pikachu #25 is Electric with hp 35, speed 90
SELECT p.id, p.name, p.base_hp, p.base_speed, GROUP_CONCAT(t.name) AS types
FROM pokemon p JOIN pokemon_types pt ON pt.pokemon_id = p.id JOIN types t ON t.id = pt.type_id
WHERE p.id IN (1, 6, 25, 150) GROUP BY p.id;

-- Moves with an unknown type: expect 0 rows
SELECT m.id, m.name FROM moves m LEFT JOIN types t ON t.id = m.type_id WHERE t.id IS NULL;