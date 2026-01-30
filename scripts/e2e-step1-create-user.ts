
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createE2EUser() {
    const email = 'athlete_e2e@test.com';
    const password = 'password123';

    console.log(`Step 1: Creating/Resetting user ${email}...`);

    // 1. Cleanup
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existing = users.find(u => u.email === email);
    if (existing) {
        // Delete auth user (cascades to profile usually, but we want fresh)
        await supabaseAdmin.auth.admin.deleteUser(existing.id);
        console.log('Deleted existing user.');
    }

    // 2. Create
    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { full_name: 'E2E Athlete' }
    });

    if (error) throw error;
    console.log('User created:', newUser.user.id);

    // Ensure Profile is clean (Role should be null or 'athlete' depending on trigger, 
    // but for Onboarding test we want Role=NULL initially usually, unless we select it in step 0.
    // Our Onboarding Step 0 sets the role. So initially it might be null.
    // Let's verify if a profile exists.
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', newUser.user.id).single();
    if (profile) {
        console.log(`Profile exists. Current Role: ${profile.role}. Resetting to NULL for onboarding...`);
        // Reset role to null to force onboarding flow
        const { error: updateError } = await supabaseAdmin.from('profiles').update({
            role: null,
            birth_date: null,
            height: null
        }).eq('id', newUser.user.id);

        if (updateError) console.error('Error resetting profile:', updateError);

        // Double check
        const { data: check } = await supabaseAdmin.from('profiles').select('role').eq('id', newUser.user.id).single();
        console.log(`VERIFICATION: User Role is now: ${check?.role} (Should be null)`);
    } else {
        // If profile doesn't exist, create it with null role (if trigger didn't run)
        await supabaseAdmin.from('profiles').insert({ id: newUser.user.id, role: null, email: email });
        console.log('Created new profile with NULL role.');
    }
}

createE2EUser();
