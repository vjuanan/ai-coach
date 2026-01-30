
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createFreshUser() {
    const email = 'nuevo_atleta@test.com';
    const password = 'password123';

    // 1. Delete if exists (Cleanup)
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        console.log('Deleting existing user...');
        await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
    }

    // 2. Create fresh user
    console.log(`Creating fresh user ${email}...`);
    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { full_name: 'Test Onboarding User' }
    });

    if (error) throw error;

    // Note: The trigger might create a profile with null role automatically.
    // That acts as our starting point.
    console.log('User created:', newUser.user.id);
}

createFreshUser();
