-- 10 trainers
INSERT INTO trainers (name, hometown, favorite_type_id) VALUES
('Ash',       'Pallet Town',    (SELECT id FROM types WHERE name='electric')),
('Misty',     'Cerulean City',  (SELECT id FROM types WHERE name='water')),
('Brock',     'Pewter City',    (SELECT id FROM types WHERE name='rock')),
('Gary',      'Pallet Town',    (SELECT id FROM types WHERE name='water')),
('Erika',     'Celadon City',   (SELECT id FROM types WHERE name='grass')),
('Sabrina',   'Saffron City',   (SELECT id FROM types WHERE name='psychic')),
('Lt. Surge', 'Vermilion City', (SELECT id FROM types WHERE name='electric')),
('Blaine',    'Cinnabar Island',(SELECT id FROM types WHERE name='fire')),
('Giovanni',  'Viridian City',  (SELECT id FROM types WHERE name='ground')),
('Koga',      'Fuchsia City',   (SELECT id FROM types WHERE name='poison'));

-- 12 teams (Ash and Gary have two each)
INSERT INTO teams (trainer_id, name) VALUES
(1,'Kanto Journey'),(1,'Champions'),(2,'Water Squad'),(3,'Rock Solid'),
(4,'Rival Team'),(4,'Gary Backup'),(5,'Garden Party'),(6,'Mind Games'),
(7,'Voltage'),(8,'Burning Hot'),(9,'Rocket Boss'),(10,'Poison Pit');

-- 55 team members: (team_id, pokemon_id, slot, nickname, level)
INSERT INTO team_members (team_id, pokemon_id, slot, nickname, level) VALUES
(1,25,1,'Sparky',50),(1,6,2,'Zard',55),(1,7,3,NULL,45),(1,1,4,NULL,45),(1,18,5,'Pidge',40),(1,143,6,'Munch',60),
(2,25,1,'Volt',70),(2,149,2,NULL,70),(2,131,3,NULL,65),(2,143,4,'Munch',68),
(3,121,1,'Star',50),(3,130,2,NULL,55),(3,54,3,'Duckie',40),(3,134,4,NULL,50),(3,131,5,NULL,52),
(4,95,1,'Rocky',45),(4,74,2,NULL,40),(4,141,3,NULL,50),(4,76,4,NULL,48),(4,112,5,NULL,52),
(5,9,1,NULL,60),(5,59,2,NULL,58),(5,65,3,NULL,60),(5,103,4,NULL,55),(5,112,5,NULL,55),(5,130,6,NULL,56),
(6,133,1,'Eevee',30),(6,18,2,NULL,45),
(7,45,1,NULL,50),(7,114,2,NULL,45),(7,71,3,NULL,48),(7,3,4,NULL,55),
(8,65,1,'Mind',60),(8,122,2,NULL,50),(8,97,3,NULL,55),(8,80,4,NULL,52),
(9,26,1,NULL,55),(9,125,2,NULL,52),(9,82,3,NULL,50),(9,135,4,NULL,50),
(10,59,1,'Hound',58),(10,78,2,NULL,55),(10,126,3,NULL,52),(10,6,4,NULL,60),(10,38,5,NULL,56),
(11,112,1,NULL,65),(11,34,2,NULL,62),(11,31,3,NULL,62),(11,51,4,NULL,60),(11,53,5,NULL,60),
(12,110,1,NULL,55),(12,89,2,NULL,52),(12,42,3,NULL,50),(12,24,4,NULL,50),(12,49,5,NULL,52);

-- Moves for a few members: (team_member_id, move_id, move_slot)
INSERT INTO team_member_moves (team_member_id, move_id, move_slot) VALUES
(1,(SELECT id FROM moves WHERE name='thunderbolt'),1),
(1,(SELECT id FROM moves WHERE name='quick-attack'),2),
(1,(SELECT id FROM moves WHERE name='thunder-wave'),3),
(2,(SELECT id FROM moves WHERE name='flamethrower'),1),
(2,(SELECT id FROM moves WHERE name='slash'),2),
(2,(SELECT id FROM moves WHERE name='fire-spin'),3),
(3,(SELECT id FROM moves WHERE name='surf'),1),
(3,(SELECT id FROM moves WHERE name='bubble-beam'),2),
(6,(SELECT id FROM moves WHERE name='body-slam'),1),
(6,(SELECT id FROM moves WHERE name='hyper-beam'),2),
(6,(SELECT id FROM moves WHERE name='rest'),3),
(11,(SELECT id FROM moves WHERE name='surf'),1),
(11,(SELECT id FROM moves WHERE name='psychic'),2),
(12,(SELECT id FROM moves WHERE name='hydro-pump'),1),
(12,(SELECT id FROM moves WHERE name='hyper-beam'),2);

-- 13 battles: (team1, team2, winner)
INSERT INTO battles (team1_id, team2_id, winner_team_id) VALUES
(1,5,5),(1,5,1),(2,5,2),(3,4,3),(3,7,7),(4,9,9),(10,7,10),
(11,1,11),(11,8,8),(12,3,3),(2,11,2),(9,10,10),(8,6,8);