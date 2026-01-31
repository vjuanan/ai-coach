const fs = require('fs');
const path = require('path');

const projectRef = 'dfbxffnuwkcbnxfwyvcc';
const token = 'sbp_27552a04009826b77beb87da9f76aef4ab867868';
const sqlPath = path.join(__dirname, 'supabase/migrations/012_stimulus_features.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function run() {
    console.log(`Reading SQL from ${sqlPath}`);
    console.log('SQL Length:', sql.length);

    // Try the /query endpoint (v1)
    const url = `https://api.supabase.com/v1/projects/${projectRef}/query`;
    console.log(`Executing against: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ query: sql })
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Request Failed:', response.status, response.statusText);
            console.error('Response Body:', text);
            process.exit(1);
        }

        const data = await response.json();
        console.log('Success! Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Network Error:', error);
        process.exit(1);
    }
}

run();
