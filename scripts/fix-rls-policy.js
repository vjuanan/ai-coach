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

// SQL to add RLS policy for public read access
const rlsSql = `
-- Enable RLS if not already enabled
ALTER TABLE training_methodologies ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists (to avoid duplicate key error)
DROP POLICY IF EXISTS "Anyone can view training methodologies" ON training_methodologies;
DROP POLICY IF EXISTS "Allow public read access" ON training_methodologies;

-- Create new policy for authenticated users to read
CREATE POLICY "Allow public read access" 
ON training_methodologies 
FOR SELECT 
TO authenticated
USING (true);
`;

console.log('🔓 Adding RLS policy for training_methodologies...');

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
            console.log('✅ RLS policy applied successfully!');
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
