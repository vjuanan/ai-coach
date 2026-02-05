const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:38797509Ok!@db.dfbxffnuwkcbnxfwyvcc.supabase.co:5432/postgres';

const client = new Client({
    connectionString,
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to database.');

        const sqlPath = path.join(__dirname, '../supabase/migrations/020_fix_programs_select_policy.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing migration:', sqlPath);
        await client.query(sql);

        console.log('Migration successfully applied!');
    } catch (err) {
        console.error('Error executing migration:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
