
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Found in apply_migration_direct.js
const connectionString = 'postgresql://postgres:38797509Ok!@db.dfbxffnuwkcbnxfwyvcc.supabase.co:5432/postgres';

const client = new Client({
    connectionString,
});

async function run() {
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected!');

        const sqlPath = path.join(__dirname, '../supabase/migrations/20260210203000_add_benchmarks_to_profiles.sql');
        console.log('Reading migration file:', sqlPath);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL...');
        await client.query(sql);

        console.log('✅ Migration successfully applied!');
    } catch (err) {
        console.error('❌ Error executing migration:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
