
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function assignE2EProgram() {
    const coachEmail = 'vjuanan@gmail.com';
    const athleteEmail = 'athlete_e2e@test.com';

    console.log(`Step 3: Assigning program from ${coachEmail} to ${athleteEmail}...`);

    // 1. Get IDs
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const coachUser = users.find(u => u.email === coachEmail);
    const athleteUser = users.find(u => u.email === athleteEmail);
    if (!coachUser || !athleteUser) throw new Error('Users not found');

    // 2. Get Coach Profile ID
    const { data: coachProfile } = await supabaseAdmin.from('coaches').select('id').eq('user_id', coachUser.id).single();
    if (!coachProfile) throw new Error('Coach profile not found');

    // 3. Link Client (Create 'clients' record if needed)
    // The Onboarding itself doesn't automatically link to a specific coach unless invited. 
    // BUT for this test we manually link them so the verification works.
    const { data: existingClient } = await supabaseAdmin.from('clients').select('id').eq('user_id', athleteUser.id).single();
    let clientId = existingClient?.id;

    if (!clientId) {
        console.log('Linking client...');
        const { data: newClient } = await supabaseAdmin.from('clients').insert({
            coach_id: coachProfile.id,
            user_id: athleteUser.id,
            name: 'E2E Athlete',
            type: 'athlete',
            email: athleteEmail
        }).select().single();
        clientId = newClient.id;
    }

    // 4. Create Program
    console.log('Creating Program...');
    await supabaseAdmin.from('programs').insert({
        coach_id: coachProfile.id,
        client_id: clientId,
        name: 'Rutina Verificación E2E',
        description: 'Programa creado automáticamente para verificar el flujo completo.',
        status: 'active'
    });

    console.log('Program assigned successfully.');
}

assignE2EProgram();
