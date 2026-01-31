import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SettingsForm } from '@/components/settings/SettingsForm';

export default async function SettingsPage() {
    const supabase = createServerClient();

    // Server-side fetch - instant on Node.js environment relative to client
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return <SettingsForm user={user} initialProfile={profile} />;
}
