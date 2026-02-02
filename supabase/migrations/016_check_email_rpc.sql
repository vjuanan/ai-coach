-- Create a secure RPC function to check if an email exists in auth.users
-- This bypasses RLS on auth.users (which is usually restricted) by using SECURITY DEFINER
-- But it only returns a boolean, not user data, preventing enumeration of sensitive info if used carefully.

CREATE OR REPLACE FUNCTION public.check_email_exists(email_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin)
SET search_path = public, auth, pg_temp -- Security best practice
AS $$
BEGIN
  -- Check if email exists in auth.users case-insensitively
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE email = lower(email_input)
  );
END;
$$;

-- Grant execute permission to authenticated users and service role
-- We might want to restrict this to service_role only if we only call it from server actions with admin client,
-- but public actions might need it. For now, public is fine as it returns limited info.
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon, authenticated, service_role;
