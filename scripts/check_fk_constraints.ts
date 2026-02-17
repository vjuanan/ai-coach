import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkForeignKeys() {
    console.log('--- CHECKING CLIENTS TABLE CONSTRAINTS ---');
    // We can't easily query information_schema via JS client usually, but we can try rpc or raw query if available.
    // Or we can try to insert a dummy value and see the error message.

    // Attempting to fetch a client to see structure
    const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching clients:', error);
    } else {
        console.log('Client structure sample:', clients?.[0]);
    }

    // Checking if we can update with a profile ID (we know Juanan's ID)
    const juananId = '38b55dc9-9be2-4fe6-b2fb-a360bf5ed675'; // Juanan's ID from previous step

    // We'll try to update a test client if one exists, or just log the intent.
    // Actually, asking the DB directly for constraints is better if possible, but let's assume valid pgsql
    // Inspecting the error message from the user would be ideal, but we only have "Error al asignar coach".
    // The console.error in the server action would show the real error. I can't see server logs.

    // I will try to perform an assignment on a test client with a known profile ID and catch the specific error.

    // 1. Create a dummy client
    const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert({ type: 'athlete', name: 'Test FK' })
        .select()
        .single();

    if (createError) {
        console.error('Failed to create test client:', createError);
        return;
    }

    console.log('Created test client:', newClient.id);

    // 2. Try to assign Juanan (profile ID)
    console.log(`Attempting to assign profile ID ${juananId} to client...`);
    const { error: updateError } = await supabase
        .from('clients')
        .update({ coach_id: juananId })
        .eq('id', newClient.id);

    if (updateError) {
        console.error('❌ Update failed. This confirms the issue.');
        console.error('Error details:', updateError);
    } else {
        console.log('✅ Update successful. No FK constraint preventing it.');
    }

    // 3. Cleanup
    await supabase.from('clients').delete().eq('id', newClient.id);
}

checkForeignKeys();
