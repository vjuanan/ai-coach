import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!DB_PASSWORD || !SUPABASE_URL) {
    console.error('Missing env vars');
    process.exit(1);
}

// Extract project ref from URL
const projectRef = SUPABASE_URL.split('//')[1].split('.')[0];
const connectionString = `postgres://postgres:${DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`;

console.log(`Connecting to ${projectRef}...`);

const sql = postgres(connectionString, {
    ssl: 'require',
    max: 1
});

async function applyMigration() {
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20260219000000_add_exercise_cue.sql');
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
