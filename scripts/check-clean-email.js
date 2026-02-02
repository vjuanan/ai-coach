// Script to check and clean profiles by email
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const emailToCheck = process.argv[2] || 'admin@epnstore.com.ar';

async function checkAndClean() {
    console.log(`\n🔍 Checking all tables for: ${emailToCheck}\n`);

    // 1. Check profiles
    const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', emailToCheck);

    console.log('📋 PROFILES TABLE:');
    if (pErr) console.error('  Error:', pErr.message);
    else if (!profiles?.length) console.log('  ✅ No records found');
    else {
        console.log('  ⚠️ Found records:');
        profiles.forEach(p => {
            console.log(`    - ID: ${p.id}, Email: ${p.email}, Role: ${p.role}`);
        });

        // Delete them
        console.log('\n🗑️ Deleting orphan profiles...');
        for (const p of profiles) {
            const { error } = await supabase.from('profiles').delete().eq('id', p.id);
            if (error) console.error(`  ❌ Failed to delete ${p.id}:`, error.message);
            else console.log(`  ✅ Deleted ${p.id}`);
        }
    }

    // 2. Check coaches
    const { data: coaches, error: cErr } = await supabase
        .from('coaches')
        .select('*, profiles(email)')
        .eq('profiles.email', emailToCheck);

    console.log('\n📋 COACHES TABLE:');
    if (cErr) console.error('  Error:', cErr.message);
    else if (!coaches?.length) console.log('  ✅ No records found');
    else {
        console.log('  ⚠️ Found records:', coaches);
    }

    // 3. Check clients
    const { data: clients, error: clErr } = await supabase
        .from('clients')
        .select('*, profiles(email)')
        .eq('profiles.email', emailToCheck);

    console.log('\n📋 CLIENTS TABLE:');
    if (clErr) console.error('  Error:', clErr.message);
    else if (!clients?.length) console.log('  ✅ No records found');
    else {
        console.log('  ⚠️ Found records:', clients);
    }

    // 4. Double-check auth.users with RPC
    console.log('\n📋 AUTH.USERS (via RPC):');
    const { data: exists, error: rpcErr } = await supabase.rpc('check_email_exists', {
        email_input: emailToCheck
    });

    if (rpcErr) console.error('  RPC Error:', rpcErr.message);
    else console.log(`  Email exists in auth.users: ${exists ? '❌ YES' : '✅ NO'}`);

    console.log('\n✨ Cleanup complete. Try registering now!\n');
}

checkAndClean();
