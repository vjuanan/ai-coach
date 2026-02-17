import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkCoachesTable() {
    console.log('--- CONTENT OF COACHES TABLE ---');
    const { data: coaches, error } = await supabase
        .from('coaches')
        .select('id, full_name, business_name');

    if (error) console.error(error);
    else console.table(coaches);

    console.log('\n--- CONTENT OF PROFILES TABLE (Role=coach/admin) ---');
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, full_name, role, email')
        .in('role', ['coach', 'admin']);

    if (pError) console.error(pError);
    else console.table(profiles);
}

checkCoachesTable();
