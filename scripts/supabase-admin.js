const fs = require('fs');
const path = require('path');
const https = require('https');

// Load env vars manually
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim();
    }
});

const PROJECT_REF = 'dfbxffnuwkcbnxfwyvcc';
const ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
    console.error('Error: SUPABASE_ACCESS_TOKEN not found in .env.local');
    process.exit(1);
}

// SQL to execute
const sql = 'SELECT version();';

const options = {
    hostname: 'api.supabase.com',
    path: `/v1/projects/${PROJECT_REF}/typeid/sql`, // API path might vary, trying standard
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
    }
};

// Test Projects Endpoint
const reqOptions = {
    hostname: 'api.supabase.com',
    path: `/v1/projects`,
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
    }
};

const req = https.request(reqOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Auth Successful! Projects found.');
            const projects = JSON.parse(data);
            const myProject = projects.find(p => p.id === PROJECT_REF);
            if (myProject) {
                console.log('🎯 Target Project Found:', myProject.name, `(${myProject.status})`);
            } else {
                console.log('⚠️ Project ID not found in your list (maybe different org?)');
            }
        } else {
            console.error('❌ Auth Failed:', res.statusCode);
            console.error('Response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e);
});

req.write(JSON.stringify({ query: sql }));
req.end();
