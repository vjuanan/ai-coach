
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

async function createTestClient() {
    console.log('Creating test client for deletion...');

    const { data, error } = await supabase
        .from('clients')
        .insert({
            name: 'User To Delete',
            email: 'todelete@test.com',
            type: 'athlete'
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating client:', error);
    } else {
        console.log('Created client:', data.id, data.name);
    }
}

createTestClient();
