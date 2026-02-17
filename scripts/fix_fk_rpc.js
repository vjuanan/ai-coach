
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixConstraint() {
    console.log('Fixing FK constraint...');

    // Using raw SQL via RPC or just informing user if not possible?
    // Supabase JS client doesn't support generic SQL execution without a function.
    // But usually we have a `exec_sql` function or similar if set up.
    // If not, I will try to use the `pg` driver if available, or just instruct user.
    // Wait, I can't easily run SQL from here if no RPC.

    // BUT! I see I have `migrations` folder. 
    // And `scripts/backfill_clients.ts`.
    // Maybe I should use a migration file?
    // But I can't apply it without a migration tool.

    // Wait, let's check if the column exists first.
    // Maybe I can just use a raw query if the project has a sql execution function.

    // Attempt to invoke a potential sql function
    const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
            ALTER TABLE clients 
            DROP CONSTRAINT IF EXISTS clients_coach_id_fkey;

            ALTER TABLE clients
            ADD CONSTRAINT clients_coach_id_fkey
            FOREIGN KEY (coach_id) REFERENCES coaches(id)
            ON DELETE SET NULL;
        `
    });

    if (error) {
        console.error('RPC exec_sql failed:', error.message);
        console.log('Attempting direct REST API SQL execution is not possible without an exposed function.');
        console.log('I will provide a SQL file for the user or try to use a different method.');
    } else {
        console.log('Constraint fixed via RPC!');
    }
}

fixConstraint();
