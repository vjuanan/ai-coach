'use client';

import { useAppStore } from '@/lib/store';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Building2,
    Dumbbell,
    FileText,
    Settings,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

// Unified nav items - no more context filtering
const navItems: NavItem[] = [
    { label: 'Panel', href: '/', icon: <LayoutDashboard size={20} /> },
    { label: 'Atletas', href: '/athletes', icon: <Users size={20} /> },
    { label: 'Gimnasios', href: '/gyms', icon: <Building2 size={20} /> },
    { label: 'Programas', href: '/programs', icon: <Dumbbell size={20} /> },
    { label: 'Plantillas', href: '/templates', icon: <FileText size={20} /> },
];

export function Sidebar() {
    const { isSidebarCollapsed, toggleSidebar } = useAppStore();
    const pathname = usePathname();

    return (
        <aside
            className={`
        fixed left-0 top-0 h-screen bg-cv-bg-secondary border-r border-cv-border
        flex flex-col transition-all duration-300 ease-in-out z-40
        ${isSidebarCollapsed ? 'w-16' : 'w-64'}
      `}
        >
            {/* Logo - Horizontal layout matching reference */}
            <div className={`
                flex items-center bg-white border-b border-cv-border transition-all duration-300 relative
                ${isSidebarCollapsed ? 'h-16 justify-center px-2' : 'h-16 px-4'}
            `}>
                <Link href="/" className="flex items-center">
                    {/* Logo */}
                    <div className="relative w-9 h-9 flex items-center justify-center flex-shrink-0">
                        <Image
                            src="/images/ai-coach-logo-v3.png"
                            alt="AI Coach Logo"
                            width={36}
                            height={36}
                            className="object-contain"
                        />
                    </div>
                    {!isSidebarCollapsed && (
                        <>
                            {/* Vertical Divider */}
                            <div className="h-5 w-px bg-slate-300 mx-3 self-center"></div>
                            {/* Text */}
                            <span className="font-semibold text-lg text-slate-800 whitespace-nowrap">
                                AI Coach
                            </span>
                        </>
                    )}
                </Link>
                {!isSidebarCollapsed && (
                    <button
                        onClick={toggleSidebar}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-cv-text-tertiary hover:text-cv-text-primary hover:bg-cv-bg-tertiary transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                )}
                {isSidebarCollapsed && (
                    <button
                        onClick={toggleSidebar}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-cv-text-tertiary hover:text-cv-text-primary hover:bg-cv-bg-tertiary transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                )}
            </div>

            {/* Navigation - Unified, no toggle */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                flex items-center gap-3 px-3 py-2 rounded-lg transition-all
                ${isSidebarCollapsed ? 'justify-center' : ''}
                ${isActive
                                    ? 'bg-cv-accent-muted text-cv-accent'
                                    : 'text-cv-text-secondary hover:text-cv-text-primary hover:bg-cv-bg-tertiary'}
              `}
                            title={isSidebarCollapsed ? item.label : undefined}
                        >
                            {item.icon}
                            {!isSidebarCollapsed && (
                                <span className="font-medium text-sm">{item.label}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-3 border-t border-cv-border">
                <Link
                    href="/settings"
                    className={`
            flex items-center gap-3 px-3 py-2 rounded-lg transition-all
            text-cv-text-secondary hover:text-cv-text-primary hover:bg-cv-bg-tertiary
            ${isSidebarCollapsed ? 'justify-center' : ''}
          `}
                    title={isSidebarCollapsed ? 'Settings' : undefined}
                >
                    <Settings size={20} />
                    {!isSidebarCollapsed && (
                        <span className="font-medium text-sm">Configuración</span>
                    )}
                </Link>
            </div>
        </aside>
    );
}
