'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function UserAvatar() {
    const [initials, setInitials] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url, email').eq('id', user.id).single();
                if (profile) {
                    setAvatarUrl(profile.avatar_url);
                    if (profile.full_name) {
                        setInitials(profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase());
                    } else if (profile.email) {
                        setInitials(profile.email.substring(0, 2).toUpperCase());
                    } else {
                        setInitials('U');
                    }
                }
            }
        };
        fetchUser();
    }, []);

    return (
        <button
            onClick={() => router.push('/settings')}
            className="w-8 h-8 rounded-full bg-cv-accent/20 border border-cv-border flex items-center justify-center text-cv-accent font-medium text-sm overflow-hidden hover:ring-2 hover:ring-cv-accent/50 transition-all"
            title="Ir a Perfil"
        >
            {avatarUrl ? (
                <img src={avatarUrl} alt="User" className="w-full h-full object-cover" />
            ) : (
                initials || <div className="animate-pulse w-full h-full bg-cv-bg-tertiary" />
            )}
        </button>
    );
}
