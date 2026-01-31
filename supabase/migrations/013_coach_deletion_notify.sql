-- 013_coach_deletion_notify.sql

-- Function to notify admins when a coach is deleted
CREATE OR REPLACE FUNCTION public.handle_coach_deletion_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    SELECT
        id,
        'other', -- Using 'other' as 'coach_deleted' is not in enum, or we can expand enum if needed. 'other' is safe.
        'Entrenador Eliminado',
        'El entrenador ' || OLD.full_name || ' ha sido eliminado. Sus atletas han quedado huérfanos.',
        '/admin/users'
    FROM public.profiles
    WHERE role = 'admin';

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger causing the notification
DROP TRIGGER IF EXISTS on_coach_deleted_notify_admins ON public.coaches;
CREATE TRIGGER on_coach_deleted_notify_admins
    BEFORE DELETE ON public.coaches
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_coach_deletion_notification();
