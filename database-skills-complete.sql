-- Add Skills for ALL Creature Types
-- Run this in Supabase SQL Editor

-- Psychic Skills (type_id = 5)
INSERT INTO public.skills(name,type_id,skill_level,base_power,sp_cost,description) VALUES
('Confusion',5,1,20,5,'Psychic wave attack'),
('Psybeam',5,1,23,5,'Mysterious beam'),
('Psychic',5,2,40,10,'Powerful telekinesis'),
('Mind Reader',5,2,42,10,'Read opponent mind'),
('Future Sight',5,3,70,20,'See the future attack'),
('Psycho Boost',5,4,120,30,'Ultimate psychic power')
ON CONFLICT(name,type_id) DO NOTHING;

-- Ice Skills (type_id = 6)
INSERT INTO public.skills(name,type_id,skill_level,base_power,sp_cost,description) VALUES
('Ice Shard',6,1,20,5,'Sharp ice attack'),
('Powder Snow',6,1,22,5,'Freezing snow'),
('Ice Beam',6,2,40,10,'Freezing beam'),
('Frost Breath',6,2,43,10,'Icy breath'),
('Blizzard',6,3,70,20,'Massive snowstorm'),
('Absolute Zero',6,4,120,30,'Ultimate freeze')
ON CONFLICT(name,type_id) DO NOTHING;

-- Dragon Skills (type_id = 7)
INSERT INTO public.skills(name,type_id,skill_level,base_power,sp_cost,description) VALUES
('Dragon Rage',7,1,20,5,'Dragon fury'),
('Twister',7,1,24,5,'Dragon tornado'),
('Dragon Breath',7,2,40,10,'Powerful breath'),
('Dragon Pulse',7,2,44,10,'Dragon energy pulse'),
('Dragon Rush',7,3,70,20,'Devastating charge'),
('Draco Meteor',7,4,120,30,'Ultimate dragon power')
ON CONFLICT(name,type_id) DO NOTHING;

-- Dark Skills (type_id = 8)
INSERT INTO public.skills(name,type_id,skill_level,base_power,sp_cost,description) VALUES
('Bite',8,1,20,5,'Dark bite'),
('Feint Attack',8,1,22,5,'Sneaky strike'),
('Crunch',8,2,40,10,'Crushing bite'),
('Night Slash',8,2,41,10,'Dark blade'),
('Dark Pulse',8,3,70,20,'Wave of darkness'),
('Dark Void',8,4,120,30,'Ultimate darkness')
ON CONFLICT(name,type_id) DO NOTHING;

-- Fairy Skills (type_id = 9)
INSERT INTO public.skills(name,type_id,skill_level,base_power,sp_cost,description) VALUES
('Fairy Wind',9,1,20,5,'Magical breeze'),
('Disarming Voice',9,1,23,5,'Charming sound'),
('Dazzling Gleam',9,2,40,10,'Blinding light'),
('Moonblast',9,2,43,10,'Lunar power'),
('Play Rough',9,3,70,20,'Rough play'),
('Light of Ruin',9,4,120,30,'Ultimate fairy power')
ON CONFLICT(name,type_id) DO NOTHING;

-- Steel Skills (type_id = 10)
INSERT INTO public.skills(name,type_id,skill_level,base_power,sp_cost,description) VALUES
('Metal Claw',10,1,20,5,'Sharp metal claws'),
('Bullet Punch',10,1,24,5,'Fast metal strike'),
('Iron Head',10,2,40,10,'Steel headbutt'),
('Flash Cannon',10,2,42,10,'Metal beam'),
('Iron Tail',10,3,70,20,'Heavy tail slam'),
('Steel Beam',10,4,120,30,'Ultimate metal blast')
ON CONFLICT(name,type_id) DO NOTHING;

-- Rock Skills (type_id = 11)
INSERT INTO public.skills(name,type_id,skill_level,base_power,sp_cost,description) VALUES
('Rock Throw',11,1,20,5,'Throw rocks'),
('Rock Tomb',11,1,22,5,'Trap with rocks'),
('Rock Slide',11,2,40,10,'Avalanche of rocks'),
('Power Gem',11,2,41,10,'Shining gemstone'),
('Stone Edge',11,3,70,20,'Sharp stone attack'),
('Rock Wrecker',11,4,120,30,'Ultimate rock slam')
ON CONFLICT(name,type_id) DO NOTHING;

-- Ghost Skills (type_id = 12)
INSERT INTO public.skills(name,type_id,skill_level,base_power,sp_cost,description) VALUES
('Lick',12,1,20,5,'Ghostly lick'),
('Astonish',12,1,21,5,'Sudden scare'),
('Shadow Ball',12,2,40,10,'Ball of shadows'),
('Hex',12,2,41,10,'Cursed attack'),
('Shadow Claw',12,3,70,20,'Ghostly claws'),
('Phantom Force',12,4,120,30,'Ultimate ghost power')
ON CONFLICT(name,type_id) DO NOTHING;

-- Verify skills were added
SELECT ct.name as type, COUNT(*) as skill_count
FROM skills s
JOIN creature_types ct ON s.type_id = ct.id
GROUP BY ct.name
ORDER BY ct.id;

