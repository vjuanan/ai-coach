
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

async function testRegistration() {
    console.log('--- STARTING REGISTRATION TEST ---');

    const email = `test_script_${Date.now()}@test.com`;
    const password = 'password123';
    const fullName = 'Test Script User';

    console.log(`1. Creating user: ${email}`);

    // Create User via Auth Admin (simulates signup but skips email confirm if set to auto-confirm, 
    // or just creates the user in auth.users which triggers the function)
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: {
            full_name: fullName,
            role: 'athlete' // This is what the frontend sends (or defaults to)
        },
        email_confirm: true
    });

    if (createError) {
        console.error('Error creating user:', createError);
        return;
    }

    if (!user.user) {
        console.error('No user returned');
        return;
    }

    const userId = user.user.id;
    console.log(`User created. ID: ${userId}`);

    // Wait a moment for trigger
    console.log('2. Waiting for trigger to fire...');
    await new Promise(r => setTimeout(r, 2000));

    // Check Profiles
    console.log('3. Checking public.profiles...');
    const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profError) {
        console.error('Error fetching profile:', profError);
    } else {
        console.log('Profile found:', profile);
    }

    // Check Clients
    console.log('4. Checking public.clients...');
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId) // Checking by user_id
        .maybeSingle();

    if (clientError) {
        console.error('Error fetching client:', clientError);
    } else if (!client) {
        console.error('FAILURE: Client record NOT found in public.clients');
        console.log('Checking if client exists by email...');
        const { data: clientByEmail } = await supabase.from('clients').select('*').eq('email', email);
        console.log('Clients by email:', clientByEmail);
    } else {
        console.log('SUCCESS: Client record found:', client);
    }

    // Cleanup
    // console.log('5. Cleanup... (SKIPPED FOR MANUAL VERIFICATION)');
    // await supabase.auth.admin.deleteUser(userId);
    // Profile cascade deletes? Clients cascade?
    // Trigger on_profile_deleted_notify_admins might run.
}

testRegistration();
