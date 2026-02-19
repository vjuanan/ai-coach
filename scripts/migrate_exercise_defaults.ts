
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('Starting migration...');

    // 1. Fetch all exercises
    const { data: exercises, error } = await supabase.from('exercises').select('*');
    if (error) {
        console.error('Error fetching exercises:', error);
        return;
    }

    console.log(`Found ${exercises.length} exercises. Updating defaults...`);

    let updatedCount = 0;

    for (const exercise of exercises) {
        const tp = exercise.tracking_parameters || {};

        // Logic for Defaults
        // User wants: Series, Reps, Peso, Distancia to be "shown" (default options).
        // But we need safe defaults for usage.
        // Monostructural/Conditioning -> Distance=True
        // Others -> Distance=False (default) -- BUT user said "TODOS... Distancia". 
        // If I enable distance for all, UI might force distance input.
        // Let's look at BlockEditor logic:
        // showDistance = exercise?.tracking_parameters?.distance === true;
        // InputCard is: showDistance ? DistanceInput : RepsInput.
        // So we CANNOT enable Distance for non-cardio exercises or we lose Reps input.
        // UNLESS the user wants to *Edit* it.
        // The Modal defaults I wrote in React handle the "Edit" view.
        // This script updates the DB.
        // I should only update where it is NULL, or specific fixes.

        // Fix Sprints specifically
        const isSprint = exercise.name.toLowerCase().includes('sprint');

        if (isSprint) {
            // Sprints need Distance
            const newTp = {
                sets: true,
                distance: true,
                time: true,
                weight: false, // Sprints usually bodyweight
                reps: false
            };

            await supabase.from('exercises').update({ tracking_parameters: newTp }).eq('id', exercise.id);
            console.log(`Updated Sprint: ${exercise.name}`);
            updatedCount++;
            continue;
        }

        // For others, if tracking_parameters is null, set a safe default?
        // User said "Corregi esto en todos".
        // If I set "Sets=true" for everyone, that's good.
        // I should NOT set Distance=true for Squat.

        if (!exercise.tracking_parameters) {
            const isCardio = exercise.category === 'Monostructural' || exercise.category === 'Conditioning';
            const newTp = {
                sets: true,
                distance: isCardio,
                time: isCardio,
                weight: !isCardio,
                reps: !isCardio
            };

            await supabase.from('exercises').update({ tracking_parameters: newTp }).eq('id', exercise.id);
            updatedCount++;
        } else {
            // Ensure 'sets' is set if missing
            if (tp.sets === undefined) {
                const newTp = { ...tp, sets: true };
                await supabase.from('exercises').update({ tracking_parameters: newTp }).eq('id', exercise.id);
                updatedCount++;
            }
        }
    }

    console.log(`Migration complete. Updated ${updatedCount} exercises.`);
}

migrate();
