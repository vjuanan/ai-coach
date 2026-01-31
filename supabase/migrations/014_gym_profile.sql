-- Gym Profile Fields Migration
-- Adds gym-specific columns to the profiles table for self-registered gyms

-- Add gym-specific profile fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gym_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gym_location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gym_type TEXT; -- crossfit, globo, boutique, functional
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_count INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipment_available JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS operating_hours TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create index for gym lookups
CREATE INDEX IF NOT EXISTS idx_profiles_gym_role ON profiles(role) WHERE role = 'gym';

COMMENT ON COLUMN profiles.gym_name IS 'Name of the gym/box for self-registered gyms';
COMMENT ON COLUMN profiles.gym_type IS 'Type of gym: crossfit, globo, boutique, functional';
COMMENT ON COLUMN profiles.equipment_available IS 'JSON object with equipment flags (rig, rowers, skiErgs, etc.)';
