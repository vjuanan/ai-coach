const { Client } = require('pg');

const password = '38797509Ok!';
const projectRef = 'dfbxffnuwkcbnxfwyvcc';
const connectionString = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;

async function run() {
    console.log('Connecting to DB...');
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        await client.query(`
            UPDATE public.profiles 
            SET onboarding_completed = FALSE, role = 'athlete'
            WHERE email = 'admin@epnstore.com.ar';
        `);

        console.log('Reset admin to pending onboarding.');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

run();
