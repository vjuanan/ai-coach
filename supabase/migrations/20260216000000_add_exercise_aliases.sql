-- Add aliases column to exercises table
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS aliases text[] DEFAULT NULL;

-- Create an index for faster searching on aliases
CREATE INDEX IF NOT EXISTS idx_exercises_aliases ON public.exercises USING GIN (aliases);

-- Update RLS policies if necessary (usually not needed for just adding a column if policies are row-based by content or role)
-- The existing policies for exercises should cover this new column as it is part of the row.

COMMENT ON COLUMN public.exercises.aliases IS 'Array of alternative names for the exercise to aid in search';
