
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const exercisesToCheck = [
    'Correr', 'Nadar', 'Remo', 'SkiErg', 'Assault Bike',
    'Trineo: Empuje', 'Trineo: Arrastre'
];

async function verifyExercises() {
    console.log('Verifying exercises...');
    const { data, error } = await supabase
        .from('exercises')
        .select('name, category')
        .in('name', exercisesToCheck);

    if (error) {
        console.error('Error fetching exercises:', error);
        return;
    }

    const foundNames = data.map(e => e.name);
    const missing = exercisesToCheck.filter(e => !foundNames.includes(e));

    console.log(`Found ${foundNames.length} / ${exercisesToCheck.length} exercises.`);

    if (missing.length > 0) {
        console.log('Missing exercises:', missing);
    } else {
        console.log('All checked exercises found! ✅');
    }
}

verifyExercises();
