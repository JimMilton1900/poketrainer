CREATE TABLE `types` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(20) UNIQUE NOT NULL
);

CREATE TABLE `pokemon` (
  `id` int PRIMARY KEY COMMENT 'National Dex number (taken from PokéAPI, not auto-increment)',
  `name` varchar(50) UNIQUE NOT NULL,
  `height_dm` int NOT NULL,
  `weight_hg` int NOT NULL,
  `base_hp` int NOT NULL,
  `base_attack` int NOT NULL,
  `base_defense` int NOT NULL,
  `base_sp_attack` int NOT NULL,
  `base_sp_defense` int NOT NULL,
  `base_speed` int NOT NULL,
  `sprite_url` varchar(255)
);

CREATE TABLE `pokemon_types` (
  `pokemon_id` int NOT NULL,
  `type_id` int NOT NULL,
  `type_slot` tinyint NOT NULL DEFAULT 1 COMMENT '1 = primary, 2 = secondary',
  PRIMARY KEY (`pokemon_id`, `type_id`)
);

CREATE TABLE `moves` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(60) UNIQUE NOT NULL,
  `type_id` int NOT NULL,
  `power` int COMMENT 'NULL for status moves',
  `accuracy` int COMMENT 'NULL for moves that never miss',
  `pp` int NOT NULL DEFAULT 10
);

CREATE TABLE `trainers` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(50) UNIQUE NOT NULL,
  `hometown` varchar(60) NOT NULL DEFAULT 'Pallet Town',
  `favorite_type_id` int COMMENT 'optional',
  `joined_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `teams` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `trainer_id` int NOT NULL,
  `name` varchar(60) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `team_members` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `team_id` int NOT NULL,
  `pokemon_id` int NOT NULL,
  `slot` tinyint NOT NULL,
  `nickname` varchar(40),
  `level` tinyint NOT NULL DEFAULT 50
);

CREATE TABLE `team_member_moves` (
  `team_member_id` int NOT NULL,
  `move_id` int NOT NULL,
  `move_slot` tinyint NOT NULL,
  PRIMARY KEY (`team_member_id`, `move_slot`)
);

CREATE TABLE `battles` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `team1_id` int NOT NULL,
  `team2_id` int NOT NULL,
  `winner_team_id` int NOT NULL,
  `battled_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE UNIQUE INDEX `pokemon_types_index_0` ON `pokemon_types` (`pokemon_id`, `type_slot`);

CREATE UNIQUE INDEX `teams_index_1` ON `teams` (`trainer_id`, `name`);

CREATE UNIQUE INDEX `team_members_index_2` ON `team_members` (`team_id`, `slot`);

CREATE UNIQUE INDEX `team_member_moves_index_3` ON `team_member_moves` (`team_member_id`, `move_id`);

ALTER TABLE `pokemon` COMMENT = 'CHECK: all base stats >= 1';

ALTER TABLE `pokemon_types` COMMENT = 'CHECK: type_slot BETWEEN 1 AND 2. Resolves the many-to-many between pokemon and types.';

ALTER TABLE `moves` COMMENT = 'CHECK: pp > 0 AND (power IS NULL OR power >= 0)';

ALTER TABLE `teams` COMMENT = 'A trainer cannot have two teams with the same name';

ALTER TABLE `team_members` COMMENT = 'CHECK: slot BETWEEN 1 AND 6 and level BETWEEN 1 AND 100. UNIQUE(team_id, slot) enforces max 6 per team.';

ALTER TABLE `team_member_moves` COMMENT = 'CHECK: move_slot BETWEEN 1 AND 4. Max 4 moves per member, no duplicate move.';

ALTER TABLE `battles` COMMENT = 'CHECK: team1_id <> team2_id AND (winner_team_id = team1_id OR winner_team_id = team2_id)';

ALTER TABLE `pokemon_types` ADD FOREIGN KEY (`pokemon_id`) REFERENCES `pokemon` (`id`) ON DELETE CASCADE;

ALTER TABLE `pokemon_types` ADD FOREIGN KEY (`type_id`) REFERENCES `types` (`id`) ON DELETE RESTRICT;

ALTER TABLE `moves` ADD FOREIGN KEY (`type_id`) REFERENCES `types` (`id`) ON DELETE RESTRICT;

ALTER TABLE `trainers` ADD FOREIGN KEY (`favorite_type_id`) REFERENCES `types` (`id`) ON DELETE SET NULL;

ALTER TABLE `teams` ADD FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`id`) ON DELETE CASCADE;

ALTER TABLE `team_members` ADD FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE;

ALTER TABLE `team_members` ADD FOREIGN KEY (`pokemon_id`) REFERENCES `pokemon` (`id`) ON DELETE RESTRICT;

ALTER TABLE `team_member_moves` ADD FOREIGN KEY (`team_member_id`) REFERENCES `team_members` (`id`) ON DELETE CASCADE;

ALTER TABLE `team_member_moves` ADD FOREIGN KEY (`move_id`) REFERENCES `moves` (`id`) ON DELETE RESTRICT;

ALTER TABLE `battles` ADD FOREIGN KEY (`team1_id`) REFERENCES `teams` (`id`) ON DELETE RESTRICT;

ALTER TABLE `battles` ADD FOREIGN KEY (`team2_id`) REFERENCES `teams` (`id`) ON DELETE RESTRICT;

ALTER TABLE `battles` ADD FOREIGN KEY (`winner_team_id`) REFERENCES `teams` (`id`) ON DELETE RESTRICT;