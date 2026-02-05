-- Add progression_id to workout_blocks table to support linked progressions
ALTER TABLE workout_blocks
ADD COLUMN progression_id UUID;

-- Create index for performance on progression operations
CREATE INDEX idx_workout_blocks_progression ON workout_blocks(progression_id);

-- Optional: Comment describing the column
COMMENT ON COLUMN workout_blocks.progression_id IS 'UUID linking multiple blocks across days/weeks that are part of the same progression chain.';
