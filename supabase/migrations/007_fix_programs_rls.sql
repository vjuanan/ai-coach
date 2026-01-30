-- 007_fix_programs_rls.sql
-- Fix RLS policies for INSERT operations on programs table
-- The issue: FOR ALL policies with USING clause don't work for INSERT
-- because the row doesn't exist yet to evaluate the USING condition.
-- Solution: Create separate INSERT policies with WITH CHECK clause.

-- ==========================
-- PROGRAMS INSERT POLICY FIX
-- ==========================

-- Drop the existing all-encompassing policy
DROP POLICY IF EXISTS "Coach manage programs" ON programs;

-- Create separate policy for INSERT with WITH CHECK
CREATE POLICY "Coach insert programs"
    ON programs FOR INSERT
    WITH CHECK (
        is_coach() 
        AND coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
    );

-- Create policy for UPDATE/DELETE with USING
CREATE POLICY "Coach update delete programs"
    ON programs FOR UPDATE
    USING (is_coach() AND coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

CREATE POLICY "Coach delete programs"
    ON programs FOR DELETE
    USING (is_coach() AND coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

-- ==========================
-- MESOCYCLES INSERT POLICY FIX
-- ==========================

DROP POLICY IF EXISTS "Coach manage mesocycles" ON mesocycles;

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
-- DAYS INSERT POLICY FIX
-- ==========================

DROP POLICY IF EXISTS "Coach manage days" ON days;

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
-- WORKOUT_BLOCKS INSERT POLICY FIX
-- ==========================

DROP POLICY IF EXISTS "Coach manage blocks" ON workout_blocks;

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
