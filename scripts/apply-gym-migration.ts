import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyGymMigration() {
    console.log('Applying gym profile columns via REST API...');

    // Columns to add
    const columns = [
        'gym_name',
        'gym_location',
        'gym_type',
        'member_count',
        'equipment_available',
        'operating_hours',
        'contact_phone',
        'website_url',
        'logo_url'
    ];

    // Check which columns already exist by querying a profile
    const { data: profile, error: checkError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .limit(1)
        .single();

    if (checkError && checkError.code !== 'PGRST116') {
        console.log('Check error:', checkError);
    }

    const existingColumns = profile ? Object.keys(profile) : [];
    console.log('Existing columns:', existingColumns);

    const missingColumns = columns.filter(c => !existingColumns.includes(c));
    console.log('Missing columns:', missingColumns);

    if (missingColumns.length === 0) {
        console.log('✅ All gym columns already exist!');
        return;
    }

    // Use the Supabase Management API instead
    // Since we can't run raw SQL, we'll need to use the Supabase Dashboard
    // OR use a workaround: Insert with the new column to trigger schema update

    console.log('⚠️ Cannot add columns via REST API.');
    console.log('Please run the following SQL in Supabase Dashboard SQL Editor:');
    console.log('');
    console.log(`
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gym_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gym_location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gym_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_count INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipment_available JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS operating_hours TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;
    `);
    console.log('');
    console.log('URL: https://supabase.com/dashboard/project/dfbxffnuwkcbnxfwyvcc/sql/new');
}

applyGymMigration();
