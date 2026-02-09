-- Final robust SELECT policy for workout_blocks
DROP POLICY IF EXISTS "workout_blocks_select" ON workout_blocks;

CREATE POLICY "workout_blocks_select"
    ON workout_blocks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM days d
            JOIN mesocycles m ON d.mesocycle_id = m.id
            JOIN programs p ON m.program_id = p.id
            WHERE d.id = workout_blocks.day_id
            AND (
                p.is_template = true
                OR p.coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
                OR p.client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
            )
        )
    );
