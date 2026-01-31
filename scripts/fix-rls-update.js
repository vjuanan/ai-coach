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

// SQL to add UPDATE policy
const rlsSql = `
-- Drop existing update policy if exists
DROP POLICY IF EXISTS "Allow authenticated update access" ON training_methodologies;

-- Create policy for authenticated users to update
CREATE POLICY "Allow authenticated update access" 
ON training_methodologies 
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
`;

console.log('🔓 Adding UPDATE RLS policy for training_methodologies...');

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
            console.log('✅ UPDATE policy applied successfully!');
        } else {
            console.log('Response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e.message);
});

req.write(JSON.stringify({ query: rlsSql }));
req.end();
