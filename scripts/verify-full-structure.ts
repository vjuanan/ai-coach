import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function verifyStructure() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    console.log('🔍 Starting Deep Verification of Template Structures (Content Quality Check)...\n');

    const { data: templates } = await supabase.from('programs').select('id, name').eq('is_template', true);
    if (!templates || templates.length === 0) { console.error('❌ No templates found!'); return; }

    for (const template of templates) {
        console.log(`==================================================`);
        console.log(`📘 Template: ${template.name}`);
        console.log(`==================================================`);

        const { data: mesos } = await supabase.from('mesocycles').select('*').eq('program_id', template.id).order('week_number').limit(1); // Check first meso only for brevity

        if (mesos && mesos.length > 0) {
            const meso = mesos[0];
            console.log(`   🗓️  Week ${meso.week_number} (${meso.focus}):`);

            const { data: days } = await supabase.from('days').select('*').eq('mesocycle_id', meso.id).order('day_number').limit(2); // Check first 2 days

            for (const day of days || []) {
                console.log(`      Day ${day.day_number} (${day.name}):`);
                if (day.notes) console.log(`         📝 Note: ${day.notes}`);

                const { data: blocks } = await supabase.from('workout_blocks').select('*').eq('day_id', day.id).order('order_index');
                for (const b of blocks || []) {
                    console.log(`         - [${b.type}] ${b.name} (${b.format || 'Standard'})`);
                    if (b.config) {
                        const c = b.config;
                        if (c.sets) console.log(`             Sets: ${c.sets}, Reps: ${c.reps}`);
                        if (c.percentage) console.log(`             Intensity: ${c.percentage}`);
                        if (c.rir !== undefined) console.log(`             RIR: ${c.rir}`);
                        if (c.tempo) console.log(`             Tempo: ${c.tempo}`);
                        if (c.rest) console.log(`             Rest: ${c.rest}`);
                        if (c.notes) console.log(`             Note: "${c.notes}"`);
                        if (c.movements) console.log(`             Movements: ${JSON.stringify(c.movements)}`);
                    }
                }
            }
        }
    }
}

verifyStructure().catch(console.error);
