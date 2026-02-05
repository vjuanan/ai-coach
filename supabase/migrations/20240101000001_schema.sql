-- CV-OS Database Schema
-- CrossFit Coach Programming Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE client_type AS ENUM ('athlete', 'gym');
CREATE TYPE block_type AS ENUM ('strength_linear', 'metcon_structured', 'warmup', 'accessory', 'skill', 'free_text');
CREATE TYPE workout_format AS ENUM ('AMRAP', 'EMOM', 'RFT', 'Chipper', 'Ladder', 'Tabata', 'Not For Time', 'For Time');
CREATE TYPE exercise_category AS ENUM ('Weightlifting', 'Gymnastics', 'Monostructural', 'Functional Bodybuilding');
CREATE TYPE program_status AS ENUM ('draft', 'active', 'archived');

-- ============================================
-- COACHES TABLE
-- ============================================

CREATE TABLE coaches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    business_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================
-- CLIENTS TABLE (Athletes & Gyms)
-- ============================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    type client_type NOT NULL,
    name TEXT NOT NULL,
    logo_url TEXT,
    email TEXT,
    phone TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_clients_coach ON clients(coach_id);
CREATE INDEX idx_clients_type ON clients(type);

-- ============================================
-- PROGRAMS TABLE
-- ============================================

CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    status program_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_programs_coach ON programs(coach_id);
CREATE INDEX idx_programs_client ON programs(client_id);
CREATE INDEX idx_programs_status ON programs(status);

-- ============================================
-- MESOCYCLES TABLE (4-Week Blocks)
-- ============================================

CREATE TABLE mesocycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 8),
    focus TEXT,
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(program_id, week_number)
);

CREATE INDEX idx_mesocycles_program ON mesocycles(program_id);

-- ============================================
-- DAYS TABLE
-- ============================================

CREATE TABLE days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mesocycle_id UUID NOT NULL REFERENCES mesocycles(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 7),
    name TEXT,
    date DATE,
    is_rest_day BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(mesocycle_id, day_number)
);

CREATE INDEX idx_days_mesocycle ON days(mesocycle_id);

-- ============================================
-- WORKOUT BLOCKS TABLE (Polymorphic)
-- ============================================

CREATE TABLE workout_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_id UUID NOT NULL REFERENCES days(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    type block_type NOT NULL,
    format workout_format,
    name TEXT,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_blocks_day ON workout_blocks(day_id);
CREATE INDEX idx_workout_blocks_order ON workout_blocks(day_id, order_index);

-- ============================================
-- EXERCISES LIBRARY TABLE
-- ============================================

CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    category exercise_category NOT NULL,
    subcategory TEXT,
    modality_suitability TEXT[] DEFAULT '{}',
    equipment TEXT[] DEFAULT '{}',
    description TEXT,
    video_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_name ON exercises(name);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coaches_updated_at
    BEFORE UPDATE ON coaches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programs_updated_at
    BEFORE UPDATE ON programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mesocycles_updated_at
    BEFORE UPDATE ON mesocycles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_days_updated_at
    BEFORE UPDATE ON days
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_blocks_updated_at
    BEFORE UPDATE ON workout_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesocycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE days ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Coaches can only see their own profile
CREATE POLICY "Coaches can view own profile"
    ON coaches FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Coaches can update own profile"
    ON coaches FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their coach profile"
    ON coaches FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Clients: Coaches can only see their own clients
CREATE POLICY "Coaches can view own clients"
    ON clients FOR SELECT
    USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

CREATE POLICY "Coaches can insert own clients"
    ON clients FOR INSERT
    WITH CHECK (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

CREATE POLICY "Coaches can update own clients"
    ON clients FOR UPDATE
    USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

CREATE POLICY "Coaches can delete own clients"
    ON clients FOR DELETE
    USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

-- Programs: Coaches can only see their own programs
CREATE POLICY "Coaches can view own programs"
    ON programs FOR SELECT
    USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

CREATE POLICY "Coaches can insert own programs"
    ON programs FOR INSERT
    WITH CHECK (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

CREATE POLICY "Coaches can update own programs"
    ON programs FOR UPDATE
    USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

CREATE POLICY "Coaches can delete own programs"
    ON programs FOR DELETE
    USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

-- Mesocycles: Access through programs
CREATE POLICY "Coaches can view own mesocycles"
    ON mesocycles FOR SELECT
    USING (program_id IN (
        SELECT id FROM programs 
        WHERE coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
    ));

CREATE POLICY "Coaches can manage own mesocycles"
    ON mesocycles FOR ALL
    USING (program_id IN (
        SELECT id FROM programs 
        WHERE coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
    ));

-- Days: Access through mesocycles
CREATE POLICY "Coaches can view own days"
    ON days FOR SELECT
    USING (mesocycle_id IN (
        SELECT m.id FROM mesocycles m
        JOIN programs p ON m.program_id = p.id
        WHERE p.coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
    ));

CREATE POLICY "Coaches can manage own days"
    ON days FOR ALL
    USING (mesocycle_id IN (
        SELECT m.id FROM mesocycles m
        JOIN programs p ON m.program_id = p.id
        WHERE p.coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
    ));

-- Workout Blocks: Access through days
CREATE POLICY "Coaches can view own workout blocks"
    ON workout_blocks FOR SELECT
    USING (day_id IN (
        SELECT d.id FROM days d
        JOIN mesocycles m ON d.mesocycle_id = m.id
        JOIN programs p ON m.program_id = p.id
        WHERE p.coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
    ));

CREATE POLICY "Coaches can manage own workout blocks"
    ON workout_blocks FOR ALL
    USING (day_id IN (
        SELECT d.id FROM days d
        JOIN mesocycles m ON d.mesocycle_id = m.id
        JOIN programs p ON m.program_id = p.id
        WHERE p.coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
    ));

-- Exercises: Public read access
CREATE POLICY "Anyone can view exercises"
    ON exercises FOR SELECT
    TO authenticated
    USING (true);
