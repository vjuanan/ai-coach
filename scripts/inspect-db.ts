import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function inspect() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    console.log('🔍 Checking workout_blocks schema...');
    // We can't query information_schema easily via RLS-protected client usually, 
    // but with service_role_key we might be able to, OR we can just try to select one row 
    // and see the structure.

    // Attempt 1: Get schema via rpc if 'exec_sql' exists (it usually does for admins)
    try {
        const { data, error } = await supabase.rpc('exec_sql', {
            query: "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'workout_blocks'"
        });
        if (error) {
            console.log('⚠️ exec_sql failed:', error.message);
        } else {
            console.log('✅ Schema columns:', data);
        }
    } catch (e) {
        console.log('⚠️ exec_sql exception:', e);
    }

    // Attempt 2: Try to insert a dummy block to see why it fails
    console.log('\n🧪 Testing block insertion on an EXISTING day...');

    // Get an existing day from the first template
    const { data: firstTemplate } = await supabase.from('programs').select('id').eq('is_template', true).limit(1).single();
    if (firstTemplate) {
        const { data: meso } = await supabase.from('mesocycles').select('id').eq('program_id', firstTemplate.id).limit(1).single();
        if (meso) {
            const { data: day } = await supabase.from('days').select('id').eq('mesocycle_id', meso.id).limit(1).single();
            if (day) {
                console.log('✅ Using existing day:', day.id);

                // Now try to insert a block
                const { error: blockError } = await supabase.from('workout_blocks').insert({
                    day_id: day.id,
                    order_index: 1,
                    type: 'warmup',
                    format: 'time',
                    name: 'Test Block',
                    config: { foo: 'bar' }
                });

                if (blockError) {
                    console.log('❌ BLOCK INSERT FAILED:', JSON.stringify(blockError, null, 2));
                } else {
                    console.log('✅ Block insert succeeded? Then why were templates empty?');
                    // Cleanup
                    await supabase.from('workout_blocks').delete().eq('day_id', day.id);
                }
            } else {
                console.log('❌ No days found for template meso');
            }
        }
    }

    console.log('\n🔍 Checking if templates have blocks...');
    // Get template IDs
    const { data: templates } = await supabase
        .from('programs')
        .select('id, name')
        .eq('is_template', true);

    console.log('Templates found:', templates?.length);

    if (templates) {
        for (const t of templates) {
            console.log(`\n📋 Template: ${t.name} (${t.id})`);

            // Get mesocycles
            const { data: mesos } = await supabase
                .from('mesocycles')
                .select('id, week_number')
                .eq('program_id', t.id);

            console.log(`   Mesocycles: ${mesos?.length}`);

            if (mesos && mesos.length > 0) {
                // Get days for first meso
                const { data: days } = await supabase
                    .from('days')
                    .select('id, day_number')
                    .eq('mesocycle_id', mesos[0].id);

                console.log(`   Days in Meso 1: ${days?.length}`);

                if (days && days.length > 0) {
                    // Get blocks for first day
                    const { data: blocks } = await supabase
                        .from('workout_blocks')
                        .select('*')
                        .eq('day_id', days[0].id);

                    console.log(`   Blocks in Day 1: ${blocks?.length}`);
                    if (blocks && blocks.length > 0) {
                        console.log('   Sample Block:', blocks[0]);
                    } else {
                        console.log('   ❌ NO BLOCKS FOR DAY 1');
                    }
                }
            }
        }
    }
}

inspect().catch(console.error);
