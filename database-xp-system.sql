-- XP and Leveling System
-- Run this in Supabase SQL Editor

-- Add current_xp column to user_creatures (if not exists)
ALTER TABLE user_creatures
ADD COLUMN IF NOT EXISTS current_xp INTEGER DEFAULT 0;

-- Function to calculate XP needed for next level
CREATE OR REPLACE FUNCTION xp_for_next_level(current_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Formula: level * 50
  -- Level 1→2: 50 XP
  -- Level 2→3: 100 XP
  -- Level 5→6: 250 XP
  RETURN current_level * 50;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate skill slots available at a level
CREATE OR REPLACE FUNCTION skill_slots_at_level(current_level INTEGER)
RETURNS TABLE(skill_level INTEGER, slots INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 1, (current_level / 2)::INTEGER
  UNION ALL
  SELECT 2, (current_level / 5)::INTEGER
  UNION ALL
  SELECT 3, (current_level / 10)::INTEGER
  UNION ALL
  SELECT 4, (current_level / 15)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Test the functions
SELECT 
  level,
  xp_for_next_level(level) as xp_needed,
  (SELECT SUM(slots) FROM skill_slots_at_level(level)) as total_skill_slots
FROM generate_series(1, 20) as level;

-- Verify column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_creatures'
AND column_name = 'current_xp';

