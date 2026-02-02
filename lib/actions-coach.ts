'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Fetches all coaches for assignment dropdowns
 */
export async function getCoaches() {
    const supabase = createServerClient();

    // We need to fetch from the coaches table
    // Depending on RLS, we might need admin access, but typically admins can see all coaches
    const { data: coaches, error } = await supabase
        .from('coaches')
        .select('id, full_name, business_name')
        .order('full_name');

    if (error) {
        console.error('Error fetching coaches:', error);
        return [];
    }

    return coaches || [];
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
