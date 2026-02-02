// Script to debug the handle_new_user trigger and test profile insertion
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function debug() {
    console.log('\n🔍 DEBUGGING TRIGGER AND CONSTRAINTS\n');

    // 1. Check if trigger exists
    console.log('1️⃣ Checking trigger existence...');
    const { data: triggers, error: triggerErr } = await supabase.rpc('check_trigger_exists');

    if (triggerErr) {
        console.log('   Cannot check triggers via RPC (expected). Skipping...');
    } else {
        console.log('   Trigger status:', triggers);
    }

    // 2. Check profiles table constraints
    console.log('\n2️⃣ Checking profiles constraints...');
    const { data: colInfo, error: colErr } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (colErr) {
        console.log('   ❌ Error querying profiles:', colErr.message);
    } else {
        console.log('   ✅ Profiles table accessible');
    }

    // 3. Check user_role enum values
    console.log('\n3️⃣ Checking user_role enum...');
    const { data: enumData, error: enumErr } = await supabase
        .from('profiles')
        .select('role')
        .limit(5);

    if (enumErr) {
        console.log('   ❌ Error:', enumErr.message);
    } else {
        console.log('   Existing roles:', enumData?.map(p => p.role));
    }

    // 4. Try manual insert as admin
    console.log('\n4️⃣ Testing manual profile insert (as admin)...');
    const testId = '00000000-0000-0000-0000-000000000001';
    const testEmail = 'test-debug@test.com';

    // First delete if exists
    await supabase.from('profiles').delete().eq('id', testId);

    const { error: insertErr } = await supabase
        .from('profiles')
        .insert({
            id: testId,
            email: testEmail,
            full_name: 'Test Debug',
            role: 'athlete'
        });

    if (insertErr) {
        console.log('   ❌ Insert failed:', insertErr.message);
        console.log('   Full error:', JSON.stringify(insertErr, null, 2));
    } else {
        console.log('   ✅ Manual insert succeeded!');
        // Cleanup
        await supabase.from('profiles').delete().eq('id', testId);
        console.log('   🗑️ Cleaned up test record');
    }

    // 5. Check for any unique constraint on email
    console.log('\n5️⃣ Testing unique constraint on email...');
    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .ilike('email', 'admin@epnstore.com.ar')
        .maybeSingle();

    if (existingProfile) {
        console.log('   ⚠️ FOUND ORPHAN PROFILE:');
        console.log('   ', existingProfile);
    } else {
        console.log('   ✅ No existing profile with admin@epnstore.com.ar');
    }

    // 6. Check direct in profiles for ALL emails containing "admin"
    console.log('\n6️⃣ Searching for any admin-related profiles...');
    const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('id, email, role')
        .ilike('email', '%admin%');

    if (adminProfiles?.length) {
        console.log('   Found profiles with "admin" in email:');
        adminProfiles.forEach(p => console.log(`    - ${p.email} (${p.role})`));
    } else {
        console.log('   No profiles found with "admin" in email');
    }

    // 7. Test auth.admin.createUser to see the REAL error
    console.log('\n7️⃣ Testing auth.admin.createUser directly...');
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: 'admin@epnstore.com.ar',
        password: 'password123',
        email_confirm: true,
        user_metadata: {
            full_name: 'Test Admin',
            role: 'athlete'
        }
    });

    if (createErr) {
        console.log('   ❌ CREATE USER FAILED:', createErr.message);
        console.log('   Full error:', JSON.stringify(createErr, null, 2));
    } else {
        console.log('   ✅ User created successfully!');
        console.log('   User ID:', newUser.user.id);

        // Check if profile was created by trigger
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newUser.user.id)
            .single();

        if (profile) {
            console.log('   ✅ Profile was created by trigger:');
            console.log('   ', profile);
        } else {
            console.log('   ❌ Profile was NOT created by trigger!');
        }
    }

    console.log('\n✨ Debug complete!\n');
}

debug().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
