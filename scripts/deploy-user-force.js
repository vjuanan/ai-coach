
const { spawn } = require('child_process');
const path = require('path');

// Credentials from User Request
const ACCESS_TOKEN = 'sbp_27552a04009826b77beb87da9f76aef4ab867868';
const PROJECT_REF = 'dfbxffnuwkcbnxfwyvcc';
const DB_PASSWORD = '38797509Ok!';

console.log('--- Force Deployment User Flow ---');

function run(cmd, args, name) {
    return new Promise((resolve, reject) => {
        console.log(`\n▶️ Running: ${name}...`);
        // console.log(`Command: ${cmd} ${args.join(' ')}`); // Don't log credentials

        const proc = spawn(cmd, args, {
            stdio: 'inherit',
            shell: false, // Security: avoid shell parsing
            env: {
                ...process.env,
                // Explicitly set env vars just in case CLI prefers them
                SUPABASE_ACCESS_TOKEN: ACCESS_TOKEN,
                SUPABASE_DB_PASSWORD: DB_PASSWORD
            }
        });

        proc.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${name} Success`);
                resolve();
            } else {
                console.error(`❌ ${name} Failed (Exit Code: ${code})`);
                reject(new Error(`${name} failed`));
            }
        });
    });
}

async function main() {
    try {
        // Step 1: Login
        // We use --token flag
        await run('npx', ['supabase', 'login', '--token', ACCESS_TOKEN], 'Supabase Login');

        // Step 2: Link
        // We use --password flag to avoid interactive prompt
        await run('npx', ['supabase', 'link',
            '--project-ref', PROJECT_REF,
            '--password', DB_PASSWORD
        ], 'Supabase Link');

        // Step 3: DB Push
        // We use --password flag
        await run('npx', ['supabase', 'db', 'push',
            '--password', DB_PASSWORD
        ], 'Supabase DB Push');

        console.log('\n✨ Deployment Completed Successfully!');
    } catch (err) {
        console.error('\n💥 Process Terminated:', err.message);
        process.exit(1);
    }
}

main();
