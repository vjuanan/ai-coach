import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function debugAdminUser() {
    console.log('Searching for admin@epnstore.com.ar...\n');

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'admin@epnstore.com.ar');

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!profiles || profiles.length === 0) {
        console.log('❌ admin@epnstore.com.ar NOT FOUND in profiles table');
        console.log('\nSearching all profiles with admin or coach role...');

        const { data: allCoaches } = await supabase
            .from('profiles')
            .select('id, email, full_name, role')
            .in('role', ['admin', 'coach']);

        console.log(`Found ${allCoaches?.length || 0} coaches/admins:`);
        allCoaches?.forEach(p => {
            console.log(`  - ${p.full_name || 'No Name'} | ${p.email} | role: ${p.role}`);
        });
    } else {
        console.log('✅ Found:', profiles[0]);
        console.log(`   ID: ${profiles[0].id}`);
        console.log(`   Full Name: ${profiles[0].full_name}`);
        console.log(`   Role: ${profiles[0].role}`);
    }
}

debugAdminUser();
