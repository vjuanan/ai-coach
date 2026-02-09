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
// Extract project ref from URL or hardcode if known from previous scripts
// URL: https://dfbxffnuwkcbnxfwyvcc.supabase.co
// Ref: dfbxffnuwkcbnxfwyvcc
const PROJECT_REF = 'dfbxffnuwkcbnxfwyvcc';

// Read SQL file
const sqlPath = path.join(__dirname, '../supabase/migrations/20260209130000_debug_blocks_rls.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

console.log('🔓 Applying migration via Management API:', sqlPath);

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
            console.log('✅ Migration applied successfully!');
            console.log(data);
        } else {
            console.log('❌ Failed:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e.message);
});

req.write(JSON.stringify({ query: sql }));
req.end();
