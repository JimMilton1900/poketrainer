CREATE OR REPLACE VIEW v_team_summary AS
SELECT te.id AS team_id, te.name AS team_name, tr.name AS trainer,
       COUNT(tm.id) AS members,
       ROUND(AVG(tm.level), 1) AS avg_level,
       COALESCE(SUM(p.base_hp + p.base_attack + p.base_defense +
                    p.base_sp_attack + p.base_sp_defense + p.base_speed), 0) AS total_base_stats
FROM teams te
JOIN trainers tr ON tr.id = te.trainer_id
LEFT JOIN team_members tm ON tm.team_id = te.id
LEFT JOIN pokemon p ON p.id = tm.pokemon_id
GROUP BY te.id, te.name, tr.name;