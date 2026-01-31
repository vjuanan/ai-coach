import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createTestGymUser() {
    const email = 'testgym@epnstore.com.ar';
    const password = '123456';

    console.log('Creating test gym user...');

    // Delete existing user if exists
    const { data: existingUsers } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email);

    if (existingUsers && existingUsers.length > 0) {
        console.log('Deleting existing user...');
        await supabaseAdmin.auth.admin.deleteUser(existingUsers[0].id);
    }

    // Create user with email_confirmed
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Test Gym User' }
    });

    if (error) {
        console.error('Error creating user:', error);
        return;
    }

    // Set role to null so onboarding is triggered
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ role: null, full_name: 'Test Gym User' })
        .eq('id', data.user.id);

    if (profileError) {
        console.error('Error updating profile:', profileError);
    }

    console.log('✅ Test gym user created:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', data.user.id);
    console.log('Role: null (will trigger onboarding)');
}

createTestGymUser();
