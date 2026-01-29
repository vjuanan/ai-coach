
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { action, payload } = await req.json()

        // ----------------------------------------------------------------
        // HELPER: Ensure Coach Exists
        // ----------------------------------------------------------------
        async function ensureCoach() {
            let { data: coach } = await supabase.from('coaches').select('id').limit(1).single()

            if (coach) return coach.id

            // Try to find a user to link
            const { data: { users } } = await supabase.auth.admin.listUsers()
            let userId = users?.[0]?.id

            if (!userId) {
                // Cannot create auth user easily here without email/pass, simpler to fail or rely on existing
                // For now, let's assume at least one user exists or create a placeholder if possible
                throw new Error('No users found to assign as coach. Please sign up first.')
            }

            const { data: newCoach, error } = await supabase.from('coaches').insert({
                full_name: 'Main Coach',
                user_id: userId
            }).select().single()

            if (error) throw error
            return newCoach.id
        }

        // ----------------------------------------------------------------
        // ACTION: CREATE CLIENT (Athlete/Gym)
        // ----------------------------------------------------------------
        if (action === 'create_client') {
            const coachId = await ensureCoach()
            const { type, name, details } = payload

            const { data, error } = await supabase.from('clients').insert({
                coach_id: coachId,
                type,
                name,
                details: details || {},
                status: 'active'
            }).select().single()

            if (error) throw error
            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // ----------------------------------------------------------------
        // ACTION: CREATE PROGRAM
        // ----------------------------------------------------------------
        if (action === 'create_program') {
            const coachId = await ensureCoach()
            const { name, clientId, focus, duration = 4 } = payload

            // 1. Create Program
            const { data: program, error: progError } = await supabase.from('programs').insert({
                coach_id: coachId,
                name,
                client_id: clientId || null,
                status: 'draft'
            }).select().single()

            if (progError) throw progError

            // 2. Create Mesocycles
            const mesocycles = Array.from({ length: duration }).map((_, i) => ({
                program_id: program.id,
                week_number: i + 1,
                focus: i === 0 && focus ? focus : (i === duration - 1 ? 'Deload' : 'Accumulation'),
            }))

            const { data: createdMesos, error: mesoError } = await supabase.from('mesocycles').insert(mesocycles).select()
            if (mesoError) throw mesoError

            // 3. Create Days
            const days = []
            for (const meso of createdMesos) {
                for (let d = 1; d <= 7; d++) {
                    days.push({
                        mesocycle_id: meso.id,
                        day_number: d,
                        is_rest_day: d === 3 || d === 7,
                    })
                }
            }
            const { error: daysError } = await supabase.from('days').insert(days)
            if (daysError) throw daysError

            return new Response(JSON.stringify(program), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // ----------------------------------------------------------------
        // ACTION: DELETE PROGRAM
        // ----------------------------------------------------------------
        if (action === 'delete_program') {
            const { id } = payload
            const { error } = await supabase.from('programs').delete().eq('id', id)
            if (error) throw error
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        throw new Error(`Unknown action: ${action}`)

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
