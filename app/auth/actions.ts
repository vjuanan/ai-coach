'use server';

import { createServerClient } from '@/lib/supabase/server';
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
