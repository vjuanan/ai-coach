ALTER TABLE profiles ADD COLUMN IF NOT EXISTS benchmarks JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN profiles.benchmarks IS 'Stores athlete RM stats and time benchmarks (e.g. { backSquat: 100, franTime: 180 })';
