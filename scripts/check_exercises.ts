
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Checking Exercises...');

    const requiredNames = [
        'Hip Thrust con Barra',
        'Peso Muerto Convencional',
        'Sentadilla Búlgara',
        'Plancha Frontal',
        'Curl Femoral Mancuerna',
        'Abducciones en Máquina',
        'Negative Pull-Ups', // This might be a block name but let's check
        'Dominadas Negativas',
        'Press de Banca Plano',
        'Remo Unilateral con Mancuerna',
        'Tríceps Trasnuca con Mancuerna',
        'Vuelos Laterales',
        'Sentadilla Trasera con Barra',
        'Zancada con Rotación',
        'Push-Ups',
        'Vuelos Posteriores',
        'Step-Up Lateral',
        'Patada de Glúteo en Polea',
        'Estocadas con Salto con Mancuernas',
        'Sentadillas con Disco al Pecho',
        'Knees to Chest',
        'Flexiones Escapulares',
        'Gato-Vaca',
        'Colgarse de Barra',
        'Pull-up (Strict)',
        'Sprints', // Might be MetCon block name
        'Buenos Días',
        'Sprawls',
        'Sentadilla con Salto',
        'Jumping Jacks',
        'Kettlebell Swings',
        'Plancha',
        'Wall Balls',
        'Burpees',
        'Saltos/Step-ups',
        'Farmers Carry'
    ];

    const { data: exercises, error } = await supabase
        .from('exercises')
        .select('name')
        .in('name', requiredNames);

    if (error) {
        console.error('Error fetching exercises:', error);
        return;
    }

    const foundNames = exercises.map(e => e.name);
    const missingNames = requiredNames.filter(n => !foundNames.includes(n));

    console.log(`Found ${foundNames.length} / ${requiredNames.length}`);

    if (missingNames.length > 0) {
        console.log('MISSING EXERCISES (Need to be inserted):');
        missingNames.forEach(n => console.log(`- ${n}`));
    } else {
        console.log('All exercises found!');
    }
}

run();
