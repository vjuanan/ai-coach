
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Fixing Program Days...');

    // Get program ID
    const { data: prog } = await supabase
        .from('programs')
        .select('id')
        .eq('name', 'Rutina Antopanti 2026 FINAL')
        .single();

    if (!prog) { console.error('Program not found'); return; }

    // Get Week 1 Meso
    const { data: meso } = await supabase
        .from('mesocycles')
        .select('id')
        .eq('program_id', prog.id)
        .order('week_number') // Get all weeks
        .select('id, week_number');

    if (!meso || meso.length === 0) { console.error('Mesos not found'); return; }

    for (const m of meso) {
        console.log(`Fixing Week ${m.week_number}...`);

        // Fix Day 2, 4, 5
        const daysToFix = [2, 4, 5];

        for (const dNum of daysToFix) {
            const { error } = await supabase
                .from('days')
                .update({ is_rest_day: false })
                .eq('mesocycle_id', m.id)
                .eq('day_number', dNum);

            if (error) console.error(`Error fixing Day ${dNum}:`, error);
            else console.log(`Fixed Day ${dNum}`);
        }

        // Ensure Rest Days are Rest Days (3, 6, 7)
        const restDays = [3, 6, 7];
        for (const dNum of restDays) {
            const { error } = await supabase
                .from('days')
                .update({ is_rest_day: true })
                .eq('mesocycle_id', m.id)
                .eq('day_number', dNum);

            if (error) console.error(`Error fixing Rest Day ${dNum}:`, error);
            else console.log(`Confirmed Rest Day ${dNum}`);
        }
    }
}

run();
