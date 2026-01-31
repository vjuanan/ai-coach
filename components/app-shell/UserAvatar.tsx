'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function UserAvatar() {
    const [initials, setInitials] = useState<string>('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setIsGuest(true);
                    setInitials('G'); // Guest
                    setIsLoading(false);
                    return;
                }

                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url, email')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error('Error fetching profile for avatar:', error);
                }

                if (profile) {
                    if (profile.avatar_url) {
                        setAvatarUrl(profile.avatar_url);
                    }
                    if (profile.full_name) {
                        const parts = profile.full_name.split(' ').filter((n: string) => n.length > 0);
                        if (parts.length >= 2) {
                            setInitials((parts[0][0] + parts[1][0]).toUpperCase());
                        } else if (parts.length === 1 && parts[0].length >= 2) {
                            setInitials(parts[0].substring(0, 2).toUpperCase());
                        } else if (parts.length === 1) {
                            setInitials(parts[0][0].toUpperCase());
                        }
                    } else if (profile.email) {
                        setInitials(profile.email.substring(0, 2).toUpperCase());
                    }
                } else {
                    // Fallback if profile missing but user auth exists
                    if (user.email) {
                        setInitials(user.email.substring(0, 2).toUpperCase());
                    }
                }
            } catch (error) {
                console.error('Error in UserAvatar:', error);
                setIsGuest(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, []);

    const handleClick = () => {
        if (isGuest) {
            router.push('/login');
        } else {
            router.push('/settings');
        }
    };

    return (
        <button
            onClick={handleClick}
            className="w-8 h-8 rounded-full bg-cv-accent/20 border border-cv-border flex items-center justify-center text-cv-accent font-medium text-sm overflow-hidden hover:ring-2 hover:ring-cv-accent/50 transition-all"
            title={isGuest ? "Invitado - Iniciar Sesión" : "Ir a Perfil"}
        >
            {avatarUrl ? (
                <img src={avatarUrl} alt="User" className="w-full h-full object-cover" />
            ) : isLoading ? (
                <div className="animate-pulse w-full h-full bg-cv-bg-tertiary rounded-full" />
            ) : (
                <span>{initials || 'U'}</span>
            )}
        </button>
    );
}

