'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useEscapeKey } from '@/hooks/use-escape-key';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const api = createClient();
    const router = useRouter();

    // Sort so unread are first, then by date
    const sortedNotifications = [...notifications].sort((a, b) => {
        if (a.read === b.read) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return a.read ? 1 : -1;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    useEscapeKey(() => setShowDropdown(false), showDropdown);

    useEffect(() => {
        const fetchNotifications = async () => {
            const { data: { user } } = await api.auth.getUser();
            if (!user) return;

            const { data } = await api
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) setNotifications(data);
        };

        fetchNotifications();

        const channel = api
            .channel('notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' },
                () => {
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            api.removeChannel(channel);
        };
    }, []);

    const markAsRead = async (id: string) => {
        await api.from('notifications').update({ read: true }).eq('id', id);
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) return;

        // Optimistic update
        setNotifications(notifications.map(n => ({ ...n, read: true })));

        const { data: { user } } = await api.auth.getUser();
        if (user) {
            await api.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
        }
    };

    const handleNotificationClick = async (notification: any) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }
        setShowDropdown(false);
        if (notification.link) {
            router.push(notification.link);
        }
    };

    return (
        <div className="relative">
            <button
                className="cv-btn-ghost relative p-2"
                onClick={() => setShowDropdown(!showDropdown)}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-cv-bg-primary" />
                )}
            </button>

            {showDropdown && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-cv-bg-secondary border border-cv-border rounded-xl shadow-xl z-50 overflow-hidden ring-1 ring-black ring-opacity-5">
                        <div className="p-3 border-b border-cv-border flex justify-between items-center bg-cv-bg-tertiary/30">
                            <h3 className="font-semibold text-sm">Notificaciones</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        markAllAsRead();
                                    }}
                                    className="text-xs text-cv-accent hover:underline flex items-center gap-1"
                                >
                                    <Check size={12} />
                                    Marcar todo leído
                                </button>
                            )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {sortedNotifications.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center text-cv-text-tertiary">
                                    <Bell size={32} className="mb-2 opacity-20" />
                                    <span className="text-sm">No tienes notificaciones</span>
                                </div>
                            ) : (
                                sortedNotifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`p-4 border-b border-cv-border last:border-0 hover:bg-cv-bg-tertiary/50 cursor-pointer transition-colors relative group ${!n.read ? 'bg-cv-accent/5' : ''}`}
                                    >
                                        {!n.read && (
                                            <span className="absolute left-0 top-0 bottom-0 w-1 bg-cv-accent" />
                                        )}
                                        <div className="flex justify-between items-start mb-1 gap-2">
                                            <h4 className={`text-sm leading-tight ${!n.read ? 'font-semibold text-cv-text-primary' : 'text-cv-text-secondary'}`}>
                                                {n.title}
                                            </h4>
                                            <span className="text-2xs text-cv-text-tertiary whitespace-nowrap">
                                                {new Date(n.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-cv-text-secondary line-clamp-2 mb-1">
                                            {n.message}
                                        </p>
                                        {n.link && (
                                            <div className="flex items-center gap-1 text-xs text-cv-accent opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span>Ver detalles</span>
                                                <ExternalLink size={10} />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
