
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function check() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    console.log('Checking "Plank" with explicit select including MISSING column...');
    const { data, error } = await supabase.from('exercises').select('id, name, cue').limit(1);

    if (error) {
        console.log('CRASH CONFIRMED:', error.message);
    } else {
        console.log('NO CRASH. Data:', data);
    }
}

check();
