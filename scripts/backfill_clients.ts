
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function backfillClients() {
    console.log('--- STARTING BACKFILL ---');

    // 1. Get all profiles with role 'athlete' or 'gym'
    console.log('Fetching profiles...');
    const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['athlete', 'gym']);

    if (profError) {
        console.error('Error fetching profiles:', profError);
        return;
    }

    console.log(`Found ${profiles.length} potential candidates.`);

    // 2. For each profile, check if client exists
    let fixedCount = 0;

    for (const p of profiles) {
        // Double check if client exists
        const { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('user_id', p.id)
            .maybeSingle();

        if (!client) {
            console.log(`MISSING CLIENT for: ${p.full_name} (${p.email}) - FIXING...`);

            // Backfill
            const { error: insertError } = await supabase
                .from('clients')
                .insert({
                    user_id: p.id,
                    coach_id: null, // Default to null (independent)
                    type: p.role,
                    name: p.full_name || p.email.split('@')[0],
                    email: p.email,
                    details: {
                        source: 'backfill_script',
                        auto_created: true,
                        backfilled_at: new Date().toISOString()
                    }
                });

            if (insertError) {
                console.error(`  XXX Failed to backfill ${p.email}:`, insertError);
            } else {
                console.log(`  >>> FIXED ${p.email}`);
                fixedCount++;
            }
        } else {
            // console.log(`✓ OK: ${p.email}`);
        }
    }

    console.log(`--- BACKFILL COMPLETE ---`);
    console.log(`Fixed ${fixedCount} missing client records.`);
}

backfillClients();
