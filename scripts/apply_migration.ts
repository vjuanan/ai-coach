
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
// https://[ref].supabase.co
const projectRef = SUPABASE_URL.split('//')[1].split('.')[0];
const connectionString = `postgres://postgres:${DB_PASSWORD}@db.${projectRef}.supabase.co:6543/postgres`; // Port 6543 or 5432? Supabase uses 5432 for direct, 6543 for pooling. Try 5432 first but with prepared:false for postgres.js usually works on 6543 too.
// Actually, for direct connection, port 5432.
// Correction: Supabase connection string usually displayed in dashboard. Transaction mode 6543, Session 5432.
// Let's try 5432.

console.log(`Connecting to ${projectRef}...`);

const sql = postgres(connectionString, {
    ssl: 'require',
    max: 1
});

async function applyMigration() {
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20260213000001_force_fix_athlete_registration.sql');
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
