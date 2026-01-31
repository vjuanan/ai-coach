import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyAthleteProfile() {
    const email = 'admin@epnstore.com.ar';
    console.log(`Verifying profile for: ${email}...`);

    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        console.log('❌ User not found in auth.users');
        return;
    }

    console.log('✅ User found in auth.users:', user.id);

    const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.log('❌ Error fetching profile:', error.message);
        return;
    }

    console.log('\\n📋 PROFILE DATA:');
    console.log('  Role:', profile.role);
    console.log('  Email:', profile.email);
    console.log('  Full Name:', profile.full_name);
    console.log('\\n✅ Database verification complete!');
}

verifyAthleteProfile();
