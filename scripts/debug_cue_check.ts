
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function check() {
    console.log('--- DB Column Check ---');
    console.log('Connecting to:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Check if column exists by selecting it
    const { data, error } = await supabase.from('exercises').select('cue').limit(1);

    if (error) {
        console.log('❌ Column "cue" DOES NOT EXIST.');
        console.log('Error details:', error.message);
        console.log('Suggestion: Run "ALTER TABLE exercises ADD COLUMN IF NOT EXISTS cue TEXT DEFAULT NULL;"');
    } else {
        console.log('✅ Column "cue" EXISTS.');
        console.log('Sample data:', data);
    }
    console.log('-----------------------');
}

check();
