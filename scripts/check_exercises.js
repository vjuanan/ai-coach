
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExercises() {
    const exercisesToCheck = ['Correr', 'Nadar', 'Remo', 'Bici', 'Run', 'Swim', 'Row', 'Bike'];

    console.log('Checking for exercises:', exercisesToCheck);

    const { data, error } = await supabase
        .from('exercises')
        .select('id, name, tracking_parameters')
        .in('name', exercisesToCheck);

    if (error) {
        console.error('Error fetching exercises:', error);
        return;
    }

    console.log('Found exercises:', data);

    const foundNames = data.map(e => e.name);
    const missing = exercisesToCheck.filter(name => !foundNames.includes(name));

    console.log('Missing exercises:', missing);
}

checkExercises();
