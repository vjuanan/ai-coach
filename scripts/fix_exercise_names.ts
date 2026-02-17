import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false }
});

// ============================================================
// INTELLIGENT EXERCISE KNOWLEDGE BASE
// Maps block names (used in Rutina Antopanti) to their canonical
// exercise library names + all known aliases.
// This uses fitness domain knowledge to identify synonyms across
// English/Spanish and naming variations.
// ============================================================

interface ExerciseMapping {
    canonicalName: string;        // The name that SHOULD be in the exercise library
    allAliases: string[];         // ALL known aliases (including the block name if different)
    category: string;             // Weightlifting | Gymnastics | Monostructural
    equipment: string[];          // Equipment needed
}

// Block names used in the script -> canonical exercise + aliases
const EXERCISE_KNOWLEDGE: Record<string, ExerciseMapping> = {
    // ===== DAY 1: Glúteo & Pierna =====
    'Hip Thrust (barra)': {
        canonicalName: 'Hip Thrust',
        allAliases: ['Hip Thrust con barra', 'Puente de glúteo con barra', 'Hip Thrust (barra)', 'Elevación de cadera'],
        category: 'Weightlifting',
        equipment: ['Barbell', 'Bench'],
    },
    'Deadlift Convencional': {
        canonicalName: 'Deadlift',
        allAliases: ['Peso Muerto', 'Deadlift Convencional', 'Peso Muerto Convencional', 'Peso muerto con barra'],
        category: 'Weightlifting',
        equipment: ['Barbell'],
    },
    '3A. Sentadilla Búlgara': {
        canonicalName: 'Bulgarian Split Squat',
        allAliases: ['Sentadilla Búlgara', 'Sentadilla bulgara', 'Bulgarian Split Squat', '3A. Sentadilla Búlgara', 'Zancada búlgara'],
        category: 'Weightlifting',
        equipment: ['Dumbbells', 'Bench'],
    },
    '3B. Plancha Frontal': {
        canonicalName: 'Plank',
        allAliases: ['Plancha', 'Plancha Frontal', '3B. Plancha Frontal', 'Plancha abdominal', 'Front Plank'],
        category: 'Gymnastics',
        equipment: [],
    },
    'Curl Femoral': {
        canonicalName: 'Leg Curl',
        allAliases: ['Curl Femoral', 'Isquios en máquina', 'Curl femoral con mancuerna', 'Hamstring Curl', 'Curl de pierna'],
        category: 'Weightlifting',
        equipment: ['Machine', 'Dumbbells'],
    },
    'Abducciones Maquina': {
        canonicalName: 'Abduction Machine',
        allAliases: ['Abducciones en máquina', 'Sillón de abductores', 'Abducciones Maquina', 'Hip Abduction Machine', 'Abductora'],
        category: 'Weightlifting',
        equipment: ['Machine'],
    },

    // ===== DAY 2: Upper Body =====
    'Negative Pull-Ups': {
        canonicalName: 'Negative Pull-Up',
        allAliases: ['Dominadas Negativas', 'Negative Pull-Ups', 'Negative Pull-Up', 'Dominadas negativas'],
        category: 'Gymnastics',
        equipment: ['Pull-up Bar'],
    },
    'Pull-Up (Intento)': {
        canonicalName: 'Pull-Up',
        allAliases: ['Dominadas', 'Pull ups', 'Pull-Up', 'Pull-Up (Intento)', 'Dominada estricta'],
        category: 'Gymnastics',
        equipment: ['Pull-up Bar'],
    },
    'Press Plano': {
        canonicalName: 'Bench Press',
        allAliases: ['Press Plano', 'Press plano con barra', 'Press de banca', 'Bench Press', 'Press de pecho'],
        category: 'Weightlifting',
        equipment: ['Barbell', 'Bench'],
    },
    '3A. Remo Unilateral': {
        canonicalName: 'Dumbbell Row',
        allAliases: ['Remo Unilateral', 'Remo con mancuerna', 'Remo unilateral con mancuerna', '3A. Remo Unilateral', 'Dumbbell Row', 'Single Arm Row'],
        category: 'Weightlifting',
        equipment: ['Dumbbells'],
    },
    '3B. Tríceps Trasnuca': {
        canonicalName: 'Tricep Overhead Extension',
        allAliases: ['Tríceps Trasnuca', 'Copa Triceps', '3B. Tríceps Trasnuca', 'Tricep Overhead Extension', 'Extensión de tríceps sobre cabeza', 'French Press'],
        category: 'Weightlifting',
        equipment: ['Dumbbells'],
    },
    'Vuelos Laterales': {
        canonicalName: 'Lateral Raises',
        allAliases: ['Vuelos Laterales', 'Elevaciones Laterales', 'Lateral Raises', 'Elevación lateral con mancuerna'],
        category: 'Weightlifting',
        equipment: ['Dumbbells'],
    },

    // ===== DAY 3: Full Body =====
    'Sentadilla Trasera': {
        canonicalName: 'Back Squat',
        allAliases: ['Sentadilla Trasera', 'Sentadilla con barra', 'Back Squat', 'Sentadilla posterior'],
        category: 'Weightlifting',
        equipment: ['Barbell', 'Rack'],
    },
    '2A. Push-Ups': {
        canonicalName: 'Push-Up',
        allAliases: ['Push-Ups', 'Flexiones de brazos', '2A. Push-Ups', 'Push-Up', 'Lagartijas', 'Flexiones'],
        category: 'Gymnastics',
        equipment: [],
    },
    '2B. Vuelos Posteriores': {
        canonicalName: 'Rear Delt Fly',
        allAliases: ['Vuelos Posteriores', 'Pájaros', '2B. Vuelos Posteriores', 'Rear Delt Fly', 'Elevación posterior'],
        category: 'Weightlifting',
        equipment: ['Dumbbells'],
    },
    '3A. Step-Up Lateral': {
        canonicalName: 'Box Step-Up',
        allAliases: ['Step-Up Lateral', 'Subidas al cajón', '3A. Step-Up Lateral', 'Box Step-Up', 'Step Up'],
        category: 'Weightlifting',
        equipment: ['Box', 'Dumbbells'],
    },
    '3B. Patada Glúteo Polea': {
        canonicalName: 'Cable Glute Kickback',
        allAliases: ['Patada de glúteo en polea', '3B. Patada Glúteo Polea', 'Cable Glute Kickback', 'Kickback de glúteo'],
        category: 'Weightlifting',
        equipment: ['Cable'],
    },

    // ===== DAY 4: Cardio & Tono =====
    'Farmer Carry': {
        canonicalName: 'Farmer Carry',
        allAliases: ['Farmer Carry', 'Caminata de granjero', 'Farmer Walk', 'Paseo del granjero'],
        category: 'Monostructural',
        equipment: ['Kettlebell', 'Dumbbells'],
    },
};

async function fixExercises() {
    console.log('🔍 Step 1: Fetching exercise library and program blocks...\n');

    // Get all exercises from library
    const { data: exercises } = await supabase.from('exercises').select('id, name, aliases, category, equipment');
    const exerciseByName = new Map<string, any>();
    const exerciseByAlias = new Map<string, any>();

    for (const e of (exercises || [])) {
        exerciseByName.set(e.name.toLowerCase(), e);
        // Also index by aliases
        for (const alias of (e.aliases || [])) {
            exerciseByAlias.set(alias.toLowerCase(), e);
        }
    }

    console.log(`📚 Found ${exercises?.length || 0} exercises in library.\n`);

    // Get all blocks from Rutina Antopanti
    const { data: programs } = await supabase.from('programs').select('id').eq('name', 'Rutina Antopanti 2026');
    if (!programs?.length) { console.log('❌ Program not found'); return; }

    const { data: mesos } = await supabase.from('mesocycles').select('id').eq('program_id', programs[0].id);
    const mesoIds = mesos?.map(m => m.id) || [];

    const { data: days } = await supabase.from('days').select('id, name').in('mesocycle_id', mesoIds);
    const dayIds = days?.map(d => d.id) || [];

    const { data: blocks } = await supabase.from('workout_blocks').select('id, name, type').in('day_id', dayIds);

    // Find all unique block names that need checking
    const blockNames = new Set<string>();
    for (const block of (blocks || [])) {
        if (['strength_linear', 'accessory'].includes(block.type) && block.name) {
            blockNames.add(block.name.trim());
        }
    }

    console.log(`📋 Found ${blockNames.size} unique exercise names in program blocks.\n`);

    // ===== Step 2: Intelligent matching =====
    console.log('🧠 Step 2: Intelligent matching...\n');

    let matchedCount = 0;
    let aliasAddedCount = 0;
    let renamedCount = 0;
    let createdCount = 0;

    for (const blockName of Array.from(blockNames)) {
        const lower = blockName.toLowerCase();

        // Case 1: Exact match in library — PERFECT
        if (exerciseByName.has(lower)) {
            console.log(`  ✅ "${blockName}" — exact match found`);
            matchedCount++;
            continue;
        }

        // Case 2: Match via existing alias
        if (exerciseByAlias.has(lower)) {
            const existing = exerciseByAlias.get(lower)!;
            console.log(`  🔗 "${blockName}" — alias match found -> "${existing.name}"`);
            matchedCount++;

            // Rename blocks to use the canonical name
            const { error } = await supabase.from('workout_blocks')
                .update({ name: existing.name })
                .in('day_id', dayIds)
                .eq('name', blockName);
            if (!error) renamedCount++;
            continue;
        }

        // Case 3: Check our knowledge base
        const knowledge = EXERCISE_KNOWLEDGE[blockName];
        if (knowledge) {
            const canonical = knowledge.canonicalName;
            const existingExercise = exerciseByName.get(canonical.toLowerCase());

            if (existingExercise) {
                // Exercise exists under canonical name -> rename blocks + add aliases
                console.log(`  🧠 "${blockName}" -> known as "${canonical}" (exists in library)`);

                // Rename blocks
                const { error: renameErr } = await supabase.from('workout_blocks')
                    .update({ name: canonical })
                    .in('day_id', dayIds)
                    .eq('name', blockName);
                if (!renameErr) renamedCount++;

                // Add aliases
                const currentAliases = existingExercise.aliases || [];
                const newAliases = Array.from(new Set([...currentAliases, ...knowledge.allAliases]));
                if (newAliases.length > currentAliases.length) {
                    await supabase.from('exercises')
                        .update({ aliases: newAliases })
                        .eq('id', existingExercise.id);
                    aliasAddedCount++;
                    console.log(`     ↳ Added ${newAliases.length - currentAliases.length} new aliases`);
                }
            } else {
                // Exercise doesn't exist at all -> create it
                console.log(`  ➕ "${blockName}" -> creating "${canonical}" (new exercise)`);

                const { data: newEx, error: createErr } = await supabase.from('exercises').insert({
                    name: canonical,
                    category: knowledge.category,
                    aliases: knowledge.allAliases,
                    equipment: knowledge.equipment,
                    description: `Imported for Rutina Antopanti 2026`,
                }).select('id').single();

                if (createErr) {
                    console.log(`     ❌ Error creating: ${createErr.message}`);
                } else {
                    createdCount++;
                    // Also put it in our map for subsequent lookups
                    exerciseByName.set(canonical.toLowerCase(), { id: newEx.id, name: canonical, aliases: knowledge.allAliases });

                    // Rename blocks to canonical
                    await supabase.from('workout_blocks')
                        .update({ name: canonical })
                        .in('day_id', dayIds)
                        .eq('name', blockName);
                    renamedCount++;
                }
            }
        } else {
            // Case 4: Unknown exercise, not in our knowledge base
            // Try a fuzzy approach: strip common prefixes like "3A. ", "3B. ", "2A. ", etc.
            const stripped = blockName.replace(/^\d+[A-Za-z]?\.\s*/, '').trim();
            const strippedLower = stripped.toLowerCase();

            if (exerciseByName.has(strippedLower)) {
                const existing = exerciseByName.get(strippedLower)!;
                console.log(`  🔤 "${blockName}" -> stripped prefix -> "${existing.name}"`);

                // Rename blocks
                const { error } = await supabase.from('workout_blocks')
                    .update({ name: existing.name })
                    .in('day_id', dayIds)
                    .eq('name', blockName);
                if (!error) renamedCount++;

                // Add block name as alias
                const currentAliases = existing.aliases || [];
                if (!currentAliases.map((a: string) => a.toLowerCase()).includes(blockName.toLowerCase())) {
                    await supabase.from('exercises')
                        .update({ aliases: [...currentAliases, blockName] })
                        .eq('id', existing.id);
                    aliasAddedCount++;
                }
            } else if (exerciseByAlias.has(strippedLower)) {
                const existing = exerciseByAlias.get(strippedLower)!;
                console.log(`  🔤 "${blockName}" -> stripped alias match -> "${existing.name}"`);

                const { error } = await supabase.from('workout_blocks')
                    .update({ name: existing.name })
                    .in('day_id', dayIds)
                    .eq('name', blockName);
                if (!error) renamedCount++;
            } else {
                console.log(`  ❓ "${blockName}" — UNKNOWN, needs manual creation`);
            }
        }
    }

    console.log('\n========================================');
    console.log(`📊 SUMMARY:`);
    console.log(`   ✅ Already matched: ${matchedCount}`);
    console.log(`   🔄 Blocks renamed: ${renamedCount}`);
    console.log(`   🏷️  Aliases added: ${aliasAddedCount}`);
    console.log(`   ➕ Exercises created: ${createdCount}`);
    console.log('========================================\n');

    // Final verification
    const { data: finalBlocks } = await supabase.from('workout_blocks').select('id, name, type').in('day_id', dayIds);
    const { data: finalExercises } = await supabase.from('exercises').select('id, name, aliases');
    const finalExMap = new Map<string, any>();
    for (const e of (finalExercises || [])) {
        finalExMap.set(e.name.toLowerCase(), e);
    }

    const stillMissing: string[] = [];
    for (const block of (finalBlocks || [])) {
        if (['strength_linear', 'accessory'].includes(block.type) && block.name) {
            if (!finalExMap.has(block.name.toLowerCase())) {
                if (!stillMissing.includes(block.name)) stillMissing.push(block.name);
            }
        }
    }

    if (stillMissing.length > 0) {
        console.log('⚠️  STILL MISSING:');
        for (const name of stillMissing.sort()) {
            console.log(`  ❌ "${name}"`);
        }
    } else {
        console.log('🎉 ALL exercise block names now match exercises in the library!');
    }
}

fixExercises().catch(console.error);
