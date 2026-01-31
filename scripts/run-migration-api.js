const fs = require('fs');
const path = require('path');
const https = require('https');

// Load env vars
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});

const ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'dfbxffnuwkcbnxfwyvcc';

// Read migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/011_training_methodologies.sql');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

console.log('🚀 Running migration via Supabase Management API...');

const postData = JSON.stringify({ query: migrationSql });

const options = {
    hostname: `${PROJECT_REF}.supabase.co`,
    port: 443,
    path: '/rest/v1/rpc/exec_sql',  // This endpoint might not exist
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
    }
};

// Try Management API instead
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
            console.log('✅ Migration executed successfully!');
            console.log(data);
        } else {
            console.log('Response:', data);
            console.log('\n⚠️ Management API may not support SQL execution.');
            console.log('Trying alternative: Using direct pg connection or Supabase CLI');
        }
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e.message);
});

req.write(JSON.stringify({ query: migrationSql }));
req.end();
