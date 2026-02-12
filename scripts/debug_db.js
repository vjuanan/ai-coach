
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkClient() {
    const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .ilike('name', '%Test Athlete%');

    console.log('Test Athlete Clients:', clients);
}

checkClient();

const programId = 'a9ea42ab-08f4-48b2-b62b-a2014f2f7700';

async function checkProgram(id) {
    console.log('Checking program:', id);

    // 1. Check raw program
    const { data: program, error } = await supabase
        .from('programs')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching program:', error);
        return;
    }

    console.log('Program Raw:', {
        id: program.id,
        name: program.name,
        client_id: program.client_id,
        status: program.status
    });

    // 2. Check client join (simulating getPrograms logic)
    const { data: joined, error: joinError } = await supabase
        .from('programs')
        .select('*, client:clients(*)')
        .eq('id', id)
        .single();

    if (joinError) {
        console.error('Error fetching join:', joinError);
    } else {
        console.log('Program Joined:', {
            client_id: joined.client_id,
            client_obj: joined.client
        });
    }
}


const testAthleteId = '524f0b5f-c6be-4800-97a3-7939881b3060';
const juanPerezId = '386b91ab-cdf7-4d9b-a583-4dc823d37c1e';

async function testAssignment() {
    console.log('--- TESTING ASSIGNMENT ---');

    // 1. Assign to Test Athlete
    const { data: updated, error } = await supabase
        .from('programs')
        .update({ client_id: testAthleteId })
        .eq('id', programId)
        .select()
        .single();

    if (error) {
        console.error('Assignment Error:', error);
        return;
    }
    console.log('Assigned to Test Athlete:', updated.client_id === testAthleteId ? 'SUCCESS' : 'FAIL');

    // 2. Read back
    await checkProgram(programId);

    // 3. Revert
    console.log('--- REVERTING ---');
    await supabase.from('programs').update({ client_id: juanPerezId }).eq('id', programId);
    console.log('Reverted to Juan Perez');
}

testAssignment();

