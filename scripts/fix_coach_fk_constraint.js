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
    // If not found, maybe we can try extracting it from user memory or asking?
    // But let's assume it exists as the other script relies on it.
    process.exit(1);
}

// Connection string construction
const connectionString = `postgres://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;

async function run() {
    console.log('Connecting to database to fix FK constraint...');
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Supabase requires SSL
    });

    try {
        await client.connect();

        console.log('Dropping foreign key constraint clients_coach_id_fkey...');

        const sql = `
            ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_coach_id_fkey;
        `;

        await client.query(sql);

        console.log('✅ Constraint clients_coach_id_fkey dropped successfully!');

        // Let's verify if there are any other constraints on that column
        const checkSql = `
            SELECT constraint_name, table_name, column_name 
            FROM information_schema.key_column_usage 
            WHERE table_name = 'clients' AND column_name = 'coach_id';
        `;

        const res = await client.query(checkSql);
        console.log('Remaining constraints on coach_id:', res.rows.map(r => r.constraint_name));

    } catch (err) {
        console.error('Fix failed:', err);
    } finally {
        await client.end();
    }
}

run();
