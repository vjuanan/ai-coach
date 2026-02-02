// Script to update Supabase Site URL and Redirect URLs via Management API
require('dotenv').config({ path: '.env.local' });

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = 'dfbxffnuwkcbnxfwyvcc';
const siteUrl = 'https://aicoach.epnstore.com.ar';

if (!accessToken) {
    console.error('Missing SUPABASE_ACCESS_TOKEN in .env.local');
    process.exit(1);
}

async function updateAuthConfig() {
    console.log('\n🔧 Updating Supabase Auth Configuration...\n');

    const url = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;

    const payload = {
        site_url: siteUrl,
        uri_allow_list: 'https://aicoach.epnstore.com.ar/**,https://aicoach.epnstore.com.ar/auth/callback',
        mailer_autoconfirm: false,
        external_email_enabled: true
    };

    console.log('📤 Sending update request...');
    console.log('   Site URL:', siteUrl);
    console.log('   Redirect Whitelist:', payload.uri_allow_list);

    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Failed to update config:', response.status, errorText);
            return false;
        }

        const data = await response.json();
        console.log('\n✅ Auth configuration updated successfully!');
        console.log('   New Site URL:', data.site_url || siteUrl);
        return true;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

async function verifyConfig() {
    console.log('\n🔍 Verifying current configuration...\n');

    const url = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            console.error('❌ Failed to get config:', response.status);
            return;
        }

        const data = await response.json();
        console.log('📋 Current Auth Config:');
        console.log('   Site URL:', data.site_url);
        console.log('   Redirect URLs:', data.uri_allow_list || 'Not set');
        console.log('   Email Autoconfirm:', data.mailer_autoconfirm);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function main() {
    await verifyConfig();
    const success = await updateAuthConfig();
    if (success) {
        console.log('\n🔄 Verifying update...');
        await verifyConfig();
        console.log('\n🎉 Configuration updated! New signups will use the correct redirect URL.');
        console.log('   Note: Existing unverified emails may still have the old localhost link.');
        console.log('   Those users need to re-register or request a new verification email.\n');
    }
}

main();
