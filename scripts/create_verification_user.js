
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const EMAIL = `auto_verifier_${Date.now()}@example.com`;
const PASSWORD = 'Password123!';

async function main() {
    console.log(`Creating user: ${EMAIL}`);

    // 1. Create User
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'Auto Verifier' }
    });

    if (createError) {
        console.error('Error creating user:', createError);
        process.exit(1);
    }

    console.log('User created:', user.id);

    // 2. Update Profile & Onboarding
    // Wait a bit for triggers if any
    await new Promise(r => setTimeout(r, 2000));

    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            role: 'coach',
            onboarding_completed: true,
            full_name: 'Auto Verifier'
        })
        .eq('id', user.id);

    if (profileError) {
        console.error('Error updating profile:', profileError);
        // Try insert if update failed (though trigger should have created it)
    } else {
        console.log('Profile updated: Coach, Onboarding Complete');
    }

    console.log('--- CREDENTIALS ---');
    console.log(`EMAIL: ${EMAIL}`);
    console.log(`PASSWORD: ${PASSWORD}`);
}

main();
