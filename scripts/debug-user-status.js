
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env vars
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase URL or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    const email = 'admin@epnstore.com.ar';
    console.log(`Checking status for: ${email}`);

    // 1. Check Auth Users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) console.error('List Users Error:', listError);

    const authUser = users.find(u => u.email === email);
    console.log('Auth User Found:', authUser ? `ID: ${authUser.id}` : 'NO');

    // 2. Check Profiles
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', email)
        .single();

    if (profileError && profileError.code !== 'PGRST116') console.error('Profile Error:', profileError.message);
    console.log('Profile Found:', profile ? `ID: ${profile.id}, Role: ${profile.role}` : 'NO');

    // 3. Check Clients
    const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', email);

    if (clientError) console.error('Client Error:', clientError.message);
    console.log('Clients Found:', clients ? clients.length : 0);
    clients?.forEach(c => console.log(` - Client ID: ${c.id}, Type: ${c.type}, UserID: ${c.user_id}`));

}

main();
