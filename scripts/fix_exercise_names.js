// Quick fix: rename blocks + ensure exercises exist
// NO deletion, NO recreation — just UPDATE existing data
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
});

// Block name -> canonical exercise name mapping
const RENAMES = {
    'Hip Thrust (barra)': 'Hip Thrust',
    'Deadlift Convencional': 'Deadlift',
    '3A. Sentadilla Búlgara': 'Bulgarian Split Squat',
    '3B. Plancha Frontal': 'Plank',
    'Curl Femoral': 'Leg Curl',
    'Abducciones Maquina': 'Abduction Machine',
    'Pull-Up (Intento)': 'Pull-Up',
    'Negative Pull-Ups': 'Negative Pull-Up',
    'Press Plano': 'Bench Press',
    '3A. Remo Unilateral': 'Dumbbell Row',
    '3B. Tríceps Trasnuca': 'Tricep Overhead Extension',
    'Vuelos Laterales': 'Lateral Raises',
    'Sentadilla Trasera': 'Back Squat',
    '2A. Push-Ups': 'Push-Up',
    '2B. Vuelos Posteriores': 'Rear Delt Fly',
    '3A. Step-Up Lateral': 'Box Step-Up',
    '3B. Patada Glúteo Polea': 'Cable Glute Kickback',
    '3B. Vuelos Posteriores': 'Rear Delt Fly',
};

// Exercises to create if missing (canonical name -> metadata)
const EXERCISES = {
    'Hip Thrust': { cat: 'Weightlifting', aliases: ['Hip Thrust con barra', 'Puente de glúteo con barra', 'Elevación de cadera'], eq: ['Barbell', 'Bench'] },
    'Deadlift': { cat: 'Weightlifting', aliases: ['Peso Muerto', 'Deadlift Convencional', 'Peso Muerto Convencional'], eq: ['Barbell'] },
    'Back Squat': { cat: 'Weightlifting', aliases: ['Sentadilla Trasera', 'Sentadilla con barra', 'Sentadilla posterior'], eq: ['Barbell', 'Rack'] },
    'Bulgarian Split Squat': { cat: 'Weightlifting', aliases: ['Sentadilla Búlgara', 'Sentadilla bulgara', 'Zancada búlgara'], eq: ['Dumbbells', 'Bench'] },
    'Bench Press': { cat: 'Weightlifting', aliases: ['Press Plano', 'Press de banca', 'Press de pecho'], eq: ['Barbell', 'Bench'] },
    'Pull-Up': { cat: 'Gymnastics', aliases: ['Dominadas', 'Pull ups', 'Dominada estricta'], eq: ['Pull-up Bar'] },
    'Negative Pull-Up': { cat: 'Gymnastics', aliases: ['Dominadas Negativas', 'Negative Pull-Ups'], eq: ['Pull-up Bar'] },
    'Push-Up': { cat: 'Gymnastics', aliases: ['Push-Ups', 'Flexiones de brazos', 'Flexiones', 'Lagartijas'], eq: [] },
    'Plank': { cat: 'Gymnastics', aliases: ['Plancha', 'Plancha Frontal', 'Plancha abdominal'], eq: [] },
    'Dumbbell Row': { cat: 'Weightlifting', aliases: ['Remo Unilateral', 'Remo con mancuerna', 'Single Arm Row'], eq: ['Dumbbells'] },
    'Tricep Overhead Extension': { cat: 'Weightlifting', aliases: ['Tríceps Trasnuca', 'Copa Triceps', 'French Press'], eq: ['Dumbbells'] },
    'Lateral Raises': { cat: 'Weightlifting', aliases: ['Vuelos Laterales', 'Elevaciones Laterales'], eq: ['Dumbbells'] },
    'Rear Delt Fly': { cat: 'Weightlifting', aliases: ['Vuelos Posteriores', 'Pájaros', 'Elevación posterior'], eq: ['Dumbbells'] },
    'Leg Curl': { cat: 'Weightlifting', aliases: ['Curl Femoral', 'Hamstring Curl', 'Curl de pierna'], eq: ['Machine'] },
    'Abduction Machine': { cat: 'Weightlifting', aliases: ['Abducciones en máquina', 'Abducciones Maquina', 'Abductora'], eq: ['Machine'] },
    'Cable Glute Kickback': { cat: 'Weightlifting', aliases: ['Patada de glúteo en polea', 'Patada Glúteo Polea', 'Kickback de glúteo'], eq: ['Cable'] },
    'Box Step-Up': { cat: 'Weightlifting', aliases: ['Step-Up Lateral', 'Subidas al cajón', 'Step Up'], eq: ['Box', 'Dumbbells'] },
    'Farmer Carry': { cat: 'Monostructural', aliases: ['Caminata de granjero', 'Farmer Walk'], eq: ['Kettlebell', 'Dumbbells'] },
};

async function main() {
    console.log('Step 1: Ensure all exercises exist in library...');

    for (const [name, meta] of Object.entries(EXERCISES)) {
        const { data: existing } = await supabase.from('exercises').select('id, aliases').eq('name', name).maybeSingle();

        if (!existing) {
            const { error } = await supabase.from('exercises').insert({
                name, category: meta.cat, aliases: meta.aliases, equipment: meta.eq,
                description: 'Imported via fix script'
            });
            if (error) console.log(`  ❌ ${name}: ${error.message}`);
            else console.log(`  ➕ Created: ${name}`);
        } else {
            // Merge aliases
            const merged = [...new Set([...(existing.aliases || []), ...meta.aliases])];
            if (merged.length > (existing.aliases || []).length) {
                await supabase.from('exercises').update({ aliases: merged }).eq('id', existing.id);
                console.log(`  🏷️  Updated aliases: ${name}`);
            } else {
                console.log(`  ✅ OK: ${name}`);
            }
        }
    }

    console.log('\nStep 2: Rename blocks in Rutina Antopanti...');

    const { data: programs } = await supabase.from('programs').select('id').eq('name', 'Rutina Antopanti 2026');
    if (!programs?.length) { console.log('❌ Program not found!'); return; }

    const { data: mesos } = await supabase.from('mesocycles').select('id').eq('program_id', programs[0].id);
    const mesoIds = mesos?.map(m => m.id) || [];

    const { data: days } = await supabase.from('days').select('id').in('mesocycle_id', mesoIds);
    const dayIds = days?.map(d => d.id) || [];

    let renamed = 0;
    for (const [oldName, newName] of Object.entries(RENAMES)) {
        const { data, error } = await supabase.from('workout_blocks')
            .update({ name: newName })
            .in('day_id', dayIds)
            .eq('name', oldName)
            .select('id');

        if (data?.length) {
            console.log(`  🔄 "${oldName}" → "${newName}" (${data.length} blocks)`);
            renamed += data.length;
        }
    }

    console.log(`\n✅ Done! Renamed ${renamed} blocks.`);

    // Final check
    const { data: blocks } = await supabase.from('workout_blocks').select('name, type').in('day_id', dayIds);
    const { data: exercises } = await supabase.from('exercises').select('name');
    const exNames = new Set(exercises?.map(e => e.name.toLowerCase()));

    const missing = [];
    for (const b of (blocks || [])) {
        if (['strength_linear', 'accessory'].includes(b.type) && b.name && !exNames.has(b.name.toLowerCase())) {
            if (!missing.includes(b.name)) missing.push(b.name);
        }
    }

    if (missing.length) {
        console.log('\n⚠️  Still missing:');
        missing.forEach(n => console.log(`  ❌ ${n}`));
    } else {
        console.log('\n🎉 ALL blocks now match exercises in the library!');
    }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
