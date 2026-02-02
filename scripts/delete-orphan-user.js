// Script to forcefully delete a user from auth.users AND profiles
// Usage: node scripts/delete-orphan-user.js <email>

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const emailToDelete = process.argv[2] || 'admin@epnstore.com.ar';

async function deleteUser() {
    console.log(`\n🔍 Searching for user with email: ${emailToDelete}\n`);

    // 1. Find user in auth.users via Admin API
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000
    });

    if (listError) {
        console.error('❌ Error listing users:', listError.message);
        process.exit(1);
    }

    const user = users.find(u => u.email?.toLowerCase() === emailToDelete.toLowerCase());

    if (!user) {
        console.log('✅ User NOT FOUND in auth.users. No orphan exists!');
        console.log('   The email should be available for registration.');

        // Double check profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', emailToDelete.toLowerCase())
            .maybeSingle();

        if (profile) {
            console.log('\n⚠️ BUT! Found orphan profile WITHOUT auth user:');
            console.log(profile);
            console.log('\n🗑️ Deleting orphan profile...');

            const { error: delProfileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', profile.id);

            if (delProfileError) {
                console.error('❌ Failed to delete profile:', delProfileError.message);
            } else {
                console.log('✅ Orphan profile deleted successfully!');
            }
        }

        return;
    }

    console.log('🔎 Found user in auth.users:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Created: ${user.created_at}`);
    console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log('');

    // 2. Delete from profiles first (if exists)
    console.log('📝 Deleting from profiles table...');
    const { error: profileDeleteError, count } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

    if (profileDeleteError) {
        console.warn('   ⚠️ Profile delete warning:', profileDeleteError.message);
    } else {
        console.log('   ✅ Profile deleted (or didn\'t exist)');
    }

    // 3. Check and delete from coaches table
    console.log('📝 Deleting from coaches table (if exists)...');
    const { error: coachDeleteError } = await supabase
        .from('coaches')
        .delete()
        .eq('id', user.id);

    if (coachDeleteError && !coachDeleteError.message.includes('not found')) {
        console.warn('   ⚠️ Coach delete warning:', coachDeleteError.message);
    } else {
        console.log('   ✅ Coach record cleaned');
    }

    // 4. Check and delete from clients table
    console.log('📝 Deleting from clients table (if exists)...');
    const { error: clientDeleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', user.id);

    if (clientDeleteError && !clientDeleteError.message.includes('not found')) {
        console.warn('   ⚠️ Client delete warning:', clientDeleteError.message);
    } else {
        console.log('   ✅ Client record cleaned');
    }

    // 5. Delete from auth.users (THE MAIN ONE)
    console.log('🗑️ Deleting from auth.users...');
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id);

    if (authDeleteError) {
        console.error('❌ FAILED to delete from auth.users:', authDeleteError.message);
        process.exit(1);
    }

    console.log('✅ User completely deleted from auth.users!');
    console.log('\n🎉 SUCCESS! The email is now available for registration.\n');
}

deleteUser().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
