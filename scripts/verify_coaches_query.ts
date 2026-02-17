
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

async function verifyCoachesQuery() {
    console.log('Testing Coach Query (Simulating getCoaches)...');

    // The query used in the new getCoaches
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, email')
        .in('role', ['coach', 'admin'])
        .order('full_name', { ascending: true });

    if (error) {
        console.error('Error fetching coaches:', error);
    } else {
        console.log(`Found ${data.length} coaches/admins:`);
        data.forEach(p => {
            console.log(`- [${p.role}] ${p.full_name} (${p.email})`);
        });

        // Verify mapping logic
        const mapped = data.map(p => ({
            id: p.id,
            full_name: p.full_name || p.email || 'Usuario sin nombre',
            business_name: p.role === 'admin' ? 'Admin / Entrenador' : null
        }));
        console.log('Mapped Output for Component:', JSON.stringify(mapped, null, 2));
    }
}

verifyCoachesQuery();
