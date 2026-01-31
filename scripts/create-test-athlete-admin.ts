import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createTestAthlete() {
    const email = 'admin@epnstore.com.ar';
    const password = '123456';

    console.log(`Creating test athlete: ${email}...`);

    // 1. Cleanup existing user
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existing = users.find(u => u.email === email);
    if (existing) {
        console.log('Deleting existing user...');
        await supabaseAdmin.auth.admin.deleteUser(existing.id);
    }

    // 2. Create fresh user with email confirmed
    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Auto-confirm email
        user_metadata: { full_name: 'Admin Test Athlete' }
    });

    if (error) throw error;
    console.log('User created:', newUser.user.id);

    // 3. Ensure profile has NULL role so onboarding triggers
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', newUser.user.id)
        .single();

    if (profile) {
        console.log(`Current role: ${profile.role}. Resetting to NULL...`);
        await supabaseAdmin
            .from('profiles')
            .update({ role: null })
            .eq('id', newUser.user.id);
    }

    // Verify
    const { data: check } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', newUser.user.id)
        .single();

    console.log(`Verification: role is now ${check?.role === null ? 'NULL' : check?.role}`);
    console.log('\\n✅ Ready to test! Login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
}

createTestAthlete();
