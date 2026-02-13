
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

async function checkAntonella() {
    console.log('--- CHECKING ANTONELLA ---');

    // Check Profiles
    console.log('1. Checking public.profiles for Antonella...');
    const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', '%Antonella%'); // Case insensitive partial match

    if (profError) {
        console.error('Error fetching profile:', profError);
    } else if (!profiles || profiles.length === 0) {
        console.log('No profiles found matching "Antonella"');
    } else {
        console.log(`Found ${profiles.length} profiles:`);
        profiles.forEach(p => console.log(`- ID: ${p.id}, Name: ${p.full_name}, Email: ${p.email}, Role: ${p.role}`));

        // Check Clients for each found profile
        for (const p of profiles) {
            console.log(`Checking client for ${p.full_name} (${p.id})...`);
            const { data: client, error: clientError } = await supabase
                .from('clients')
                .select('*')
                .eq('user_id', p.id)
                .maybeSingle();

            if (client) {
                console.log(`  -> CLIENT EXISTS: ${client.id}`);
            } else {
                console.log(`  -> CLIENT MISSING! This user needs backfill.`);
            }
        }
    }
}

checkAntonella();
