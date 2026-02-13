-- Migration: 20260213000001_force_fix_athlete_registration.sql
-- Description: FORCE fix for athlete registration. Drop check constraints if any, allow NULL coach_id, and update trigger.

-- 1. Ensure coach_id is nullable
DO $$ 
BEGIN 
    ALTER TABLE public.clients ALTER COLUMN coach_id DROP NOT NULL;
EXCEPTION 
    WHEN others THEN NULL; -- Ignore if already nullable or other minor issues
END $$;

-- 2. Drop any rigorous constraints that might block insertion (e.g. if coach_id had a strict check)
-- (No specific check constraints known besides NOT NULL, which we just dropped)

-- 3. Update handle_new_user trigger with BETTER LOGGING and SIMPLER LOGIC
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    input_role user_role := 'athlete'; 
    input_full_name TEXT;
    extracted_role TEXT;
    new_client_id UUID;
    debug_msg TEXT;
BEGIN
    -- Extract info
    input_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    extracted_role := NEW.raw_user_meta_data->>'role';
    
    IF extracted_role IS NOT NULL AND extracted_role IN ('coach', 'athlete', 'admin', 'gym') THEN
        input_role := extracted_role::user_role;
    END IF;

    -- Insert profile
    BEGIN
        INSERT INTO public.profiles (id, email, full_name, role, onboarding_completed)
        VALUES (NEW.id, NEW.email, input_full_name, input_role, FALSE)
        ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Profile insertion failed for %: %', NEW.email, SQLERRM;
    END;
    
    -- Insert into clients if athlete/gym
    IF input_role IN ('athlete', 'gym') THEN
        BEGIN
            -- Check if client exists for this user_id
            IF NOT EXISTS (SELECT 1 FROM public.clients WHERE user_id = NEW.id) THEN
                INSERT INTO public.clients (
                    user_id,
                    coach_id,
                    type,
                    name,
                    email,
                    details
                ) VALUES (
                    NEW.id,
                    NULL, -- Explicitly NULL
                    input_role::text::client_type, 
                    input_full_name,
                    NEW.email,
                    jsonb_build_object('source', 'signup_trigger', 'auto_created', true)
                );
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- CRITICAL: Log this failure so we can debug if it happens again
            RAISE LOG 'Client insertion FAILED for %: %', NEW.email, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$;
