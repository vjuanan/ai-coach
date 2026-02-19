
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateExercises() {
    console.log('Updating exercises and aliases...');

    const exercises = [
        { name: 'Plancha', aliases: ['Plank', 'Plancha Frontal'], category: 'Gymnastics', subcategory: 'Core' },
        { name: 'Puente de Glúteo', aliases: ['Glute Bridge'], category: 'Functional Bodybuilding', subcategory: 'Glutes' },
        { name: 'Bird-Dog', aliases: ['Bird Dog'], category: 'Gymnastics', subcategory: 'Core' },
        { name: 'Sentadilla Aire', aliases: ['Air Squat', 'Sentadilla'], category: 'Gymnastics', subcategory: 'Legs' },
        { name: 'Hip Thrust', aliases: ['Hip Thrust con Barra'], category: 'Functional Bodybuilding', subcategory: 'Glutes' },
        { name: 'Peso Muerto Convencional', aliases: ['Deadlift', 'Deadlift Convencional', 'Peso Muerto'], category: 'Weightlifting', subcategory: 'Hinge' },
        { name: 'Sentadilla Búlgara', aliases: ['Bulgarian Split Squat'], category: 'Functional Bodybuilding', subcategory: 'Legs' },
        { name: 'Curl Femoral Mancuerna', aliases: ['Dumbbell Leg Curl', 'Curl Femoral'], category: 'Functional Bodybuilding', subcategory: 'Legs' },
        { name: 'Abducciones en Máquina', aliases: ['Hip Abduction Machine'], category: 'Functional Bodybuilding', subcategory: 'Glutes' },
        { name: 'Estocadas con Salto', aliases: ['Jumping Lunges'], category: 'Gymnastics', subcategory: 'Legs' },
        { name: 'Sentadilla con Disco', aliases: ['Goblet Squat (Plate)', 'Plate Squat'], category: 'Functional Bodybuilding', subcategory: 'Legs' },
        { name: 'Knees to Chest', aliases: ['Rodillas al Pecho'], category: 'Gymnastics', subcategory: 'Core' },
        { name: 'Flexiones Escapulares', aliases: ['Scapular Push-ups'], category: 'Gymnastics', subcategory: 'Upper Body' },
        { name: 'Gato-Vaca', aliases: ['Cat-Cow', 'Cat Cow'], category: 'Gymnastics', subcategory: 'Core' },
        { name: 'Colgarse de Barra', aliases: ['Dead Hang'], category: 'Gymnastics', subcategory: 'Pulling' },
        { name: 'Dominadas Negativas', aliases: ['Negative Pull-Ups'], category: 'Gymnastics', subcategory: 'Pulling' },
        { name: 'Press de Banca Plano', aliases: ['Bench Press', 'Press Plano con Barra', 'Press de Banca'], category: 'Weightlifting', subcategory: 'Pressing' },
        { name: 'Remo Unilateral con Mancuerna', aliases: ['Dumbbell Row', 'Remo Unilateral'], category: 'Functional Bodybuilding', subcategory: 'Pulling' },
        { name: 'Tríceps Trasnuca con Mancuerna', aliases: ['Dumbbell Overhead Extension', 'Tríceps Trasnuca'], category: 'Functional Bodybuilding', subcategory: 'Upper Body' },
        { name: 'Vuelos Laterales', aliases: ['Lateral Raise'], category: 'Functional Bodybuilding', subcategory: 'Upper Body' },
        { name: 'Sprints', aliases: ['Carrera Rápida'], category: 'Monostructural', subcategory: 'Running' },
        { name: 'Zancada con Rotación', aliases: ['Lunge with Rotation'], category: 'Gymnastics', subcategory: 'Lower Body' },
        { name: 'Y-T-W', aliases: ['YTW'], category: 'Gymnastics', subcategory: 'Upper Body' },
        { name: 'Sentadilla Trasera con Barra', aliases: ['Back Squat', 'Sentadilla con Barra'], category: 'Weightlifting', subcategory: 'Squat' },
        { name: 'Push-Ups', aliases: ['Flexiones', 'Flexiones de Brazos'], category: 'Gymnastics', subcategory: 'Pushing' },
        { name: 'Vuelos Posteriores', aliases: ['Rear Delt Fly'], category: 'Functional Bodybuilding', subcategory: 'Upper Body' },
        { name: 'Step-Up Lateral', aliases: ['Step Up Lateral'], category: 'Functional Bodybuilding', subcategory: 'Legs' },
        { name: 'Patada de Glúteo en Polea', aliases: ['Cable Glute Kickback', 'Patada de Glúteo'], category: 'Functional Bodybuilding', subcategory: 'Glutes' },
        { name: 'Buenos Días', aliases: ['Good Morning'], category: 'Functional Bodybuilding', subcategory: 'Hinge' },
        { name: 'Sprawls', aliases: ['Down Ups'], category: 'Monostructural', subcategory: 'Bodyweight' },
        { name: 'Sentadilla con Salto', aliases: ['Jump Squat'], category: 'Gymnastics', subcategory: 'Legs' },
        { name: 'Jumping Jacks', aliases: ['Saltos de Tijera'], category: 'Monostructural', subcategory: 'Bodyweight' },
        { name: 'Kettlebell Swing', aliases: ['KB Swing', 'Swing'], category: 'Weightlifting', subcategory: 'Hinge' },
        { name: 'Wall Ball', aliases: ['Lanzamiento de Balón'], category: 'Weightlifting', subcategory: 'Compound' },
        { name: 'Burpee', aliases: ['Burpees'], category: 'Monostructural', subcategory: 'Bodyweight' },
        { name: 'Farmers Carry', aliases: ['Caminata del Granjero', 'Farmer Carry'], category: 'Functional Bodybuilding', subcategory: 'Carry' }
    ];

    for (const ex of exercises) {
        const { error } = await supabase
            .from('exercises')
            .upsert({
                name: ex.name,
                aliases: ex.aliases,
                category: ex.category,
                subcategory: ex.subcategory
            }, { onConflict: 'name' });

        if (error) {
            console.error(`Error updating exercise ${ex.name}:`, error);
        } else {
            console.log(`Updated exercise: ${ex.name}`);
        }
    }
}

async function updateMethodologies() {
    console.log('Updating methodologies...');

    const superSetUpdate = {
        code: 'SUPER_SET',
        name: 'Super Set',
        description: 'Dos ejercicios realizados consecutivamente sin descanso',
        category: 'strength',
        icon: 'Repeat',
        form_config: {
            fields: [
                { key: 'sets', label: 'Series', type: 'number', placeholder: '4', required: true },
                { key: 'movements', label: 'Ejercicios (A + B)', type: 'movements_list', required: true },
                { key: 'restBetweenSets', label: 'Descanso Entre Series', type: 'text', placeholder: '90s' }
            ]
        },
        default_values: {
            sets: 3,
            movements: [],
            restBetweenSets: '90s'
        }
    };

    const { error } = await supabase
        .from('training_methodologies')
        .upsert(superSetUpdate, { onConflict: 'code' });

    if (error) {
        console.error('Error updating methodology SUPER_SET:', error);
    } else {
        console.log('Updated methodology: SUPER_SET');
    }
}

async function run() {
    await updateExercises();
    await updateMethodologies();
    console.log('Done!');
}

run();
