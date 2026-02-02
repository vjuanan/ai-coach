// Test signup with a completely new random email
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function testNewEmail() {
    const randomEmail = `test-${Date.now()}@example.com`;
    console.log(`\n🧪 Testing signup with BRAND NEW email: ${randomEmail}\n`);

    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: randomEmail,
        password: 'password123',
        email_confirm: true,
        user_metadata: {
            full_name: 'Test User',
            role: 'athlete'
        }
    });

    if (createErr) {
        console.log('❌ CREATE USER FAILED:', createErr.message);
        console.log('   Full error:', JSON.stringify(createErr, null, 2));
        console.log('\n⚠️ PROBLEM IS GLOBAL - Not specific to admin@epnstore.com.ar');
        console.log('   The trigger or database has a systemic issue.');
    } else {
        console.log('✅ User created successfully!');
        console.log('   User ID:', newUser.user.id);
        console.log('   Email:', newUser.user.email);

        // Check if profile was created
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newUser.user.id)
            .single();

        if (profile) {
            console.log('   ✅ Profile was created by trigger!');
            console.log('   Role:', profile.role);
        } else {
            console.log('   ⚠️ Profile was NOT created by trigger!');
        }

        // Cleanup - delete the test user
        console.log('\n🗑️ Cleaning up test user...');
        await supabase.auth.admin.deleteUser(newUser.user.id);
        console.log('   ✅ Test user deleted');
    }
}

testNewEmail().catch(console.error);
