import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!DB_PASSWORD || !SUPABASE_URL) {
    console.error('Missing env vars: SUPABASE_DB_PASSWORD or NEXT_PUBLIC_SUPABASE_URL');
    process.exit(1);
}

// Extract project ref from URL
// https://[ref].supabase.co
const projectRef = SUPABASE_URL.split('//')[1].split('.')[0];
const connectionString = `postgres://postgres:${DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`;

console.log(`Connecting to ${projectRef}...`);

const sql = postgres(connectionString, {
    ssl: 'require',
    max: 1
});

async function applyMigration() {
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/20260216000000_add_exercise_aliases.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration...');
    try {
        await sql.unsafe(migrationSql);
        console.log('Migration applied successfully!');
    } catch (err) {
        console.error('Error applying migration:', err);
    } finally {
        await sql.end();
    }
}

applyMigration();
