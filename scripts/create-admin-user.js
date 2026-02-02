// Create admin@epnstore.com.ar user now that signups work
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function createAdmin() {
    console.log('\n🔧 Creating admin@epnstore.com.ar user...\n');

    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: 'admin@epnstore.com.ar',
        password: 'password123',
        email_confirm: true,
        user_metadata: {
            full_name: 'Admin EPN',
            role: 'admin'
        }
    });

    if (createErr) {
        console.log('❌ CREATE USER FAILED:', createErr.message);
        console.log('   Full error:', JSON.stringify(createErr, null, 2));
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
            console.log('   ✅ Profile created by trigger:');
            console.log('      Full Name:', profile.full_name);
            console.log('      Role:', profile.role);
        } else {
            console.log('   ⚠️ Profile was NOT created by trigger!');
        }

        console.log('\n🎉 You can now login with:');
        console.log('   Email: admin@epnstore.com.ar');
        console.log('   Password: password123');
    }
}

createAdmin().catch(console.error);
