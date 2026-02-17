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
    ChevronRight,
    Shield,
    BookOpen,
} from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

// Unified nav items - Reverted to Original Nomenclature
const navItems: NavItem[] = [
    { label: 'Panel', href: '/', icon: <LayoutDashboard size={20} /> },
    { label: 'Atletas', href: '/athletes', icon: <Users size={20} /> },
    { label: 'Gimnasios', href: '/gyms', icon: <Building2 size={20} /> },
    { label: 'Ejercicios', href: '/exercises', icon: <Dumbbell size={20} /> },
    { label: 'Programas', href: '/programs', icon: <FileText size={20} /> },
    { label: 'Plantillas', href: '/templates', icon: <FileText size={20} /> },
    { label: 'Conocimiento', href: '/knowledge', icon: <BookOpen size={20} /> },
    { label: 'Usuarios', href: '/admin/users', icon: <Shield size={20} /> },
];

interface SidebarProps {
    /** Role passed from server - NO async loading, immediate render */
    role?: 'admin' | 'coach' | 'athlete' | 'gym';
}

export function Sidebar({ role = 'coach' }: SidebarProps) {
    const { isSidebarCollapsed, toggleSidebar } = useAppStore();
    const pathname = usePathname();

    // Filter Items based on Role - role is passed from server, no loading state!
    const filteredNavItems = navItems.filter(item => {
        if (role === 'admin') return true; // See all

        if (role === 'coach') {
            // Coach cannot see 'Gimnasios' OR admin sections
            return item.href !== '/gyms' && !item.href.startsWith('/admin');
        }

        if (role === 'athlete') {
            // Athletes only see dashboard
            return item.href === '/';
        }
        return true; // Fallback: show item
    });

    return (
        <aside
            data-version="2"
            className={`
        fixed left-0 top-0 h-screen bg-white border-r border-slate-100
        flex flex-col transition-all duration-300 ease-in-out z-40
        ${isSidebarCollapsed ? 'w-16' : 'w-48'}
      `}
        >
            {/* Logo - Horizontal layout matching reference */}
            <div className={`
                flex items-center bg-transparent transition-all duration-300 relative
                ${isSidebarCollapsed ? 'h-12 justify-center px-2' : 'h-12 justify-start px-6'}
            `}>
                <Link href="/" className="flex items-center gap-2">
                    {/* Logo - Reduced size for better proportion */}
                    <Image
                        src="/icon.png"
                        alt="Logo"
                        width={20}
                        height={20}
                        className="h-5 w-5 object-contain"
                    />

                    {!isSidebarCollapsed && (
                        <span className="text-slate-700 font-semibold text-sm tracking-tight whitespace-nowrap">
                            AI Nutrition
                        </span>
                    )}
                </Link>
                {/* Removed Toggle Button from Header to match clean look */}
            </div>

            {/* Navigation - Unified, no toggle */}
            <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
                {filteredNavItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                flex items-center gap-3 px-3 py-3 rounded-lg transition-all mb-1
                ${isSidebarCollapsed ? 'justify-center' : ''}
                ${isActive
                                    ? 'bg-emerald-50 text-emerald-600 font-medium'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
              `}
                            title={isSidebarCollapsed ? item.label : undefined}
                        >
                            {item.icon}
                            {!isSidebarCollapsed && (
                                <span className="text-sm">{item.label}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Expand button when collapsed - at bottom */}
            {isSidebarCollapsed && (
                <div className="flex justify-center py-4 border-t border-slate-100">
                    <button
                        onClick={toggleSidebar}
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </aside>
    );
}
