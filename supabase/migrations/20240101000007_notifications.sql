-- 005_notifications.sql

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('program_created', 'program_updated', 'new_client', 'payment_received', 'other')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Security Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- 3. Function to notify admins on new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    SELECT
        id,
        'new_client',
        'Nuevo Usuario Registrado',
        'Se ha registrado un nuevo usuario: ' || COALESCE(NEW.full_name, NEW.email, 'Desconocido'),
        '/athletes'
    FROM public.profiles
    WHERE role = 'admin';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created_notify_admins ON public.profiles;
CREATE TRIGGER on_auth_user_created_notify_admins
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_notification();

-- 4. Function to notify athlete/gym on program assignment/update
CREATE OR REPLACE FUNCTION public.handle_program_notification()
RETURNS TRIGGER AS $$
DECLARE
    client_email TEXT;
    target_user_id UUID;
BEGIN
    -- Only notify if status is active
    IF (NEW.status = 'active') THEN
        
        -- Get client email
        SELECT email INTO client_email
        FROM public.clients
        WHERE id = NEW.client_id;

        -- Find user with this email
        IF client_email IS NOT NULL THEN
            SELECT id INTO target_user_id
            FROM public.profiles
            WHERE email = client_email;

            -- If user exists, create notification
            IF target_user_id IS NOT NULL THEN
                INSERT INTO public.notifications (user_id, type, title, message, link)
                VALUES (
                    target_user_id,
                    CASE WHEN TG_OP = 'INSERT' THEN 'program_created' ELSE 'program_updated' END,
                    'Nuevo Programa Asignado',
                    'Tu coach ha ' || CASE WHEN TG_OP = 'INSERT' THEN 'creado' ELSE 'actualizado' END || ' el programa: ' || NEW.name,
                    '/programs' 
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for programs
DROP TRIGGER IF EXISTS on_program_invoked_notify_client ON public.programs;
CREATE TRIGGER on_program_invoked_notify_client
    AFTER INSERT OR UPDATE ON public.programs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_program_notification();
