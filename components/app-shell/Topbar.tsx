'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Search, UserPlus } from 'lucide-react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { NotificationBell } from './NotificationBell';
import { UserAvatar } from './UserAvatar';
import { InviteDialog } from './InviteDialog';

interface TopbarProps {
    title?: string;
    actions?: React.ReactNode;
    prefixActions?: React.ReactNode;
}

export function Topbar({ title, actions, prefixActions }: TopbarProps) {
    const { isSidebarCollapsed } = useAppStore();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (term) {
            params.set('q', term);
        } else {
            params.delete('q');
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <>
            <header
                className={`
            fixed top-0 right-0 h-12 bg-white border-b border-cv-border
            flex items-center justify-between px-4 z-30 transition-all duration-300
            ${isSidebarCollapsed ? 'left-20' : 'left-60'}
          `}
            >
                {/* Left: Title */}
                <div className="flex items-center gap-4 min-w-[200px]">
                    {title && (
                        <h1 className="text-lg font-semibold text-cv-text-primary tracking-tight">
                            {title}
                        </h1>
                    )}
                </div>

                {/* Center: Search */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[320px]">
                    <div className="relative group w-full">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cv-text-tertiary group-hover:text-cv-text-secondary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            defaultValue={searchParams.get('q')?.toString()}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="
                            w-full pl-9 pr-4 py-1.5 rounded-full
                            bg-slate-100
                            text-xs text-cv-text-primary
                            placeholder:text-cv-text-tertiary
                            focus:outline-none focus:ring-1 focus:ring-cv-accent
                            transition-all duration-200
                        "
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                            {/* Hidden for now unless we implement global shortcut again */}
                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5">

                    {prefixActions}

                    {actions}

                    {/* Invite Button */}
                    <button
                        onClick={() => setIsInviteDialogOpen(true)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        title="Invitar usuarios"
                    >
                        <UserPlus size={20} />
                    </button>

                    {/* Notifications */}
                    <NotificationBell />

                    {/* User Avatar */}
                    <UserAvatar />
                </div>
            </header>

            {/* Invite Dialog */}
            <InviteDialog
                isOpen={isInviteDialogOpen}
                onClose={() => setIsInviteDialogOpen(false)}
            />
        </>
    );
}

// Force rebuild trigger
