-- 014_fix_coach_deletion_trigger.sql

-- 1. Add INSERT policy for notifications (SECURITY DEFINER should handle this, but let's be safe)
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

-- 2. Fix the trigger function to be more robust
-- Use AFTER DELETE instead of BEFORE DELETE to not block the delete
DROP TRIGGER IF EXISTS on_coach_deleted_notify_admins ON public.coaches;

CREATE OR REPLACE FUNCTION public.handle_coach_deletion_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Use BEGIN/EXCEPTION to not fail if notification insert fails
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
        -- Log to server but don't fail the delete
        RAISE WARNING 'Failed to create notification for coach deletion: %', SQLERRM;
    END;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create trigger as AFTER DELETE (so delete happens first, then notification)
CREATE TRIGGER on_coach_deleted_notify_admins
    AFTER DELETE ON public.coaches
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_coach_deletion_notification();
