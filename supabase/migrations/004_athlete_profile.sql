-- Migration: 004_athlete_profile.sql
-- Description: Adds demographic and training columns to profiles table for Athlete Onboarding

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS height INT,           -- in cm
ADD COLUMN IF NOT EXISTS weight NUMERIC(5,2),  -- in kg
ADD COLUMN IF NOT EXISTS main_goal TEXT,       -- user defined enum: hypertrophy, fat_loss, performance, maintenance
ADD COLUMN IF NOT EXISTS training_place TEXT,  -- user defined enum: gym, crossfit, home
ADD COLUMN IF NOT EXISTS equipment_list JSONB, -- Array of strings for home equipment
ADD COLUMN IF NOT EXISTS days_per_week INT,
ADD COLUMN IF NOT EXISTS minutes_per_session INT,
ADD COLUMN IF NOT EXISTS experience_level TEXT,-- user defined enum: beginner, intermediate, advanced
ADD COLUMN IF NOT EXISTS injuries TEXT,
ADD COLUMN IF NOT EXISTS training_preferences TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT, -- E.164 format
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Validation Checks (Optional but recommended for data integrity, checking ranges as per UI)
ALTER TABLE profiles ADD CONSTRAINT check_height_range CHECK (height IS NULL OR (height >= 50 AND height <= 300));
ALTER TABLE profiles ADD CONSTRAINT check_weight_range CHECK (weight IS NULL OR (weight >= 20 AND weight <= 500));
ALTER TABLE profiles ADD CONSTRAINT check_days_week CHECK (days_per_week IS NULL OR (days_per_week >= 1 AND days_per_week <= 7));
