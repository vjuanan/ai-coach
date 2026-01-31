
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function run() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const email = 'testgym@epnstore.com.ar';

    console.log(`Checking profile for ${email}...`);

    // 1. Get User ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email === email);

    if (!user) {
        console.error('User not found!');
        return;
    }

    console.log(`Found user: ${user.id}`);

    // 2. Update Profile
    const updateData = {
        role: 'gym',
        full_name: 'CrossFit Test Gym', // Usually mapped from gym_name or separate
        gym_name: 'CrossFit Test Gym',
        gym_type: 'box_crossfit',
        gym_location: 'Buenos Aires, Test Location',
        member_count: 150,
        contact_phone: '+5491122334455',
        website_url: 'https://testgym.com',
        operating_hours: 'Mon-Fri 8-22, Sat 9-13',
        equipment_available: {
            rig: true,
            rowers: true,
            skiErgs: true,
            assaultBikes: true,
            pool: false,
            dumbbells: true,
            barbells: true
        }
    };

    console.log('Updating profile with gym data...');
    const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

    if (error) {
        console.error('Update failed:', error);
    } else {
        console.log('✅ Success! Test Gym populated.');
        console.log('Updated Role:', data.role);
        console.log('Updated Equipment:', data.equipment_available);
    }
}

run();
