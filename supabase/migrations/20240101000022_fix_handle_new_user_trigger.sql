-- 017_fix_handle_new_user_trigger.sql
-- Description: Fix the handle_new_user trigger that's causing signup failures

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with proper error handling and ON CONFLICT
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    input_role user_role;
    input_full_name TEXT;
BEGIN
    -- Extract Role from metadata
    BEGIN
        input_role := (NEW.raw_user_meta_data->>'role')::user_role;
    EXCEPTION WHEN OTHERS THEN
        input_role := NULL;
    END;

    -- Extract Full Name
    input_full_name := NEW.raw_user_meta_data->>'full_name';

    -- Defaults
    IF input_role IS NULL THEN
        input_role := 'athlete';
    END IF;

    IF input_full_name IS NULL OR input_full_name = '' THEN
        input_full_name := split_part(NEW.email, '@', 1);
    END IF;

    -- Insert into profiles with ON CONFLICT to avoid duplicate key errors
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        input_full_name,
        input_role
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the auth transaction
    RAISE WARNING 'handle_new_user failed for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
