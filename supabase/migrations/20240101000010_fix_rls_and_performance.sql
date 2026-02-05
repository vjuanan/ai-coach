-- 008_fix_rls_and_performance.sql
-- Consolidated fix for RLS policies and performance issues

-- 1. PERFORMANCE FIX: Add avatar_url to profiles to prevent 42703 errors
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- 2. RLS FIX: Re-create policies safely (Drop first to avoid conflicts)

-- ==========================
-- PROGRAMS
-- ==========================

-- Drop existing policies to prevent "policy already exists" errors
DROP POLICY IF EXISTS "Coach manage programs" ON programs;
DROP POLICY IF EXISTS "Coach insert programs" ON programs;
DROP POLICY IF EXISTS "Coach update delete programs" ON programs;
DROP POLICY IF EXISTS "Coach delete programs" ON programs;

-- Create policies
CREATE POLICY "Coach insert programs"
    ON programs FOR INSERT
    WITH CHECK (
        is_coach() 
        AND coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
    );

CREATE POLICY "Coach update delete programs"
    ON programs FOR UPDATE
    USING (is_coach() AND coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

CREATE POLICY "Coach delete programs"
    ON programs FOR DELETE
    USING (is_coach() AND coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

-- ==========================
-- MESOCYCLES
-- ==========================

DROP POLICY IF EXISTS "Coach manage mesocycles" ON mesocycles;
DROP POLICY IF EXISTS "Coach insert mesocycles" ON mesocycles;
DROP POLICY IF EXISTS "Coach update mesocycles" ON mesocycles;
DROP POLICY IF EXISTS "Coach delete mesocycles" ON mesocycles;

CREATE POLICY "Coach insert mesocycles"
    ON mesocycles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM programs p
            JOIN coaches c ON p.coach_id = c.id
            WHERE p.id = program_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Coach update mesocycles"
    ON mesocycles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM programs p
            JOIN coaches c ON p.coach_id = c.id
            WHERE p.id = mesocycles.program_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Coach delete mesocycles"
    ON mesocycles FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM programs p
            JOIN coaches c ON p.coach_id = c.id
            WHERE p.id = mesocycles.program_id
            AND c.user_id = auth.uid()
        )
    );

-- ==========================
-- DAYS
-- ==========================

DROP POLICY IF EXISTS "Coach manage days" ON days;
DROP POLICY IF EXISTS "Coach insert days" ON days;
DROP POLICY IF EXISTS "Coach update days" ON days;
DROP POLICY IF EXISTS "Coach delete days" ON days;

CREATE POLICY "Coach insert days"
    ON days FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM mesocycles m
            JOIN programs p ON m.program_id = p.id
            WHERE m.id = mesocycle_id
            AND p.coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Coach update days"
    ON days FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM mesocycles m
            JOIN programs p ON m.program_id = p.id
            WHERE m.id = days.mesocycle_id
            AND p.coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Coach delete days"
    ON days FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM mesocycles m
            JOIN programs p ON m.program_id = p.id
            WHERE m.id = days.mesocycle_id
            AND p.coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
        )
    );

-- ==========================
-- WORKOUT BLOCKS
-- ==========================

DROP POLICY IF EXISTS "Coach manage blocks" ON workout_blocks;
DROP POLICY IF EXISTS "Coach insert blocks" ON workout_blocks;
DROP POLICY IF EXISTS "Coach update blocks" ON workout_blocks;
DROP POLICY IF EXISTS "Coach delete blocks" ON workout_blocks;

CREATE POLICY "Coach insert blocks"
    ON workout_blocks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM days d
            JOIN mesocycles m ON d.mesocycle_id = m.id
            JOIN programs p ON m.program_id = p.id
            WHERE d.id = day_id
            AND p.coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Coach update blocks"
    ON workout_blocks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM days d
            JOIN mesocycles m ON d.mesocycle_id = m.id
            JOIN programs p ON m.program_id = p.id
            WHERE d.id = workout_blocks.day_id
            AND p.coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Coach delete blocks"
    ON workout_blocks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM days d
            JOIN mesocycles m ON d.mesocycle_id = m.id
            JOIN programs p ON m.program_id = p.id
            WHERE d.id = workout_blocks.day_id
            AND p.coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
        )
    );
