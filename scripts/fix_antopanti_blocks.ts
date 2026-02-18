import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

async function fixBlocks() {
    console.log('🔧 Fixing Antopanti blocks...\n');

    // 1. Find the program
    const { data: prog } = await supabase
        .from('programs')
        .select('id')
        .eq('name', 'Rutina Antopanti 2026')
        .single();

    if (!prog) { console.error('❌ Program not found'); process.exit(1); }

    // 2. Get all mesocycles
    const { data: mesos } = await supabase
        .from('mesocycles')
        .select('id, week_number')
        .eq('program_id', prog.id);

    if (!mesos?.length) { console.error('❌ No mesocycles found'); process.exit(1); }

    const mesoIds = mesos.map(m => m.id);

    // 3. Get all days
    const { data: days } = await supabase
        .from('days')
        .select('id, day_number, mesocycle_id')
        .in('mesocycle_id', mesoIds);

    if (!days?.length) { console.error('❌ No days found'); process.exit(1); }

    const dayIds = days.map(d => d.id);

    // 4. Get all blocks
    const { data: blocks } = await supabase
        .from('workout_blocks')
        .select('*')
        .in('day_id', dayIds)
        .order('order_index');

    if (!blocks?.length) { console.error('❌ No blocks found'); process.exit(1); }

    console.log(`📊 Found ${blocks.length} total blocks across ${mesos.length} weeks\n`);

    let fixedCount = 0;

    for (const block of blocks) {
        const updates: Record<string, any> = {};
        const config = block.config || {};

        // FIX 1: Set `format` column from config.format for metcon/warmup/accessory blocks
        if (!block.format && config.format) {
            updates.format = config.format;
        }

        // FIX 2: Warmup blocks need a format
        if (block.type === 'warmup' && !block.format && !config.format) {
            updates.format = 'STANDARD';
        }

        // FIX 3: Accessory blocks need a format  
        if (block.type === 'accessory' && !block.format && !config.format) {
            updates.format = 'STANDARD';
        }

        // FIX 4: Finisher blocks need a format
        if (block.type === 'finisher' && !block.format && !config.format) {
            updates.format = 'STANDARD';
        }

        // FIX 5: Conditioning blocks need a format
        if (block.type === 'conditioning' && !block.format && !config.format) {
            updates.format = config.format || 'STANDARD';
        }

        // FIX 6: Strength blocks - ensure rest exists
        if (block.type === 'strength_linear') {
            if (!config.rest || String(config.rest).trim().length === 0) {
                const newConfig = { ...config, rest: '2 min' };
                updates.config = newConfig;
            }
            // Ensure at least one intensity field exists
            const hasIntensity = (config.weight && String(config.weight).trim().length > 0) ||
                (config.percentage && Number(config.percentage) > 0) ||
                (config.rpe && Number(config.rpe) > 0) ||
                (config.rir !== undefined && config.rir !== null && config.rir !== '');
            if (!hasIntensity) {
                const newConfig = updates.config || { ...config };
                newConfig.rpe = 7;
                updates.config = newConfig;
            }
        }

        if (Object.keys(updates).length > 0) {
            const dayInfo = days.find(d => d.id === block.day_id);
            const weekInfo = mesos.find(m => m.id === dayInfo?.mesocycle_id);
            console.log(`  ✏️  Week ${weekInfo?.week_number} Day ${dayInfo?.day_number} | ${block.type} "${block.name}" → updating: ${JSON.stringify(updates).substring(0, 120)}`);

            const { error } = await supabase
                .from('workout_blocks')
                .update(updates)
                .eq('id', block.id);

            if (error) {
                console.error(`     ❌ Error updating block ${block.id}:`, error.message);
            } else {
                fixedCount++;
            }
        }
    }

    console.log(`\n✅ Fixed ${fixedCount} blocks`);

    // Now recount remaining issues (simulating validateBlockContent)
    // Re-fetch blocks
    const { data: updatedBlocks } = await supabase
        .from('workout_blocks')
        .select('*')
        .in('day_id', dayIds)
        .order('order_index');

    let remaining = 0;
    const issues: string[] = [];
    for (const block of (updatedBlocks || [])) {
        const config = block.config || {};

        if (block.type === 'strength_linear') {
            const hasSets = config.sets && Number(config.sets) > 0;
            const hasReps = config.reps && String(config.reps).trim().length > 0;
            const hasIntensity = (config.weight && String(config.weight).trim().length > 0) ||
                (config.percentage && Number(config.percentage) > 0) ||
                (config.rpe && Number(config.rpe) > 0) ||
                (config.rir !== undefined && config.rir !== null && config.rir !== '');
            const hasRest = config.rest && String(config.rest).trim().length > 0;

            if (!hasSets || !hasReps || !hasIntensity || !hasRest) {
                remaining++;
                const missing = [];
                if (!hasSets) missing.push('sets');
                if (!hasReps) missing.push('reps');
                if (!hasIntensity) missing.push('intensity');
                if (!hasRest) missing.push('rest');
                issues.push(`  ⚠️  strength_linear "${block.name}" missing: ${missing.join(', ')}`);
            }
        }

        if (['metcon_structured', 'warmup', 'accessory', 'skill'].includes(block.type)) {
            if (!block.format) {
                remaining++;
                issues.push(`  ⚠️  ${block.type} "${block.name}" missing format`);
            }
        }
    }

    if (remaining > 0) {
        console.log(`\n⚠️  ${remaining} blocks still have issues:`);
        issues.forEach(i => console.log(i));
    } else {
        console.log('\n🎉 All blocks now pass validation!');
    }
}

fixBlocks().catch(console.error);
