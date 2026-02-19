
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

/**
 * Migration Script: Populate descriptions with cues from Antopanti program
 * 
 * PIVOT: Using `description` column instead of `cue` column to avoid schema migration blockers.
 * 
 * This script:
 * 1. Extract cues from Antopanti program blocks.
 * 2. Updates `exercises.description` with these cues.
 * 3. Strips "Cue:" prefixed text from config.notes in workout_blocks.
 */

// Exercise → Cue mapping (extracted from create_rutina_antopanti.ts)
const EXERCISE_CUES: Record<string, string> = {
    // Warmup exercises (from ACTIVATION blocks)
    'Plank': 'abdomen duro, glúteos apretados, cuerpo en línea',
    'Glute Bridge': 'empujá con talones, arriba apretá 1s',
    'Bird Dog': 'espalda neutra, no rote cadera',
    'Air Squat': 'rodillas siguen línea de pies',
    'Scapular Push-Up': 'brazos estirados, movés solo escápulas',
    'Cat-Cow': 'movilidad suave',
    'Dead Hang': 'hombros abajo',
    'Lunge with Rotation': 'rotá desde columna torácica',
    'Prone Y-T-W': 'hombros lejos de orejas',
    'Good Morning': 'bisagra de cadera',
    'Sprawl': 'rápido pero prolijo',
    'Jump Squat': 'aterrizá suave',
    'Knees to Chest': 'no balancees, subí con abdomen',

    // Main lifts (from strength blocks config.notes)
    'Hip Thrust': 'mirada al frente, mentón levemente hacia el pecho, costillas "abajo", empujá con talones, arriba apretá glúteos sin hiperextender lumbar',
    'Deadlift': 'barra pegada a tibias, pecho "orgulloso", espalda neutra, empujá el piso, cerrá con glúteos',
    'Bulgarian Split Squat': 'incliná levemente el tronco hacia adelante para foco en glúteo',
    'Leg Curl': 'bajá lento',
    'Abduction Machine': 'empujá desde las rodillas, no rebotes',
    'Pull-Up': 'arrancá con escápulas abajo',
    'Negative Pull-Up': 'subí con ayuda, bajá lento control total',
    'Bench Press': 'escápulas juntas y abajo, pies firmes, bajá a línea del pecho',
    'Dumbbell Row': 'tirá el codo al bolsillo',
    'Tricep Overhead Extension': 'codos cerrados',
    'Lateral Raises': 'sube el codo, no la mano',
    'Back Squat': 'aire a la panza, rodillas afuera',
    'Push-Up': 'cuerpo en tabla',
    'Rear Delt Fly': 'abrí como alas',
    'Box Step-Up': 'empujá con pierna de arriba',
    'Cable Glute Kickback': 'pelvis quieta, apretá glúteo',
    'Kettlebell Swing': 'bisagra, cadera dispara',
    'Farmer Carry': 'hombros abajo, postura alta',
    'Sprint': 'sprint al 90-95%, descanso suave',
    'Run (Zone 2)': 'podés hablar frases cortas sin ahogarte',

    // Synonyms / Handling duplicates in DB
    'Push-up': 'cuerpo en tabla',
    'Pull-up (Strict)': 'arrancá con escápulas abajo'
};

async function run() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing env vars');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false }
    });

    console.log('🔧 Step 1: Using existing `description` column for cues (No schema change needed).');

    console.log('\n🏋️ Step 2: Populating descriptions for exercises...');

    let updated = 0;
    let skipped = 0;

    for (const [exerciseName, cue] of Object.entries(EXERCISE_CUES)) {
        // Try exact match first
        let { data: exercises, error: qError } = await supabase
            .from('exercises')
            .select('id, name, description')
            .eq('name', exerciseName);

        if (qError) console.log(`   ❌ Query error for ${exerciseName}:`, qError.message);

        if (!exercises || exercises.length === 0) {
            // Try case-insensitive
            const { data: ilikeExercises } = await supabase
                .from('exercises')
                .select('id, name, description')
                .ilike('name', exerciseName);

            exercises = ilikeExercises;
        }

        if (!exercises || exercises.length === 0) {
            // Try aliases
            const { data: byAlias } = await supabase
                .from('exercises')
                .select('id, name, description')
                .contains('aliases', [exerciseName]);

            exercises = byAlias;
        }


        if (!exercises || exercises.length === 0) {
            console.log(`   ⏭️ Exercise "${exerciseName}" not found in library. Skipping.`);
            skipped++;
            continue;
        }

        for (const ex of exercises) {
            // Overwrite description with cue
            const { error } = await supabase.from('exercises')
                .update({ description: cue })
                .eq('id', ex.id);

            if (!error) {
                console.log(`   ✅ ${ex.name} → "${cue.substring(0, 50)}${cue.length > 50 ? '...' : ''}"`);
                updated++;
            } else {
                console.log(`   ❌ Failed to update ${ex.name}: ${error.message}`);
            }
        }
    }

    console.log(`\n📊 Results: ${updated} updated, ${skipped} skipped`);

    console.log('\n🧹 Step 3: Cleaning cue text from config.notes in workout_blocks...');

    // Get all workout_blocks that have notes containing "Cue:"
    const { data: blocks } = await supabase
        .from('workout_blocks')
        .select('id, config, name, type');

    if (!blocks) {
        console.log('   No blocks found.');
    } else {
        let cleanedCount = 0;
        for (const block of blocks) {
            const config = block.config as any;
            if (!config?.notes || typeof config.notes !== 'string') continue;

            const notes = config.notes as string;
            const cuePattern = /\s*(?:\.?\s*)?Cue:\s*.+$/i;
            if (!cuePattern.test(notes)) continue;

            const cleanedNotes = notes.replace(cuePattern, '').trim();
            const finalNotes = cleanedNotes || '';

            if (finalNotes !== notes) {
                const { error } = await supabase
                    .from('workout_blocks')
                    .update({ config: { ...config, notes: finalNotes } })
                    .eq('id', block.id);

                if (!error) {
                    cleanedCount++;
                    if (cleanedCount <= 10) { // Limit log output
                        console.log(`   🧹 ${block.name || block.type}: "${notes.substring(0, 40)}..." → "${finalNotes.substring(0, 40) || '(empty)'}"`);
                    }
                }
            }
        }
        console.log(`   ✅ Cleaned ${cleanedCount} blocks.`);
    }

    console.log('\n✅ Migration complete!');
}

run().catch(console.error);
