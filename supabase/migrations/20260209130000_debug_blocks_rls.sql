-- Temporary debug policy
DROP POLICY IF EXISTS "workout_blocks_select" ON workout_blocks;

CREATE POLICY "workout_blocks_select"
    ON workout_blocks FOR SELECT
    TO authenticated
    USING (true);
