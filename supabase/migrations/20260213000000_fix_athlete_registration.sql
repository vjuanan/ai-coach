-- Migration: 20260213000000_fix_athlete_registration.sql
-- Description: Allow clients to exist without a coach (independent) and auto-create client record on signup

-- 1. Modify clients table to allow NULL coach_id
-- This allows "independent" athletes who sign up directly without an invite
ALTER TABLE public.clients ALTER COLUMN coach_id DROP NOT NULL;

-- 2. Update handle_new_user trigger to create client record
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
    
    -- Variables for client creation
    new_client_id UUID;
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
    INSERT INTO public.profiles (id, email, full_name, role, onboarding_completed)
    VALUES (
        NEW.id, 
        NEW.email, 
        input_full_name,
        input_role,
        FALSE -- Explicitly force NEW users to be incomplete
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert into clients if athlete or gym
    -- This ensures they appear in the "Athletes" list
    IF input_role IN ('athlete', 'gym') THEN
        -- Only insert if not already exists (idempotency check using user_id if present)
        -- Note: clients table has a user_id column added in migration 004_rbac_roles.sql
        
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
                NULL, -- No coach initially
                input_role::text::client_type, 
                input_full_name,
                NEW.email,
                jsonb_build_object('source', 'signup_trigger', 'auto_created', true)
            );
        END IF;
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't block user creation if client insert fails
    RAISE LOG 'handle_new_user warning for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;
