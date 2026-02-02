
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
    console.log('Verifying RPC check_email_exists...');
    const { data, error } = await supabase.rpc('check_email_exists', { email_input: 'test@example.com' });

    if (error) {
        console.error('RPC Error:', error.message);
        if (error.message.includes('function') && error.message.includes('not found')) {
            console.log('❌ RPC function NOT FOUND. Migration needed.');
        }
    } else {
        console.log('✅ RPC function exists and works.');
        console.log('Result for test@example.com:', data);
    }
}

main();
