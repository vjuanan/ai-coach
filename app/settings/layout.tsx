'use client';

import { AppShell } from '@/components/app-shell';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Zap } from 'lucide-react';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const tabs = [
        { name: 'Perfil', href: '/settings', icon: User },
        { name: 'Estímulos', href: '/settings/stimuli', icon: Zap },
    ];

    return (
        <AppShell title="Configuración">
            <div className="flex flex-col h-full bg-cv-bg-primary">
                {/* Tabs Navigation */}
                <div className="flex items-center gap-1 border-b border-cv-border px-6 pt-4 mb-6">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = pathname === tab.href;
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`
                                    flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                                    ${isActive
                                        ? 'border-cv-accent text-cv-text-primary'
                                        : 'border-transparent text-cv-text-tertiary hover:text-cv-text-secondary hover:border-slate-300 dark:hover:border-slate-700'}
                                `}
                            >
                                <Icon size={16} />
                                {tab.name}
                            </Link>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    {children}
                </div>
            </div>
        </AppShell>
    );
}
