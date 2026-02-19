
// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const validateBlockContent = (block: any): string | null => {
    const cfg = block.config || {};
    if (block.type === 'strength_linear') {
        if (!block.name) return 'Missing Name';
        const hasSets = cfg.sets && Number(cfg.sets) > 0;
        const hasReps = (cfg.reps && String(cfg.reps).trim().length > 0) || (cfg.distance && String(cfg.distance).trim().length > 0); // Reps OR Distance
        const hasIntensity = (cfg.weight && String(cfg.weight).trim().length > 0) ||
            (cfg.percentage && Number(cfg.percentage) > 0) ||
            (cfg.rpe && String(cfg.rpe).trim().length > 0) || // RPE is usually string/number, check logic
            (cfg.rir !== undefined && cfg.rir !== null && cfg.rir !== '');
        const hasRest = cfg.rest && String(cfg.rest).trim().length > 0;

        if (!hasSets) return 'Missing Sets';
        if (!hasReps) return 'Missing Reps/Distance';
        if (!hasIntensity) return 'Missing Intensity (Weight/RPE/%)';
        if (!hasRest) return 'Missing Rest';
        return null;
    }
    if (block.type === 'accessory' || block.type === 'warmup' || block.type === 'metcon_structured') {
        const hasFormat = block.format || (block.config as any)?.format;
        if (!hasFormat) return 'Missing Format';
        const movements = (block.config as any)?.movements as any[] || [];
        if (movements.length === 0) return 'Missing Movements';
        return null;
    }
    return null;
};

async function run() {
    const { data: prog } = await supabase.from('programs').select('id').eq('name', 'Rutina Antopanti 2026 FINAL').single();
    if (!prog) return;

    const { data: mesos } = await supabase.from('mesocycles').select('id, week_number').eq('program_id', prog.id);
    const mesoIds = mesos.map(m => m.id);

    const { data: days } = await supabase.from('days').select('id, week:mesocycles(week_number), day_number').in('mesocycle_id', mesoIds).eq('is_rest_day', false);
    const dayIds = days.map(d => d.id);

    const { data: blocks } = await supabase.from('workout_blocks').select('*').in('day_id', dayIds);

    console.log(`Checking ${blocks.length} blocks...`);
    let incompleteCount = 0;

    for (const b of blocks) {
        const error = validateBlockContent(b);
        if (error) {
            const day = days.find(d => d.id === b.day_id);
            console.log(`[Week ${day?.week?.week_number} Day ${day?.day_number}] Block '${b.name}' (${b.type}): ${error}`);
            // console.log('Config:', JSON.stringify(b.config));
            incompleteCount++;
        }
    }
    console.log(`Found ${incompleteCount} incomplete blocks.`);
}
run();
