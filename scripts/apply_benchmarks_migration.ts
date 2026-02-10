
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dfbxffnuwkcbnxfwyvcc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmYnhmZm51d2tjYm54Znd5dmNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUzMzUxMywiZXhwIjoyMDg1MTA5NTEzfQ.waUHxz5lUSELECf4Hk-5r9K3lMfJelroU3kxgDzUYI4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
    console.log('🚀 Applying Benchmarks Migration...');

    const sql = `
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS benchmarks JSONB DEFAULT '{}'::jsonb;
        COMMENT ON COLUMN profiles.benchmarks IS 'Stores athlete RM stats and time benchmarks';
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
        console.error('❌ Error executing SQL via RPC:', error);
        console.log('If exec_sql does not exist, you must run the migration manually in Supabase Dashboard.');
    } else {
        console.log('✅ Migration applied successfully via RPC.');
    }
}

applyMigration().catch(console.error);
