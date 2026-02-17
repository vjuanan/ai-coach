
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
    console.log('Checking athletes in DB...');

    // Check all clients
    const { data: clients, error } = await supabase
        .from('clients')
        .select('id, name, type, coach_id, email')
        .eq('type', 'athlete');

    if (error) {
        console.error('Error fetching clients:', error);
    } else {
        console.log(`Found ${clients.length} athletes.`);
        if (clients.length > 0) {
            console.log('First 5 athletes:', clients.slice(0, 5));
        }
    }

    // Check profiles/roles for vjuanan
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .ilike('email', '%juanan%'); // Check loosely

    if (pError) console.error(pError);
    else {
        console.log('Profiles matching "juanan":', profiles);
    }
}

check();
