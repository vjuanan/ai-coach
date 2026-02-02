const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Credentials
const password = process.env.SUPABASE_DB_PASSWORD;
const projectRef = 'dfbxffnuwkcbnxfwyvcc';

if (!password) {
    console.error('Error: SUPABASE_DB_PASSWORD not found');
    process.exit(1);
}

// URL Encode password to handle special chars like '!'
const encodedPassword = encodeURIComponent(password);

// Construct Connection Strings
// 1. Direct Connection (often fails DNS in strictly firewalled envs)
const directUrl = `postgres://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`;

// 2. Pooler Connection (observed from CLI logs)
// Format: postgres://[user].[project]:[pass]@[host]:[port]/[db]
// Note: Pooler usually uses port 5432 or 6543. Transaction mode is 6543. Session 5432.
// CLI tried: host=aws-1-us-east-2.pooler.supabase.com user=postgres.dfbxffnuwkcbnxfwyvcc
const poolerHost = 'aws-1-us-east-2.pooler.supabase.com';
const poolerUser = `postgres.${projectRef}`;
const poolerUrl = `postgres://${poolerUser}:${encodedPassword}@${poolerHost}:5432/postgres`;

async function tryConnect(connString, name) {
    console.log(`\n🔌 Trying ${name} connection...`);
    // Mask password in log
    console.log(`URL: ${connString.replace(encodedPassword, '*****')}`);

    const client = new Client({
        connectionString: connString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000 // 10s timeout
    });

    try {
        await client.connect();
        console.log(`✅ Connected via ${name}!`);

        // Run Migration
        const sqlPath = path.join(__dirname, '../supabase/migrations/016_check_email_rpc.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log(`Processing migration: ${path.basename(sqlPath)}`);

        await client.query(sql);
        console.log('🚀 Migration executed successfully.');

        await client.end();
        return true;
    } catch (err) {
        console.error(`❌ ${name} failed:`, err.message);
        await client.end().catch(() => { }); // catch cleanup errors
        return false;
    }
}

async function run() {
    // Try Direct first
    console.log('--- Deployment Strategy 1: Direct ---');
    if (await tryConnect(directUrl, 'Direct')) return;

    // Try Pooler second (Session Mode)
    console.log('\n--- Deployment Strategy 2: Pooler (Session) ---');
    if (await tryConnect(poolerUrl, 'Pooler')) return;

    // Try Pooler Transaction Mode (Port 6543)
    const poolerTransactionUrl = `postgres://${poolerUser}:${encodedPassword}@${poolerHost}:6543/postgres`;
    console.log('\n--- Deployment Strategy 3: Pooler (Transaction) ---');
    if (await tryConnect(poolerTransactionUrl, 'Pooler-Transaction')) return;

    console.error('\n💥 All connection strategies failed.');
    process.exit(1);
}

run();
