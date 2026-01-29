'use server';

import { createServerClient } from './supabase/server';
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

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Helper to ensure coach exists for current user
// Uses Service Role to bypass RLS for creation if needed
// Helper to ensure coach exists for current user
// Uses Service Role to bypass RLS for creation if needed
async function ensureCoach(supabase: any) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // NO-AUTH FALLBACK: If user is missing, check if we're in "Public Mode"
    let userId = user?.id;

    if (!userId) {
        console.log('ensureCoach: No authenticated user. Running in Public/Demo Mode.');
        // Use a fixed UUID for the "Public Owner" to allow the app to function without login
        userId = '00000000-0000-0000-0000-000000000000';
    }

    console.log('ensureCoach: Resolving coach for userId', userId);

    // Try normal fetch first
    const { data: coach, error: fetchError } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (coach) {
        console.log('ensureCoach: Found existing coach', coach.id);
        return coach.id;
    }

    // Fallback to Service Role key for creation/admin access
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        console.error('ensureCoach: CRITICAL - SUPABASE_SERVICE_ROLE_KEY missing.');
        throw new Error('Server configuration error: Missing Service Role Key.');
    }

    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    // Check again via Admin
    const { data: adminCoach } = await supabaseAdmin
        .from('coaches')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (adminCoach) {
        return adminCoach.id;
    }

    // Create "Public Coach" if not exists
    const { data: newCoach, error: insertError } = await supabaseAdmin
        .from('coaches')
        .insert({
            user_id: userId,
            full_name: user?.user_metadata?.full_name || 'Public Coach',
            business_name: 'AI Coach Demo'
        })
        .select('id')
        .single();

    if (insertError) {
        console.error('ensureCoach: Error creating coach profile via Admin', insertError);

        // Handle race condition
        if (insertError.code === '23505') {
            const { data: existing } = await supabaseAdmin.from('coaches').select('id').eq('user_id', userId).single();
            return existing?.id;
        }
        throw new Error(`Error creating coach profile: ${insertError.message}`);
    }

    console.log('ensureCoach: Created new coach profile', newCoach.id);
    return newCoach.id;
}

export async function createProgram(
    name: string,
    clientId: string | null,
    focus?: string,
    duration: number = 4
) {
    console.log('createProgram: Starting creation', { name, clientId, duration });
    const supabase = createServerClient();

    try {
        const coachId = await ensureCoach(supabase);
        console.log('createProgram: Using coachId', coachId);

        // 1. Create Program
        const { data: program, error: progError } = await supabase
            .from('programs')
            .insert({
                coach_id: coachId,
                name,
                client_id: clientId || null,
                status: 'draft'
            })
            .select()
            .single();

        if (progError) {
            console.error('createProgram: Error inserting program', progError);
            throw new Error(`Failed to create program: ${progError.message}`);
        }

        console.log('createProgram: Created program', program.id);

        // 2. Create Mesocycles
        const mesocycles = Array.from({ length: duration }).map((_, i) => ({
            program_id: program.id,
            week_number: i + 1,
            focus: i === 0 && focus ? focus : (i === duration - 1 ? 'Deload' : 'Accumulation'),
            // attributes can be null based on types
        }));

        const { data: createdMesos, error: mesoError } = await supabase
            .from('mesocycles')
            .insert(mesocycles)
            .select();

        if (mesoError) {
            console.error('createProgram: Error inserting mesocycles', mesoError);
            throw new Error(`Failed to create mesocycles: ${mesoError.message}`);
        }

        console.log('createProgram: Created mesocycles', createdMesos.length);

        // 3. Create Days
        const days: any[] = []; // Explicit type to avoid inference issues
        for (const meso of createdMesos) {
            for (let d = 1; d <= 7; d++) {
                days.push({
                    mesocycle_id: meso.id,
                    day_number: d,
                    is_rest_day: d === 3 || d === 7,
                });
            }
        }

        const { error: daysError } = await supabase.from('days').insert(days);
        if (daysError) {
            console.error('createProgram: Error inserting days', daysError);
            throw new Error(`Failed to create days: ${daysError.message}`);
        }

        console.log('createProgram: Successfully created full program structure');
        revalidatePath('/programs');
        revalidatePath('/');
        return program;

    } catch (error: any) {
        console.error('createProgram: UNHANDLED ERROR', error);
        throw new Error(error.message || 'Error creating program');
    }
}

export async function deleteProgram(programId: string) {
    const supabase = createServerClient();
    // Verify ownership via RLS mainly, but good to check current user too if needed.
    // Standard delete calls RLS policies.
    const { error } = await supabase.from('programs').delete().eq('id', programId);

    if (error) throw new Error(error.message);

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
    console.log('createClient: Starting', clientData);
    const supabase = createServerClient();

    try {
        const coachId = await ensureCoach(supabase);
        console.log('createClient: Using coachId', coachId);

        const { data, error } = await supabase
            .from('clients')
            .insert({
                coach_id: coachId,
                type: clientData.type,
                name: clientData.name,
                email: clientData.email,
                details: clientData.details || {},
                status: 'active'
            })
            .select()
            .single();

        if (error) {
            console.error('createClient: Error inserting client', error);
            throw new Error(error.message);
        }

        console.log('createClient: Success', data.id);
        revalidatePath(clientData.type === 'athlete' ? '/athletes' : '/gyms');
        revalidatePath('/');
        return data;

    } catch (error: any) {
        console.error('createClient: UNHANDLED ERROR', error);
        throw new Error(error.message);
    }
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
