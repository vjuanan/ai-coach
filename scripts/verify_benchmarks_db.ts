
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyBenchmarks(athleteId: string) {
    console.log(`Verifying benchmarks for athlete: ${athleteId}`);

    // 1. Check Profiles Table
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('benchmarks')
        .eq('id', athleteId)
        .single();

    if (profileError) {
        console.log('Profile not found or error:', profileError.message);
    } else {
        console.log('--- Profile Benchmarks ---');
        console.log(JSON.stringify(profile.benchmarks, null, 2));
    }

    // 2. Check Clients Table
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('details')
        .eq('id', athleteId)
        .single();

    if (clientError) {
        // Try finding by ID directly in case ID matches but not in clients table (rare for athletes)
        console.log('Client record not found in clients table (might be pure profile):', clientError.message);
    } else {
        console.log('--- Client Details (oneRmStats) ---');
        console.log(JSON.stringify(client.details?.oneRmStats, null, 2));
    }
}

const athleteId = process.argv[2];
if (!athleteId) {
    console.error('Usage: npx tsx scripts/verify_benchmarks_db.ts <athlete_id>');
    process.exit(1);
}

verifyBenchmarks(athleteId);
