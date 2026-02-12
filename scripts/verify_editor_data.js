
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

// Emulate the getFullProgramData logic with Admin Client
async function verifyEditorFetch(programId) {
    console.log('--- VERIFYING EDITOR FETCH ---');
    console.log('Program ID:', programId);

    const adminSupabase = createClient(supabaseUrl, serviceKey);

    // 1. Fetch Program with Client Join
    const { data: program, error: adminProgError } = await adminSupabase
        .from('programs')
        .select('*, client:clients(*), coach:coaches(full_name)')
        .eq('id', programId)
        .single();

    if (adminProgError) {
        console.error('Fetch Failed:', adminProgError);
        return;
    }

    console.log('Program Found:', program.name);

    if (program.client) {
        console.log('✅ Client Data Present:', {
            id: program.client.id,
            name: program.client.name,
            type: program.client.type
        });
    } else {
        console.error('❌ Client Data MISSING in Join!');
        console.log('Raw Client ID in Program:', program.client_id);
    }
}

const programId = 'a9ea42ab-08f4-48b2-b62b-a2014f2f7700'; // Final Verification
verifyEditorFetch(programId);
