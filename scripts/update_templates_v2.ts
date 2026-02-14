
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

    console.log('🚀 Running PROFESSIONAL template update...');

    // 1. Get Templates
    const { data: templates } = await supabase.from('programs').select('id, name').eq('is_template', true);
    if (!templates || templates.length === 0) { console.error('No templates.'); process.exit(1); }

    const crossfitTemplate = templates.find(t => t.name.includes('CrossFit'));
    const strengthTemplate = templates.find(t => t.name.includes('Fuerza'));
    const hypertrophyTemplate = templates.find(t => t.name.includes('Hipertrofia'));

    // Helper
    async function insertBlock(dayId: string, block: any) {
        await supabase.from('workout_blocks').insert({ day_id: dayId, ...block });
    }

    // Common Warmup Function
    async function insertWarmup(dayId: string, focus: string) {
        const warmupFormats = ['AMRAP', 'EMOM', 'Not For Time', 'For Time'];
        const format = warmupFormats[Math.floor(Math.random() * warmupFormats.length)];

        let movements = [];
        if (focus === 'upper') {
            movements = ["10 Arm Circles", "10 Scap Pullups", "10 Pushups", "30s Plank"];
        } else if (focus === 'lower') {
            movements = ["10 Air Squats", "10 Lunges", "10 Good Mornings", "30s Wall Sit"];
        } else {
            movements = ["5 Burpees", "10 Jumping Jacks", "10 Mountain Climbers", "30s Jump Rope"];
        }

        await insertBlock(dayId, {
            order_index: 0,
            type: 'warmup',
            format: 'Not For Time',
            name: 'General Warm-up',
            section: 'warmup',
            config: {
                "movements": ["5 min Cardio Machine (Light)", ...movements],
                "notes": "Increase intensity gradually. Focus on quality movement."
            }
        });
    }

    // 2. Clean Old Structure
    console.log('🧹 Cleaning old structures for target templates...');
    const targetTemplates = [crossfitTemplate, strengthTemplate, hypertrophyTemplate].filter(Boolean);

    for (const t of targetTemplates) {
        if (!t) continue;
        console.log(`- Cleaning ${t.name}...`);
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

    // 3. Populate CrossFit (Andy Galpin)
    if (crossfitTemplate) {
        console.log('🏋️ Populating CrossFit (Andy Galpin)...');
        for (let week = 1; week <= 4; week++) {
            const isDeload = week === 4;
            const weekFocus = isDeload ? 'Deload & Testing' : 'Accumulation';

            const { data: meso } = await supabase.from('mesocycles').insert({
                program_id: crossfitTemplate.id,
                week_number: week,
                focus: weekFocus,
                attributes: { methodology: 'Andy Galpin', phase: 'GPP' }
            }).select().single();

            // Monday: Strength + Metcon
            const { data: d1 } = await supabase.from('days').insert({
                mesocycle_id: meso.id, day_number: 1, name: 'Strength & Conditioning', notes: 'High intensity start to the week.'
            }).select().single();
            await insertWarmup(d1.id, 'full');
            await insertBlock(d1.id, { order_index: 1, type: 'strength_linear', name: 'Back Squat', config: { "sets": isDeload ? 3 : 5, "reps": "5", "percentage": "75%", "rest": "3min", "notes": "Focus on speed out of the hole." } });
            await insertBlock(d1.id, { order_index: 2, type: 'metcon_structured', format: 'AMRAP', name: 'Metcon: "The Grinder"', config: { "minutes": 12, "movements": ["10 Wall Balls (20/14lb)", "10 Toes to Bar", "50 Double Unders"], "notes": "Consistent pacing." } });
            await insertBlock(d1.id, { order_index: 3, type: 'accessory', name: 'Cool Down', config: { "sets": 1, "reps": "10min", "notes": "Light bike + stretching." } });

            // Tuesday: Rest
            await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 2, name: 'Rest', is_rest_day: true, notes: 'Active recovery. Walk or easy swim.' });

            // Wednesday: Skill + Intervals
            const { data: d3 } = await supabase.from('days').insert({
                mesocycle_id: meso.id, day_number: 3, name: 'Skill & Intervals', notes: 'Focus on technique under fatigue.'
            }).select().single();
            await insertWarmup(d3.id, 'upper');
            await insertBlock(d3.id, { order_index: 1, type: 'skill', format: 'EMOM', name: 'Gymnastics Skill', config: { "minutes": 10, "interval": 1, "movements": ["Odd: 3-5 Strict Pullups", "Even: 30s Handstand Hold"] } });
            await insertBlock(d3.id, { order_index: 2, type: 'metcon_structured', format: 'EMOM', name: 'Interval Training', config: { "minutes": 20, "interval": 1, "movements": ["Min 1: 15 Cal Row", "Min 2: 12 Burpees", "Min 3: 15 Kettlebell Swings", "Min 4: Rest"] } });

            // Thursday: Rest
            await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 4, name: 'Rest', is_rest_day: true });

            // Friday: Long Metcon (Chipper)
            const { data: d5 } = await supabase.from('days').insert({
                mesocycle_id: meso.id, day_number: 5, name: 'Endurance Chipper', notes: 'Mental toughness day.'
            }).select().single();
            await insertWarmup(d5.id, 'full');
            await insertBlock(d5.id, { order_index: 1, type: 'metcon_structured', format: 'For Time', name: 'Chipper', config: { "timeCap": 25, "movements": ["50 Wall Balls", "40 Alt DB Snatch", "30 Box Jumps", "20 Pullups", "10 Clean & Jerk (135/95)"], "notes": "Break sets early and often." } });

            // Saturday: Team / Fun
            const { data: d6 } = await supabase.from('days').insert({
                mesocycle_id: meso.id, day_number: 6, name: 'Community / Team', notes: 'Fun workout with friends.'
            }).select().single();
            await insertWarmup(d6.id, 'full');
            await insertBlock(d6.id, { order_index: 1, type: 'metcon_structured', format: 'AMRAP', name: 'Team WOD', config: { "minutes": 30, "movements": ["In teams of 2:", "100 Cal Bike", "80 Burpees over Bar", "60 Power Cleans", "40 Thrusters"], "notes": "Split work as needed." } });

            // Sunday: Rest
            await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 7, name: 'Rest', is_rest_day: true });
        }
    }

    // 4. Populate Strength (Mike Israetel)
    if (strengthTemplate) {
        console.log('💪 Populating Strength (Israetel)...');
        for (let week = 1; week <= 4; week++) {
            const isDeload = week === 4;
            const weekFocus = isDeload ? 'Deload' : 'Strength Peaking';
            // RIR decreases 3->1
            const rir = isDeload ? 5 : Math.max(1, 4 - week);

            const { data: meso } = await supabase.from('mesocycles').insert({
                program_id: strengthTemplate.id, week_number: week, focus: weekFocus,
                attributes: { methodology: 'Mike Israetel', phase: 'Strength' }
            }).select().single();

            // Monday: Squat
            const { data: d1 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 1, name: 'Squat Focus' }).select().single();
            await insertWarmup(d1.id, 'lower');
            await insertBlock(d1.id, { order_index: 1, type: 'strength_linear', name: 'Competition Low Bar Squat', config: { "sets": isDeload ? 3 : 5, "reps": "3-5", "rir": rir, "rest": "4-5min", "notes": "Belt on. Specificity is key." } });
            await insertBlock(d1.id, { order_index: 2, type: 'strength_linear', name: 'Pause Squat', config: { "sets": 3, "reps": "5", "rir": rir + 1, "notes": "2 sec pause at bottom." } });
            await insertBlock(d1.id, { order_index: 3, type: 'accessory', name: 'Leg Curls', config: { "sets": 4, "reps": "12-15", "rir": rir } });

            // Tuesday: Rest
            await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 2, name: 'Rest', is_rest_day: true });

            // Wednesday: Bench
            const { data: d3 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 3, name: 'Bench Focus' }).select().single();
            await insertWarmup(d3.id, 'upper');
            await insertBlock(d3.id, { order_index: 1, type: 'strength_linear', name: 'Competition Bench Press', config: { "sets": isDeload ? 3 : 5, "reps": "3-6", "rir": rir, "rest": "3min" } });
            await insertBlock(d3.id, { order_index: 2, type: 'accessory', name: 'Close Grip Bench', config: { "sets": 3, "reps": "8-10", "rir": rir + 1 } });
            await insertBlock(d3.id, { order_index: 3, type: 'accessory', name: 'Seal Rows', config: { "sets": 4, "reps": "10-12", "rir": rir } });

            // Thursday: Rest
            await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 4, name: 'Rest', is_rest_day: true });

            // Friday: Deadlift
            const { data: d5 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 5, name: 'Deadlift Focus' }).select().single();
            await insertWarmup(d5.id, 'lower');
            await insertBlock(d5.id, { order_index: 1, type: 'strength_linear', name: 'Sumo/Conventional Deadlift', config: { "sets": isDeload ? 1 : 3, "reps": "3-5", "rir": rir, "rest": "5min", "notes": "Deadstop every rep." } });
            await insertBlock(d5.id, { order_index: 2, type: 'accessory', name: 'RDLs', config: { "sets": 4, "reps": "8-12", "rir": rir } });

            // Saturday: OHP / Accessories
            const { data: d6 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 6, name: 'OHP & Accessories' }).select().single();
            await insertWarmup(d6.id, 'upper');
            await insertBlock(d6.id, { order_index: 1, type: 'strength_linear', name: 'Overhead Press', config: { "sets": 4, "reps": "6-8", "rir": rir, "rest": "3min" } });
            await insertBlock(d6.id, { order_index: 2, type: 'accessory', name: 'Pull Ups', config: { "sets": 4, "reps": "AMRAP (-2)", "notes": "Strict form." } });
            await insertBlock(d6.id, { order_index: 3, type: 'accessory', name: 'Dips', config: { "sets": 3, "reps": "10-15" } });

            // Sunday: Rest
            await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 7, name: 'Rest', is_rest_day: true });
        }
    }

    // 5. Populate Hypertrophy (RP)
    if (hypertrophyTemplate) {
        console.log('💊 Populating Hypertrophy (RP)...');
        for (let week = 1; week <= 5; week++) {
            const isDeload = week === 5;
            const weekFocus = isDeload ? 'Deload' : 'Hypertrophy';
            // RIR 3, 2, 1, 0, Deload
            const rir = isDeload ? 5 : (3 - (week - 1));

            const { data: meso } = await supabase.from('mesocycles').insert({
                program_id: hypertrophyTemplate.id, week_number: week, focus: weekFocus,
                attributes: { methodology: 'RP Hypertrophy' }
            }).select().single();

            // Monday: Upper Push
            const { data: d1 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 1, name: 'Upper Push' }).select().single();
            await insertWarmup(d1.id, 'upper');
            await insertBlock(d1.id, { order_index: 1, type: 'strength_linear', name: 'Incline Dumbbell Press', config: { "sets": 4, "reps": "10-15", "rir": rir, "tempo": "2010", "rest": "2min" } });
            await insertBlock(d1.id, { order_index: 2, type: 'strength_linear', name: 'Machine Chest Press', config: { "sets": 3, "reps": "12-15", "rir": rir, "notes": "Focus on stretch." } });
            await insertBlock(d1.id, { order_index: 3, type: 'accessory', name: 'Lateral Raises', config: { "sets": 5, "reps": "15-20", "rir": rir, "notes": "Strict no swing." } });
            await insertBlock(d1.id, { order_index: 4, type: 'accessory', name: 'Tricep Pushdowns', config: { "sets": 4, "reps": "12-15", "rir": rir } });

            // Tuesday: Rest
            await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 2, name: 'Rest', is_rest_day: true });

            // Wednesday: Lower Quad
            const { data: d3 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 3, name: 'Lower Quad Focus' }).select().single();
            await insertWarmup(d3.id, 'lower');
            await insertBlock(d3.id, { order_index: 1, type: 'strength_linear', name: 'Hack Squat', config: { "sets": 4, "reps": "8-12", "rir": rir, "tempo": "3110", "notes": "Full depth. Control eccentric." } });
            await insertBlock(d3.id, { order_index: 2, type: 'strength_linear', name: 'Leg Press', config: { "sets": 3, "reps": "10-15", "rir": rir, "notes": "Close stance." } });
            await insertBlock(d3.id, { order_index: 3, type: 'accessory', name: 'Leg Extensions', config: { "sets": 3, "reps": "15-20", "rir": 0, "notes": "Burn sets." } });
            await insertBlock(d3.id, { order_index: 4, type: 'accessory', name: 'Calf Raises', config: { "sets": 4, "reps": "15-20", "rir": rir } });

            // Thursday: Rest
            await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 4, name: 'Rest', is_rest_day: true });

            // Friday: Upper Pull
            const { data: d5 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 5, name: 'Upper Pull' }).select().single();
            await insertWarmup(d5.id, 'upper');
            await insertBlock(d5.id, { order_index: 1, type: 'strength_linear', name: 'Pull Downs (Neutral Grip)', config: { "sets": 4, "reps": "10-12", "rir": rir, "tempo": "3011" } });
            await insertBlock(d5.id, { order_index: 2, type: 'strength_linear', name: 'Chest Supported Row', config: { "sets": 4, "reps": "12-15", "rir": rir } });
            await insertBlock(d5.id, { order_index: 3, type: 'accessory', name: 'Incline Bicep Curl', config: { "sets": 3, "reps": "12-15", "rir": rir } });
            await insertBlock(d5.id, { order_index: 4, type: 'accessory', name: 'Face Pulls', config: { "sets": 3, "reps": "15-20", "rir": rir } });

            // Saturday: Lower Ham/Glute
            const { data: d6 } = await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 6, name: 'Lower Ham/Glute' }).select().single();
            await insertWarmup(d6.id, 'lower');
            await insertBlock(d6.id, { order_index: 1, type: 'strength_linear', name: 'Stiff Leg Deadlift', config: { "sets": 4, "reps": "8-12", "rir": rir, "tempo": "2111" } });
            await insertBlock(d6.id, { order_index: 2, type: 'strength_linear', name: 'Walking Lunges', config: { "sets": 3, "reps": "20 steps", "rir": rir } });
            await insertBlock(d6.id, { order_index: 3, type: 'accessory', name: 'Lying Leg Curls', config: { "sets": 4, "reps": "12-15", "rir": rir } });

            // Sunday: Rest
            await supabase.from('days').insert({ mesocycle_id: meso.id, day_number: 7, name: 'Rest', is_rest_day: true });

        }
    }

    console.log('🎉 Done! Workouts updated successfully.');
}

runMigration().catch(console.error);
