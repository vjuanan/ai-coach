-- 019_fix_onboarding_trigger.sql
-- FIX: Use explicit onboarding_completed flag instead of relying on NULL role.
-- This satisfies the requirement for NOT NULL role integrity while enforcing the onboarding flow.

-- Step 1: Add the onboarding status column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Step 2: Restore NOT NULL constraint (if it was dropped, or ensure it exists)
-- We ensure role defaults to 'athlete' initially to satisfy NOT NULL
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'athlete';
-- We attempt to set NOT NULL, filling any NULLs first just in case
UPDATE profiles SET role = 'athlete' WHERE role IS NULL;
ALTER TABLE profiles ALTER COLUMN role SET NOT NULL;

-- Step 3: Mark existing users as completed (assumption: if they exist before this, they are done)
-- Optimistic approach: If they have a role, they are done.
UPDATE profiles SET onboarding_completed = TRUE WHERE onboarding_completed IS FALSE;

-- Step 4: Recreate the trigger to use the new logic
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    -- Default to athlete if not provided (Safety net)
    input_role user_role := 'athlete'; 
    input_full_name TEXT;
    extracted_role TEXT;
BEGIN
    -- Extract full name
    input_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name', 
        split_part(NEW.email, '@', 1)
    );

    -- Check metadata for role
    extracted_role := NEW.raw_user_meta_data->>'role';
    
    IF extracted_role IS NOT NULL AND extracted_role IN ('coach', 'athlete', 'admin', 'gym') THEN
        input_role := extracted_role::user_role;
    END IF;

    -- Insert profile
    -- onboarding_completed defaults to FALSE in schema, so new users will be forced to onboarding
    -- UNLESS they are invited coaches/admins who might skip it? 
    -- For now, let's allow explicit override in metadata if needed, otherwise default schema applies (FALSE)
    
    INSERT INTO public.profiles (id, email, full_name, role, onboarding_completed)
    VALUES (
        NEW.id, 
        NEW.email, 
        input_full_name,
        input_role,
        FALSE -- Explicitly force NEW users to be incomplete
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user warning for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 5: Trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Verify Admin is set correctly for testing
-- We want to force the admin test user to pending
UPDATE profiles 
SET onboarding_completed = FALSE 
WHERE email = 'admin@epnstore.com.ar';
