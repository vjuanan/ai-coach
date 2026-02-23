'use client';

import { Sidebar } from '@/components/app-shell/Sidebar';
import { CommandPalette } from '@/components/app-shell/CommandPalette';
import { useAppStore } from '@/lib/store';
import { CoachWarning } from '@/components/app-shell/CoachWarning';
import { getCoachStatus } from '@/lib/actions';
import { useEffect, useState } from 'react';

interface DashboardShellProps {
    children: React.ReactNode;
    /** Role from server - renders sidebar immediately without flash */
    role: 'admin' | 'coach' | 'athlete' | 'gym';
    athleteSidebar?: {
        showMyCoach: boolean;
        showMyGym: boolean;
        disableMyGymCard: boolean;
    } | null;
}

export function DashboardShell({ children, role, athleteSidebar = null }: DashboardShellProps) {
    const { isSidebarCollapsed } = useAppStore();
    const [status, setStatus] = useState<{ hasCoach: boolean; isAthlete: boolean } | null>(null);

    useEffect(() => {
        getCoachStatus().then(setStatus);
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <Sidebar role={role} athleteSidebar={athleteSidebar} />
            <CommandPalette />

            <main
                className={`
                    pt-12 min-h-screen transition-all duration-300
                    ${isSidebarCollapsed ? 'pl-20' : 'pl-60'}
                `}
            >
                {/* Warning Banner */}
                {status && (
                    <div className="pt-2 px-6">
                        <CoachWarning hasCoach={status.hasCoach} isAthlete={status.isAthlete} />
                    </div>
                )}

                {/* 
                   We keep the padding logic here to ensure content doesn't go under the sidebar.
                   Individual pages will render their own Topbar which handles its own positioning.
                   The 'pt-12' accounts for the Topbar height.
                */}
                <div className="px-6 pt-2 pb-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
