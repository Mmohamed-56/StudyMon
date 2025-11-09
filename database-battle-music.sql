-- Battle Music Pool System
-- Run this in Supabase SQL Editor

-- Table for shared battle music tracks
CREATE TABLE IF NOT EXISTS battle_music (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_type text NOT NULL CHECK (battle_type IN ('wild', 'gym')),
  music_url text NOT NULL, -- URL to stored MP3 in Supabase Storage
  duration_seconds integer,
  generated_at timestamp with time zone DEFAULT now(),
  play_count integer DEFAULT 0,
  is_active boolean DEFAULT true
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_battle_music_type ON battle_music(battle_type);
CREATE INDEX IF NOT EXISTS idx_battle_music_play_count ON battle_music(play_count);

-- Enable RLS
ALTER TABLE battle_music ENABLE ROW LEVEL SECURITY;

-- Anyone can read active music
CREATE POLICY "Anyone can view active battle music"
  ON battle_music FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Verify
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'battle_music';

NOTIFY pgrst, 'reload schema';

