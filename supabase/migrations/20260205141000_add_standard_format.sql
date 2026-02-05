-- Add STANDARD to workout_format enum to fix saving error
ALTER TYPE workout_format ADD VALUE IF NOT EXISTS 'STANDARD';
