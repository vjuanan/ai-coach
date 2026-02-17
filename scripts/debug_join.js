
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Testing JOIN query...');

    // Test basic select
    const { data: basic, error: basicError } = await supabase
        .from('clients')
        .select('id, name')
        .limit(1);

    if (basicError) console.error('Basic select failed:', basicError);
    else console.log('Basic select success:', basic.length);

    // Test JOIN
    const { data: join, error: joinError } = await supabase
        .from('clients')
        .select('*, coach:coaches(full_name, business_name)')
        .limit(1);

    if (joinError) {
        console.error('JOIN query failed:', joinError);
        console.log('Error details:', JSON.stringify(joinError, null, 2));
    } else {
        console.log('JOIN query success:', join.length);
        if (join.length > 0) console.log('Sample:', join[0]);
    }
}

check();
