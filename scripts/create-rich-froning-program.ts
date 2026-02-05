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

    console.log('🚀 Starting Rich Froning "PRO LEVEL" Program Creation...');

    // 0. Ensure Exercises Exist (Expanded for Pro Level)
    const newExercises = [
        { name: "Pegboard Ascent", category: "Gymnastics" },
        { name: "GHD Sit-up", category: "Gymnastics" },
        { name: "Sandbag Clean", category: "Weightlifting" },
        { name: "Yoke Carry", category: "Monostructural" },
        { name: "SkiErg", category: "Monostructural" },
        { name: "Assault Bike", category: "Monostructural" },
        { name: "Deficit Handstand Push-up", category: "Gymnastics" },
        { name: "Ring Muscle Up", category: "Gymnastics" },
        { name: "Sled Push", category: "Monostructural" },
        { name: "Heavy Rope Double Under", category: "Monostructural" },
        { name: "Legless Rope Climb", category: "Gymnastics" },
        { name: "D-Ball Over Shoulder", category: "Weightlifting" },
        { name: "Echo Bike", category: "Monostructural" },
        { name: "TrueForm Runner", category: "Monostructural" },
        { name: "Prowler Push", category: "Monostructural" },
        { name: "Weighted Vest Air Squat", category: "Gymnastics" }
    ];

    console.log('💪 Checking/Inserting Elite Exercises...');
    for (const ex of newExercises) {
        const { data: existing } = await supabase.from('exercises').select('id').eq('name', ex.name).single();
        if (!existing) {
            console.log(`   + Creating ${ex.name}`);
            await supabase.from('exercises').insert({
                name: ex.name,
                category: ex.category,
                description: "Pro Level Staple"
            });
        }
    }

    // 1. Get a Coach
    const { data: coaches } = await supabase.from('coaches').select('id').limit(1);
    const coachId = coaches?.[0]?.id;

    if (!coachId) {
        console.error('❌ No coaches found. Create a coach first.');
        process.exit(1);
    }

    // 2. Create Program
    // We will DELETE existing to ensure fresh start
    console.log('📘 Creating Program: Rich Froning - Mayhem Strength (PRO)...');
    const programName = "Rich Froning - Mayhem Strength (PRO)";

    // Check if exists
    const { data: existingProgs } = await supabase.from('programs').select('id').eq('name', programName);
    if (existingProgs?.length) {
        for (const p of existingProgs) {
            // Clean up old mesos
            const { data: mesos } = await supabase.from('mesocycles').select('id').eq('program_id', p.id);
            if (mesos?.length) {
                const mesoIds = mesos.map(m => m.id);
                const { data: days } = await supabase.from('days').select('id').in('mesocycle_id', mesoIds);
                if (days?.length) {
                    await supabase.from('workout_blocks').delete().in('day_id', days.map(d => d.id));
                }
                await supabase.from('days').delete().in('mesocycle_id', mesoIds);
                await supabase.from('mesocycles').delete().eq('program_id', p.id);
            }
            await supabase.from('programs').delete().eq('id', p.id);
        }
    }

    // Clean up OLD non-pro version too if it exists
    const { data: oldProgs } = await supabase.from('programs').select('id').eq('name', "Rich Froning - Mayhem Strength");
    if (oldProgs?.length) {
        for (const p of oldProgs) {
            const { data: mesos } = await supabase.from('mesocycles').select('id').eq('program_id', p.id);
            if (mesos?.length) {
                const mesoIds = mesos.map(m => m.id);
                const { data: days } = await supabase.from('days').select('id').in('mesocycle_id', mesoIds);
                if (days?.length) {
                    await supabase.from('workout_blocks').delete().in('day_id', days.map(d => d.id));
                }
                await supabase.from('days').delete().in('mesocycle_id', mesoIds);
                await supabase.from('mesocycles').delete().eq('program_id', p.id);
            }
            await supabase.from('programs').delete().eq('id', p.id);
        }
    }


    const { data: newProg, error } = await supabase.from('programs').insert({
        coach_id: coachId,
        name: programName,
        description: "ELITE Level Programming. 2 Sessions/Day volume packed into one flow. Heavy strength, high skill, multiple metcons per day. NOT FOR BEGINNERS.",
        status: 'active'
    }).select().single();

    if (error) {
        console.error('❌ Error creating program:', error);
        process.exit(1);
    }
    const programId = newProg.id;

    // Helper
    async function insertBlock(dayId: string, block: any) {
        await supabase.from('workout_blocks').insert({ day_id: dayId, ...block });
    }

    // 3. Create 4 Weeks
    const weeks = [
        { num: 1, focus: "Volume Injection", rir: 3 },
        { num: 2, focus: "Intensification", rir: 2 },
        { num: 3, focus: "Peak / Overreaching", rir: 1 },
        { num: 4, focus: "Deload", rir: 4 }
    ];

    for (const week of weeks) {
        console.log(`   📅 Building Pro Week ${week.num}: ${week.focus}...`);

        const { data: meso } = await supabase.from('mesocycles').insert({
            program_id: programId,
            week_number: week.num,
            focus: week.focus,
            attributes: { methodology: 'Mayhem Pro', intensity: 'Elite' }
        }).select().single();

        const mesoId = meso.id;

        // --- Day 1: Squat + Snatch + Metcon + Leg Pump ---
        const { data: d1 } = await supabase.from('days').insert({ mesocycle_id: mesoId, day_number: 1, name: 'Monday: Legs Destruction', notes: 'Leg heavy day. Eat big.' }).select().single();

        // Block 1: Activation
        await insertBlock(d1.id, { order_index: 0, type: 'warmup', format: 'Not For Time', name: 'Hip Flow', config: { "movements": ["5 min BikeErg", "3 Rounds: 10 Spiderman Lunge, 10 Cossack Squats, 10 Banded GM"] } });
        // Block 2: Oly
        await insertBlock(d1.id, { order_index: 1, type: 'strength_linear', name: 'Snatch', config: { "sets": 6, "reps": "2", "percentage": "75-80%", "notes": "Technique focus. 2 Power + 1 Squat.", "rest": "2min" } });
        // Block 3: Strength
        await insertBlock(d1.id, { order_index: 2, type: 'strength_linear', name: 'Back Squat', config: { "sets": "5", "reps": "4", "percentage": "80-85%", "rir": week.rir, "rest": "3min" } });
        // Block 4: Metcon 1 (Sprint)
        await insertBlock(d1.id, { order_index: 3, type: 'metcon_structured', format: 'For Time', name: 'Event 1: "Legs Gone"', config: { "timeCap": 12, "movements": ["21-15-9", "Cal Echo Bike", "Thrusters (115/85)"] } });
        // Block 5: Accessory (Hypertrophy)
        await insertBlock(d1.id, { order_index: 4, type: 'accessory', name: 'Leg Accessory', config: { "sets": 4, "movements": ["A1. DB Walking Lunges x 20m", "A2. GHD Situps x 15", "A3. Chinese Plank x 60s"], "notes": "Quality reps." } });
        // Block 6: Zone 2
        await insertBlock(d1.id, { order_index: 5, type: 'conditioning', name: 'Flush', config: { "time": "20min", "movement": "Assault Bike", "zone": "2", "notes": "Nasal breathing." } });


        // --- Day 2: Press + Gymnastics Volume ---
        const { data: d2 } = await supabase.from('days').insert({ mesocycle_id: mesoId, day_number: 2, name: 'Tuesday: Gymnast Logic' }).select().single();

        await insertBlock(d2.id, { order_index: 1, type: 'warmup', name: 'Shoulder Prep', config: { "movements": ["Crossover Symmetry", "Handstand Hold 3x30s"] } });
        await insertBlock(d2.id, { order_index: 2, type: 'strength_linear', name: 'Strict Press', config: { "sets": 5, "reps": "5", "rir": week.rir } });
        await insertBlock(d2.id, { order_index: 3, type: 'strength_linear', name: 'Weighted Pull Ups', config: { "sets": 4, "reps": "6-8", "notes": "Heavy." } });
        await insertBlock(d2.id, { order_index: 4, type: 'skill', name: 'Gymnastics Stamina', config: { "format": "EMOM 16", "movements": ["1: 4-6 Ring Muscle Ups", "2: 50ft Handstand Walk", "3: 15 C2B Pull-ups", "4: Rest"] } });
        await insertBlock(d2.id, { order_index: 5, type: 'metcon_structured', format: 'AMRAP', name: 'Event 2: "Diane on Steroids"', config: { "minutes": 9, "movements": ["21-15-9", "Deadlift (225/155)", "HSPU", "Then max meters Handstand Walk"] } });
        await insertBlock(d2.id, { order_index: 6, type: 'accessory', name: 'Upper Body Pump', config: { "sets": 3, "reps": "15-20", "movements": ["DB Lateral Raises", "Tricep Pushdowns", "Bicep Curls"] } });


        // --- Day 3: Clean + Deadlift + Grunt Work ---
        const { data: d3 } = await supabase.from('days').insert({ mesocycle_id: mesoId, day_number: 3, name: 'Wednesday: Engine & Hinge' }).select().single();

        await insertBlock(d3.id, { order_index: 1, type: 'strength_linear', name: 'Clean & Jerk', config: { "sets": 7, "reps": "1", "percentage": "80-90%", "rest": "2-3min" } });
        await insertBlock(d3.id, { order_index: 2, type: 'strength_linear', name: 'Deadlift', config: { "sets": 3, "reps": "3", "percentage": "85-90%", "notes": "No touch and go." } });
        await insertBlock(d3.id, { order_index: 3, type: 'metcon_structured', format: 'RFT', name: 'Event 3: "Pain Cave"', config: { "rounds": 4, "movements": ["500m Row", "10 Sandbag Cleans (150/100)", "20m Yoke Carry (Heavy)", "15 Burpee Box Jump Overs"] } });
        await insertBlock(d3.id, { order_index: 4, type: 'accessory', name: 'Posterior Chain', config: { "sets": 3, "movements": ["Banded Good Mornings x 25", "Sled Push Heavy x 20m"] } });
        await insertBlock(d3.id, { order_index: 5, type: 'conditioning', name: 'Run Intervals', config: { "sets": 6, "work": "400m", "rest": "1:1", "pace": "Mile pace" } });


        // --- Day 4: Active Recovery (Swim) ---
        await supabase.from('days').insert({ mesocycle_id: mesoId, day_number: 4, name: 'Active Recovery', is_rest_day: true, notes: 'Pool day. 45-60 min easy swim + Sauna/Ice Bath.' });


        // --- Day 5: Snatch + Intervals + Triplets ---
        const { data: d5 } = await supabase.from('days').insert({ mesocycle_id: mesoId, day_number: 5, name: 'Friday: Speed & Power' }).select().single();

        await insertBlock(d5.id, { order_index: 1, type: 'strength_linear', name: 'Power Snatch', config: { "sets": 6, "reps": "3", "percentage": "70%", "notes": "Touch and go. Fast." } });
        await insertBlock(d5.id, { order_index: 2, type: 'strength_linear', name: 'Front Squat', config: { "sets": 4, "reps": "5", "percentage": "75%", "tempo": "31X1" } });
        await insertBlock(d5.id, { order_index: 3, type: 'metcon_structured', format: 'Intervals', name: 'Event 4: "Interval City"', config: { "sets": 5, "work": "3:00", "rest": "1:00", "movements": ["2 Rounds:", "10 Wall Balls", "10 Toes to Bar", "Max Cal SkiErg"] } });
        await insertBlock(d5.id, { order_index: 4, type: 'metcon_structured', format: 'For Time', name: 'Event 5: "Finisher"', config: { "timeCap": 7, "movements": ["50-40-30-20-10", "Double Unders", "Situps"] } });


        // --- Day 6: Team/Long Chipper ---
        const { data: d6 } = await supabase.from('days').insert({ mesocycle_id: mesoId, day_number: 6, name: 'Saturday: The Long Grind' }).select().single();

        await insertBlock(d6.id, { order_index: 1, type: 'warmup', name: 'Partner Warmup', config: { "movements": ["Run 1 mile together, conversational pace"] } });
        await insertBlock(d6.id, { order_index: 2, type: 'metcon_structured', format: 'Chipper', name: 'Event 6: "Murph Prep"', config: { "format": "For Time", "movements": ["1000m Run", "5 Rope Climbs", "50 Thrusters (95/65)", "5 Rope Climbs", "50 Pullups", "5 Rope Climbs", "50 Pushups", "1000m Run"] } });
        await insertBlock(d6.id, { order_index: 3, type: 'accessory', name: 'Bulletproof Shoulders', config: { "sets": 3, "movements": ["Face Pulls x 20", "Powell Raise x 15/side"] } });
        await insertBlock(d6.id, { order_index: 4, type: 'conditioning', name: 'Flush', config: { "time": "30min", "machine": "AirBike", "zone": "1" } });


        // --- Day 7: REST ---
        await supabase.from('days').insert({ mesocycle_id: mesoId, day_number: 7, name: 'Full Rest', is_rest_day: true, notes: 'Complete rest. Family time. No gym.' });

    }

    console.log('✅ Rich Froning PRO Program Created Successfully (Destroyed the database, built the empire)!');
}

runMigration().catch(console.error);
