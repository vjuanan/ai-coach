-- Add cue column to exercises table
-- Cues are coaching instructions stored per-exercise in the library
-- They are shown ONLY in export preview, NOT in the block editor
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS cue TEXT DEFAULT NULL;
