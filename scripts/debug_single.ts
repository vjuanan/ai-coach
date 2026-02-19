
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function check() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    console.log('Checking "Plank"...');
    const { data, error } = await supabase.from('exercises').select('*').eq('name', 'Plank');
    console.log('Error:', error);
    console.log('Data:', data);

    console.log('Checking "Plank" with ilike...');
    const { data: data2, error: error2 } = await supabase.from('exercises').select('*').ilike('name', 'Plank');
    console.log('Error2:', error2);
    console.log('Data2:', data2);
}

check();
