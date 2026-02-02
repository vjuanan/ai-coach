
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables manually to avoid shell parsing issues
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = { ...process.env }; // Start with existing env

envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        env[key] = value;
    }
});

const password = env.SUPABASE_DB_PASSWORD;
const projectRef = 'dfbxffnuwkcbnxfwyvcc';

if (!password) {
    console.error('Error: SUPABASE_DB_PASSWORD not found in .env.local');
    process.exit(1);
}

console.log('--- CLI Deployment Wrapper ---');
console.log(`Project Ref: ${projectRef}`);
console.log(`Detailed Password Check: Length=${password.length}, EndsWith='!'? ${password.endsWith('!')}`);

// Helper to run command
function runCommand(command, args, name) {
    return new Promise((resolve, reject) => {
        console.log(`\n🚀 Running: ${name} (${command} ${args.join(' ')})`);

        const proc = spawn(command, args, {
            stdio: 'inherit',
            env: env, // Pass env directly, NO SHELL INTERPOLATION
            shell: true
        });

        proc.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${name} success`);
                resolve();
            } else {
                console.error(`❌ ${name} failed with code ${code}`);
                reject(new Error(`${name} failed`));
            }
        });
    });
}

async function main() {
    try {
        // 1. Link Project (Non-interactive)
        // We pass the password via flag to be sure, although it might check env too
        await runCommand('npx', ['supabase', 'link', '--project-ref', projectRef, '--password', password], 'Supabase Link');

        // 2. Db Push
        await runCommand('npx', ['supabase', 'db', 'push', '--password', password], 'Supabase DB Push');

        console.log('\n✨ All steps completed successfully!');
    } catch (err) {
        console.error('\n💥 Deployment failed.');
        process.exit(1);
    }
}

main();
