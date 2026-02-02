
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Mocking getClient from lib/actions.ts by copying the logic
async function getClientMock(id: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing env vars');
        return null;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Try clients table
    const { data: clientData, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

    if (!error && clientData) {
        console.log('✅ Found in clients table');
        return clientData;
    }

    // 2. Fallback to profiles
    console.log('⚠️ Not found in clients, checking profiles...');
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

    if (profile) {
        console.log('✅ Found in profiles table. Role:', profile.role);
        // Map profile to Client shape
        const isGym = profile.role === 'gym';
        const isAthlete = profile.role === 'athlete';

        if (!isGym && !isAthlete) return null;

        return {
            id: profile.id,
            coach_id: null,
            type: isGym ? 'gym' : 'athlete',
            name: isGym ? (profile.gym_name || profile.full_name || 'Gym') : (profile.full_name || 'Athlete'),
            email: profile.email,
            details: isGym ? {
                source: 'self-registered',
                gym_type: profile.gym_type,
                location: profile.gym_location,
                member_count: profile.member_count,
                equipment: profile.equipment_available, // This is what we want to verify!
            } : {
                source: 'self-registered',
                level: profile.experience_level,
                injuries: profile.injuries,
                // ... other fields
            }
        };
    }
    return null;
}

async function run() {
    console.log('Starting verification...');
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // 1. Find a Gym Profile
    const { data: gym } = await supabase.from('profiles').select('id, email').eq('role', 'gym').limit(1).single();
    if (gym) {
        console.log(`\nTesting Gym: ${gym.email} (${gym.id})`);
        const result = await getClientMock(gym.id);
        console.log('Mapped Result Details:', JSON.stringify(result.details, null, 2));
    } else {
        console.log('No gym found');
    }

    // 2. Find an Athlete Profile
    const { data: athlete } = await supabase.from('profiles').select('id, email').eq('role', 'athlete').limit(1).single();
    if (athlete) {
        console.log(`\nTesting Athlete: ${athlete.email} (${athlete.id})`);
        const result = await getClientMock(athlete.id);
        console.log('Mapped Result Details:', JSON.stringify(result.details, null, 2));
    } else {
        console.log('No athlete found');
    }
}

run();
