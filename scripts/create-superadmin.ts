
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ADMIN SCRIPT: Create/Update Superuser
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function promoteToSuperAdmin() {
    const email = 'vjuanan@gmail.com';
    const password = 'password123'; // Temporary password if creating new

    console.log(`Promoting ${email} to Super Admin...`);

    // 1. Check if user exists
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === email);

    let userId;

    if (existingUser) {
        console.log('User exists. ID:', existingUser.id);
        userId = existingUser.id;
    } else {
        console.log('User not found. Creating...');
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: 'Super Admin Juanan' }
        });

        if (createError) throw createError;
        userId = newUser.user.id;
        console.log('User created. ID:', userId);
    }

    // 2. Set Role in Profiles Table (using Service Role to bypass potential RLS if needed, although policies allow updates)
    // We update 'role' to 'admin' (or 'coach' if we want him to act as coach but superuser)
    // Schema says 'admin' is a role.

    // Note: Trigger might have created profile already if INSERT happened. 
    // If not (e.g. existing user), we insert/update manually.

    const { error: upsertError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: userId,
            email: email,
            role: 'admin', // Or 'coach'? User asked for superadmin, but schema differentiates. 
            // If he needs to use the app, 'coach' might be safer for UI, 'admin' for backend.
            // Let's set 'coach' for now to ensure UI access, as 'admin' UI doesn't exist yet.
            // OR better: 'admin' and middleware allows admin unrestricted?
            // Let's stick to 'coach' for functional Dashboard access, or check schema..
            // Schema has 'admin'. Let's use 'admin' and ensure Middleware handles it?
            // Middleware redirects: "role === 'athlete' ? ... : '/'". So 'admin' goes to '/'.
            full_name: 'Super Admin Juanan'
        });

    if (upsertError) {
        console.error('Error updating profile:', upsertError);
    } else {
        console.log('SUCCESS: Profile updated with role.');
    }
}

promoteToSuperAdmin();
