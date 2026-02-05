-- 20260205180000_fix_workout_blocks_read_policy.sql
-- Fix: Ensure SELECT policy exists for workout_blocks after previous migration dropped it

-- First, safely drop any existing SELECT policy to avoid conflicts
DROP POLICY IF EXISTS "RBAC Block Visibility" ON workout_blocks;
DROP POLICY IF EXISTS "workout_blocks_select" ON workout_blocks;
DROP POLICY IF EXISTS "Coaches can view own workout blocks" ON workout_blocks;

-- Create a robust SELECT policy for workout_blocks
-- This allows:
-- 1. Coaches to see blocks in their programs
-- 2. Athletes to see blocks in programs assigned to them
-- 3. Public to see blocks in template programs
CREATE POLICY "workout_blocks_select"
    ON workout_blocks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM days d
            JOIN mesocycles m ON d.mesocycle_id = m.id
            JOIN programs p ON m.program_id = p.id
            WHERE d.id = workout_blocks.day_id
            AND (
                (p.is_template = true)
                OR (p.coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()))
                OR (p.client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
            )
        )
    );
