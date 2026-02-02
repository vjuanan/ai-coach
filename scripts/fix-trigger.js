// Script to recreate the handle_new_user trigger directly
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function fixTrigger() {
    console.log('\n🔧 RECREATING handle_new_user TRIGGER\n');

    // SQL to recreate the trigger function and trigger
    const sql = `
-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    input_role user_role;
    input_full_name TEXT;
BEGIN
    -- Extract Role from metadata
    BEGIN
        input_role := (NEW.raw_user_meta_data->>'role')::user_role;
    EXCEPTION WHEN OTHERS THEN
        input_role := NULL;
    END;

    -- Extract Full Name
    input_full_name := NEW.raw_user_meta_data->>'full_name';

    -- Defaults
    IF input_role IS NULL THEN
        input_role := 'athlete';
    END IF;

    IF input_full_name IS NULL OR input_full_name = '' THEN
        input_full_name := split_part(NEW.email, '@', 1);
    END IF;

    -- Insert into profiles
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        input_full_name,
        input_role
    )
    ON CONFLICT (id) DO NOTHING; -- Avoid duplicate key errors

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the auth transaction
    RAISE WARNING 'handle_new_user failed for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;

    // Execute the SQL directly
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.log('❌ RPC exec_sql failed (expected if not exists):', error.message);
        console.log('\n⚠️ You need to run this SQL manually in the Supabase SQL Editor:');
        console.log('═'.repeat(60));
        console.log(sql);
        console.log('═'.repeat(60));
    } else {
        console.log('✅ Trigger recreated successfully!');
    }

    // Test signup now
    console.log('\n📝 Testing signup after fix...');
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: 'admin@epnstore.com.ar',
        password: 'password123',
        email_confirm: true,
        user_metadata: {
            full_name: 'Test Admin',
            role: 'admin'
        }
    });

    if (createErr) {
        console.log('❌ CREATE USER STILL FAILED:', createErr.message);
    } else {
        console.log('✅ User created successfully!');
        console.log('   User ID:', newUser.user.id);
    }
}

fixTrigger().catch(console.error);
