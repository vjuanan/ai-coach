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

    console.log('🚀 Starting "Rutina Antopanti 2026" Creation...');

    // --- HELPER: Ensure Exercise Exists with Aliases ---
    async function ensureExercise(name: string, category: string, aliases: string[] = [], defaultEquipment: string[] = []) {
        // 1. Try to find by Name
        let { data: existing } = await supabase.from('exercises')
            .select('id, aliases')
            .eq('name', name)
            .single();

        // 2. If not found, try to find by Alias (using overlaps operator &&)
        if (!existing && aliases.length > 0) {
            const { data: byAlias } = await supabase.from('exercises')
                .select('id, aliases')
                .contains('aliases', aliases) // usage of contains for array? actually aliases is text[], contains works if row has all tags. overlaps (&&) is better but supabase js syntax: .overlaps('aliases', aliases)
                .limit(1)
                .maybeSingle();

            if (byAlias) {
                existing = byAlias;
                console.log(`   found "${name}" via alias match.`);
            }
        }

        // 3. If still not found, try exact match on known aliases loop (slower but safer if array ops fail)
        if (!existing && aliases.length > 0) {
            // simplify: just create if not found by name for now, or trust the user input names match mostly.
            // But valid standard exercises might exist like "Back Squat" for "Sentadilla Trasera".
            // Let's assume we want to map "Sentadilla Trasera" -> "Back Squat" if it exists.
            // For this script, I will try to use the English standard name if I know it, or just create it.
            // Given the user prompt says "busca con variaciones... Si encontras varios... agrega el alias".
        }

        if (!existing) {
            console.log(`   + Creating ${name} [Aliases: ${aliases.join(', ')}]`);
            const { data, error } = await supabase.from('exercises').insert({
                name: name,
                category: category,
                aliases: aliases,
                equipment: defaultEquipment,
                description: "Imported via Antopanti Script"
            }).select('id').single();

            if (error) {
                console.error(`Error creating ${name}:`, error.message);
                return null;
            }
            return data.id;
        } else {
            // Update aliases if needed
            const currentAliases = existing.aliases || [];
            const newAliases = [...new Set([...currentAliases, ...aliases])];

            if (newAliases.length > currentAliases.length) {
                console.log(`   ^ Updating aliases for ${name}`);
                await supabase.from('exercises').update({ aliases: newAliases }).eq('id', existing.id);
            }
            return existing.id;
        }
    }

    // --- 0. Ensure Exercises ---
    // Mapping user names to potential standard names or just creating them.
    // Spec: "Sentadilla Trasera" -> "Back Squat"

    console.log('💪 Checking/Inserting Exercises...');

    // Core Lifts & Variations
    await ensureExercise("Hip Thrust", "Weightlifting", ["Hip Thrust con barra", "Puente de glúteo con barra"], ["Barbell", "Bench"]);
    await ensureExercise("Deadlift", "Weightlifting", ["Peso Muerto", "Deadlift Convencional", "Peso Muerto Convencional"], ["Barbell"]);
    await ensureExercise("Back Squat", "Weightlifting", ["Sentadilla Trasera", "Sentadilla con barra"], ["Barbell", "Rack"]);
    await ensureExercise("Bulgarian Split Squat", "Weightlifting", ["Sentadilla Búlgara", "Sentadilla bulgara"], ["Dumbbells", "Bench"]);
    await ensureExercise("Bench Press", "Weightlifting", ["Press Plano", "Press plano con barra", "Press de banca"], ["Barbell", "Bench"]);
    await ensureExercise("Strict Press", "Weightlifting", ["Press Militar", "Shoulder Press"], ["Barbell"]);
    await ensureExercise("Pull-Up", "Gymnastics", ["Dominadas", "Pull ups"], ["Pull-up Bar"]);
    await ensureExercise("Negative Pull-Up", "Gymnastics", ["Dominadas Negativas", "Negative Pull-Ups"], ["Pull-up Bar"]);

    // Accessory / Isolation
    await ensureExercise("Dumbbell Row", "Weightlifting", ["Remo Unilateral", "Remo con mancuerna", "Remo unilateral con mancuerna"], ["Dumbbells"]);
    await ensureExercise("Tricep Overhead Extension", "Weightlifting", ["Tríceps Trasnuca", "Copa Triceps"], ["Dumbbells"]);
    await ensureExercise("Lateral Raises", "Weightlifting", ["Vuelos Laterales", "Elevaciones Laterales"], ["Dumbbells"]);
    await ensureExercise("Rear Delt Fly", "Weightlifting", ["Vuelos Posteriores", "Pájaros"], ["Dumbbells"]);
    await ensureExercise("Leg Curl", "Weightlifting", ["Curl Femoral", "Isquios en máquina", "Curl femoral con mancuerna"], ["Machine", "Dumbbells"]);
    await ensureExercise("Abduction Machine", "Weightlifting", ["Abducciones en máquina", "Sillón de abductores"], ["Machine"]);
    await ensureExercise("Cable Glute Kickback", "Weightlifting", ["Patada de glúteo en polea"], ["Cable"]);
    await ensureExercise("Box Step-Up", "Weightlifting", ["Step-Up Lateral", "Subidas al cajón"], ["Box", "Dumbbells"]);

    // Warmup / Mobility / Core
    await ensureExercise("Plank", "Gymnastics", ["Plancha", "Plancha Frontal"], []);
    await ensureExercise("Glute Bridge", "Gymnastics", ["Puente de glúteo", "Puente gloteo"], []);
    await ensureExercise("Bird Dog", "Gymnastics", ["Bird-Dog", "Cuadrupedia cruzada"], []);
    await ensureExercise("Air Squat", "Gymnastics", ["Sentadillas aire", "Sentadillas sin peso"], []);
    await ensureExercise("Scapular Push-Up", "Gymnastics", ["Flexiones escapulares"], []);
    await ensureExercise("Cat-Cow", "Gymnastics", ["Gato-Vaca", "Cat Cow"], []);
    await ensureExercise("Dead Hang", "Gymnastics", ["Colgarse de barra"], ["Pull-up Bar"]);
    await ensureExercise("Lunge with Rotation", "Gymnastics", ["Zancada + rotación", "Estocada con rotacion"], []);
    await ensureExercise("Prone Y-T-W", "Gymnastics", ["Y-T-W en el suelo", "YTW"], []);
    await ensureExercise("Good Morning", "Weightlifting", ["Buenos días"], ["Barbell"]); // Or bodyweight? User says "Activation", likely bodyweight or light.
    await ensureExercise("Sprawl", "Gymnastics", ["Sprawls", "Medio Burpee"], []);
    await ensureExercise("Jump Squat", "Gymnastics", ["Sentadillas salto", "Sentadilla con salto"], []);
    await ensureExercise("Jumping Jack", "Monostructural", ["Jumping jacks", "Angelitos"], []);
    await ensureExercise("Knees to Chest", "Gymnastics", ["Knees to Chest con disco", "Rodillas al pecho"], []);

    // Conditioning / Metcon items
    await ensureExercise("Dumbbell Walking Lunge", "Weightlifting", ["Estocadas con salto con mancuernas", "Estocadas caminadas"], ["Dumbbells"]); // User says "Estocadas con salto" -> Jumping Lunges
    await ensureExercise("Jumping Lunge", "Gymnastics", ["Estocadas con salto", "Jumping Lunges"], ["Dumbbells"]);
    await ensureExercise("Goblet Squat", "Weightlifting", ["Sentadillas con disco al pecho", "Sentadilla Goblet"], ["Kettlebell", "Dumbbells", "Plate"]);
    await ensureExercise("Sprint", "Monostructural", ["Sprints", "Correr"], []);
    await ensureExercise("Push-Up", "Gymnastics", ["Push-Ups", "Flexiones de brazos"], []);
    await ensureExercise("Kettlebell Swing", "Weightlifting", ["Kettlebell Swings", "KB Swing"], ["Kettlebell"]);
    await ensureExercise("Wall Ball", "Weightlifting", ["Wall Balls", "Lanzamiento de balón"], ["Medicine Ball"]);
    await ensureExercise("Burpee", "Gymnastics", ["Burpees"], []);
    await ensureExercise("Box Jump", "Gymnastics", ["Saltos al cajón", "Box Jumps"], ["Box"]);
    await ensureExercise("Farmer Carry", "Monostructural", ["Farmer Carry", "Caminata de granjero"], ["Kettlebell", "Dumbbells"]);
    await ensureExercise("Run (Zone 2)", "Monostructural", ["Zona 2", "Correr suave"], []);


    // 1. Get Coach
    const { data: coaches } = await supabase.from('coaches').select('id').limit(1);
    const coachId = coaches?.[0]?.id;
    if (!coachId) { console.error('❌ No coach found'); process.exit(1); }

    // 2. Create Program
    console.log('📘 Creating Program: Rutina Antopanti 2026...');
    const programName = "Rutina Antopanti 2026";

    // Cleanup existing
    const { data: existingProgs } = await supabase.from('programs').select('id').eq('name', programName);
    if (existingProgs?.length) {
        for (const p of existingProgs) {
            await supabase.from('workout_blocks').delete().in('day_id', (await supabase.from('days').select('id').in('mesocycle_id', (await supabase.from('mesocycles').select('id').eq('program_id', p.id)).data!.map(m => m.id))).data!.map(d => d.id));
            await supabase.from('days').delete().in('mesocycle_id', (await supabase.from('mesocycles').select('id').eq('program_id', p.id)).data!.map(m => m.id));
            await supabase.from('mesocycles').delete().eq('program_id', p.id);
            await supabase.from('programs').delete().eq('id', p.id);
        }
    }

    const { data: newProg, error } = await supabase.from('programs').insert({
        coach_id: coachId,
        name: programName,
        description: "Programación de fuerza y estética. Foco en Glúteo, Pierna y Upper Body Toning.",
        status: 'active'
    }).select().single();

    if (error) { console.error('❌ Error creating program:', error); process.exit(1); }
    const programId = newProg.id;

    // Helper to insert blocks
    async function addBlock(dayId: string, idx: number, type: string, name: string, config: any, section: 'warmup' | 'main' | 'cooldown' = 'main') {
        await supabase.from('workout_blocks').insert({
            day_id: dayId,
            order_index: idx,
            type: type,
            name: name,
            config: config,
            section: section
        });
    }

    // --- Create 4 Weeks ---
    const weeks = [1, 2, 3, 4];

    // DATA CONSTANTS
    const ACTIVATION_D1 = {
        rounds: 3,
        movements: [
            "Plancha: 30” (Cue: abdomen duro, glúteos apretados, cuerpo en línea)",
            "Puente de glúteo: 15 reps (Cue: empujá con talones, arriba apretá 1s)",
            "Bird-Dog: 10 total (Cue: espalda neutra, no rote cadera)",
            "Sentadillas aire: 10 reps (Cue: rodillas siguen línea de pies)"
        ]
    };

    const ACTIVATION_D2 = {
        rounds: 3,
        movements: [
            "Flexiones escapulares: 10 reps (Cue: brazos estirados, movés solo escápulas)",
            "Gato-Vaca: 10 reps (Cue: movilidad suave)",
            "Colgarse de barra: 20” (Cue: hombros abajo)"
        ]
    };

    const ACTIVATION_D3 = {
        rounds: 3,
        movements: [
            "Zancada + rotación: 6 total (Cue: rotá desde columna torácica)",
            "Y-T-W en el suelo: 10 total (Cue: hombros lejos de orejas)",
            "Sentadillas aire: 10 reps"
        ]
    };

    const ACTIVATION_D4 = {
        rounds: 3,
        movements: [
            "Buenos días: 10 reps (Cue: bisagra de cadera)",
            "Sprawls: 5 reps (Cue: rápido pero prolijo)",
            "Sentadillas salto: 10 reps (Cue: aterrizá suave)",
            "Jumping jacks: 20 reps"
        ]
    };

    for (const weekNum of weeks) {
        console.log(`   📅 Week ${weekNum}...`);
        const { data: meso } = await supabase.from('mesocycles').insert({
            program_id: programId, week_number: weekNum, focus: weekNum === 4 ? "Deload / Peak" : "Accumulation"
        }).select().single();
        const mId = meso.id;

        // --- DAY 1: Glúteo & Pierna ---
        const { data: d1 } = await supabase.from('days').insert({ mesocycle_id: mId, day_number: 1, name: "Día 1: Glúteo & Pierna (Fuerza)" }).select().single();

        // Warmup
        await addBlock(d1.id, 0, 'warmup', 'Activación (3 series)', {
            rounds: 3,
            movements: ACTIVATION_D1.movements
        }, 'warmup');

        // Main
        let hipThrustLoad = "75 kg"; if (weekNum == 2) hipThrustLoad = "80 kg"; if (weekNum == 3) hipThrustLoad = "85 kg"; if (weekNum == 4) hipThrustLoad = "90 kg";
        let hipThrustReps = "10"; if (weekNum == 2) hipThrustReps = "12"; if (weekNum == 4) hipThrustReps = "8";
        let hipThrustSets = 3; if (weekNum >= 3) hipThrustSets = 4;

        await addBlock(d1.id, 1, 'strength_linear', 'Hip Thrust (barra)', {
            sets: hipThrustSets, reps: hipThrustReps, weight: hipThrustLoad, rir: weekNum === 4 ? 3 : 1, rest: "2-3 min",
            notes: "Cue: mirada al frente, mentón levemente hacia el pecho, costillas “abajo”, empujá con talones, arriba apretá glúteos sin hiperextender lumbar."
        });

        let deadLoad = "50 kg"; if (weekNum == 2) deadLoad = "52.5 kg"; if (weekNum == 3) deadLoad = "55 kg"; if (weekNum == 4) deadLoad = "57.5 kg";
        let deadReps = "5"; if (weekNum == 3) deadReps = "4"; if (weekNum == 4) deadReps = "3";
        let deadSets = 3; if (weekNum >= 3) deadSets = 4;

        await addBlock(d1.id, 2, 'strength_linear', 'Deadlift Convencional', {
            sets: deadSets, reps: deadReps, weight: deadLoad, rir: weekNum === 4 ? 3 : 2, rest: "3 min",
            notes: "Cue: barra pegada a tibias, pecho “orgulloso”, espalda neutra, empujá el piso, cerrá con glúteos."
        });

        // Superserie A
        let bulgReps = weekNum === 4 ? "8" : (weekNum === 3 ? "12" : (weekNum === 2 ? "10" : "8"));
        let bulgWeight = weekNum === 4 ? "12 kg" : "10 kg";
        await addBlock(d1.id, 3, 'strength_linear', '3A. Sentadilla Búlgara', {
            sets: 3, reps: bulgReps, weight: bulgWeight, rir: 2, rest: "0 min", notes: "Cue: incliná levemente el tronco hacia adelante para foco en glúteo."
        });
        await addBlock(d1.id, 4, 'strength_linear', '3B. Plancha Frontal', {
            sets: 3, reps: "45-60s", rest: "2 min", notes: "Cue: glúteos y abdomen apretados, no “cuelgues” la cintura."
        });

        // Accessories
        let curlReps = weekNum === 1 ? "12" : (weekNum === 2 ? "15" : "12");
        let curlSets = weekNum >= 3 ? 4 : 3;
        await addBlock(d1.id, 5, 'accessory', 'Curl Femoral', {
            sets: curlSets, reps: curlReps, weight: weekNum >= 3 ? "12kg" : "10kg", rir: 1, rest: "90s", notes: "Cue: bajá lento."
        });

        let abdReps = weekNum === 1 ? "15" : "20";
        if (weekNum === 3) abdReps = "15";
        let abdSets = weekNum >= 3 ? 4 : 3;
        await addBlock(d1.id, 6, 'accessory', 'Abducciones Maquina', {
            sets: abdSets, reps: abdReps, weight: "35-45kg", rir: 0, rest: "60-90s", notes: "Cue: empujá desde las rodillas, no rebotes."
        });

        // Condicionamiento
        await addBlock(d1.id, 7, 'metcon_structured', 'EMOM 6: Piernas', {
            format: "EMOM", minutes: 6,
            movements: [
                "Min 1: 20 Estocadas con salto (Jumping Lunges)",
                "Min 2: 12 Sentadillas con disco (Goblet Squat) [12kg]"
            ],
            notes: "Calidad sobre velocidad."
        });

        await addBlock(d1.id, 8, 'finisher', 'Core Finisher', {
            rounds: 1, movements: ["Knees to Chest con disco: 30 reps (Cue: no balancees, subí con abdomen)"]
        });


        // --- DAY 2: Upper Body ---
        const { data: d2 } = await supabase.from('days').insert({ mesocycle_id: mId, day_number: 2, name: "Día 2: Upper Body + Pull-Up" }).select().single();

        await addBlock(d2.id, 0, 'warmup', 'Activación', { rounds: 3, movements: ACTIVATION_D2.movements }, 'warmup');

        if (weekNum === 4) {
            await addBlock(d2.id, 1, 'strength_linear', 'Pull-Up (Intento)', {
                sets: 3, reps: "1", notes: "Intento de pull up estricta. Cue: arrancá con escápulas abajo.", rest: "2-3 min"
            });
            await addBlock(d2.id, 2, 'strength_linear', 'Press Plano', {
                sets: 4, reps: "6", weight: "30 kg", rpe: 8, rest: "2-3 min", notes: "Cue: escápulas juntas y abajo."
            });
        } else {
            let negSets = weekNum === 3 ? 5 : 4;
            let negTempo = weekNum === 1 ? "3s" : "5s";
            await addBlock(d2.id, 1, 'strength_linear', 'Negative Pull-Ups', {
                sets: negSets, reps: "3", tempo: negTempo, rest: "2 min", notes: "Cue: subí con ayuda, bajá lento control total."
            });

            let pressSets = 3;
            let pressReps = weekNum === 3 ? "8" : "10";
            await addBlock(d2.id, 2, 'strength_linear', 'Press Plano', {
                sets: pressSets, reps: pressReps, weight: weekNum === 3 ? "25 kg" : "22.5 kg", rir: 2, rest: "2 min", notes: "Cue: pies firmes, bajá a línea del pecho."
            });
        }

        // Superserie A
        let rowReps = weekNum === 1 ? "10" : (weekNum === 4 ? "10" : (weekNum === 3 ? "10" : "12"));
        let rowSets = weekNum >= 3 ? 4 : 3;
        let rowWeight = weekNum >= 3 ? (weekNum === 4 ? "16kg" : "14kg") : (weekNum === 2 ? "12kg" : "10-12kg");

        await addBlock(d2.id, 3, 'strength_linear', '3A. Remo Unilateral', {
            sets: rowSets, reps: rowReps, weight: rowWeight, rir: 1, rest: "0 min", notes: "Cue: tirá el codo al bolsillo."
        });

        let triSets = weekNum >= 3 ? 4 : 3;
        let triReps = weekNum === 1 ? "12" : (weekNum === 2 ? "15" : (weekNum === 3 ? "12" : "15"));
        await addBlock(d2.id, 4, 'strength_linear', '3B. Tríceps Trasnuca', {
            sets: triSets, reps: triReps, weight: "6-8 kg", rir: 1, rest: "90s", notes: "Cue: codos cerrados."
        });

        // Vuelos
        let latSets = weekNum === 4 ? 4 : 3;
        let latReps = weekNum === 3 ? "20" : "15";
        await addBlock(d2.id, 5, 'accessory', 'Vuelos Laterales', {
            sets: latSets, reps: latReps, weight: "4-6 kg", rir: 0, rest: "60s", notes: "Cue: sube el codo, no la mano."
        });

        // Sprints
        let rounds = weekNum === 1 ? 8 : (weekNum === 2 ? 8 : (weekNum === 3 ? 7 : 6));
        let work = weekNum === 1 ? "30s" : (weekNum === 2 ? "35s" : (weekNum === 3 ? "40s" : "50s"));
        await addBlock(d2.id, 6, 'conditioning', 'Sprints', {
            format: "Intervals", rounds: rounds, work: work, rest: "1:00", notes: "Cue: sprint al 90-95%, descanso suave."
        });


        // --- DAY 3: Full Body ---
        const { data: d3 } = await supabase.from('days').insert({ mesocycle_id: mId, day_number: 3, name: "Día 3: Full Body Mix" }).select().single();

        await addBlock(d3.id, 0, 'warmup', 'Activación', { rounds: 3, movements: ACTIVATION_D3.movements }, 'warmup');

        let sqSets = weekNum >= 3 ? (weekNum === 4 ? 3 : 4) : 3;
        let sqReps = weekNum === 4 ? "6" : (weekNum === 3 ? "8" : "10");
        let sqWeight = weekNum === 4 ? "50 kg" : (weekNum === 3 ? "45 kg" : "40 kg");
        await addBlock(d3.id, 1, 'strength_linear', 'Sentadilla Trasera', {
            sets: sqSets, reps: sqReps, weight: sqWeight, rir: 2, rest: "2-3 min", notes: "Cue: aire a la panza, rodillas afuera."
        });

        // Super A
        let pushSets = weekNum >= 3 ? 5 : 4;
        let pushReps = weekNum === 2 ? "10" : (weekNum === 1 ? "8" : (weekNum === 3 ? "10" : "Al fallo"));
        await addBlock(d3.id, 2, 'strength_linear', '2A. Push-Ups', {
            sets: pushSets, reps: pushReps, rir: 1, rest: "0 min", notes: "Cue: cuerpo en tabla."
        });

        let flySets = weekNum >= 3 ? 4 : 3;
        let flyReps = weekNum === 3 ? "12" : (weekNum === 4 ? "15" : "12"); // Sem 1 12, Sem 2 15? Sem 2 15.
        if (weekNum == 2) flyReps = "15";
        await addBlock(d3.id, 3, 'strength_linear', '2B. Vuelos Posteriores', {
            sets: flySets, reps: flyReps, weight: "4-6 kg", rir: 1, rest: "90s", notes: "Cue: abrí como alas."
        });

        // Super B
        let stepSets = 3;
        let stepReps = weekNum === 3 ? "12" : (weekNum === 4 ? "8" : (weekNum === 2 ? "10" : "8"));
        await addBlock(d3.id, 4, 'strength_linear', '3A. Step-Up Lateral', {
            sets: stepSets, reps: stepReps, weight: weekNum === 4 ? "12kg" : "10kg", rir: 2, rest: "0 min", notes: "Cue: empujá con pierna de arriba."
        });

        let kickSets = weekNum >= 3 ? 4 : 3;
        let kickReps = weekNum === 1 ? "15" : (weekNum === 2 ? "20" : (weekNum === 3 ? "15" : "20"));
        await addBlock(d3.id, 5, 'strength_linear', '3B. Patada Glúteo Polea', {
            sets: kickSets, reps: kickReps, weight: "15-20kg", rir: 0, rest: "60-90s", notes: "Cue: pelvis quieta, apretá glúteo."
        });

        await addBlock(d3.id, 6, 'conditioning', 'Sprints', {
            format: "Intervals", rounds: rounds, work: work, rest: "1:00", notes: "Igual que día 2."
        });


        // --- DAY 4: Cardio & Tono ---
        const { data: d4 } = await supabase.from('days').insert({ mesocycle_id: mId, day_number: 4, name: "Día 4: Cardio & Tono (Metabólico)" }).select().single();

        await addBlock(d4.id, 0, 'warmup', 'Activación', { rounds: 3, movements: ACTIVATION_D4.movements }, 'warmup');

        let emomMin = weekNum === 1 ? 10 : (weekNum === 2 ? 12 : (weekNum === 3 ? 14 : 12));
        await addBlock(d4.id, 1, 'metcon_structured', `EMOM ${emomMin}: Swings & Plank`, {
            format: "EMOM", minutes: emomMin,
            movements: [
                "Min par: 12 KB Swings (12-16kg) (Cue: bisagra, cadera dispara)",
                "Min impar: 30s Plancha (Cue: abdomen duro)"
            ]
        });

        await addBlock(d4.id, 2, 'metcon_structured', 'AMRAP 12: Wall Balls & Burpees', {
            format: "AMRAP", minutes: 12,
            movements: [
                "10 Wall Balls (6kg)",
                "10 Burpees",
                "10 Box Jumps / Step-Ups (50cm)"
            ],
            notes: "Cue: ritmo constante."
        });

        await addBlock(d4.id, 3, 'accessory', 'Farmer Carry', {
            sets: 3, reps: "30-40m", weight: "10-12kg/lado", rest: "60s", notes: "Cue: hombros abajo, postura alta."
        });

        let z2Time = weekNum === 1 ? "35min" : (weekNum === 2 ? "40min" : (weekNum === 3 ? "45min" : "50min"));
        await addBlock(d4.id, 4, 'conditioning', 'Zona 2', {
            time: z2Time, notes: "Cue: podés hablar frases cortas sin ahogarte."
        });

    }

    console.log('✅ "Rutina Antopanti 2026" Created Successfully!');
}

runMigration().catch(console.error);
