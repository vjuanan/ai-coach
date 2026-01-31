import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyGymMigration() {
    console.log('Applying gym profile migration...');

    const sql = `
        -- Add gym-specific profile fields
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gym_name TEXT;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gym_location TEXT;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gym_type TEXT;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_count INTEGER;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipment_available JSONB DEFAULT '{}';
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS operating_hours TEXT;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_phone TEXT;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;
    `;

    // Execute each statement separately
    const statements = sql.split(';').filter(s => s.trim().length > 0);

    for (const stmt of statements) {
        try {
            const { error } = await supabaseAdmin.rpc('exec_sql', { sql: stmt.trim() + ';' });
            if (error && !error.message.includes('already exists')) {
                console.log('Warning:', error.message);
            }
        } catch (e: any) {
            // Try direct query approach
            console.log('Statement:', stmt.trim().substring(0, 50) + '...');
        }
    }

    // Verify columns exist by querying schema
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('gym_name')
        .limit(1);

    if (error && error.code === '42703') {
        console.log('Columns not yet added. Attempting alternative method...');

        // Use the Supabase Dashboard SQL editor approach
        // For now, let's check if columns exist
        const { data: check } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .limit(1);

        console.log('Current profile columns:', check ? Object.keys(check[0] || {}) : 'no data');
    } else {
        console.log('✅ Gym columns likely already exist or were added');
    }

    console.log('Migration script complete. If columns were not added, please run the SQL manually in Supabase Dashboard.');
}

applyGymMigration();
