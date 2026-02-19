
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function check() {
    try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { count, error } = await supabase.from('exercises').select('*', { count: 'exact', head: true });
        if (error) {
            console.error('Error counting:', error);
        } else {
            console.log('Total exercises:', count);
        }

        // List all
        const { data } = await supabase.from('exercises').select('name').order('name');
        console.log('All names:', JSON.stringify(data?.map(e => e.name), null, 2));
    } catch (e) {
        console.error('Crash:', e);
    }
}

check();
