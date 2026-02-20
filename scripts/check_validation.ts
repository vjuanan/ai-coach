import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkValidation() {
    // 1. Fetch exercises for cache
    const { data: exercises } = await supabase.from('exercises').select('name');
    const validNames = exercises!.map(e => e.name.toLowerCase());

    // 2. Fetch program
    const { data: program, error: progErr } = await supabase.from('programs').select('id, name').eq('name', 'Rutina Antopanti SUPREMA').order('created_at', { ascending: false }).limit(1).single();
    if (!program) { console.log('Program not found', progErr); return; }

    const { data: mesocycles } = await supabase.from('mesocycles').select('id, week_number').eq('program_id', program.id);
    let totalIncomplete = 0;

    for (const meso of mesocycles!) {
        const { data: days, error: err } = await supabase.from('days').select('id, day_number').eq('mesocycle_id', meso.id);
        if (!days) { console.error(err); continue; }
        for (const day of days) {
            const { data: blocks } = await supabase.from('workout_blocks').select('*').eq('day_id', day.id);
            for (const block of blocks!) {
                const config = block.config || {};
                const missingFields: string[] = [];

                if (block.type === 'strength_linear') {
                    if (!block.name || block.name.trim().length === 0) missingFields.push('Nombre del Ejercicio');
                    else if (!validNames.includes(block.name.toLowerCase())) missingFields.push(`Ejercicio Válido: "${block.name}" no está en DB`);

                    if (!config.sets || Number(config.sets) <= 0) missingFields.push('Series');
                    if (!config.reps || String(config.reps).trim().length === 0) missingFields.push('Repeticiones');

                    const hasIntensity = (config.weight && String(config.weight).trim().length > 0) ||
                        (config.percentage && Number(config.percentage) > 0) ||
                        (config.rpe && Number(config.rpe) > 0) ||
                        (config.rir !== undefined && config.rir !== null && config.rir !== '');
                    if (!hasIntensity) missingFields.push('Intensidad');
                    if (!config.rest || String(config.rest).trim().length === 0) missingFields.push('Descanso');
                } else if (['metcon_structured', 'warmup', 'accessory', 'skill', 'finisher'].includes(block.type)) {
                    if (!block.format) missingFields.push('Metodología (Formato)');
                    const movements = config.movements as any[] || [];
                    if (movements.length === 0) missingFields.push('Al menos 1 movimiento');
                    else if (block.type === 'warmup' || block.type === 'accessory') {
                        let allStrictValid = true;
                        for (const m of movements) {
                            let mName = typeof m === 'string' ? m : (m as any).name;
                            if (!validNames.includes(mName.toLowerCase())) {
                                missingFields.push(`Movimiento "${mName}" no está en DB`);
                            }
                        }
                    }
                    if (block.format === 'AMRAP') {
                        if (!config.minutes || Number(config.minutes) <= 0) missingFields.push('Time Cap (Minutos)');
                    }
                }

                if (missingFields.length > 0) {
                    console.log(`Semana ${meso.week_number} Dia ${day.day_number} Bloque "${block.name}": Faltan`, missingFields);
                    totalIncomplete++;
                }
            }
        }
    }
    console.log(`Total Incomplete: ${totalIncomplete}`);
}

checkValidation();
