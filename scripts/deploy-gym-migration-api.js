const fs = require('fs');
const path = require('path');
const https = require('https');

// Load env vars manually
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});

const ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'dfbxffnuwkcbnxfwyvcc';

console.log('Using Access Token:', ACCESS_TOKEN ? 'Found' : 'MISSING');

// Split SQL into two parts
const part1_enum = `
    -- Add gym to user_role enum
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'gym';
`;

const part2_tables = `
    -- Add gym-specific profile fields
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gym_name TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gym_location TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gym_type TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_count INTEGER;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipment_available JSONB DEFAULT '{}';
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS operating_hours TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_phone TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;

    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_profiles_gym_role ON profiles(role) WHERE role = 'gym';
`;

async function executeSql(sql, label) {
    return new Promise((resolve, reject) => {
        console.log(`\n--- Executing ${label} ---`);

        const mgmtOptions = {
            hostname: 'api.supabase.com',
            port: 443,
            path: `/v1/projects/${PROJECT_REF}/database/query`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
            }
        };

        const req = https.request(mgmtOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('Status:', res.statusCode);
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`✅ ${label} Success!`);
                    resolve(data);
                } else {
                    console.error(`❌ ${label} Failed!`);
                    console.error('Response:', data);
                    // Check if error is just "already exists" or similar non-critical
                    if (data.includes('already exists')) {
                        console.log('Ignoring already exists error...');
                        resolve(data);
                    } else {
                        reject(new Error(data));
                    }
                }
            });
        });

        req.on('error', (e) => {
            console.error('Request Error:', e.message);
            reject(e);
        });

        req.write(JSON.stringify({ query: sql }));
        req.end();
    });
}

async function run() {
    try {
        await executeSql(part1_enum, 'Part 1: Enum Update');
        console.log('Waiting 2 seconds for enum to commit...');
        await new Promise(r => setTimeout(r, 2000));
        await executeSql(part2_tables, 'Part 2: Table Updates');
        console.log('\n🎉 ALL MIGRATIONS DONE!');
    } catch (e) {
        console.error('\n💥 Migration Aborted due to error.');
        process.exit(1);
    }
}

run();
