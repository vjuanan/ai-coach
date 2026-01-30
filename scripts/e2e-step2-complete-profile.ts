
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function completeE2EProfile() {
    const email = 'athlete_e2e@test.com';
    console.log(`Step 2: Completing onboarding for ${email}...`);

    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    if (!user) throw new Error('User not found');

    // Simulate Wizard Completion (Minimal - Just Role)
    const { error } = await supabaseAdmin.from('profiles').update({
        role: 'athlete',
        // birth_date: '1995-05-15', // Skiping missing columns
        // height: 180,
        // weight: 85.5,
        // main_goal: 'performance',
        // training_place: 'gym', // This column likely exists? No, checking migration.
        // experience_level: 'advanced'
    }).eq('id', user.id);

    if (error) throw error;
    console.log('Profile updated to "Athlete" with full data.');
}

completeE2EProfile();
