'use server';

import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

export async function refreshUserRoleReference() {
    const supabase = createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const role = profile?.role;

    if (role) {
        // Set a lightweight cookie for the middleware to read
        // Format: "userId:role" to verify ownership
        cookies().set('user_role', `${user.id}:${role}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });
    }
    // ... (existing code for refreshUserRoleReference)
}

export async function login(formData: FormData) {
    const supabase = createServerClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        if (error.message.includes('Email not confirmed')) {
            return { error: 'Para proteger tu cuenta, necesitamos que confirmes tu email. Por favor, revisá tu bandeja de entrada y hacé clic en el enlace que te enviamos.' };
        }
        return { error: error.message };
    }

    if (user) {
        // Check if email is verified
        if (!user.email_confirmed_at) {
            // Sign out the user since they haven't verified their email
            await supabase.auth.signOut();
            return { error: 'Por favor, verificá tu email antes de iniciar sesión. Revisá tu bandeja de entrada.' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = profile?.role;

        if (role) {
            // Set cookie for instant SSR access
            cookies().set('user_role', `${user.id}:${role}`, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });
        } else {
            // User has no role - they need to complete onboarding
            return { success: true, needsOnboarding: true };
        }
    }

    return { success: true };
}

export async function checkEmailRegistered(email: string) {
    console.log('[checkEmailRegistered] Starting check for:', email);

    // Validate service key exists
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('[checkEmailRegistered] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!');
        // Fail CLOSED - block registration if we can't verify
        throw new Error('Error de configuración del servidor. Por favor, intenta más tarde.');
    }

    const supabase = createAdminClient();

    // Use the secure RPC function to check auth.users directly
    const { data, error } = await supabase.rpc('check_email_exists', {
        email_input: email.toLowerCase().trim()
    });

    console.log('[checkEmailRegistered] RPC result:', { data, error: error?.message });

    if (error) {
        console.warn('[checkEmailRegistered] RPC check failed:', error.message);

        // FAILSAFE FALLBACK: Fetch users via Admin API
        try {
            console.log('[checkEmailRegistered] Trying Admin API fallback...');
            const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
                page: 1,
                perPage: 1000
            });

            if (listError) throw listError;

            const normalizedEmail = email.toLowerCase().trim();
            const exists = users.some(u => u.email?.toLowerCase().trim() === normalizedEmail);
            console.log('[checkEmailRegistered] Admin API result:', { exists, totalUsers: users.length });

            return { exists };

        } catch (fallbackError: any) {
            console.error('[checkEmailRegistered] All strategies failed:', fallbackError);
            // Fail CLOSED - don't allow registration if we can't verify
            throw new Error('No pudimos verificar el email. Por favor, intenta más tarde.');
        }
    }

    console.log('[checkEmailRegistered] Email exists:', !!data);
    return { exists: !!data };
}
