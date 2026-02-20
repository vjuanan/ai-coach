
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const COACH_ID = 'f211afb5-d1c3-4c9c-8bd6-695368c11cd9'; // Dev Coach
const CLIENT_ID = 'ecf20550-3cb3-42e9-bddf-e9ec0068fc3a'; // Antonella Barone

async function run() {
    console.log('Generating Program: Rutina Antopanti SUPREMA');

    // 0. Cleanup existing program with same name
    await supabase
        .from('programs')
        .delete()
        .eq('name', 'Rutina Antopanti SUPREMA')
        .eq('client_id', CLIENT_ID);

    // 1. Create Program
    const { data: program, error: programError } = await supabase
        .from('programs')
        .insert({
            coach_id: COACH_ID,
            client_id: CLIENT_ID,
            name: 'Rutina Antopanti SUPREMA',
            description: 'Programa completo de 4 semanas enfocado en Fuerza y Tono.',
            status: 'active'
        })
        .select()
        .single();

    if (programError) {
        console.error('Error creating program:', programError);
        return;
    }

    const programId = program.id;
    console.log(`Program created: ${programId}`);

    // Weeks loop
    for (let week = 1; week <= 4; week++) {
        console.log(`Generating Week ${week}...`);

        // 2. Create Mesocycle for this week
        const { data: meso, error: mesoError } = await supabase
            .from('mesocycles')
            .insert({
                program_id: programId,
                week_number: week,
                focus: `Semana ${week} - Fase de ${week === 4 ? 'Intensificación' : 'Acumulación'}`
            })
            .select()
            .single();

        if (mesoError) {
            console.error(`Error creating mesocycle week ${week}:`, mesoError);
            continue;
        }

        const mesoId = meso.id;

        // Days loop (1-7)
        for (let dayNum = 1; dayNum <= 7; dayNum++) {
            let dayName = '';
            let isRest = false;

            switch (dayNum) {
                case 1: dayName = 'Glúteo & Pierna'; break;
                case 2: dayName = 'Upper Body + Pull-Up'; break;
                case 3: dayName = 'Rest Day'; isRest = true; break;
                case 4: dayName = 'Full Body Mix'; break;
                case 5: dayName = 'Cardio & Tono'; break;
                case 6: dayName = 'Rest Day'; isRest = true; break;
                case 7: dayName = 'Rest Day'; isRest = true; break;
            }

            // 3. Create Day
            const { data: day, error: dayError } = await supabase
                .from('days')
                .insert({
                    mesocycle_id: mesoId,
                    day_number: dayNum,
                    name: dayName,
                    is_rest_day: isRest
                })
                .select()
                .single();

            if (dayError) {
                console.error(`Error creating day ${dayNum} week ${week}:`, dayError);
                continue;
            }

            if (isRest) continue;

            const dayId = day.id;
            const blocks = [];

            // Define blocks based on day and week
            if (dayNum === 1) { // Glúteo & Pierna
                // Warmup
                blocks.push({
                    day_id: dayId,
                    order_index: 0,
                    type: 'warmup',
                    name: 'Activación',
                    config: {
                        rounds: 3,
                        movements: [
                            { name: 'Plank', quantity: '30"', notes: 'abdomen duro, glúteos apretados, cuerpo en línea.' },
                            { name: 'Glute Bridge', quantity: '15', notes: 'empujá con talones, arriba apretá 1 segundo.' },
                            { name: 'Bird Dog', quantity: '10 total', notes: 'espalda neutra, no rote la cadera.' },
                            { name: 'Air Squat', quantity: '10', notes: 'rodillas siguen la línea de los pies, tronco firme.' }
                        ]
                    },
                    format: 'STANDARD'
                });

                // Main lifts: Hip Thrust
                let htSets = week <= 2 ? 3 : 4;
                let htReps = week === 1 ? 10 : (week === 2 ? 12 : (week === 3 ? 10 : 8));
                let htWeight = 75 + (week - 1) * 5;
                blocks.push({
                    day_id: dayId,
                    order_index: 1,
                    type: 'strength_linear',
                    name: 'Hip Thrust',
                    config: {
                        sets: htSets,
                        reps: htReps,
                        weight: htWeight,
                        rest: '2-3 min',
                        notes: 'Foco en glúteo mayor. Explosivo arriba, pausa 1s.'
                    }
                });

                // Main lifts: Deadlift
                let dlSets = week <= 2 ? 3 : 4;
                let dlReps = week === 1 ? 5 : (week === 2 ? 5 : (week === 3 ? 4 : 3));
                let dlWeight = 50 + (week - 1) * 2.5;
                blocks.push({
                    day_id: dayId,
                    order_index: 2,
                    type: 'strength_linear',
                    name: 'Deadlift',
                    config: {
                        sets: dlSets,
                        reps: dlReps,
                        weight: dlWeight,
                        rest: '3 min',
                        notes: 'Técnica perfecta, espalda neutra.'
                    }
                });

                // Superset A: Bulgarian Squat + Plank
                let bgReps = week === 1 ? 8 : (week === 2 ? 10 : (week === 3 ? 12 : 8));
                let bgWeight = week === 4 ? '12 kg' : '10 kg';
                blocks.push({
                    day_id: dayId,
                    order_index: 3,
                    type: 'accessory',
                    name: 'Superserie A',
                    format: 'STANDARD',
                    config: {
                        format: 'SUPER_SET',
                        methodology_code: 'SUPER_SET',
                        sets: 3,
                        restBetweenSets: '90s',
                        movements: [
                            { name: 'Bulgarian Split Squat', reps: bgReps, weight: bgWeight, notes: 'incliná levemente el tronco hacia adelante para foco en glúteo.' },
                            { name: 'Plank', reps: '45-60"', weight: 'BW', notes: 'glúteos y abdomen apretados, no “cuelgues” la cintura.' }
                        ]
                    }
                });

                // Femoral Curl
                blocks.push({
                    day_id: dayId,
                    order_index: 5, // Adjusted from 4
                    type: 'strength_linear',
                    name: 'Leg Curl',
                    config: {
                        sets: 3,
                        reps: 12,
                        weight: '10kg',
                        rest: '60s',
                        notes: 'Controlá la excéntrica.'
                    }
                });

                // Abductions
                blocks.push({
                    day_id: dayId,
                    order_index: 5,
                    type: 'strength_linear',
                    name: 'Abduction Machine',
                    config: {
                        sets: 3,
                        reps: 15,
                        weight: '20-30kg',
                        rest: '60s',
                        notes: '3 series de 15 reps + drop set última serie.'
                    }
                });

                // EMOM 6
                blocks.push({
                    day_id: dayId,
                    order_index: 6,
                    type: 'metcon_structured',
                    name: 'Condicionamiento',
                    format: 'EMOM',
                    config: {
                        minutes: 6,
                        movements: [
                            '20 Estocadas con Salto con Mancuernas',
                            '12 Sentadillas con Disco al Pecho (10 kg)'
                        ]
                    }
                });

                // Core Finisher
                blocks.push({
                    day_id: dayId,
                    order_index: 7,
                    type: 'finisher',
                    name: 'Core finisher',
                    format: 'STANDARD',
                    config: {
                        movements: [{ name: 'Knees to Chest', reps: 30, weight: '2.5-5 kg', notes: 'con disco - no balancees, subí con abdomen.' }]
                    }
                });
            } else if (dayNum === 2) { // Upper Body
                // Warmup
                blocks.push({
                    day_id: dayId,
                    order_index: 0,
                    type: 'warmup',
                    name: 'Activación',
                    config: {
                        rounds: 3,
                        movements: [
                            { name: 'Scapular Push-Up', quantity: '10', notes: 'brazos estirados, movés solo escápulas.' },
                            { name: 'Cat-Cow', quantity: '10', notes: 'movilidad suave.' },
                            { name: 'Dead Hang', quantity: '20"', notes: 'hombros abajo.' }
                        ]
                    },
                    format: 'STANDARD'
                });

                // Pullup Negatives (or Pullup attempt week 4)
                if (week < 4) {
                    let negSec = week === 1 ? 3 : 5;
                    let negSets = week <= 2 ? 4 : 5;
                    blocks.push({
                        day_id: dayId,
                        order_index: 1,
                        type: 'strength_linear',
                        name: 'Negative Pull-Up',
                        config: {
                            sets: negSets,
                            reps: 3,
                            weight: 'BW',
                            rest: '90s',
                            notes: `Controlá la bajada ${negSec}-5 seg.`
                        }
                    });
                } else {
                    blocks.push({
                        day_id: dayId,
                        order_index: 1,
                        type: 'strength_linear',
                        name: 'Pull-Up',
                        config: {
                            sets: 3,
                            reps: '1 (intento)',
                            weight: 'BW',
                            rest: '2 min',
                            notes: 'arrancá con escápulas abajo, pecho a barra.'
                        }
                    });
                }

                // Buenos Días (new block)
                blocks.push({
                    day_id: dayId,
                    order_index: 0, // This order index will need to be adjusted if it's not meant to be 0
                    type: 'strength_linear',
                    name: 'Good Morning',
                    config: {
                        sets: 3,
                        reps: 10,
                        weight: 'Barra',
                        rest: '90s',
                        notes: 'Enfoque en isquios.'
                    }
                });

                // Bench Press
                let bpReps = week === 3 ? 8 : (week === 4 ? 6 : 10);
                let bpWeight = week === 1 ? 'Barra Sola' : (week === 2 ? 'Subir levemente' : (week === 3 ? 'Más pesado' : 'Pesado'));
                let bpSets = week === 4 ? 4 : 3;
                blocks.push({
                    day_id: dayId,
                    order_index: 2,
                    type: 'strength_linear',
                    name: 'Bench Press',
                    config: {
                        sets: bpSets,
                        reps: bpReps,
                        weight: bpWeight,
                        rest: '2 min',
                        notes: 'escápulas juntas y abajo, pies firmes.'
                    }
                });

                // Superset A: Row + Triceps
                let rowReps = week === 1 ? 10 : (week === 2 ? 12 : 10);
                let rowWeight = week === 1 ? '10-12 kg' : (week === 2 ? '12 kg' : (week === 3 ? '14 kg' : '16 kg'));
                let triReps = week === 1 ? 12 : 15;
                let triSets = week <= 2 ? 3 : 4;
                blocks.push({
                    day_id: dayId,
                    order_index: 3,
                    type: 'accessory',
                    name: 'Superserie A',
                    format: 'STANDARD',
                    config: {
                        format: 'SUPER_SET',
                        methodology_code: 'SUPER_SET',
                        sets: triSets,
                        restBetweenSets: '90s',
                        movements: [
                            { name: 'Dumbbell Row', reps: rowReps, weight: rowWeight, notes: 'tirá el codo al bolsillo.' },
                            { name: 'Tricep Overhead Extension', reps: triReps, weight: '8-10 kg', notes: 'codos cerrados.' }
                        ]
                    }
                });

                // Lateral Raise
                let lrSets = week === 4 ? 4 : 3;
                let lrReps = week === 3 ? 20 : 15;
                let lrWeight = week === 1 ? '4-5 kg' : (week === 4 ? '6 kg' : '5 kg');
                blocks.push({
                    day_id: dayId,
                    order_index: 4,
                    type: 'strength_linear',
                    name: 'Lateral Raises',
                    config: {
                        sets: 3,
                        reps: 15,
                        weight: '3-4kg',
                        rest: '60s',
                        notes: 'Controlados.'
                    }
                });

                // Sprints
                let spTime = week === 1 ? '30"' : (week === 2 ? '35"' : (week === 3 ? '40"' : '50"'));
                let spRounds = week === 1 ? 8 : (week === 2 ? 8 : (week === 3 ? 7 : 6));
                blocks.push({
                    day_id: dayId,
                    order_index: 5,
                    type: 'metcon_structured',
                    name: 'Sprints',
                    format: 'RFT',
                    config: {
                        format: 'RFT',
                        methodology_code: 'RFT',
                        rounds: spRounds,
                        movements: [`Sprint ${spTime} (90-95%)`, `Descanso 1' (Suave)`],
                        notes: `Enfocate en la velocidad máxima durante los ${spTime}.`
                    }
                });
            } else if (dayNum === 4) { // Full Body
                // Warmup
                blocks.push({
                    day_id: dayId,
                    order_index: 0,
                    type: 'warmup',
                    name: 'Activación',
                    config: {
                        rounds: 3,
                        movements: [
                            { name: 'Lunge with Rotation', quantity: '6 total', notes: 'rotá desde torácica.' },
                            { name: 'Prone Y-T-W', quantity: '10 total', notes: 'hombros lejos de orejas.' },
                            { name: 'Air Squat', quantity: '10', notes: 'truco firme.' }
                        ]
                    },
                    format: 'STANDARD'
                });

                // Back Squat
                let sqReps = week === 4 ? 6 : (week === 3 ? 8 : 10);
                let sqSets = week <= 2 ? 3 : (week === 3 ? 4 : 3);
                let sqWeight = week === 1 ? 'Liviano' : (week === 2 ? '+2.5 kg' : (week === 3 ? 'Pesado tecnico' : 'Pesado'));
                blocks.push({
                    day_id: dayId,
                    order_index: 1,
                    type: 'strength_linear',
                    name: 'Back Squat',
                    config: {
                        sets: sqSets,
                        reps: sqReps,
                        weight: sqWeight,
                        rest: '3 min',
                        notes: 'Bajá controlado, explosivo arriba.'
                    }
                });

                // Superset A: Push-ups + Rear Fly
                let puReps = week === 1 ? 8 : (week === 2 ? 10 : (week === 3 ? 10 : 'al fallo'));
                let puSets = week === 1 ? 4 : (week === 2 ? 4 : 5);
                let rfReps = week === 1 ? 12 : 15;
                let rfSets = week <= 2 ? 3 : 4;
                blocks.push({
                    day_id: dayId,
                    order_index: 2,
                    type: 'accessory',
                    name: 'Superserie A',
                    format: 'STANDARD',
                    config: {
                        format: 'SUPER_SET',
                        methodology_code: 'SUPER_SET',
                        sets: 4,
                        restBetweenSets: '90s',
                        movements: [
                            { name: 'Push-Up', sets: puSets, reps: puReps, notes: 'cuerpo en tabla, codos 30-45°.' },
                            { name: 'Rear Delt Fly', sets: rfSets, reps: rfReps, weight: 'Liviano', notes: 'abrí como alas.' }
                        ]
                    }
                });

                // Superset B: Step lateral + Kickback
                let stReps = week === 3 ? 12 : (week === 4 ? 8 : (week === 2 ? 10 : 8));
                let kbReps = week === 1 ? 15 : 20;
                let kbSets = week <= 2 ? 3 : 4;
                let stWeight = week === 4 ? '12 kg' : '10 kg';
                blocks.push({
                    day_id: dayId,
                    order_index: 3,
                    type: 'accessory',
                    name: 'Superserie B',
                    format: 'STANDARD',
                    config: {
                        format: 'SUPER_SET',
                        methodology_code: 'SUPER_SET',
                        sets: 3,
                        restBetweenSets: '90s',
                        movements: [
                            { name: 'Box Step-Up', reps: stReps, weight: stWeight, notes: 'subí empujando solo con pierna arriba.' },
                            { name: 'Cable Glute Kickback', sets: kbSets, reps: kbReps, weight: '5-10 kg', notes: 'pelvis quieta.' }
                        ]
                    }
                });

                // Sprints (same as day 2)
                let spTimeFB = week === 1 ? '30"' : (week === 2 ? '35"' : (week === 3 ? '40"' : '50"'));
                let spRoundsFB = week === 1 ? 8 : (week === 2 ? 8 : (week === 3 ? 7 : 6));
                blocks.push({
                    day_id: dayId,
                    order_index: 4,
                    type: 'metcon_structured',
                    name: 'Sprints',
                    format: 'RFT',
                    config: {
                        format: 'RFT',
                        methodology_code: 'RFT',
                        rounds: spRoundsFB,
                        movements: [`Sprint ${spTimeFB} (90-95%)`, `Descanso 1' (Suave)`],
                        notes: `Mantené el ritmo en todas las vueltas.`
                    }
                });
            } else if (dayNum === 5) { // Cardio & Tono
                // Warmup
                blocks.push({
                    day_id: dayId,
                    order_index: 0,
                    type: 'warmup',
                    name: 'Activación',
                    config: {
                        rounds: 3,
                        movements: [
                            { name: 'Good Morning', quantity: '10', notes: 'Enfoque en isquios.' },
                            { name: 'Sprawl', quantity: '5', notes: 'Dinámico.' },
                            { name: 'Jump Squat', quantity: '10', notes: 'Explosivo.' },
                            { name: 'Jumping Jack', quantity: '20', notes: 'Ritmo constante.' }
                        ]
                    },
                    format: 'STANDARD'
                });

                // EMOM (KB Swings + Plank)
                let emTime = week === 1 ? 10 : (week === 2 ? 12 : (week === 3 ? 14 : 12));
                blocks.push({
                    day_id: dayId,
                    order_index: 1,
                    type: 'metcon_structured',
                    name: 'Metabólico 1',
                    format: 'EMOM',
                    config: {
                        format: 'EMOM',
                        methodology_code: 'EMOM',
                        minutes: emTime,
                        movements: [
                            '12 Kettlebell Swings (Bisagra, cadera dispara)',
                            '30" Plancha (Abdomen duro)'
                        ]
                    }
                });

                // AMRAP 12
                blocks.push({
                    day_id: dayId,
                    order_index: 2,
                    type: 'metcon_structured',
                    name: 'Metabólico 2',
                    format: 'AMRAP',
                    config: {
                        format: 'AMRAP',
                        methodology_code: 'AMRAP',
                        minutes: 12,
                        movements: [
                            '10 Wall Balls (6 kg)',
                            '10 Burpees',
                            '10 Saltos/Step-ups'
                        ]
                    }
                });

                // Farmer Carry
                blocks.push({
                    day_id: dayId,
                    order_index: 3,
                    type: 'strength_linear',
                    name: 'Farmer Carry',
                    format: 'STANDARD',
                    config: {
                        sets: 3,
                        distance: '30-40m',
                        weight: '10-12 kg',
                        rest: '60s',
                        notes: 'hombros abajo, postura alta.'
                    }
                });

                // Zona 2
                let z2Time = 35 + (week - 1) * 5;
                blocks.push({
                    day_id: dayId,
                    order_index: 4,
                    type: 'free_text',
                    name: 'Zona 2',
                    config: {
                        content: `35 min de Zona 2. `
                    }
                });
            }

            // Insert all blocks for this day
            for (const b of blocks) {
                const { error: blockError } = await supabase
                    .from('workout_blocks')
                    .insert(b);

                if (blockError) {
                    console.error(`Error creating block ${b.name} for day ${dayNum} week ${week}:`, blockError);
                }
            }
        }
    }

    console.log('Program generation complete!');
}

run();
