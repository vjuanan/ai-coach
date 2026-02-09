
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('Running migration to add tracking_parameters...');

    // 1. Check if column exists. If not, add it via unsafe SQL execution if possible, 
    // OR we can try to use a function if one exists.
    // BUT the easiest way might be to ask the user to run it. 
    // However, I can try to use the 'rpc' method if there is a 'exec_sql' function.
    // Most likely there isn't.

    // ALTERNATIVE: Use the API to update rows, but we need the column first.
    // If we can't add the column via API, we are stuck.
    // Wait, I can try to run raw SQL if I had a connection string for postgres.
    // But I only have the REST URL and Key. I CANNOT run DDL (ALTER TABLE) via the JS client unless I have an RPC function for it.

    // WAIT! The user provided `SUPABASE_DB_PASSWORD`. I might be able to construct a postgres connection string!
    // Host: db.[ref].supabase.co
    // Port: 5432
    // User: postgres
    // Pass: [SUPABASE_DB_PASSWORD]
    // DB: postgres

    // Extract ref from URL: https://dfbxffnuwkcbnxfwyvcc.supabase.co -> dfbxffnuwkcbnxfwyvcc
    const ref = supabaseUrl.split('//')[1].split('.')[0];
    const dbPassword = process.env.SUPABASE_DB_PASSWORD;

    if (!dbPassword) {
        console.error('No DB password found to run DDL.');
        return;
    }

    const connectionString = `postgres://postgres:${dbPassword}@db.${ref}.supabase.co:5432/postgres`;
    console.log('Connection string constructed (hidden password). Connecting...');

    try {
        // We need 'postgres' package. Let's check if it is installed or if we can use 'pg'.
        // If not, I can try to use 'npx' to run a script that installs it temporarily? 
        // Or just try to require it.

        const postgres = require('postgres');
        const sql = postgres(connectionString);

        console.log('Adding column tracking_parameters...');
        await sql`
        ALTER TABLE exercises 
        ADD COLUMN IF NOT EXISTS tracking_parameters JSONB DEFAULT NULL;
      `;

        console.log('Column added. Updating exercises...');

        const exercisesToUpdate = [
            { name: 'Correr', category: 'Monostructural', sub: 'Running' },
            { name: 'Nadar', category: 'Monostructural', sub: 'Swimming' },
            { name: 'Remo', category: 'Monostructural', sub: 'Rowing' },
            { name: 'Bici', category: 'Monostructural', sub: 'Biking' },
            { name: 'Ski Erg', category: 'Monostructural', sub: 'Skiing' },
            { name: 'Assault Bike', category: 'Monostructural', sub: 'Biking' },
            { name: 'Caminar', category: 'Monostructural', sub: 'Walking' },
            { name: 'Ruck', category: 'Monostructural', sub: 'Rucking' },
            { name: 'Run', category: 'Monostructural', sub: 'Running' },
            { name: 'Swim', category: 'Monostructural', sub: 'Swimming' },
            { name: 'Row', category: 'Monostructural', sub: 'Rowing' },
            { name: 'Bike', category: 'Monostructural', sub: 'Biking' }
        ];

        for (const ex of exercisesToUpdate) {
            // Upsert exercise
            const params = {
                distance: true
            };

            // We use ON CONFLICT to update existing or insert new
            await sql`
            INSERT INTO exercises (name, category, subcategory, tracking_parameters)
            VALUES (${ex.name}, ${ex.category}::exercise_category, ${ex.sub}, ${params})
            ON CONFLICT (name) 
            DO UPDATE SET 
                tracking_parameters = ${params},
                category = EXCLUDED.category,
                subcategory = EXCLUDED.subcategory;
        `;
            console.log(`Processed ${ex.name}`);
        }

        console.log('Migration complete.');
        await sql.end();

    } catch (err) {
        console.error('Migration failed:', err);
        // Fallback: If 'postgres' is missing, likely need to install it.
        if (err.code === 'MODULE_NOT_FOUND') {
            console.error("Please install 'postgres' package: npm install postgres");
        }
    }
}

runMigration();
