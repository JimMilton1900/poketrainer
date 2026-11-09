
ALTER TABLE pokemon ADD CONSTRAINT chk_pokemon_stats CHECK (
  base_hp >= 1 AND base_attack >= 1 AND base_defense >= 1 AND
  base_sp_attack >= 1 AND base_sp_defense >= 1 AND base_speed >= 1);
ALTER TABLE pokemon_types     ADD CONSTRAINT chk_type_slot   CHECK (type_slot BETWEEN 1 AND 2);
ALTER TABLE moves             ADD CONSTRAINT chk_move_values CHECK (pp > 0 AND (power IS NULL OR power >= 0));
ALTER TABLE team_members      ADD CONSTRAINT chk_slot        CHECK (slot BETWEEN 1 AND 6);
ALTER TABLE team_members      ADD CONSTRAINT chk_level       CHECK (level BETWEEN 1 AND 100);
ALTER TABLE team_member_moves ADD CONSTRAINT chk_move_slot   CHECK (move_slot BETWEEN 1 AND 4);
ALTER TABLE battles           ADD CONSTRAINT chk_battle      CHECK (
  team1_id <> team2_id AND (winner_team_id = team1_id OR winner_team_id = team2_id));
