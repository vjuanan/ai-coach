
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// Database Connection
const connectionString = 'postgresql://postgres:38797509Ok!@db.dfbxffnuwkcbnxfwyvcc.supabase.co:5432/postgres';

// Supabase API Connection (Service Role)
const supabaseUrl = 'https://dfbxffnuwkcbnxfwyvcc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmYnhmZm51d2tjYm54Znd5dmNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUzMzUxMywiZXhwIjoyMDg1MTA5NTEzfQ.waUHxz5lUSELECf4Hk-5r9K3lMfJelroU3kxgDzUYI4';

const pgClient = new Client({ connectionString });
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        // 1. Reload Schema Cache
        console.log('🔄 Reloading Schema Cache via Postgres...');
        await pgClient.connect();
        await pgClient.query("NOTIFY pgrst, 'reload schema';");
        console.log('✅ Schema Cache Reloaded.');
        await pgClient.end();

        // 2. Test Update via Supabase Client
        console.log('🧪 Testing Benchmark Update via API...');

        // Get a user
        const { data: { users }, error: usErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
        if (usErr || !users.length) {
            console.error('❌ Could not fetch users:', usErr);
            return;
        }

        const userId = users[0].id; // Test with first user
        console.log(`👤 Testing with User ID: ${userId} (${users[0].email})`);

        // Update benchmarks
        const testBenchmarks = {
            clean: 100,
            franTime: '3:00' // String format or whatever
        };

        const { data, error } = await supabase
            .from('profiles')
            .update({ benchmarks: testBenchmarks })
            .eq('id', userId)
            .select();

        if (error) {
            console.error('❌ Update FAILED:', error);
            console.log('Details:', JSON.stringify(error, null, 2));
        } else {
            console.log('✅ Update SUCCESS!', data);
        }

    } catch (err) {
        console.error('💥 Script Error:', err);
    }
}

run();
