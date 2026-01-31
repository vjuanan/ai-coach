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
}
