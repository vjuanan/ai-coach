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

async function listAllCoaches() {
    console.log('Fetching all coaches and admins from profiles...\n');

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, email')
        .in('role', ['coach', 'admin'])
        .order('full_name');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${profiles?.length || 0} coaches/admins:\n`);
    profiles?.forEach((p, i) => {
        const displayName = p.full_name || p.email || 'Sin Nombre';
        const businessName = p.role === 'admin' ? 'Admin / Entrenador' : null;
        console.log(`${i + 1}. "${displayName}" ${businessName ? '(' + businessName + ')' : ''}`);
        console.log(`   Email: ${p.email}`);
        console.log(`   Role: ${p.role}`);
        console.log(`   ID: ${p.id}`);
        console.log('');
    });

    // Simulate the mapping function
    const mapped = (profiles || []).map(p => ({
        id: p.id,
        full_name: p.full_name || p.email || 'Sin Nombre',
        business_name: p.role === 'admin' ? 'Admin / Entrenador' : null
    }));

    console.log('=== MAPPED OUTPUT (as seen by Component) ===');
    console.log(JSON.stringify(mapped, null, 2));
}

listAllCoaches();
