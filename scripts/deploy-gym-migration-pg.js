const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const projectRef = 'dfbxffnuwkcbnxfwyvcc';
const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
    console.error('Error: SUPABASE_DB_PASSWORD not found in .env.local');
    process.exit(1);
}

const connectionString = `postgres://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;

async function run() {
    console.log('Connecting to database...');
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Supabase requires SSL
    });

    try {
        await client.connect();

        const sqlPath = path.join(__dirname, '../supabase/migrations/014_gym_profile.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log(`Running migration from ${sqlPath}...`);

        // Split by semicolon? No, usually fine to run whole block unless transactions are tricky.
        // But pg driver might prefer single command or split. Let's send as one block.
        // Postgres can handle multiple statements in one query string typically.

        await client.query(sql);

        console.log('✅ Migration executed successfully!');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

run();
