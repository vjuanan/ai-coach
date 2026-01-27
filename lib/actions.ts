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

export async function createProgram(name: string, clientId: string | null) {
    const supabase = createServerClient();

    // Try to find ANY coach first
    let { data: coach } = await supabase.from('coaches').select('id').limit(1).single();

    if (!coach) {
        // Need a valid user_id for the coach
        // 1. Try to list users to find an existing one
        const { data: { users } } = await supabase.auth.admin.listUsers();
        let userId = users?.[0]?.id;

        // 2. If no users, create a dev user
        if (!userId) {
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: 'dev@example.com',
                password: 'password123',
                email_confirm: true
            });
            if (createError || !newUser.user) throw new Error('Failed to create dev auth user: ' + createError?.message);
            userId = newUser.user.id;
        }

        // 3. Create Key Coach Profile
        const { data: newCoach, error: coachError } = await supabase
            .from('coaches')
            .insert({
                full_name: 'Dev Coach',
                user_id: userId
            })
            .select()
            .single();

        if (coachError) {
            // Fallback: Maybe coach already exists for this user but wasn't found in first query
            const { data: existingCoach } = await supabase.from('coaches').select('id').eq('user_id', userId).single();
            if (existingCoach) {
                coach = existingCoach;
            } else {
                throw new Error('Failed to create coach profile: ' + coachError.message);
            }
        } else {
            coach = newCoach;
        }
    }

    if (!coach) throw new Error('Could not find or create a coach');

    return createProgramInternal(supabase, coach.id, name, clientId);
}

export async function deleteProgram(programId: string) {
    const supabase = createServerClient();

    // Delete in order due to constraints
    // (Ideally use ON DELETE CASCADE in DB, but doing manual cleanup to be safe)

    // 1. Get mesos
    const { data: mesos } = await supabase.from('mesocycles').select('id').eq('program_id', programId);
    if (mesos) {
        for (const meso of mesos) {
            const { data: days } = await supabase.from('days').select('id').eq('mesocycle_id', meso.id);
            if (days) {
                const dayIds = days.map(d => d.id);
                if (dayIds.length > 0) {
                    await supabase.from('workout_blocks').delete().in('day_id', dayIds);
                }
                await supabase.from('days').delete().in('id', dayIds);
            }
        }
        await supabase.from('mesocycles').delete().eq('program_id', programId);
    }

    const { error } = await supabase.from('programs').delete().eq('id', programId);
    if (error) throw error;

    revalidatePath('/programs');
    revalidatePath('/');
}

async function createProgramInternal(
    supabase: any,
    coachId: string,
    name: string,
    clientId: string | null
) {
    // 1. Create Program
    const { data: program, error } = await supabase
        .from('programs')
        .insert({
            coach_id: coachId,
            name,
            client_id: clientId,
            status: 'draft'
        })
        .select()
        .single();

    if (error) throw error;

    // 2. Create 4 Empty Mesocycles
    const mesocycles = Array.from({ length: 4 }).map((_, i) => ({
        program_id: program.id,
        week_number: i + 1,
        focus: i === 3 ? 'Deload' : 'Accumulation',
    }));

    const { data: createdMesocycles, error: mesoError } = await supabase
        .from('mesocycles')
        .insert(mesocycles)
        .select();

    if (mesoError) throw mesoError;

    // 3. Create Days
    const days = [];
    for (const meso of createdMesocycles) {
        for (let d = 1; d <= 7; d++) {
            days.push({
                mesocycle_id: meso.id,
                day_number: d,
                is_rest_day: d === 3 || d === 7,
            });
        }
    }

    const { error: daysError } = await supabase.from('days').insert(days);
    if (daysError) throw daysError;

    revalidatePath('/programs');
    revalidatePath('/');
    return program;
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

export async function createClient(clientData: { type: 'athlete' | 'gym', name: string, email?: string }) {
    const supabase = createServerClient();

    // Ensure Coach Exists (Repeated logic - ideally refactor to helper)
    let { data: coach } = await supabase.from('coaches').select('id').limit(1).single();

    if (!coach) {
        // Need a valid user_id for the coach
        const { data: { users } } = await supabase.auth.admin.listUsers();
        let userId = users?.[0]?.id;

        if (!userId) {
            const { data: newUser } = await supabase.auth.admin.createUser({
                email: 'dev@example.com',
                password: 'password123',
                email_confirm: true
            });
            if (newUser.user) userId = newUser.user.id;
        }

        if (userId) {
            const { data: newCoach } = await supabase
                .from('coaches')
                .insert({ full_name: 'Dev Coach', user_id: userId })
                .select()
                .single();
            coach = newCoach;
            // Check if it failed because it existed
            if (!coach) {
                const { data: existing } = await supabase.from('coaches').select('id').eq('user_id', userId).single();
                coach = existing;
            }
        }
    }

    if (!coach) throw new Error('System Error: No coach available to assign client to.');

    const { error } = await supabase
        .from('clients')
        .insert({
            ...clientData,
            coach_id: coach.id
        });

    if (error) throw error;
    revalidatePath('/athletes');
    revalidatePath('/gyms');
    revalidatePath('/');
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
