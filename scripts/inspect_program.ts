
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Inspecting Program...');

    // Get program ID
    const { data: prog, error: progError } = await supabase
        .from('programs')
        .select('id, name')
        .eq('name', 'Rutina Antopanti 2026 FINAL')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (progError || !prog) {
        console.error('Program not found', progError);
        return;
    }

    console.log(`Program ID: ${prog.id}`);

    // Get Week 1 Meso
    const { data: meso, error: mesoError } = await supabase
        .from('mesocycles')
        .select('id')
        .eq('program_id', prog.id)
        .eq('week_number', 1)
        .single();

    if (mesoError || !meso) {
        console.error('Meso 1 not found', mesoError);
        return;
    }

    console.log(`Meso ID: ${meso.id}`);

    // Get Days
    const { data: days, error: daysError } = await supabase
        .from('days')
        .select('*')
        .eq('mesocycle_id', meso.id)
        .order('day_number');

    if (daysError) {
        console.error('Error fetching days', daysError);
        return;
    }

    console.log(`Found ${days.length} days.`);

    // Check Day 2
    const day2 = days.find(d => d.day_number === 2);
    if (day2) {
        console.log('--- Day 2 ---');
        console.log(`Name: ${day2.name}`);
        console.log(`Is Rest Day: ${day2.is_rest_day}`);

        const { data: blocks, error: blocksError } = await supabase
            .from('workout_blocks')
            .select('id, name, order_index')
            .eq('day_id', day2.id)
            .order('order_index');

        if (blocksError) {
            console.error('Error fetching Day 2 blocks', blocksError);
        } else {
            console.log(`Blocks count: ${blocks.length}`);
            blocks.forEach(b => console.log(`- [${b.order_index}] ${b.name}`));
        }
    } else {
        console.error('Day 2 not found!');
    }
}

run();
