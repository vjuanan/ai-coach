const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing Supabase credentials in .env.local');
    process.exit(1);
}

// Read migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/004_athlete_profile.sql');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

console.log('🚀 Running migration: 011_training_methodologies.sql');
console.log('📍 Target:', supabaseUrl);

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    try {
        // Execute the migration using the raw SQL endpoint
        const { data, error } = await supabase.rpc('exec', { sql: migrationSql });

        if (error) {
            // If exec RPC doesn't exist, we'll use a simpler approach
            console.log('⚠️  RPC exec not available, trying direct query...');

            // Split SQL into statements and execute individually
            const statements = migrationSql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            console.log(`📝 Found ${statements.length} SQL statements to execute`);

            // For now, let's just check if the table exists first
            const { data: existingTable, error: checkError } = await supabase
                .from('training_methodologies')
                .select('id')
                .limit(1);

            if (!checkError) {
                console.log('✅ Table training_methodologies already exists!');

                // Check how many records
                const { count } = await supabase
                    .from('training_methodologies')
                    .select('*', { count: 'exact', head: true });

                console.log(`📊 Found ${count} existing methodologies`);
                return;
            }

            console.log('⚠️ Table does not exist. Please run the migration manually via Supabase Dashboard SQL Editor.');
            console.log('📄 Migration file: supabase/migrations/011_training_methodologies.sql');
            console.log('\n💡 Instructions:');
            console.log('1. Go to https://app.supabase.com/project/dfbxffnuwkcbnxfwyvcc/sql');
            console.log('2. Copy the contents of the migration file');
            console.log('3. Paste and execute in the SQL Editor');
        } else {
            console.log('✅ Migration executed successfully!');
        }
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    }
}

runMigration();
