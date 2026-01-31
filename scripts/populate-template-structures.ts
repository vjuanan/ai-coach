import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';

async function runMigration() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false }
    });

    console.log('🚀 Running template structure migration...');

    console.log('📊 Step 1: Getting template IDs...');

    const { data: templates, error: templatesError } = await supabase
        .from('programs')
        .select('id, name')
        .eq('is_template', true);

    if (templatesError) {
        console.error('Error fetching templates:', templatesError);
        process.exit(1);
    }

    console.log('Found templates:', templates?.map(t => t.name));

    if (!templates || templates.length === 0) {
        console.error('No templates found. Run migration 010 first.');
        process.exit(1);
    }

    const crossfitTemplate = templates.find(t => t.name.includes('CrossFit'));
    const strengthTemplate = templates.find(t => t.name.includes('Fuerza'));
    const hypertrophyTemplate = templates.find(t => t.name.includes('Hipertrofia'));

    if (!crossfitTemplate || !strengthTemplate || !hypertrophyTemplate) {
        console.error('One or more templates not found');
        process.exit(1);
    }

    // Clean existing structure first
    console.log('🧹 Step 2: Cleaning existing structures...');

    for (const template of templates) {
        // Get mesocycles for this template
        const { data: mesos } = await supabase
            .from('mesocycles')
            .select('id')
            .eq('program_id', template.id);

        if (mesos && mesos.length > 0) {
            const mesoIds = mesos.map(m => m.id);

            // Get days
            const { data: days } = await supabase
                .from('days')
                .select('id')
                .in('mesocycle_id', mesoIds);

            if (days && days.length > 0) {
                const dayIds = days.map(d => d.id);

                // Delete blocks
                await supabase.from('workout_blocks').delete().in('day_id', dayIds);
            }

            // Delete days
            await supabase.from('days').delete().in('mesocycle_id', mesoIds);

            // Delete mesocycles
            await supabase.from('mesocycles').delete().eq('program_id', template.id);
        }
    }

    console.log('✅ Cleaned existing structures');

    // Now create new structures
    console.log('🏋️ Step 3: Creating CrossFit template structure (4 weeks)...');
    await createCrossFitStructure(supabase, crossfitTemplate.id);

    console.log('💪 Step 4: Creating Strength template structure (6 weeks)...');
    await createStrengthStructure(supabase, strengthTemplate.id);

    console.log('🎯 Step 5: Creating Hypertrophy template structure (5 weeks)...');
    await createHypertrophyStructure(supabase, hypertrophyTemplate.id);

    console.log('🎉 Migration complete!');
}

async function createCrossFitStructure(supabase: any, templateId: string) {
    for (let week = 1; week <= 4; week++) {
        // Create mesocycle
        const { data: meso, error: mesoError } = await supabase
            .from('mesocycles')
            .insert({
                program_id: templateId,
                week_number: week,
                focus: week === 4 ? 'Deload' : week === 1 ? 'Accumulation' : week === 2 ? 'Intensification' : 'Realization',
                attributes: {
                    methodology: 'Andy Galpin',
                    volume_factor: week === 4 ? 0.5 : 0.75 + (week * 0.08)
                }
            })
            .select()
            .single();

        if (mesoError) throw mesoError;

        // Day 1: Strength Lower
        const { data: day1 } = await supabase.from('days').insert({
            mesocycle_id: meso.id, day_number: 1, name: 'Strength - Lower', is_rest_day: false,
            notes: 'Protocolo 3-5: Enfoque en fuerza máxima'
        }).select().single();

        await supabase.from('workout_blocks').insert([
            { day_id: day1.id, order_index: 1, type: 'warmup', format: 'time', name: 'Warm-up', config: { duration_minutes: 10, description: 'Movilidad de caderas, activación glúteos, remo ligero' } },
            { day_id: day1.id, order_index: 2, type: 'strength', format: 'sets_reps', name: 'Back Squat (3-5 Protocol)', config: { sets: 5, reps: '3-5', rest_seconds: 180, intensity: '85-90%' } },
            { day_id: day1.id, order_index: 3, type: 'strength', format: 'sets_reps', name: 'Romanian Deadlift', config: { sets: 4, reps: '6-8', rest_seconds: 120 } },
            { day_id: day1.id, order_index: 4, type: 'conditioning', format: 'amrap', name: 'Short Metcon', config: { duration_minutes: 8, movements: ['KB Swings x15', 'Box Jumps x10', 'Push-ups x15'] } }
        ]);

        // Day 2: Power + Skill
        const { data: day2 } = await supabase.from('days').insert({
            mesocycle_id: meso.id, day_number: 2, name: 'Power + Skill', is_rest_day: false,
            notes: 'Trabajo técnico olímpico y potencia'
        }).select().single();

        await supabase.from('workout_blocks').insert([
            { day_id: day2.id, order_index: 1, type: 'warmup', format: 'time', name: 'Barbell Warm-up', config: { duration_minutes: 12, description: 'Progresión con barra vacía' } },
            { day_id: day2.id, order_index: 2, type: 'skill', format: 'emom', name: 'Snatch Skill', config: { duration_minutes: 12, description: 'EMOM: 2 Power Snatch @ 70%' } },
            { day_id: day2.id, order_index: 3, type: 'strength', format: 'complex', name: 'Power Complex', config: { sets: 4, description: '1 Power Clean + 1 Front Squat + 1 Push Jerk' } },
            { day_id: day2.id, order_index: 4, type: 'skill', format: 'practice', name: 'Gymnastics Skill', config: { duration_minutes: 10, description: 'Kipping pull-ups / Muscle-up progressions' } }
        ]);

        // Day 3: Rest
        await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 3, name: 'Descanso Activo', is_rest_day: true, notes: 'Movilidad ligera' });

        // Day 4: Conditioning
        const { data: day4 } = await supabase.from('days').insert({
            mesocycle_id: meso.id, day_number: 4, name: 'Conditioning', is_rest_day: false,
            notes: 'Día de metcon largo'
        }).select().single();

        await supabase.from('workout_blocks').insert([
            { day_id: day4.id, order_index: 1, type: 'warmup', format: 'time', name: 'Cardio Warm-up', config: { duration_minutes: 8, description: 'Remo 500m + movilidad' } },
            { day_id: day4.id, order_index: 2, type: 'conditioning', format: 'amrap', name: 'Main Metcon', config: { duration_minutes: 20, movements: ['Run 200m', '15 Wall Balls', '10 Toes to Bar', '5 Burpees'] } },
            { day_id: day4.id, order_index: 3, type: 'accessory', format: 'sets_reps', name: 'Core Finisher', config: { sets: 3, description: '20 GHD Sit-ups + 30s Hollow Hold' } }
        ]);

        // Day 5: Strength Upper
        const { data: day5 } = await supabase.from('days').insert({
            mesocycle_id: meso.id, day_number: 5, name: 'Strength - Upper', is_rest_day: false,
            notes: 'Protocolo 3-5: Empuje y tracción'
        }).select().single();

        await supabase.from('workout_blocks').insert([
            { day_id: day5.id, order_index: 1, type: 'warmup', format: 'time', name: 'Upper Warm-up', config: { duration_minutes: 8 } },
            { day_id: day5.id, order_index: 2, type: 'strength', format: 'sets_reps', name: 'Strict Press (3-5 Protocol)', config: { sets: 5, reps: '3-5', rest_seconds: 180, intensity: '80-85%' } },
            { day_id: day5.id, order_index: 3, type: 'strength', format: 'sets_reps', name: 'Weighted Pull-ups', config: { sets: 4, reps: '4-6', rest_seconds: 150 } },
            { day_id: day5.id, order_index: 4, type: 'conditioning', format: 'for_time', name: 'Short Burner', config: { movements: ['21-15-9 Thrusters + Pull-ups'], time_cap_minutes: 10 } }
        ]);

        // Day 6: Hybrid
        const { data: day6 } = await supabase.from('days').insert({
            mesocycle_id: meso.id, day_number: 6, name: 'Hybrid Training', is_rest_day: false,
            notes: 'Combinación potencia + resistencia'
        }).select().single();

        await supabase.from('workout_blocks').insert([
            { day_id: day6.id, order_index: 1, type: 'warmup', format: 'time', name: 'Dynamic Warm-up', config: { duration_minutes: 10 } },
            { day_id: day6.id, order_index: 2, type: 'strength', format: 'complex', name: 'Barbell Complex', config: { sets: 4, description: '5 Deadlifts + 5 Hang Cleans + 5 Front Squats + 5 Push Press' } },
            { day_id: day6.id, order_index: 3, type: 'conditioning', format: 'intervals', name: 'Mixed Modal', config: { rounds: 5, work_seconds: 90, rest_seconds: 90 } }
        ]);

        // Day 7: Rest
        await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 7, name: 'Descanso', is_rest_day: true, notes: 'Recuperación completa' });
    }
    console.log('   ✅ CrossFit template structure created');
}

async function createStrengthStructure(supabase: any, templateId: string) {
    for (let week = 1; week <= 6; week++) {
        const rir = week === 1 ? 3 : week === 2 ? 3 : week === 3 ? 2 : week === 4 ? 2 : week === 5 ? 1 : 4;

        const { data: meso } = await supabase
            .from('mesocycles')
            .insert({
                program_id: templateId,
                week_number: week,
                focus: week === 6 ? 'Deload' : week <= 2 ? 'Accumulation (MEV)' : week <= 4 ? 'Intensification (MAV)' : 'Realization (MRV)',
                attributes: { methodology: 'Mike Israetel', RIR: rir }
            })
            .select().single();

        // Day 1: Lower Squat
        const { data: day1 } = await supabase.from('days').insert({
            mesocycle_id: meso.id, day_number: 1, name: 'Lower - Squat Focus', is_rest_day: false,
            notes: 'Fuerza máxima tren inferior'
        }).select().single();

        await supabase.from('workout_blocks').insert([
            { day_id: day1.id, order_index: 1, type: 'warmup', format: 'time', name: 'Lower Warm-up', config: { duration_minutes: 10 } },
            { day_id: day1.id, order_index: 2, type: 'strength', format: 'sets_reps', name: 'Back Squat', config: { sets: 4, reps: '4-6', rest_seconds: 180, intensity: '80-85%' } },
            { day_id: day1.id, order_index: 3, type: 'strength', format: 'sets_reps', name: 'Romanian Deadlift', config: { sets: 3, reps: '8-10', rest_seconds: 120 } },
            { day_id: day1.id, order_index: 4, type: 'strength', format: 'sets_reps', name: 'Leg Press', config: { sets: 3, reps: '10-12', rest_seconds: 90 } },
            { day_id: day1.id, order_index: 5, type: 'accessory', format: 'sets_reps', name: 'Leg Curl', config: { sets: 3, reps: '12-15', rest_seconds: 60 } }
        ]);

        // Day 2: Upper Push
        const { data: day2 } = await supabase.from('days').insert({
            mesocycle_id: meso.id, day_number: 2, name: 'Upper - Push Focus', is_rest_day: false,
            notes: 'Fuerza máxima empuje'
        }).select().single();

        await supabase.from('workout_blocks').insert([
            { day_id: day2.id, order_index: 1, type: 'warmup', format: 'time', name: 'Upper Warm-up', config: { duration_minutes: 8 } },
            { day_id: day2.id, order_index: 2, type: 'strength', format: 'sets_reps', name: 'Bench Press', config: { sets: 4, reps: '4-6', rest_seconds: 180, intensity: '80-85%' } },
            { day_id: day2.id, order_index: 3, type: 'strength', format: 'sets_reps', name: 'Barbell Row', config: { sets: 4, reps: '6-8', rest_seconds: 150 } },
            { day_id: day2.id, order_index: 4, type: 'strength', format: 'sets_reps', name: 'Overhead Press', config: { sets: 3, reps: '6-8', rest_seconds: 120 } },
            { day_id: day2.id, order_index: 5, type: 'accessory', format: 'sets_reps', name: 'Tricep Dips', config: { sets: 3, reps: '8-12', rest_seconds: 90 } }
        ]);

        // Day 3: Rest
        await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 3, name: 'Descanso', is_rest_day: true });

        // Day 4: Lower Deadlift
        const { data: day4 } = await supabase.from('days').insert({
            mesocycle_id: meso.id, day_number: 4, name: 'Lower - Deadlift Focus', is_rest_day: false,
            notes: 'Potencia tren inferior'
        }).select().single();

        await supabase.from('workout_blocks').insert([
            { day_id: day4.id, order_index: 1, type: 'warmup', format: 'time', name: 'Deadlift Warm-up', config: { duration_minutes: 10 } },
            { day_id: day4.id, order_index: 2, type: 'strength', format: 'sets_reps', name: 'Conventional Deadlift', config: { sets: 4, reps: '3-5', rest_seconds: 240, intensity: '82-88%' } },
            { day_id: day4.id, order_index: 3, type: 'strength', format: 'sets_reps', name: 'Front Squat', config: { sets: 3, reps: '6-8', rest_seconds: 150 } },
            { day_id: day4.id, order_index: 4, type: 'strength', format: 'sets_reps', name: 'Walking Lunges', config: { sets: 3, reps: '10 each leg', rest_seconds: 90 } },
            { day_id: day4.id, order_index: 5, type: 'accessory', format: 'sets_reps', name: 'Calf Raises', config: { sets: 4, reps: '15-20', rest_seconds: 60 } }
        ]);

        // Day 5: Upper Pull
        const { data: day5 } = await supabase.from('days').insert({
            mesocycle_id: meso.id, day_number: 5, name: 'Upper - Pull Focus', is_rest_day: false,
            notes: 'Volumen espalda'
        }).select().single();

        await supabase.from('workout_blocks').insert([
            { day_id: day5.id, order_index: 1, type: 'warmup', format: 'time', name: 'Pull Warm-up', config: { duration_minutes: 8 } },
            { day_id: day5.id, order_index: 2, type: 'strength', format: 'sets_reps', name: 'Weighted Pull-ups', config: { sets: 4, reps: '6-8', rest_seconds: 150 } },
            { day_id: day5.id, order_index: 3, type: 'strength', format: 'sets_reps', name: 'Incline Dumbbell Press', config: { sets: 3, reps: '8-10', rest_seconds: 120 } },
            { day_id: day5.id, order_index: 4, type: 'strength', format: 'sets_reps', name: 'Cable Row', config: { sets: 3, reps: '10-12', rest_seconds: 90 } },
            { day_id: day5.id, order_index: 5, type: 'accessory', format: 'sets_reps', name: 'Bicep Curls + Face Pulls', config: { sets: 3, reps: '12-15 each', rest_seconds: 60 } }
        ]);

        // Days 6-7: Rest
        await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 6, name: 'Descanso', is_rest_day: true });
        await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 7, name: 'Descanso', is_rest_day: true });
    }
    console.log('   ✅ Strength template structure created');
}

async function createHypertrophyStructure(supabase: any, templateId: string) {
    for (let week = 1; week <= 5; week++) {
        const rir = week === 1 ? 4 : week === 2 ? 3 : week === 3 ? 2 : week === 4 ? 1 : 4;

        const { data: meso } = await supabase
            .from('mesocycles')
            .insert({
                program_id: templateId,
                week_number: week,
                focus: week === 5 ? 'Deload' : week === 1 ? 'MEV (Baseline)' : week === 2 ? 'MEV+2' : week === 3 ? 'MAV' : 'Near MRV',
                attributes: { methodology: 'Mike Israetel RP', RIR: rir }
            })
            .select().single();

        // Day 1: Push
        const { data: day1 } = await supabase.from('days').insert({
            mesocycle_id: meso.id, day_number: 1, name: 'Push Day', is_rest_day: false,
            notes: 'Pecho, hombros, tríceps'
        }).select().single();

        await supabase.from('workout_blocks').insert([
            { day_id: day1.id, order_index: 1, type: 'warmup', format: 'time', name: 'Push Warm-up', config: { duration_minutes: 8 } },
            { day_id: day1.id, order_index: 2, type: 'strength', format: 'sets_reps', name: 'Flat Dumbbell Press', config: { sets: 4, reps: '8-12', rest_seconds: 120 } },
            { day_id: day1.id, order_index: 3, type: 'strength', format: 'sets_reps', name: 'Incline Machine Press', config: { sets: 3, reps: '10-12', rest_seconds: 90 } },
            { day_id: day1.id, order_index: 4, type: 'strength', format: 'sets_reps', name: 'Lateral Raises', config: { sets: 4, reps: '12-15', rest_seconds: 60 } },
            { day_id: day1.id, order_index: 5, type: 'accessory', format: 'sets_reps', name: 'Cable Flyes', config: { sets: 3, reps: '12-15', rest_seconds: 60 } },
            { day_id: day1.id, order_index: 6, type: 'accessory', format: 'sets_reps', name: 'Tricep Pushdowns', config: { sets: 3, reps: '12-15', rest_seconds: 60 } }
        ]);

        // Day 2: Pull
        const { data: day2 } = await supabase.from('days').insert({
            mesocycle_id: meso.id, day_number: 2, name: 'Pull Day', is_rest_day: false,
            notes: 'Espalda, bíceps'
        }).select().single();

        await supabase.from('workout_blocks').insert([
            { day_id: day2.id, order_index: 1, type: 'warmup', format: 'time', name: 'Pull Warm-up', config: { duration_minutes: 8 } },
            { day_id: day2.id, order_index: 2, type: 'strength', format: 'sets_reps', name: 'Lat Pulldown', config: { sets: 4, reps: '8-12', rest_seconds: 120 } },
            { day_id: day2.id, order_index: 3, type: 'strength', format: 'sets_reps', name: 'Cable Row', config: { sets: 4, reps: '10-12', rest_seconds: 90 } },
            { day_id: day2.id, order_index: 4, type: 'strength', format: 'sets_reps', name: 'Chest-Supported Row', config: { sets: 3, reps: '10-12', rest_seconds: 90 } },
            { day_id: day2.id, order_index: 5, type: 'accessory', format: 'sets_reps', name: 'Rear Delt Flyes', config: { sets: 3, reps: '15-20', rest_seconds: 60 } },
            { day_id: day2.id, order_index: 6, type: 'accessory', format: 'sets_reps', name: 'Hammer Curls', config: { sets: 3, reps: '10-12', rest_seconds: 60 } }
        ]);

        // Day 3: Legs
        const { data: day3 } = await supabase.from('days').insert({
            mesocycle_id: meso.id, day_number: 3, name: 'Leg Day', is_rest_day: false,
            notes: 'Cuádriceps, isquios, glúteos'
        }).select().single();

        await supabase.from('workout_blocks').insert([
            { day_id: day3.id, order_index: 1, type: 'warmup', format: 'time', name: 'Leg Warm-up', config: { duration_minutes: 10 } },
            { day_id: day3.id, order_index: 2, type: 'strength', format: 'sets_reps', name: 'Hack Squat', config: { sets: 4, reps: '8-12', rest_seconds: 150 } },
            { day_id: day3.id, order_index: 3, type: 'strength', format: 'sets_reps', name: 'Romanian Deadlift', config: { sets: 4, reps: '10-12', rest_seconds: 120 } },
            { day_id: day3.id, order_index: 4, type: 'strength', format: 'sets_reps', name: 'Leg Extension', config: { sets: 3, reps: '12-15', rest_seconds: 60 } },
            { day_id: day3.id, order_index: 5, type: 'strength', format: 'sets_reps', name: 'Lying Leg Curl', config: { sets: 3, reps: '12-15', rest_seconds: 60 } },
            { day_id: day3.id, order_index: 6, type: 'accessory', format: 'sets_reps', name: 'Standing Calf Raises', config: { sets: 4, reps: '15-20', rest_seconds: 45 } }
        ]);

        // Day 4: Upper Accessories
        const { data: day4 } = await supabase.from('days').insert({
            mesocycle_id: meso.id, day_number: 4, name: 'Upper Accessories', is_rest_day: false,
            notes: 'Volumen adicional upper body'
        }).select().single();

        await supabase.from('workout_blocks').insert([
            { day_id: day4.id, order_index: 1, type: 'warmup', format: 'time', name: 'Upper Warm-up', config: { duration_minutes: 6 } },
            { day_id: day4.id, order_index: 2, type: 'strength', format: 'sets_reps', name: 'Dips', config: { sets: 3, reps: '8-12', rest_seconds: 90 } },
            { day_id: day4.id, order_index: 3, type: 'strength', format: 'sets_reps', name: 'Pull-ups', config: { sets: 3, reps: '8-12', rest_seconds: 90 } },
            { day_id: day4.id, order_index: 4, type: 'strength', format: 'sets_reps', name: 'Dumbbell Shoulder Press', config: { sets: 3, reps: '10-12', rest_seconds: 90 } },
            { day_id: day4.id, order_index: 5, type: 'accessory', format: 'sets_reps', name: 'Incline Curls + Overhead Extension', config: { sets: 3, reps: '12-15 each', rest_seconds: 60 } }
        ]);

        // Day 5: Lower Volume
        const { data: day5 } = await supabase.from('days').insert({
            mesocycle_id: meso.id, day_number: 5, name: 'Lower Volume', is_rest_day: false,
            notes: 'Volumen adicional piernas'
        }).select().single();

        await supabase.from('workout_blocks').insert([
            { day_id: day5.id, order_index: 1, type: 'warmup', format: 'time', name: 'Lower Warm-up', config: { duration_minutes: 8 } },
            { day_id: day5.id, order_index: 2, type: 'strength', format: 'sets_reps', name: 'Leg Press', config: { sets: 4, reps: '10-15', rest_seconds: 120 } },
            { day_id: day5.id, order_index: 3, type: 'strength', format: 'sets_reps', name: 'Walking Lunges', config: { sets: 3, reps: '12 each leg', rest_seconds: 90 } },
            { day_id: day5.id, order_index: 4, type: 'strength', format: 'sets_reps', name: 'Seated Leg Curl', config: { sets: 3, reps: '12-15', rest_seconds: 60 } },
            { day_id: day5.id, order_index: 5, type: 'strength', format: 'sets_reps', name: 'Hip Thrust', config: { sets: 3, reps: '12-15', rest_seconds: 90 } },
            { day_id: day5.id, order_index: 6, type: 'accessory', format: 'sets_reps', name: 'Seated Calf Raises', config: { sets: 4, reps: '15-20', rest_seconds: 45 } }
        ]);

        // Days 6-7: Rest
        await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 6, name: 'Descanso', is_rest_day: true });
        await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 7, name: 'Descanso', is_rest_day: true });
    }
    console.log('   ✅ Hypertrophy template structure created');
}

runMigration().catch(console.error);
