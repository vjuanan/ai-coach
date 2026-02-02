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

    console.log('🚀 Running ENHANCED template structure migration...');

    // 1. Get Templates
    const { data: templates } = await supabase.from('programs').select('id, name').eq('is_template', true);
    if (!templates || templates.length === 0) { console.error('No templates.'); process.exit(1); }

    const crossfitTemplate = templates.find(t => t.name.includes('CrossFit'));
    const strengthTemplate = templates.find(t => t.name.includes('Fuerza'));
    const hypertrophyTemplate = templates.find(t => t.name.includes('Hipertrofia'));

    // 2. Clean Old Structure
    console.log('🧹 Cleaning old structures...');
    for (const t of templates) {
        const { data: mesos } = await supabase.from('mesocycles').select('id').eq('program_id', t.id);
        if (mesos?.length) {
            const mesoIds = mesos.map(m => m.id);
            const { data: days } = await supabase.from('days').select('id').in('mesocycle_id', mesoIds);
            if (days?.length) {
                await supabase.from('workout_blocks').delete().in('day_id', days.map(d => d.id));
            }
            await supabase.from('days').delete().in('mesocycle_id', mesoIds);
            await supabase.from('mesocycles').delete().eq('program_id', t.id);
        }
    }

    // Helper
    async function insertBlock(dayId: string, block: any) {
        await supabase.from('workout_blocks').insert({ day_id: dayId, ...block });
    }

    // 3. Populate CrossFit (Andy Galpin)
    if (crossfitTemplate) {
        console.log('🏋️ Populating CrossFit (Andy Galpin)...');
        for (let week = 1; week <= 4; week++) {
            const { data: meso } = await supabase.from('mesocycles').insert({
                program_id: crossfitTemplate.id, week_number: week, focus: week === 4 ? 'Deload & Testing' : 'Accumulation',
                attributes: { methodology: 'Andy Galpin', phase: 'GPP' }
            }).select().single();

            // Day 1: Strength + Short Metcon
            const { data: d1 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 1, name: 'Strength Speed', notes: 'Enfoque: Mover cargas moderadas a alta velocidad.' }).select().single();
            await insertBlock(d1.id, { order_index: 1, type: 'warmup', format: 'Not For Time', name: 'General Warm-up', config: { "movements": ["5 min Assault Bike", "2 rounds: 10 Air Squats, 10 Scaps Pullups, 10 Good Mornings"], "notes": "Increase intensity gradually." } });
            await insertBlock(d1.id, { order_index: 2, type: 'strength_linear', name: 'Back Squat (Speed)', config: { "sets": 5, "reps": "3", "percentage": "65-70%", "tempo": "X0X0", "rest": "90s", "notes": "Focus on explosive concentric phase." } });
            await insertBlock(d1.id, { order_index: 3, type: 'metcon_structured', format: 'AMRAP', name: 'Metcon: "The Burner"', config: { "minutes": 12, "movements": ["15 Wall Balls (20/14lb)", "12 Toes to Bar", "9 Box Jumps (24/20\")"], "notes": "Consistent pacing. Do not go out too hot." } });

            // Day 2: Skill + Long Mono
            const { data: d2 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 2, name: 'Skill & Endurance', notes: 'Desarrollo de habilidad bajo fatiga leve.' }).select().single();
            await insertBlock(d2.id, { order_index: 1, type: 'skill', format: 'EMOM', name: 'Gymnastics Skill', config: { "minutes": 10, "interval": 1, "movements": ["Odd: 3-5 Bar Muscle Ups (or progression)", "Even: 30 Double Unders"] } });
            await insertBlock(d2.id, { order_index: 2, type: 'conditioning', format: 'Not For Time', name: 'Aerobic Capacity', config: { "sets": 4, "workTime": "8:00", "restTime": "2:00", "movements": ["Run @ Zone 2"], "notes": "Strict nasal breathing if possible." } });

            // Day 3: Active Rest
            await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 3, name: 'Active Recovery', is_rest_day: true, notes: 'Flush blood flow. 20-30 min easy swim or hike.' });

            // Day 4: Heavy Lifting
            const { data: d4 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 4, name: 'Absolute Strength', notes: 'Día pesado. CNS primed.' }).select().single();
            await insertBlock(d4.id, { order_index: 1, type: 'strength_linear', name: 'Deadlift', config: { "sets": 1, "reps": "5", "percentage": "85%", "notes": "Heavy set of 5. RPE 9.", "rest": "3-5min" } });
            await insertBlock(d4.id, { order_index: 2, type: 'strength_linear', name: 'Strict Press', config: { "sets": 4, "reps": "6", "percentage": "75%", "rest": "2min" } });

            // Day 5: Metcon
            const { data: d5 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 5, name: 'Classic CrossFit', notes: 'High intensity intensity.' }).select().single();
            await insertBlock(d5.id, { order_index: 1, type: 'metcon_structured', format: 'For Time', name: 'Fran-ish', config: { "timeCap": 10, "movements": ["21-15-9", "Thrusters (95/65lb)", "Pull-ups"], "notes": "Go unbroken on Thrusters." } });

            await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 6, name: 'Rest', is_rest_day: true });
            await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 7, name: 'Rest', is_rest_day: true });
        }
    }

    // 4. Populate Strength (Mike Israetel)
    if (strengthTemplate) {
        console.log('💪 Populating Strength (Israetel)...');
        for (let week = 1; week <= 6; week++) {
            const { data: meso } = await supabase.from('mesocycles').insert({
                program_id: strengthTemplate.id, week_number: week, focus: 'Strength Peaking',
                attributes: { methodology: 'Mike Israetel', phase: 'Strength' }
            }).select().single();

            const isDeload = week === 6;
            const rir = isDeload ? 5 : Math.max(0, 4 - Math.floor(week / 2)); // RIR decreases 3->1

            // Day 1: Lower Squat
            const { data: d1 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 1, name: 'Squat Focus' }).select().single();
            await insertBlock(d1.id, { order_index: 1, type: 'strength_linear', name: 'Competition Low Bar Squat', config: { "sets": isDeload ? 2 : 4, "reps": "3-6", "rir": rir, "rest": "3-5min", "notes": "Belt on. Specificity is key." } });
            await insertBlock(d1.id, { order_index: 2, type: 'strength_linear', name: 'Pause Squat', config: { "sets": 3, "reps": "5", "rir": rir + 1, "notes": "2 sec pause at bottom." } });

            // Day 2: Bench
            const { data: d2 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 2, name: 'Bench Focus' }).select().single();
            await insertBlock(d2.id, { order_index: 1, type: 'strength_linear', name: 'Competition Bench Press', config: { "sets": isDeload ? 2 : 5, "reps": "3-6", "rir": rir, "rest": "3min" } });
            await insertBlock(d2.id, { order_index: 2, type: 'accessory', name: 'Close Grip Bench', config: { "sets": 3, "reps": "8-10", "rir": rir + 1 } });

            await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 3, name: 'Rest', is_rest_day: true });

            // Day 4: Deadlift
            const { data: d4 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 4, name: 'Deadlift Focus' }).select().single();
            await insertBlock(d4.id, { order_index: 1, type: 'strength_linear', name: 'Sumo/Conventional Deadlift', config: { "sets": isDeload ? 1 : 3, "reps": "3-5", "rir": rir, "rest": "5min", "notes": "Deadstop every rep." } });
            await insertBlock(d4.id, { order_index: 2, type: 'accessory', name: 'Barbell Rows', config: { "sets": 4, "reps": "8-12", "rir": rir } });

            await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 5, name: 'Rest', is_rest_day: true });

            // Day 6: Accessory
            const { data: d6 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 6, name: 'GPP / Accessory' }).select().single();
            await insertBlock(d6.id, { order_index: 1, type: 'accessory', name: 'Pull Ups', config: { "sets": 4, "reps": "AMRAP (-2)", "notes": "Strict form." } });
            await insertBlock(d6.id, { order_index: 2, type: 'accessory', name: 'Dips', config: { "sets": 3, "reps": "10-15" } });

            await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 7, name: 'Rest', is_rest_day: true });
        }
    }

    // 5. Populate Hypertrophy (RP)
    if (hypertrophyTemplate) {
        console.log('💊 Populating Hypertrophy (RP)...');
        for (let week = 1; week <= 5; week++) {
            const { data: meso } = await supabase.from('mesocycles').insert({
                program_id: hypertrophyTemplate.id, week_number: week, focus: 'Accumulation',
                attributes: { methodology: 'RP Hypertrophy' }
            }).select().single();

            const rir = week === 5 ? 5 : (3 - (week - 1)); // RIR 3, 2, 1, 0, Deload

            // Day 1: Upper PUSH
            const { data: d1 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 1, name: 'Push (Chest/Delts/Tris)' }).select().single();
            await insertBlock(d1.id, { order_index: 1, type: 'strength_linear', name: 'Incline Dumbbell Press', config: { "sets": 4, "reps": "10-15", "rir": rir, "tempo": "2010", "rest": "2min" } });
            await insertBlock(d1.id, { order_index: 2, type: 'strength_linear', name: 'Machine Chest Press', config: { "sets": 3, "reps": "12-15", "rir": rir, "notes": "Focus on stretch." } });
            await insertBlock(d1.id, { order_index: 3, type: 'accessory', name: 'Lateral Raises', config: { "sets": 5, "reps": "15-20", "rir": rir, "notes": "Strict no swing." } });

            // Day 2: Upper PULL
            const { data: d2 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 2, name: 'Pull (Back/Biceps)' }).select().single();
            await insertBlock(d2.id, { order_index: 1, type: 'strength_linear', name: 'Pull Downs (Neutral Grip)', config: { "sets": 4, "reps": "10-12", "rir": rir, "tempo": "3011" } });
            await insertBlock(d2.id, { order_index: 2, type: 'strength_linear', name: 'Chest Supported Row', config: { "sets": 4, "reps": "12-15", "rir": rir } });
            await insertBlock(d2.id, { order_index: 3, type: 'accessory', name: 'Incline Bicep Curl', config: { "sets": 3, "reps": "12-15", "rir": rir } });

            // Day 3: Legs
            const { data: d3 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 3, name: 'Legs Quads Focus' }).select().single();
            await insertBlock(d3.id, { order_index: 1, type: 'strength_linear', name: 'Hack Squat', config: { "sets": 4, "reps": "8-12", "rir": rir, "tempo": "3110", "notes": "Full depth. Control eccentric." } });
            await insertBlock(d3.id, { order_index: 2, type: 'accessory', name: 'Leg Extensions', config: { "sets": 3, "reps": "15-20", "rir": 0, "notes": "Burn sets." } });

            await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 4, name: 'Rest', is_rest_day: true });

            // Day 5: Full Body Pump
            const { data: d5 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 5, name: 'Full Body Pump' }).select().single();
            await insertBlock(d5.id, { order_index: 1, type: 'strength_linear', name: 'Dips', config: { "sets": 3, "reps": "AMRAP", "rir": rir } });
            await insertBlock(d5.id, { order_index: 2, type: 'strength_linear', name: 'Pull Ups', config: { "sets": 3, "reps": "AMRAP", "rir": rir } });
            await insertBlock(d5.id, { order_index: 3, type: 'strength_linear', name: 'Walking Lunges', config: { "sets": 3, "reps": "20 steps", "rir": rir } });

            await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 6, name: 'Rest', is_rest_day: true });
            await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 7, name: 'Rest', is_rest_day: true });

        }
    }

    console.log('🎉 Done!');
}

runMigration().catch(console.error);
