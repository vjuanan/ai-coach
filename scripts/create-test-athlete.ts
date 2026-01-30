
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createTestAthlete() {
    const coachEmail = 'vjuanan@gmail.com';
    const athleteEmail = 'atleta@test.com';
    const password = 'password123';

    console.log(`Creating test athlete ${athleteEmail} linked to ${coachEmail}...`);

    // 1. Get Coach ID (from Profiles/Coaches)
    // We need the *Internal ID* from the 'coaches' table, not just the user ID.
    const { data: coachUser } = await supabaseAdmin.from('profiles').select('id').eq('email', coachEmail).single();
    if (!coachUser) throw new Error('Coach User not found');

    const { data: coachProfile } = await supabaseAdmin.from('coaches').select('id').eq('user_id', coachUser.id).single();

    // If coach profile doesn't exist in 'coaches' table (it might purely be in 'profiles' for now), we need to create it.
    let coachId = coachProfile?.id;
    if (!coachId) {
        console.log('Coach profile missing in "coaches" table. Creating...');
        const { data: newCoach } = await supabaseAdmin.from('coaches').insert({
            user_id: coachUser.id,
            full_name: 'Super Coach Juanan',
            email: coachEmail // If schema allows
        }).select().single();
        coachId = newCoach.id;
    }

    // 2. Create Athlete User (Auth)
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    let athleteUser = users.find(u => u.email === athleteEmail);
    let athleteUserId;

    if (!athleteUser) {
        console.log('Creating Athlete Auth User...');
        const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
            email: athleteEmail,
            password: password,
            email_confirm: true,
            user_metadata: { full_name: 'Test Athlete' }
        });
        if (error) throw error;
        athleteUserId = newUser.user.id;
    } else {
        athleteUserId = athleteUser.id;
        console.log('Athlete Auth User exists.');
    }

    // 3. Set Role to 'athlete'
    await supabaseAdmin.from('profiles').upsert({
        id: athleteUserId,
        email: athleteEmail,
        role: 'athlete',
        full_name: 'Test Athlete'
    });

    // 4. Link to Coach (Create 'clients' record)
    // Check if client record exists linked to this user_id
    const { data: existingClient } = await supabaseAdmin.from('clients').select('id').eq('user_id', athleteUserId).single();

    let clientId;
    if (!existingClient) {
        console.log('Linking Athlete to Coach...');
        const { data: newClient, error: clientError } = await supabaseAdmin.from('clients').insert({
            coach_id: coachId,
            user_id: athleteUserId,
            name: 'Test Athlete',
            type: 'athlete',
            email: athleteEmail
        }).select().single();

        if (clientError) throw clientError;
        clientId = newClient.id;
    } else {
        clientId = existingClient.id;
        console.log('Link already exists.');
    }

    // 5. Assign a Program (Optional, to verify visibility)
    // Find a program template to copy or assign?
    // Let's just create a dummy program assigned to this client
    console.log('Assigning dummy program...');
    await supabaseAdmin.from('programs').insert({
        coach_id: coachId,
        client_id: clientId,
        name: 'Programa de Prueba Atleta',
        description: 'Programa asignado para verificar dashboard',
        status: 'active',
        is_template: false
    });

    console.log('SUCCESS: Test Athlete Created and Linked.');
}

createTestAthlete();
