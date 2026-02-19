
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const exercisesToInsert = [
    { name: 'Hip Thrust con Barra', category: 'Weightlifting', equipment: ['Barbell'] },
    { name: 'Plancha Frontal', category: 'Gymnastics', equipment: ['Bodyweight'] },
    { name: 'Negative Pull-Ups', category: 'Gymnastics', equipment: ['Pull-up Bar'] },
    { name: 'Estocadas con Salto con Mancuernas', category: 'Functional Bodybuilding', equipment: ['Dumbbell'] },
    { name: 'Sentadillas con Disco al Pecho', category: 'Weightlifting', equipment: ['Plate'] },
    { name: 'Kettlebell Swings', category: 'Weightlifting', equipment: ['Kettlebell'] },
    { name: 'Wall Balls', category: 'Functional Bodybuilding', equipment: ['Medicine Ball'] },
    { name: 'Burpees', category: 'Gymnastics', equipment: ['Bodyweight'] },
    { name: 'Saltos/Step-ups', category: 'Monostructural', equipment: ['Box'] }
];

async function run() {
    console.log('Seeding Missing Exercises...');

    for (const ex of exercisesToInsert) {
        // Check if exists
        const { data: existing } = await supabase.from('exercises').select('id').eq('name', ex.name).single();
        if (existing) {
            console.log(`Skipping ${ex.name} (already exists)`);
            continue;
        }

        const { error } = await supabase.from('exercises').insert({
            name: ex.name,
            category: ex.category,
            equipment: ex.equipment,
            description: 'Agregado automáticamente para Rutina Antopanti',
            video_url: null
        });

        if (error) console.error(`Error inserting ${ex.name}:`, error);
        else console.log(`Inserted ${ex.name}`);
    }
}

run();
