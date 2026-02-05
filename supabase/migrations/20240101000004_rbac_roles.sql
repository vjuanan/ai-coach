-- 003_rbac_roles.sql
-- Implement Role-Based Access Control

-- 1. Create Role Enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('coach', 'athlete', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Profiles Table (Public Identity)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role user_role DEFAULT NULL, -- Null initially, forces onboarding
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);

-- 4. Auto-create Profile on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'full_name',
        NULL -- Role is selected during onboarding
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Link Athletes to Users
-- Add user_id to clients table to link a "Client Record" to a "Real User"
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- 6. STRICT RLS POLICIES (The "Bouncer")

-- Drop existing lenient policies
DROP POLICY IF EXISTS "Coaches can view own clients" ON clients;
DROP POLICY IF EXISTS "Coaches can insert own clients" ON clients;
DROP POLICY IF EXISTS "Coaches can update own clients" ON clients;
DROP POLICY IF EXISTS "Coaches can delete own clients" ON clients;
DROP POLICY IF EXISTS "Coach view own clients" ON clients;
DROP POLICY IF EXISTS "Coach manage clients" ON clients;

DROP POLICY IF EXISTS "Coaches can view own programs" ON programs;
DROP POLICY IF EXISTS "Coaches can insert own programs" ON programs;
DROP POLICY IF EXISTS "Coaches can update own programs" ON programs;
DROP POLICY IF EXISTS "Coaches can delete own programs" ON programs;
DROP POLICY IF EXISTS "RBAC Program Visibility" ON programs;
DROP POLICY IF EXISTS "Coach manage programs" ON programs;

-- Define Helper Functions for Clean Policies
CREATE OR REPLACE FUNCTION is_coach() 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'coach'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================
-- CLIENTS (Athletes managed by Coach)
-- ==========================

-- Coach sees clients they created
CREATE POLICY "Coach view own clients"
    ON clients FOR SELECT
    USING (
        (is_coach() AND coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()))
        OR 
        (auth.uid() = user_id) -- Athlete sees themselves
    );

-- Only Coach can Insert/Update/Delete Clients
CREATE POLICY "Coach manage clients"
    ON clients FOR ALL
    USING (is_coach() AND coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

-- ==========================
-- PROGRAMS
-- ==========================

-- Coach sees own programs. Athlete sees programs assigned to them.
CREATE POLICY "RBAC Program Visibility"
    ON programs FOR SELECT
    USING (
        -- As Coach: I own the program via my coach profile
        (is_coach() AND coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()))
        OR
        -- As Athlete: The program is assigned to my Client-Link
        (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
        OR
        -- Public Templates (Keep existing logic)
        (is_template = true)
    );

-- Only Coach can Manage Programs
CREATE POLICY "Coach manage programs"
    ON programs FOR ALL
    USING (is_coach() AND coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

-- ==========================
-- MESOCYCLES / DAYS / BLOCKS (Inherited Visibility)
-- ==========================

-- MESOCYCLES
DROP POLICY IF EXISTS "Coaches can view own mesocycles" ON mesocycles;
DROP POLICY IF EXISTS "Coaches can manage own mesocycles" ON mesocycles;
DROP POLICY IF EXISTS "Public can view template mesocycles" ON mesocycles;
DROP POLICY IF EXISTS "RBAC Mesocycle Visibility" ON mesocycles;
DROP POLICY IF EXISTS "Coach manage mesocycles" ON mesocycles;

CREATE POLICY "RBAC Mesocycle Visibility"
    ON mesocycles FOR SELECT
    USING (
        -- Efficient: EXIST check against visible programs (Re-implement logic to avoid recursion recursion issues if any)
        EXISTS (
            SELECT 1 FROM programs p 
            WHERE p.id = mesocycles.program_id
            AND (
                -- Logic repeated from Programs Policy for strictness without recursion
                 (is_template = true)
                 OR (is_coach() AND p.coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()))
                 OR (p.client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
            )
        )
    );

CREATE POLICY "Coach manage mesocycles"
    ON mesocycles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM programs p
            JOIN coaches c ON p.coach_id = c.id
            WHERE p.id = mesocycles.program_id
            AND c.user_id = auth.uid()
        )
    );

-- DAYS
DROP POLICY IF EXISTS "Coaches can view own days" ON days;
DROP POLICY IF EXISTS "Coaches can manage own days" ON days;
DROP POLICY IF EXISTS "Public can view template days" ON days;
DROP POLICY IF EXISTS "RBAC Day Visibility" ON days;
DROP POLICY IF EXISTS "Coach manage days" ON days;

CREATE POLICY "RBAC Day Visibility"
    ON days FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM mesocycles m
            JOIN programs p ON m.program_id = p.id
            WHERE m.id = days.mesocycle_id
            AND (
                (p.is_template = true)
                OR (is_coach() AND p.coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()))
                OR (p.client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
            )
        )
    );
    
-- Note for manage policies: Just being a coach owner is enough
CREATE POLICY "Coach manage days"
    ON days FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM mesocycles m
            JOIN programs p ON m.program_id = p.id
            WHERE m.id = days.mesocycle_id
            AND p.coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
        )
    );

-- WORKOUT BLOCKS
DROP POLICY IF EXISTS "Coaches can view own workout blocks" ON workout_blocks;
DROP POLICY IF EXISTS "Coaches can manage own workout blocks" ON workout_blocks;
DROP POLICY IF EXISTS "Public can view template workout blocks" ON workout_blocks;
DROP POLICY IF EXISTS "RBAC Block Visibility" ON workout_blocks;
DROP POLICY IF EXISTS "Coach manage blocks" ON workout_blocks;


CREATE POLICY "RBAC Block Visibility"
    ON workout_blocks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM days d
            JOIN mesocycles m ON d.mesocycle_id = m.id
            JOIN programs p ON m.program_id = p.id
            WHERE d.id = workout_blocks.day_id
            AND (
                (p.is_template = true)
                OR (is_coach() AND p.coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()))
                OR (p.client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
            )
        )
    );

CREATE POLICY "Coach manage blocks"
    ON workout_blocks FOR ALL
    USING (
         EXISTS (
            SELECT 1 FROM days d
            JOIN mesocycles m ON d.mesocycle_id = m.id
            JOIN programs p ON m.program_id = p.id
            WHERE d.id = workout_blocks.day_id
            AND p.coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
        )
    );
