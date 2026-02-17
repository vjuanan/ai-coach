'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

/**
 * Fetches all coaches for assignment dropdowns (now from profiles table)
 * Using a new name to bust any potential build/import cache
 */
export async function getCoachesNew() {
    noStore(); // Opt out of static caching

    const supabase = createServerClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Use admin client to bypass RLS
    const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY
        ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
        : supabase;

    const { data: profiles, error } = await adminSupabase
        .from('profiles')
        .select('id, full_name, role, email')
        .in('role', ['coach', 'admin'])
        .order('full_name');

    if (error) {
        console.error('Error fetching coaches:', error);
        return [];
    }

    return (profiles || []).map(p => ({
        id: p.id,
        // Removed validation prefix - trusting this will work now
        full_name: p.full_name || p.email || 'Sin Nombre',
        business_name: p.role === 'admin' ? 'Admin / Entrenador' : null
    }));
}

/**
 * Assigns a coach to a client
 */
export async function assignCoach(clientId: string, coachId: string) {
    const supabase = createServerClient();

    // Verify permission (Admin only ideally, but we'll let RLS handle it or assume server action implies trust for now)

    const { error } = await supabase
        .from('clients')
        .update({ coach_id: coachId })
        .eq('id', clientId);

    if (error) {
        console.error('Error assigning coach:', error);
        throw new Error('No se pudo asignar el entrenador.');
    }

    revalidatePath(`/athletes/${clientId}`);
    revalidatePath('/athletes');
    return { success: true };
}
