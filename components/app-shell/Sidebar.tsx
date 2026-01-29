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
    Zap
} from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    context?: 'athletes' | 'gyms' | 'all';
}

const navItems: NavItem[] = [
    { label: 'Panel', href: '/', icon: <LayoutDashboard size={20} />, context: 'all' },
    { label: 'Atletas', href: '/athletes', icon: <Users size={20} />, context: 'athletes' },
    { label: 'Gimnasios', href: '/gyms', icon: <Building2 size={20} />, context: 'gyms' },
    { label: 'Programas', href: '/programs', icon: <Dumbbell size={20} />, context: 'all' },
    { label: 'Plantillas', href: '/templates', icon: <FileText size={20} />, context: 'all' },
];

export function Sidebar() {
    const { currentView, isSidebarCollapsed, toggleSidebar, setCurrentView } = useAppStore();
    const pathname = usePathname();

    const filteredNavItems = navItems.filter(
        item => item.context === 'all' || item.context === currentView
    );

    return (
        <aside
            className={`
        fixed left-0 top-0 h-screen bg-cv-bg-secondary border-r border-cv-border
        flex flex-col transition-all duration-300 ease-in-out z-40
        ${isSidebarCollapsed ? 'w-16' : 'w-64'}
      `}
        >
            {/* Logo */}
            <div className={`
                flex items-center border-b border-cv-border transition-all duration-300
                ${isSidebarCollapsed ? 'h-16 justify-center px-4' : 'h-32 justify-center px-6'}
            `}>
                <Link href="/" className={`flex items-center gap-3 ${isSidebarCollapsed ? '' : 'flex-col gap-2'}`}>
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        <Image
                            src="/logo.png"
                            alt="AI Coach Logo"
                            width={40}
                            height={40}
                            className="object-contain"
                        />
                    </div>
                    {!isSidebarCollapsed && (
                        <span className="font-bold text-xl tracking-tight text-cv-text-primary">
                            AI Coach
                        </span>
                    )}
                </Link>
                {!isSidebarCollapsed && (
                    <button
                        onClick={toggleSidebar}
                        className="absolute right-4 top-4 p-1.5 rounded-md text-cv-text-tertiary hover:text-cv-text-primary hover:bg-cv-bg-tertiary transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                )}
                {isSidebarCollapsed && (
                    <button
                        onClick={toggleSidebar}
                        className="p-1.5 rounded-md text-cv-text-tertiary hover:text-cv-text-primary hover:bg-cv-bg-tertiary transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                )}
            </div>

            {/* Context Switcher */}
            {!isSidebarCollapsed && (
                <div className="p-3 border-b border-cv-border">
                    <div className="flex bg-cv-bg-tertiary rounded-lg p-1">
                        <button
                            onClick={() => setCurrentView('athletes')}
                            className={`
                flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all
                ${currentView === 'athletes'
                                    ? 'bg-cv-accent text-white shadow-cv-sm'
                                    : 'text-cv-text-secondary hover:text-cv-text-primary'}
              `}
                        >
                            Atletas
                        </button>
                        <button
                            onClick={() => setCurrentView('gyms')}
                            className={`
                flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all
                ${currentView === 'gyms'
                                    ? 'bg-cv-accent text-white shadow-cv-sm'
                                    : 'text-cv-text-secondary hover:text-cv-text-primary'}
              `}
                        >
                            Gimnasios
                        </button>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {filteredNavItems.map((item) => {
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
