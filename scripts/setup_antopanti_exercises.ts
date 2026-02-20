import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const antopantiExercises = [
    // Day 1
    { name: 'Plancha frontal', aliases: ['Plancha'], cue: 'abdomen duro, glúteos apretados, cuerpo en línea.', category: 'Gymnastics' },
    { name: 'Puente glúteo', aliases: ['Puente de glúteo'], cue: 'empujá con talones, arriba apretá 1 segundo.', category: 'Functional Bodybuilding' },
    { name: 'Bird-Dog', aliases: ['Bird Dog', 'Bird-dog (brazo/pierna opuesta)'], cue: 'espalda neutra, no rote la cadera.', category: 'Functional Bodybuilding' },
    { name: 'Sentadillas al aire', aliases: ['Sentadillas aire', 'Air Squats', 'Sentadilla al aire'], cue: 'rodillas siguen la línea de los pies, tronco firme.', category: 'Gymnastics' },
    { name: 'Hip Thrust', aliases: ['Hip Thrust (barra)'], cue: 'mirada al frente, mentón levemente hacia el pecho, costillas "abajo", empujá con talones, arriba apretá glúteos sin hiperextender lumbar.', category: 'Weightlifting' },
    { name: 'Deadlift Convencional', aliases: ['Deadlift', 'Peso muerto'], cue: 'barra pegada a tibias, pecho "orgulloso", espalda neutra, empujá el piso, cerrá con glúteos.', category: 'Weightlifting' },
    { name: 'Sentadilla búlgara', aliases: ['Bulgarian Split Squat'], cue: 'incliná levemente el tronco hacia adelante para foco en glúteo, rodilla acompaña línea del pie, bajá controlado.', category: 'Functional Bodybuilding' },
    { name: 'Curl femoral', aliases: ['Curl femoral con mancuerna', 'Curl femoral con mancuerna (boca abajo)'], cue: 'atrapá la mancuerna con los pies, subí sin despegar cadera del banco/suelo, bajá lento.', category: 'Functional Bodybuilding' },
    { name: 'Abducciones en máquina', aliases: ['Máquina abductora', 'Abductor Machine'], cue: 'empujá "desde las rodillas", no rebotes; abrí y controlá el regreso.', category: 'Functional Bodybuilding' },
    { name: 'Estocadas con salto', aliases: ['Estocadas con salto con mancuernas', 'Jumping Lunges'], cue: 'caída suave, tronco firme.', category: 'Gymnastics' },
    { name: 'Sentadilla Goblet', aliases: ['Sentadillas con disco', 'Sentadillas con disco al pecho', 'Goblet Squat'], cue: 'codos abajo, pecho arriba, bajá a rango cómodo.', category: 'Functional Bodybuilding' },
    { name: 'Knees to Chest', aliases: ['Knees to Chest con disco', 'Knees to chest'], cue: 'no balancees, subí con abdomen.', category: 'Gymnastics' },

    // Day 2
    { name: 'Flexiones escapulares', aliases: ['Scapular Push-Ups'], cue: 'brazos estirados, movés solo escápulas.', category: 'Gymnastics' },
    { name: 'Gato-Vaca', aliases: ['Gato-vaca', 'Cat-Cow'], cue: 'movilidad suave, respiración controlada.', category: 'Gymnastics' },
    { name: 'Colgarse de barra', aliases: ['Dead Hang', 'Colgado activo'], cue: 'hombros "abajo", no te cuelgues de las orejas.', category: 'Gymnastics' },
    { name: 'Pull-Ups Negativos', aliases: ['Negative Pull-Ups'], cue: 'subí con ayuda/salto, bajá lento 3 segundos, control total.', category: 'Gymnastics' },
    { name: 'Press de banca plano', aliases: ['Press plano', 'Press plano con barra', 'Bench Press'], cue: 'escápulas juntas y abajo, pies firmes, bajá a línea del pecho, subí sin despegar glúteos.', category: 'Weightlifting' },
    { name: 'Remo unilateral', aliases: ['Remo unilateral con mancuerna', 'Remo a un brazo'], cue: 'tirá el codo al "bolsillo", hombro lejos de la oreja, torso estable.', category: 'Functional Bodybuilding' },
    { name: 'Extensión de tríceps trasnuca', aliases: ['Tríceps trasnuca', 'Tríceps trasnuca con mancuerna'], cue: 'codos cerrados, bajá controlado, extendé fuerte sin arquear espalda.', category: 'Functional Bodybuilding' },
    { name: 'Vuelos laterales', aliases: ['Vuelos laterales con mancuernas'], cue: 'sube el codo, no la mano; leve inclinación adelante, sin balanceo.', category: 'Functional Bodybuilding' },
    { name: 'Sprint', aliases: ['Sprints', 'Sprint 30"', 'Sprint 35"', 'Sprint 40"', 'Sprint 50"'], cue: 'sprint al 90–95% sostenido.', category: 'Monostructural' },

    // Day 3
    { name: 'Zancada más rotación', aliases: ['Zancada + rotación', 'Lunge with rotation'], cue: 'rotá desde columna torácica, pelvis estable.', category: 'Functional Bodybuilding' },
    { name: 'Y-T-W', aliases: ['Y-T-W en el suelo', 'Y-T-W (boca abajo)'], cue: 'hombros lejos de orejas, control.', category: 'Functional Bodybuilding' },
    { name: 'Sentadilla Trasera', aliases: ['Sentadilla trasera con barra', 'Back Squat'], cue: 'aire a la panza, abdomen duro, rodillas afuera, bajá controlado.', category: 'Weightlifting' },
    { name: 'Push-Ups', aliases: ['Flexiones de brazos', 'Push-ups', 'Push-Up'], cue: 'cuerpo en tabla, codos 30–45°, pecho al piso con control.', category: 'Gymnastics' },
    { name: 'Vuelos posteriores', aliases: ['Vuelos posteriores (mancuernas)', 'Pájaros'], cue: 'tronco inclinado, abrí como "alas", sin encoger trapecio.', category: 'Functional Bodybuilding' },
    { name: 'Step-Up lateral', aliases: ['Step-up lateral (cajón)'], cue: 'subí empujando solo con pierna de arriba, bajá lento, pelvis nivelada.', category: 'Functional Bodybuilding' },
    { name: 'Patada de glúteo en polea', aliases: ['Patada glúteo polea', 'Glute Kickback'], cue: 'pelvis quieta, no arquees lumbar, apretá glúteo arriba 1 segundo.', category: 'Functional Bodybuilding' },

    // Day 4
    { name: 'Buenos días', aliases: ['Good Mornings'], cue: 'bisagra de cadera, espalda neutra.', category: 'Weightlifting' },
    { name: 'Sprawls', aliases: ['Sprawl'], cue: 'rápido pero prolijo, tronco firme.', category: 'Gymnastics' },
    { name: 'Sentadilla salto', aliases: ['Sentadillas salto', 'Squat Jumps', 'Jump Squats'], cue: 'aterrizá suave, rodillas alineadas.', category: 'Gymnastics' },
    { name: 'Jumping Jacks', aliases: ['Jumping jacks'], cue: 'respiración rítmica.', category: 'Monostructural' },
    { name: 'Kettlebell Swings', aliases: ['KB swings'], cue: 'bisagra, cadera "dispara" la pesa, brazos ganchos.', category: 'Weightlifting' },
    { name: 'Wall Balls', aliases: ['Wall balls', 'Wall Balls 6 kg'], cue: 'sentadilla + empuje fluido, objetivo alto constante.', category: 'Weightlifting' },
    { name: 'Burpees', aliases: ['Burpee'], cue: 'ritmo constante, no te mates al inicio.', category: 'Gymnastics' },
    { name: 'Box Jumps', aliases: ['saltos al cajón', 'saltos/step-ups'], cue: 'eficiente, repetible.', category: 'Gymnastics' },
    { name: 'Farmer Carry', aliases: ['Paseo del granjero', 'Farmer carry'], cue: 'hombros abajo, postura alta, pasos firmes.', category: 'Functional Bodybuilding' },
    { name: 'Zona 2', aliases: ['Cardio Zona 2', 'Zone 2'], cue: 'podés hablar frases cortas sin ahogarte.', category: 'Monostructural' }
];

async function updateExercises() {
    console.log('Fetching existing exercises...');
    const { data: existing, error: fetchErr } = await supabase
        .from('exercises')
        .select('*');

    if (fetchErr) {
        console.error('Error fetching exercises:', fetchErr);
        return;
    }

    const existingMap = new Map();
    existing.forEach(ex => {
        existingMap.set(ex.name.toLowerCase(), ex);
        if (ex.aliases) {
            ex.aliases.forEach((alias: string) => existingMap.set(alias.toLowerCase(), ex));
        }
    });

    for (const newEx of antopantiExercises) {
        let match = null;

        if (existingMap.has(newEx.name.toLowerCase())) {
            match = existingMap.get(newEx.name.toLowerCase());
        } else {
            for (const alias of newEx.aliases) {
                if (existingMap.has(alias.toLowerCase())) {
                    match = existingMap.get(alias.toLowerCase());
                    break;
                }
            }
        }

        if (match) {
            console.log(`Found matching exercise for "${newEx.name}" -> DB Name: "${match.name}"`);

            // Combine aliases
            const currentAliases = match.aliases || [];
            const updatedAliases = Array.from(new Set([...currentAliases, ...newEx.aliases, newEx.name])).filter(a => typeof a === 'string' && a.toLowerCase() !== match.name.toLowerCase());

            const updateData: any = {};
            if (JSON.stringify(currentAliases.sort()) !== JSON.stringify(updatedAliases.sort())) {
                updateData.aliases = updatedAliases;
            }
            if (match.cue !== newEx.cue || match.description !== newEx.cue) {
                updateData.cue = newEx.cue;
                updateData.description = newEx.cue; // also set description just in case the UI falls back on it
            }

            if (Object.keys(updateData).length > 0) {
                const { error: updErr } = await supabase
                    .from('exercises')
                    .update(updateData)
                    .eq('id', match.id);

                if (updErr) console.error(`Failed to update ${match.name}:`, updErr);
                else console.log(`   Updated ${match.name} with new aliases/cue.`);
            } else {
                console.log(`   No updates needed for ${match.name}.`);
            }
        } else {
            console.log(`Creating new exercise "${newEx.name}"...`);
            const { error: insErr } = await supabase
                .from('exercises')
                .insert({
                    name: newEx.name,
                    category: newEx.category,
                    equipment: ['None'],
                    modality_suitability: ['Classic'],
                    aliases: newEx.aliases,
                    cue: newEx.cue,
                    description: newEx.cue,
                    tracking_parameters: { sets: true, reps: true, weight: true }
                });

            if (insErr) console.error(`Failed to create ${newEx.name}:`, insErr);
            else console.log(`   Created ${newEx.name}.`);
        }
    }

    console.log('Done!');
}

updateExercises();
