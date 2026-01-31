'use client';

import { useAppStore } from '@/lib/store';
import { Search } from 'lucide-react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { NotificationBell } from './NotificationBell';
import { UserAvatar } from './UserAvatar';

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
        <header
            className={`
        fixed top-0 right-0 h-12 bg-cv-bg-primary/80 backdrop-blur-xl border-b border-cv-border
        flex items-center justify-between px-6 z-30 transition-all duration-300
        ${isSidebarCollapsed ? 'left-16' : 'left-64'}
      `}
        >
            {/* Left: Title & Breadcrumb */}
            <div className="flex items-center gap-4">
                {title && (
                    <h1 className="text-lg font-semibold text-cv-text-primary">{title}</h1>
                )}
            </div>

            {/* Center: Search */}
            <div className="relative group min-w-[320px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cv-text-tertiary group-hover:text-cv-text-secondary transition-colors" />
                <input
                    type="text"
                    placeholder="Buscar..."
                    defaultValue={searchParams.get('q')?.toString()}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="
                        w-full pl-10 pr-4 py-2 rounded-lg
                        bg-cv-bg-secondary border border-cv-border
                        text-sm text-cv-text-primary
                        placeholder:text-cv-text-tertiary
                        focus:outline-none focus:border-cv-accent focus:ring-1 focus:ring-cv-accent
                        transition-all duration-200
                    "
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                    {/* Hidden for now unless we implement global shortcut again */}
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">

                {prefixActions}

                {actions}

                {/* Notifications */}
                <NotificationBell />

                {/* User Avatar */}
                <UserAvatar />
            </div>
        </header>
    );
}
