-- 020_fix_programs_select_policy.sql
-- Fix visibility issues where Coaches cannot see their own Draft programs
-- and ensure Admins see everything, while Athletes see only assigned programs.

-- 1. Helper function for Admin check (if not exists)
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop known potential SELECT policies (historical or current)
DROP POLICY IF EXISTS "RBAC Program Visibility" ON programs;
DROP POLICY IF EXISTS "Coaches can view own programs" ON programs;
DROP POLICY IF EXISTS "Public can view active programs" ON programs;
DROP POLICY IF EXISTS "Authenticated can view active programs" ON programs;
DROP POLICY IF EXISTS "Coach view own programs" ON programs;
DROP POLICY IF EXISTS "Admin view all programs" ON programs;

-- 3. Create the definitive SELECT policy
CREATE POLICY "RBAC Program Visibility"
    ON programs FOR SELECT
    USING (
        -- 1. Admin Access: Admins can see EVERYTHING
        is_admin()
        OR
        -- 2. Owner Access: The program belongs to the Coach associated with the current User
        (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()))
        OR
        -- 3. Client Access: The program is assigned to the Client associated with the current User
        (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
        OR
        -- 4. Template Access: The program is a template (publicly usable)
        (is_template = true)
    );

-- 4. Ensure RLS is enabled
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
