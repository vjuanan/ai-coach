
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const exercisesToAdd = [
    // MONOSTRUCTURAL
    {
        name: 'Correr',
        category: 'Monostructural',
        subcategory: 'Running',
        modality_suitability: ['good_for_amrap', 'good_for_chipper', 'good_for_warmup'],
        equipment: [],
        description: 'Carrera de media o larga distancia'
    },
    {
        name: 'Nadar',
        category: 'Monostructural',
        subcategory: 'Swimming',
        modality_suitability: ['good_for_chipper', 'good_for_aerobic'],
        equipment: ['Pool'],
        description: 'Estilo libre u otros'
    },
    {
        name: 'Remo',
        category: 'Monostructural',
        subcategory: 'Machine',
        modality_suitability: ['good_for_emom', 'good_for_amrap', 'good_for_chipper'],
        equipment: ['Rower'],
        description: 'Remo en ergómetro Concept2'
    },
    {
        name: 'SkiErg',
        category: 'Monostructural',
        subcategory: 'Machine',
        modality_suitability: ['good_for_emom', 'good_for_amrap', 'good_for_chipper'],
        equipment: ['SkiErg'],
        description: 'Ergómetro de esquí'
    },
    {
        name: 'Assault Bike',
        category: 'Monostructural',
        subcategory: 'Machine',
        modality_suitability: ['good_for_emom', 'good_for_amrap', 'good_for_tabata'],
        equipment: ['Assault Bike'],
        description: 'Bicicleta de aire de alta intensidad'
    },
    {
        name: 'BikeErg',
        category: 'Monostructural',
        subcategory: 'Machine',
        modality_suitability: ['good_for_emom', 'good_for_amrap', 'good_for_endurance'],
        equipment: ['BikeErg'],
        description: 'Bicicleta ergométrica Concept2'
    },
    {
        name: 'Dobles de Soga',
        category: 'Monostructural',
        subcategory: 'Jump Rope',
        modality_suitability: ['good_for_emom', 'good_for_amrap', 'good_for_chipper'],
        equipment: ['Jump Rope'],
        description: 'Saltos dobles de comba (Double Unders)'
    },
    {
        name: 'Simples de Soga',
        category: 'Monostructural',
        subcategory: 'Jump Rope',
        modality_suitability: ['good_for_emom', 'good_for_amrap', 'good_for_warmup'],
        equipment: ['Jump Rope'],
        description: 'Saltos simples de comba (Single Unders)'
    },
    {
        name: 'Caminata (Run)',
        category: 'Monostructural',
        subcategory: 'Running',
        modality_suitability: ['good_for_warmup', 'good_for_recovery'],
        equipment: [],
        description: 'Caminata a paso ligero'
    },

    // WEIGHTLIFTING / STRENGTH / STRONGMAN
    {
        name: 'Trineo: Empuje',
        category: 'Functional Bodybuilding',
        subcategory: 'Conditioning',
        modality_suitability: ['good_for_chipper', 'good_for_accessory', 'good_for_amrap'],
        equipment: ['Sled'],
        description: 'Empuje de trineo (Sled Push)'
    },
    {
        name: 'Trineo: Arrastre',
        category: 'Functional Bodybuilding',
        subcategory: 'Conditioning',
        modality_suitability: ['good_for_chipper', 'good_for_accessory'],
        equipment: ['Sled', 'Rope'],
        description: 'Arrastre de trineo (Sled Pull)'
    },
    {
        name: 'Farmers Carry',
        category: 'Functional Bodybuilding',
        subcategory: 'Carry',
        modality_suitability: ['good_for_chipper', 'good_for_accessory'],
        equipment: ['Dumbbells', 'Kettlebells'],
        description: 'Caminata con carga en ambas manos'
    },
    {
        name: 'Sandbag Carry',
        category: 'Functional Bodybuilding',
        subcategory: 'Carry',
        modality_suitability: ['good_for_chipper', 'good_for_amrap'],
        equipment: ['Sandbag'],
        description: 'Caminata cargando saco de arena'
    },
    {
        name: 'Yoke Carry',
        category: 'Weightlifting',
        subcategory: 'Strongman',
        modality_suitability: ['strength_only', 'good_for_chipper'],
        equipment: ['Yoke'],
        description: 'Caminata con Yugo'
    },

    // GYMNASTICS
    {
        name: 'Trepar la Soga',
        category: 'Gymnastics',
        subcategory: 'Climbing',
        modality_suitability: ['good_for_chipper', 'good_for_amrap'],
        equipment: ['Rope'],
        description: 'Subir la soga (Rope Climb)'
    },
    {
        name: 'Caminata de Manos',
        category: 'Gymnastics',
        subcategory: 'Balance',
        modality_suitability: ['good_for_chipper', 'good_for_amrap'],
        equipment: [],
        description: 'Caminar sobre las manos (Handstand Walk)'
    },
    {
        name: 'Wall Walk',
        category: 'Gymnastics',
        subcategory: 'Core',
        modality_suitability: ['good_for_emom', 'good_for_amrap'],
        equipment: ['Wall'],
        description: 'Caminata hacia la pared en posición de pino'
    }
];

async function addExercises() {
    console.log(`Attempting to add ${exercisesToAdd.length} exercises...`);

    // Use upsert or insert with ignoreDuplicates
    const { data, error } = await supabase
        .from('exercises')
        .upsert(exercisesToAdd, { onConflict: 'name', ignoreDuplicates: true })
        .select();

    if (error) {
        console.error('Error adding exercises:', error);
    } else {
        console.log('Exercises processed successfully.');
        if (data && data.length > 0) {
            console.log(`Inserted ${data.length} new exercises.`);
        } else {
            console.log('No new exercises inserted (duplicates ignored).');
        }
    }
}

addExercises();
