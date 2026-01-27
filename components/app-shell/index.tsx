'use client';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';
import { useAppStore } from '@/lib/store';

interface AppShellProps {
    children: React.ReactNode;
    title?: string;
    actions?: React.ReactNode;
}

export function AppShell({ children, title, actions }: AppShellProps) {
    const { isSidebarCollapsed } = useAppStore();

    return (
        <div className="min-h-screen bg-cv-bg-primary">
            <Sidebar />
            <Topbar title={title} actions={actions} />
            <CommandPalette />

            <main
                className={`
          pt-16 min-h-screen transition-all duration-300
          ${isSidebarCollapsed ? 'pl-16' : 'pl-64'}
        `}
            >
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}

// Export all components
export { Sidebar } from './Sidebar';
export { Topbar } from './Topbar';
export { CommandPalette } from './CommandPalette';
