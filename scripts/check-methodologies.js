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

// SQL to check data and policies
const checkSql = `
SELECT 
    COUNT(*) as total_methodologies 
FROM training_methodologies;
`;

console.log('🔍 Checking training_methodologies data...');

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
        const result = JSON.parse(data);
        console.log('Result:', JSON.stringify(result, null, 2));
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e.message);
});

req.write(JSON.stringify({ query: checkSql }));
req.end();
