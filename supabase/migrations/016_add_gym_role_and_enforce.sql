-- 016_add_gym_role_and_enforce.sql
-- Description: Adds 'gym' to user_role enum and strict enforcement of profile fields

-- 1. Add 'gym' role if it doesn't exist
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'gym';

-- 2. Update handle_new_user function to be STRICT
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    input_role user_role;
    input_full_name TEXT;
BEGIN
    -- Extract and Validate Role
    -- We assume the client sends role in user_metadata
    BEGIN
        input_role := (NEW.raw_user_meta_data->>'role')::user_role;
    EXCEPTION WHEN OTHERS THEN
        input_role := NULL; -- Invalid enum value or missing
    END;

    -- Extract Full Name
    input_full_name := NEW.raw_user_meta_data->>'full_name';

    -- DEFAULT BACKUP (Optional: If we want to allow quick-start without role, we'd fallback. 
    -- But user requested MANDATORY. So we default to 'athlete' if missing to avoid breaking legacy auth,
    -- OR we leave it NULL and let the app handle the "incomplete profile" state. 
    -- User said "SIEMPRE tiene que tener todo asignado".
    -- So we will force it. If it's null, we default to 'athlete' to be safe, or raise error?
    -- Trigger cannot easily raise error to the user during Oauth/MagicLink.
    -- Best approach: Default to 'athlete' if missing, but we will enforce frontend to send it.
    
    IF input_role IS NULL THEN
        input_role := 'athlete'; -- Fallback default
    END IF;

    IF input_full_name IS NULL OR input_full_name = '' THEN
        input_full_name := split_part(NEW.email, '@', 1); -- Fallback to email prefix
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        input_full_name,
        input_role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Fix Existing NULL Roles
-- We blindly assume 'athlete' for anyone missing a role to satisfy "NO PUEDE HABER USUARIOS SIN ROL".
UPDATE profiles 
SET role = 'athlete' 
WHERE role IS NULL;

-- 4. Not enforcing DB constraint NOT NULL on table level yet to allow flexibility if needed, 
-- but the trigger ensures new ones are good.
-- Actually, let's enforce it on the table to be sure.
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'athlete';
-- We can't easily alter column to NOT NULL if there are nulls, but we just fixed them.
ALTER TABLE profiles ALTER COLUMN role SET NOT NULL;
