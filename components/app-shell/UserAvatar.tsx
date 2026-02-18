import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as Popover from '@radix-ui/react-popover';
import { LogOut, User } from 'lucide-react';

export function UserAvatar() {
    const [initials, setInitials] = useState<string>('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [fullName, setFullName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
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

                setEmail(user.email || '');

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
                        setFullName(profile.full_name);
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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push('/login');
    };

    const AvatarButton = (
        <button
            className="w-9 h-9 rounded-full bg-cv-accent/10 border border-cv-border flex items-center justify-center text-cv-accent font-medium text-sm overflow-hidden hover:ring-2 hover:ring-cv-accent/30 transition-all focus:outline-none"
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

    if (isGuest) {
        return (
            <Popover.Root>
                <Popover.Trigger asChild>
                    {AvatarButton}
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Content
                        className="w-48 bg-cv-bg-secondary border border-cv-border rounded-lg shadow-xl p-1 z-50 mr-2"
                        align="end"
                        sideOffset={5}
                    >
                        <div className="px-2 py-2 text-xs text-cv-text-secondary border-b border-cv-border mb-1">
                            Invitado
                        </div>
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full text-left px-2 py-2 text-sm text-cv-text-primary hover:bg-cv-bg-tertiary rounded flex items-center gap-2"
                        >
                            <User size={14} />
                            Iniciar Sesión
                        </button>
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        );
    }

    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                {AvatarButton}
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    className="w-56 bg-cv-bg-secondary/95 backdrop-blur-xl border border-cv-border rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                    align="end"
                    sideOffset={8}
                >
                    <div className="px-3 py-2.5 border-b border-cv-border/50 mb-1">
                        <p className="text-sm font-medium text-cv-text-primary truncate">{fullName || 'Usuario'}</p>
                        <p className="text-xs text-cv-text-tertiary truncate">{email}</p>
                    </div>

                    <div className="space-y-0.5">
                        <Link
                            href="/settings"
                            className="w-full text-left px-3 py-2 text-sm text-cv-text-secondary hover:text-cv-text-primary hover:bg-cv-bg-tertiary/50 rounded-lg flex items-center gap-2.5 transition-colors"
                        >
                            <User size={15} />
                            Perfil
                        </Link>
                    </div>

                    <div className="h-px bg-cv-border/50 my-1.5 mx-1" />

                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg flex items-center gap-2.5 transition-colors"
                    >
                        <LogOut size={15} />
                        Cerrar Sesión
                    </button>

                    <Popover.Arrow className="fill-cv-border" />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}

