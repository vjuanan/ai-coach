-- 018_emergency_fix_trigger.sql
-- EMERGENCY: Complete recreation of handle_new_user trigger to fix blocked signups

-- Step 1: Drop ALL triggers that might be on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Drop the old function completely
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 3: Recreate a MINIMAL, SAFE version of the function
-- This version has maximum error tolerance and minimal logic to prevent failures
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Simple insert with all fallbacks and maximum safety
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(
            CASE 
                WHEN NEW.raw_user_meta_data->>'role' IN ('coach', 'athlete', 'admin', 'gym') 
                THEN (NEW.raw_user_meta_data->>'role')::user_role 
                ELSE 'athlete'::user_role 
            END,
            'athlete'::user_role
        )
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- CRITICAL: Never fail the auth transaction
    -- Log warning but always return NEW to let auth succeed
    RAISE LOG 'handle_new_user warning for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 4: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;

-- Step 5: Recreate the trigger with explicit schema
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();
