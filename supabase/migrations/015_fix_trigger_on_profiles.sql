-- 015_fix_trigger_on_profiles.sql

-- Drop the old trigger on coaches if it exists (it was unreliable because coaches table is not always populated)
DROP TRIGGER IF EXISTS on_coach_deleted_notify_admins ON public.coaches;

-- Update the function to check for role = 'coach'
CREATE OR REPLACE FUNCTION public.handle_coach_deletion_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify if the deleted user was a coach
    IF OLD.role = 'coach' THEN
        -- Use BEGIN/EXCEPTION block to ensure deletion never fails due to notification errors
        BEGIN
            INSERT INTO public.notifications (user_id, type, title, message, link)
            SELECT
                id,
                'other',
                'Entrenador Eliminado',
                'El entrenador ' || COALESCE(OLD.full_name, 'Desconocido') || ' ha sido eliminado. Sus atletas han quedado huérfanos.',
                '/admin/users'
            FROM public.profiles
            WHERE role = 'admin';
        EXCEPTION WHEN OTHERS THEN
            -- Log error but don't fail the transaction
            RAISE WARNING 'Failed to send coach deletion notification: %', SQLERRM;
        END;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_deleted_notify_admins ON public.profiles;

CREATE TRIGGER on_profile_deleted_notify_admins
    AFTER DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_coach_deletion_notification();
