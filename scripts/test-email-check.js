// Test script to debug checkEmailRegistered
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

async function checkEmailRegistered(email) {
    console.log('[checkEmailRegistered] Starting check for:', email);

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('[checkEmailRegistered] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!');
        throw new Error('Error de configuración del servidor.');
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc('check_email_exists', {
        email_input: email.toLowerCase().trim()
    });

    console.log('[checkEmailRegistered] RPC result:', { data, error: error?.message });

    if (error) {
        console.warn('[checkEmailRegistered] RPC check failed:', error.message);
        throw new Error('No pudimos verificar el email.');
    }

    console.log('[checkEmailRegistered] Email exists:', !!data);
    return { exists: !!data };
}

async function test() {
    try {
        const result = await checkEmailRegistered('admin@epnstore.com.ar');
        console.log('\n=== RESULT ===');
        console.log('exists:', result.exists);
        if (result.exists) {
            console.log('✅ SHOULD BLOCK SIGNUP!');
        } else {
            console.log('❌ Would allow signup (BUG!)');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

test();
