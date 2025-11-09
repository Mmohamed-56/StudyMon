-- Add audio columns to gym_series_gyms table
-- Run this in Supabase SQL Editor

ALTER TABLE gym_series_gyms 
ADD COLUMN IF NOT EXISTS voice_id text DEFAULT 'pNInz6obpgDQGcFmaJgB',
ADD COLUMN IF NOT EXISTS intro_line text,
ADD COLUMN IF NOT EXISTS victory_line text,
ADD COLUMN IF NOT EXISTS defeat_line text;

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'gym_series_gyms'
AND column_name IN ('voice_id', 'intro_line', 'victory_line', 'defeat_line');

-- Reload schema
NOTIFY pgrst, 'reload schema';

