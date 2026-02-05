-- 009_ensure_coaches_rls.sql
-- Ensure Coaches table has correct RLS policies for SELECT
-- This is critical for other policies (like programs insert) to work correctly
-- as they subquery the coaches table.

-- Enable RLS just in case
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

-- Drop existing potential conflicting policies
DROP POLICY IF EXISTS "Coaches can view own profile" ON coaches;
DROP POLICY IF EXISTS "Coaches can update own profile" ON coaches;
DROP POLICY IF EXISTS "Users can insert their coach profile" ON coaches;
DROP POLICY IF EXISTS "Coach view own profile" ON coaches;

-- Re-create basic policies for Coaches table
CREATE POLICY "Coaches can view own profile"
    ON coaches FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Coaches can update own profile"
    ON coaches FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their coach profile"
    ON coaches FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Explicitly grant permissions if needed (usually handled by RLS but good to be safe)
GRANT SELECT, INSERT, UPDATE ON coaches TO authenticated;

-- Force re-apply of the Program Insert Policy just to be absolutely sure it's the latest version
DROP POLICY IF EXISTS "Coach insert programs" ON programs;

CREATE POLICY "Coach insert programs"
    ON programs FOR INSERT
    WITH CHECK (
        -- Allow if user is a coach AND owns the coach record
        -- Re-implementing the check to NOT rely strictly on is_coach() function 
        -- inside the subquery if that was causing issues, but logic remains valid.
        EXISTS (
            SELECT 1 FROM coaches 
            WHERE id = coach_id 
            AND user_id = auth.uid()
        )
    );
