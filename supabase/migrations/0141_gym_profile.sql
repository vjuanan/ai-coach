-- Add gym to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'gym';

-- Add gym-specific profile fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gym_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gym_location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gym_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_count INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipment_available JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS operating_hours TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_gym_role ON profiles(role) WHERE role = 'gym';
