'use server';

import { createServerClient } from './supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from './supabase/types';
import type { DraftMesocycle } from './store';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

type Program = Database['public']['Tables']['programs']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

// ==========================================
// PROGRAMS ACTIONS
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

export async function getTemplates() {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('is_template', true)
        .eq('status', 'active');

    if (error) {
        console.error('Error fetching templates:', error);
        return [];
    }
    return data;
}

export async function copyTemplateToProgram(templateId: string) {
    const supabase = createServerClient();

    // Use Admin Client for reading template to bypass RLS complexity (Public Read Policies can be tricky with nested joins)
    const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY
        ? createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
        : supabase;

    // 1. Fetch Template Data
    const { data: templateProgram, error: progError } = await adminSupabase
        .from('programs')
        .select('*')
        .eq('id', templateId)
        .single();

    if (progError || !templateProgram) {
        throw new Error('Template not found');
    }

    // Explicitly fetch nested structure with Admin privileges
    const { data: mesocycles } = await adminSupabase
        .from('mesocycles')
        .select('*, days(*, workout_blocks(*))')
        .eq('program_id', templateId);

    if (!mesocycles) throw new Error('Template structure missing');

    try {
        const coachId = await ensureCoach(supabase);

        // 2. Create Target Program (Use Admin Client for writes to bypass RLS insertion checks)
        // We verified the user via ensureCoach, so we can safely write as admin.
        const writeClient = adminSupabase;

        const { data: newProgram, error: newProgError } = await writeClient
            .from('programs')
            .insert({
                coach_id: coachId,
                name: `${templateProgram.name} (Copy)`,
                description: templateProgram.description,
                status: 'draft',
                // Explicitly not a template
                is_template: false,
                client_id: null // Unassigned initially
            })
            .select()
            .single();

        if (newProgError) throw new Error(newProgError.message);

        // 3. Clone Mesocycles
        for (const meso of mesocycles) {
            const { data: newMeso, error: mesoError } = await writeClient
                .from('mesocycles')
                .insert({
                    program_id: newProgram.id,
                    week_number: meso.week_number,
                    focus: meso.focus,
                    attributes: meso.attributes
                })
                .select()
                .single();

            if (mesoError) throw mesoError;

            // 4. Clone Days
            for (const day of meso.days) {
                const { data: newDay, error: dayError } = await writeClient
                    .from('days')
                    .insert({
                        mesocycle_id: newMeso.id,
                        day_number: day.day_number,
                        name: day.name,
                        is_rest_day: day.is_rest_day,
                        notes: day.notes
                    })
                    .select()
                    .single();

                if (dayError) throw dayError;

                // 5. Clone Blocks
                const blocks = day.workout_blocks || [];
                if (blocks.length > 0) {
                    const blocksToInsert = blocks.map((b: any) => ({
                        day_id: newDay.id,
                        order_index: b.order_index,
                        type: b.type,
                        format: b.format,
                        name: b.name,
                        config: b.config
                    }));

                    await writeClient.from('workout_blocks').insert(blocksToInsert);
                }
            }
        }

        revalidatePath('/programs');
        return { data: newProgram };

    } catch (error: any) {
        console.error('Copy Template Failed', error);
        return { error: error.message };
    }
}

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Helper to ensure coach exists for current user
async function ensureCoach(supabase: any) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // ==========================================
    // NO-AUTH FALLBACK (DEMO MODE)
    // ==========================================
    if (userError || !user) {
        console.log('ensureCoach: No authenticated user. Attempting Public/Demo Mode.');

        // 1. Try to find any existing coach to attach to (Demo Mode)
        const { data: coaches } = await supabase
            .from('coaches')
            .select('id')
            .limit(1);

        if (coaches && coaches.length > 0) {
            console.log('ensureCoach: Using existing public coach', coaches[0].id);
            return coaches[0].id;
        }

        // 2. If no coaches exist, we need to create one.
        if (!serviceRoleKey) {
            console.error('ensureCoach: No user and no Service Role Key. Cannot create public coach.');
            throw new Error('Modo Demo no configurado: Falta Service Role Key.');
        }

        try {
            const supabaseAdmin = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                serviceRoleKey
            );

            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

            if (listError || !users || users.length === 0) {
                throw new Error('No hay usuarios en la base de datos para asignar el coach demo.');
            }

            const fallbackUserId = users[0].id;

            const { data: newCoach, error: insError } = await supabaseAdmin
                .from('coaches')
                .insert({
                    user_id: fallbackUserId,
                    full_name: 'Coach Demo',
                    business_name: 'AI Coach Public'
                })
                .select('id')
                .single();

            if (insError) {
                // Check if already exists
                const { data: existing } = await supabaseAdmin.from('coaches').select('id').eq('user_id', fallbackUserId).single();
                if (existing) return existing.id;
                throw insError;
            }

            return newCoach.id;

        } catch (adminError: any) {
            console.error('ensureCoach: Admin fallback failed', adminError);
            throw new Error(`Error en configuración Demo: ${adminError.message}`);
        }
    }

    // 1. Try to find existing coach
    const { data: coach } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (coach) return coach.id;

    console.log('ensureCoach: Creating coach profile for', user.id);

    // 2. Try to create coach with normal auth
    const { data: newCoach, error: insertError } = await supabase
        .from('coaches')
        .insert({
            user_id: user.id,
            full_name: user.user_metadata?.full_name || 'Coach',
        })
        .select('id')
        .single();

    if (insertError) {
        console.error('ensureCoach: Creation failed', insertError);
        // Retry fetch just in case of race condition
        const { data: existing } = await supabase
            .from('coaches')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (existing) return existing.id;

        throw new Error(`Error al crear perfil de coach: ${insertError.message}`);
    }

    return newCoach.id;
}

export async function createProgram(
    name: string,
    clientId: string | null,
    focus?: string,
    duration: number = 4
) {
    console.log('createProgram: Starting creation', { name, clientId, duration });

    // Default client (Subject to RLS)
    let supabase = createServerClient();

    const { data: { user } } = await supabase.auth.getUser();

    // If no user, switch to Admin Client to bypass RLS for Demo Mode
    if (!user && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('createProgram: No auth user. Switching to Admin Client for Demo Mode operations.');
        supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        ) as any;
    }

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
            return { error: `DB Error (Program): ${progError.message}` };
        }

        console.log('createProgram: Created program', program.id);

        // 2. Create Mesocycles
        const mesocycles = Array.from({ length: duration }).map((_, i) => ({
            program_id: program.id,
            week_number: i + 1,
            focus: i === 0 && focus ? focus : (i === duration - 1 ? 'Deload' : 'Accumulation'),
        }));

        const { data: createdMesos, error: mesoError } = await supabase
            .from('mesocycles')
            .insert(mesocycles)
            .select();

        if (mesoError) {
            console.error('createProgram: Error inserting mesocycles', mesoError);
            return { error: `DB Error (Mesocycles): ${mesoError.message}` };
        }

        // 3. Create Days
        const days: any[] = [];
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
            return { error: `DB Error (Days): ${daysError.message}` };
        }

        console.log('createProgram: Successfully created full program structure');
        revalidatePath('/programs');
        revalidatePath('/');
        return { data: program };

    } catch (error: any) {
        console.error('createProgram: UNHANDLED ERROR', error);
        return { error: `Unhandled Exception: ${error.message}` };
    }
}

export async function deleteProgram(programId: string) {
    const supabase = createServerClient();
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

    // Check for Service Key to potentially bypass RLS
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            const adminSupabase = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );

            // We need to filter by Coach ID to mimic RLS.
            // But first we need the coach ID of the current user.
            // Note: ensureCoach uses 'supabase' (user client) to find coach by auth.uid().
            // If coach table RLS is also broken, ensureCoach might fail. 
            // But typically 'coaches' RLS is simpler.
            const coachId = await ensureCoach(supabase); // Use user session to identify coach

            const { data, error } = await adminSupabase
                .from('clients')
                .select('*')
                .eq('type', type)
                .eq('coach_id', coachId) // Manual RLS
                .order('name');

            if (error) {
                console.error('getClients [Admin Bypass] Error:', error);
                return [];
            }
            return data;
        } catch (err) {
            console.error('getClients: Admin Bypass Failed', err);
            // Fallback to normal
        }
    }

    // Fallback normal RLS
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('type', type)
        .order('name');

    if (error) return [];
    return data;
}

export async function getClient(id: string) {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching client:', error);
        return null;
    }
    return data;
}

export async function getClientPrograms(clientId: string) {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching client programs:', error);
        return [];
    }
    return data;
}

export async function createClient(clientData: {
    type: 'athlete' | 'gym',
    name: string,
    email?: string,
    details?: Record<string, any>
}) {
    console.log('--- ACTION: createClient STARTED ---');
    console.log('Payload:', JSON.stringify(clientData));

    // Create client safely
    // NOTE: We need to ensure we are using a client that has cookie access!
    // actions.ts usually imports createServerClient from ./supabase/server
    const supabase = createServerClient();

    try {
        console.log('Getting User...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) console.error('Auth Error:', userError);
        if (!user) {
            console.error('No User Found');
            return { error: 'Unauthorized' };
        }
        console.log('User Found:', user.id);

        console.log('Ensuring Coach...');
        const coachId = await ensureCoach(supabase);
        console.log('Coach ID resolved:', coachId);

        console.log('Inserting into clients table...');
        const row = {
            coach_id: coachId,
            type: clientData.type,
            name: clientData.name,
            email: clientData.email || null,
            details: clientData.details || {},
        };
        console.log('Row to insert:', JSON.stringify(row));

        // Check Env Var
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!');
            throw new Error('Server Misconfiguration: Missing Admin Key');
        }

        // Use Admin Client to bypass complex RLS
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Minimal Insert to avoid Schema issues
        // We will update details later if needed, or assume details column exists as JSONB
        const { data, error } = await adminSupabase
            .from('clients')
            .insert({
                coach_id: coachId,
                type: clientData.type,
                name: clientData.name,
                email: clientData.email || null,
                // details: clientData.details || {}, // TEMPORARY REMOVE to debug
            })
            .select()
            .single();

        if (error) {
            console.error('--- INSERT ERROR ---');
            console.error('Code:', error.code);
            console.error('Message:', error.message);
            throw new Error(`Database Error: ${error.message}`);
        }

        console.log('--- ACTION: createClient SUCCESS ---', data.id);
        revalidatePath(clientData.type === 'athlete' ? '/athletes' : '/gyms');
        revalidatePath('/');
        return data;

    } catch (error: any) {
        console.error('--- ACTION: createClient FATAL ERROR ---', error);
        // THROWING to ensure client UI handles it correctly (stops loading)
        throw new Error(error.message || 'Unknown Server Error');
    }
}

export async function deleteClient(id: string) {
    const supabase = createServerClient();
    await supabase.from('clients').delete().eq('id', id);
    revalidatePath('/athletes');
    revalidatePath('/gyms');
    revalidatePath('/');
}

export async function getAdminClients() {
    const supabase = createServerClient();

    // Check for admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        console.warn('Unauthorized access to getAdminClients');
        return [];
    }

    const { data, error } = await supabase
        .from('clients')
        .select('*, coach:coaches(full_name, business_name)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching admin clients:', error);
        return [];
    }
    return data;
}

// ==========================================
// MESOCYCLE & EDITOR ACTIONS
// ==========================================

export async function getFullProgramData(programId: string) {
    let supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Demo Mode: Use Admin Client to view programs if not authenticated
    if (!user && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        ) as any;
    }

    // Fetch Program + Client
    // Check if user is admin to bypass RLS (Admins should see everything)
    // We need to fetch profile first
    if (user && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role === 'admin') {
            supabase = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            ) as any;
        }
    }

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

        // Touch program updated_at to trigger notifications
        await supabase
            .from('programs')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', programId);

        return { success: true };

    } catch (error) {
        console.error('Save failed:', error);
        return { success: false, error };
    }
}

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

export async function getEquipmentCatalog() {
    const supabase = createServerClient();

    const { data, error } = await supabase
        .from('equipment_catalog')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching equipment catalog:', error);
        return [];
    }
    return data;
}
