'use server';

import { createServerClient } from './supabase/client';
import { revalidatePath } from 'next/cache';
import type { Database } from './supabase/types';
import type { DraftMesocycle } from './store';

type Program = Database['public']['Tables']['programs']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

// ==========================================
// PROGRAMS ACTIONS
// ==========================================

// ... (keeping imports)

// ==========================================
// DASHBOARD ACTIONS
// ==========================================

export async function getDashboardStats() {
    const supabase = createServerClient();

    // Run parallel queries for speed
    const [
        { count: athletes },
        { count: gyms },
        { count: programs },
        { count: blocks }
    ] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('type', 'athlete'),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('type', 'gym'),
        supabase.from('programs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('workout_blocks').select('*', { count: 'exact', head: true })
    ]);

    return {
        athletes: athletes || 0,
        gyms: gyms || 0,
        activePrograms: programs || 0,
        totalBlocks: blocks || 0
    };
}

// ==========================================
// PROGRAMS ACTIONS
// ==========================================

export async function getPrograms() {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('programs')
        .select(`*, client:clients(*)`)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching programs:', error);
        return [];
    }
    return data;
}

export async function createProgram(
    name: string,
    clientId: string | null,
    focus?: string,
    duration: number = 4
) {
    const supabase = createServerClient();

    const { data, error } = await supabase.functions.invoke('manage-resources', {
        body: {
            action: 'create_program',
            payload: { name, clientId, focus, duration }
        }
    });

    if (error) throw new Error(error.message || 'Error creating program via Edge Function');

    revalidatePath('/programs');
    revalidatePath('/');
    return data;
}

export async function deleteProgram(programId: string) {
    const supabase = createServerClient();

    const { error } = await supabase.functions.invoke('manage-resources', {
        body: {
            action: 'delete_program',
            payload: { id: programId }
        }
    });

    if (error) throw error;

    revalidatePath('/programs');
    revalidatePath('/');
}



// ==========================================
// CLIENTS ACTIONS
// ==========================================

export async function getClients(type: 'athlete' | 'gym') {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('type', type)
        .order('name');

    if (error) return [];
    return data;
}

export async function createClient(clientData: {
    type: 'athlete' | 'gym',
    name: string,
    email?: string,
    details?: Record<string, any>
}) {
    const supabase = createServerClient();

    const { data, error } = await supabase.functions.invoke('manage-resources', {
        body: {
            action: 'create_client',
            payload: clientData
        }
    });

    if (error) throw new Error(error.message || 'Error creating client via Edge Function');

    revalidatePath(clientData.type === 'athlete' ? '/athletes' : '/gyms');
    revalidatePath('/');
    return data;
}

export async function deleteClient(id: string) {
    const supabase = createServerClient();
    await supabase.from('clients').delete().eq('id', id);
    revalidatePath('/athletes');
    revalidatePath('/gyms');
    revalidatePath('/');
}

// ==========================================
// MESOCYCLE & EDITOR ACTIONS


// ==========================================
// MESOCYCLE & EDITOR ACTIONS
// ==========================================

export async function getFullProgramData(programId: string) {
    const supabase = createServerClient();

    // Fetch Program + Client
    const { data: program, error: progError } = await supabase
        .from('programs')
        .select('*, client:clients(*)')
        .eq('id', programId)
        .single();

    if (progError) return null;

    // Fetch Hierarchy: Mesocycles -> Days -> Workout Blocks
    const { data: mesocycles, error: mesoError } = await supabase
        .from('mesocycles')
        .select(`
      *,
      days (
        *,
        workout_blocks (*)
      )
    `)
        .eq('program_id', programId)
        .order('week_number', { ascending: true });

    if (mesoError) return null;

    // Sort children manually (Supabase doesn't sort nested arrays automatically)
    const sortedMesocycles = mesocycles.map(meso => ({
        ...meso,
        days: meso.days
            .sort((a: any, b: any) => a.day_number - b.day_number)
            .map((day: any) => ({
                ...day,
                blocks: day.workout_blocks
                    ? day.workout_blocks.sort((a: any, b: any) => a.order_index - b.order_index)
                    : []
            }))
    }));

    return { program, mesocycles: sortedMesocycles };
}

export async function saveMesocycleChanges(
    programId: string,
    mesocycles: DraftMesocycle[]
) {
    const supabase = createServerClient();

    // We can't do a massive upset easily for deep nested structures,
    // so we'll process updates. In a prod app, we'd diff the changes.
    // For this version, we'll iterate and upsert.

    try {
        for (const meso of mesocycles) {
            // 1. Update Mesocycle
            await supabase
                .from('mesocycles')
                .update({
                    focus: meso.focus,
                    attributes: meso.attributes || {}
                })
                .eq('id', meso.id);

            for (const day of meso.days) {
                // 2. Update Day
                await supabase
                    .from('days')
                    .update({
                        is_rest_day: day.is_rest_day,
                        notes: day.notes
                    })
                    .eq('id', day.id);

                // 3. Handle Blocks (Upsert/Delete)
                // First delete ALL blocks for this day to handle reorders/deletions cleanly
                // (This is a bruteforce approach, safe for small data sets like daily workouts)
                await supabase
                    .from('workout_blocks')
                    .delete()
                    .eq('day_id', day.id);

                if (day.blocks.length > 0) {
                    const blocksToInsert = day.blocks.map((b, index) => ({
                        day_id: day.id,
                        order_index: index,
                        type: b.type,
                        format: b.format,
                        name: b.name,
                        config: b.config
                    }));

                    await supabase
                        .from('workout_blocks')
                        .insert(blocksToInsert);
                }
            }
        }

        revalidatePath(`/editor/${programId}`);
        return { success: true };

    } catch (error) {
        console.error('Save failed:', error);
        return { success: false, error };
    }
}

// ==========================================
// EXERCISE ACTIONS
// ==========================================

export async function searchExercises(query: string) {
    const supabase = createServerClient();

    const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10);

    if (error) return [];
    return data;
}
