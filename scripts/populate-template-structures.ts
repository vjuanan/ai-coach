import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

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

    console.log('🚀 Running template structure migration (Fixed Enums)...');

    console.log('📊 Step 1: Getting template IDs...');

    const { data: templates, error: templatesError } = await supabase
        .from('programs')
        .select('id, name')
        .eq('is_template', true);

    if (templatesError) {
        console.error('Error fetching templates:', templatesError);
        process.exit(1);
    }

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
        const { data: mesos } = await supabase.from('mesocycles').select('id').eq('program_id', template.id);
        if (mesos && mesos.length > 0) {
            const mesoIds = mesos.map(m => m.id);
            const { data: days } = await supabase.from('days').select('id').in('mesocycle_id', mesoIds);
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

    // Helper to insert block with error checking
    async function insertBlock(dayId: string, block: any) {
        const { error } = await supabase.from('workout_blocks').insert({
            day_id: dayId,
            ...block
        });
        if (error) {
            console.error(`❌ Error inserting block "${block.name}":`, error.message);
            // Don't throw, just log. This helps us see if some succeed and others fail.
        }
    }

    // Now create new structures
    console.log('🏋️ Step 3: Creating CrossFit template structure (4 weeks)...');
    await createCrossFitStructure(supabase, crossfitTemplate.id, insertBlock);

    console.log('💪 Step 4: Creating Strength template structure (6 weeks)...');
    await createStrengthStructure(supabase, strengthTemplate.id, insertBlock);

    console.log('🎯 Step 5: Creating Hypertrophy template structure (5 weeks)...');
    await createHypertrophyStructure(supabase, hypertrophyTemplate.id, insertBlock);

    console.log('🎉 Migration complete!');
}

async function createCrossFitStructure(supabase: any, templateId: string, insertBlock: any) {
    for (let week = 1; week <= 4; week++) {
        const { data: meso } = await supabase.from('mesocycles').insert({
            program_id: templateId,
            week_number: week,
            focus: week === 4 ? 'Deload' : 'Accumulation',
            attributes: { methodology: 'Andy Galpin', volume_factor: 1 }
        }).select().single();

        // Day 1: Strength Lower
        const { data: day1 } = await supabase.from('days').insert({
            mesocycle_id: meso.id, day_number: 1, name: 'Strength - Lower', is_rest_day: false, notes: 'Protocolo 3-5'
        }).select().single();

        await insertBlock(day1.id, { order_index: 1, type: 'warmup', format: 'Not For Time', name: 'Warm-up', config: { duration_minutes: 10 } });
        await insertBlock(day1.id, { order_index: 2, type: 'strength_linear', format: null, name: 'Back Squat', config: { sets: 5, reps: '3-5', notes: 'Protocolo 3-5' } });
        await insertBlock(day1.id, { order_index: 3, type: 'strength_linear', format: null, name: 'Romanian Deadlift', config: { sets: 4, reps: '6-8' } });
        await insertBlock(day1.id, { order_index: 4, type: 'metcon_structured', format: 'AMRAP', name: 'Short Metcon', config: { duration: '8 min', movements: 'KB Swings, Box Jumps' } });

        // Day 2: Power + Skill
        const { data: day2 } = await supabase.from('days').insert({
            mesocycle_id: meso.id, day_number: 2, name: 'Power + Skill', is_rest_day: false
        }).select().single();

        await insertBlock(day2.id, { order_index: 1, type: 'warmup', format: 'Not For Time', name: 'Barbell Warm-up', config: { duration_minutes: 12 } });
        await insertBlock(day2.id, { order_index: 2, type: 'skill', format: 'EMOM', name: 'Snatch Skill', config: { description: 'EMOM 12: 2 Power Snatch' } });
        await insertBlock(day2.id, { order_index: 3, type: 'strength_linear', format: null, name: 'Power Complex', config: { sets: 4, notes: '1 Clean + 1 Front Squat' } });

        // Day 3: Rest
        await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 3, name: 'Descanso Activo', is_rest_day: true });

        // Day 4: Conditioning
        const { data: day4 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 4, name: 'Conditioning', is_rest_day: false }).select().single();

        await insertBlock(day4.id, { order_index: 1, type: 'warmup', format: 'Not For Time', name: 'Cardio Warm-up', config: { duration_minutes: 8 } });
        await insertBlock(day4.id, { order_index: 2, type: 'metcon_structured', format: 'AMRAP', name: 'Main Metcon', config: { duration: '20 min', movements: 'Run, Wall Balls, TTB' } });
        await insertBlock(day4.id, { order_index: 3, type: 'accessory', format: 'Not For Time', name: 'Core Finisher', config: { sets: 3, movements: 'GHD Sit-ups' } });

        // Day 5: Strength Upper
        const { data: day5 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 5, name: 'Strength - Upper', is_rest_day: false }).select().single();

        await insertBlock(day5.id, { order_index: 1, type: 'warmup', format: 'Not For Time', name: 'Upper Warm-up', config: {} });
        await insertBlock(day5.id, { order_index: 2, type: 'strength_linear', format: null, name: 'Strict Press', config: { sets: 5, reps: '3-5' } });
        await insertBlock(day5.id, { order_index: 3, type: 'metcon_structured', format: 'For Time', name: 'Short Burner', config: { description: '21-15-9 Thrusters + Pullups' } });

        // Day 6: Hybrid
        const { data: day6 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 6, name: 'Hybrid', is_rest_day: false }).select().single();
        await insertBlock(day6.id, { order_index: 1, type: 'strength_linear', format: null, name: 'Barbell Complex', config: { sets: 4 } });

        // Day 7: Rest
        await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 7, name: 'Descanso', is_rest_day: true });
    }
    console.log('   ✅ CrossFit template structure created');
}

async function createStrengthStructure(supabase: any, templateId: string, insertBlock: any) {
    for (let week = 1; week <= 6; week++) {
        const { data: meso } = await supabase.from('mesocycles').insert({
            program_id: templateId, week_number: week, focus: 'Strength', attributes: { methodology: 'Mike Israetel' }
        }).select().single();

        // Day 1: Lower Squat
        const { data: day1 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 1, name: 'Lower - Squat', is_rest_day: false }).select().single();
        await insertBlock(day1.id, { order_index: 1, type: 'warmup', format: 'Not For Time', name: 'Initial Warmup', config: {} });
        await insertBlock(day1.id, { order_index: 2, type: 'strength_linear', format: null, name: 'Back Squat', config: { sets: 4, reps: '4-6' } });
        await insertBlock(day1.id, { order_index: 3, type: 'strength_linear', format: null, name: 'Romanian Deadlift', config: { sets: 3, reps: '8-10' } });
        await insertBlock(day1.id, { order_index: 4, type: 'accessory', format: null, name: 'Leg Curl', config: { sets: 3, reps: '12-15' } });

        // Day 2: Upper Push
        const { data: day2 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 2, name: 'Upper - Push', is_rest_day: false }).select().single();
        await insertBlock(day2.id, { order_index: 1, type: 'strength_linear', format: null, name: 'Bench Press', config: { sets: 4, reps: '4-6' } });
        await insertBlock(day2.id, { order_index: 2, type: 'strength_linear', format: null, name: 'Barbell Row', config: { sets: 4, reps: '6-8' } });

        // Day 3: Rest
        await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 3, name: 'Descanso', is_rest_day: true });

        // Day 4: Lower Deadlift
        const { data: day4 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 4, name: 'Lower - Deadlift', is_rest_day: false }).select().single();
        await insertBlock(day4.id, { order_index: 1, type: 'strength_linear', format: null, name: 'Deadlift', config: { sets: 4, reps: '3-5' } });
        await insertBlock(day4.id, { order_index: 2, type: 'strength_linear', format: null, name: 'Front Squat', config: { sets: 3, reps: '6-8' } });

        // Day 5: Upper Pull
        const { data: day5 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 5, name: 'Upper - Pull', is_rest_day: false }).select().single();
        await insertBlock(day5.id, { order_index: 1, type: 'strength_linear', format: null, name: 'Weighted Pull-ups', config: { sets: 4, reps: '6-8' } });

        // Rest
        await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 6, name: 'Descanso', is_rest_day: true });
        await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 7, name: 'Descanso', is_rest_day: true });
    }
    console.log('   ✅ Strength template structure created');
}

async function createHypertrophyStructure(supabase: any, templateId: string, insertBlock: any) {
    for (let week = 1; week <= 5; week++) {
        const { data: meso } = await supabase.from('mesocycles').insert({
            program_id: templateId, week_number: week, focus: 'Hypertrophy', attributes: { methodology: 'RP' }
        }).select().single();

        // Day 1: Push
        const { data: day1 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 1, name: 'Push', is_rest_day: false }).select().single();
        await insertBlock(day1.id, { order_index: 1, type: 'strength_linear', format: null, name: 'Dumbbell Press', config: { sets: 4, reps: '8-12' } });
        await insertBlock(day1.id, { order_index: 2, type: 'strength_linear', format: null, name: 'Lateral Raises', config: { sets: 4, reps: '12-15' } });
        await insertBlock(day1.id, { order_index: 3, type: 'accessory', format: null, name: 'Tricep Pushdowns', config: { sets: 3, reps: '12-15' } });

        // Day 2: Pull
        const { data: day2 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 2, name: 'Pull', is_rest_day: false }).select().single();
        await insertBlock(day2.id, { order_index: 1, type: 'strength_linear', format: null, name: 'Lat Pulldown', config: { sets: 4, reps: '8-12' } });
        await insertBlock(day2.id, { order_index: 2, type: 'strength_linear', format: null, name: 'Cable Row', config: { sets: 4, reps: '10-12' } });

        // Day 3: Legs
        const { data: day3 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 3, name: 'Legs', is_rest_day: false }).select().single();
        await insertBlock(day3.id, { order_index: 1, type: 'strength_linear', format: null, name: 'Hack Squat', config: { sets: 4, reps: '8-12' } });
        await insertBlock(day3.id, { order_index: 2, type: 'strength_linear', format: null, name: 'RDL', config: { sets: 4, reps: '10-12' } });

        // Day 4: Upper
        const { data: day4 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 4, name: 'Upper Body', is_rest_day: false }).select().single();
        await insertBlock(day4.id, { order_index: 1, type: 'strength_linear', format: null, name: 'Dips', config: { sets: 3, reps: '10-12' } });

        // Day 5: Lower
        const { data: day5 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 5, name: 'Lower Body', is_rest_day: false }).select().single();
        await insertBlock(day5.id, { order_index: 1, type: 'strength_linear', format: null, name: 'Leg Press', config: { sets: 4, reps: '10-15' } });

        // Rest
        await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 6, name: 'Descanso', is_rest_day: true });
        await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 7, name: 'Descanso', is_rest_day: true });
    }
    console.log('   ✅ Hypertrophy template structure created');
}

runMigration().catch(console.error);
