'use client';

import { useAppStore } from '@/lib/store';
import { Search, Command } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { UserAvatar } from './UserAvatar';

interface TopbarProps {
    title?: string;
    actions?: React.ReactNode;
}

export function Topbar({ title, actions }: TopbarProps) {
    const { openCommandPalette, isSidebarCollapsed } = useAppStore();

    return (
        <header
            className={`
        fixed top-0 right-0 h-16 bg-cv-bg-primary/80 backdrop-blur-xl border-b border-cv-border
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
            <button
                onClick={openCommandPalette}
                className="
          flex items-center gap-3 px-4 py-2 rounded-lg
          bg-cv-bg-secondary border border-cv-border
          text-cv-text-tertiary hover:text-cv-text-secondary hover:border-cv-text-tertiary
          transition-all duration-200 group min-w-[280px]
        "
            >
                <Search size={16} className="text-cv-text-tertiary group-hover:text-cv-text-secondary" />
                <span className="text-sm flex-1 text-left">Buscar...</span>
                <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-cv-bg-tertiary text-2xs font-mono text-cv-text-tertiary">
                        <Command size={10} className="inline" />
                    </kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-cv-bg-tertiary text-2xs font-mono text-cv-text-tertiary">
                        K
                    </kbd>
                </div>
            </button>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">

                {/* Notifications */}
                <NotificationBell />

                {/* User Avatar */}
                <UserAvatar />

                {actions}
            </div>
        </header>
    );
}
