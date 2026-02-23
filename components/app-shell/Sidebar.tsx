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
    UserCog,
    Lock,
} from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    disabled?: boolean;
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
    athleteSidebar?: {
        showMyCoach: boolean;
        showMyGym: boolean;
        disableMyGymCard: boolean;
    } | null;
}

export function Sidebar({ role = 'coach', athleteSidebar = null }: SidebarProps) {
    const { isSidebarCollapsed, toggleSidebar } = useAppStore();
    const pathname = usePathname();

    let filteredNavItems = navItems.filter(item => {
        if (role === 'admin') return true; // See all

        if (role === 'coach') {
            // Coach cannot see 'Gimnasios' OR admin sections
            return item.href !== '/gyms' && !item.href.startsWith('/admin');
        }

        if (role === 'athlete') {
            return false;
        }

        if (role === 'gym') {
            // Gym users: no admin, no editor/tooling sections
            return !item.href.startsWith('/admin') &&
                item.href !== '/programs' &&
                item.href !== '/templates' &&
                item.href !== '/knowledge' &&
                item.href !== '/exercises';
        }
        return true; // Fallback: show item
    });

    if (role === 'athlete') {
        filteredNavItems = [{ label: 'Panel', href: '/', icon: <LayoutDashboard size={20} /> }];
        if (athleteSidebar?.showMyCoach) {
            filteredNavItems.push({
                label: 'Mi Coach',
                href: '/athlete/my-coach',
                icon: <UserCog size={20} />
            });
        }
        if (athleteSidebar?.showMyGym) {
            filteredNavItems.push({
                label: 'Mi Gimnasio',
                href: '/athlete/my-gym',
                icon: <Building2 size={20} />
            });
        } else if (athleteSidebar?.disableMyGymCard) {
            filteredNavItems.push({
                label: 'Mi Gimnasio',
                href: '/athlete/my-gym',
                icon: <Lock size={20} />,
                disabled: true
            });
        }
    }

    return (
        <aside
            data-version="6"
            className={`
        fixed left-0 top-0 h-screen bg-white border-r border-slate-100
        flex flex-col transition-all duration-300 ease-in-out z-40
        ${isSidebarCollapsed ? 'w-[64px]' : 'w-[256px]'}
      `}
        >
            {/* Logo - Horizontal layout matching reference */}
            {/* Logo - Horizontal layout matching reference */}
            <div className={`
                flex items-center bg-transparent transition-all duration-300 relative
                ${isSidebarCollapsed ? 'h-12 justify-center px-2' : 'h-12 justify-start px-5'}
            `}>
                <Link href="/" className="flex items-center gap-3">
                    {/* Logo - Reduced size for better proportion */}
                    <Image
                        src="/icon.png"
                        alt="Logo"
                        width={28}
                        height={28}
                        className="h-7 w-7 object-contain"
                    />

                    {!isSidebarCollapsed && (
                        <span
                            className="text-[#334155] font-[600] text-[18px] tracking-tight whitespace-nowrap"
                            style={{ fontFeatureSettings: "'cv02', 'cv03', 'cv04', 'cv11'" }}
                        >
                            AI Coach
                        </span>
                    )}
                </Link>
                {/* Removed Toggle Button from Header to match clean look */}
            </div>

            {/* Navigation - Unified, no toggle */}
            <nav className="flex-1 px-2 pt-2 pb-4 space-y-1 overflow-y-auto">
                {filteredNavItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));

                    if (item.disabled) {
                        return (
                            <div
                                key={item.label}
                                className={`
                                    flex items-center gap-3 px-4 py-[11px] rounded-lg transition-all mb-1
                                    ${isSidebarCollapsed ? 'justify-center' : ''}
                                    text-slate-300 cursor-not-allowed
                                `}
                                title={isSidebarCollapsed ? item.label : 'Disponible cuando tengas gimnasio asignado'}
                                aria-disabled="true"
                            >
                                {item.icon}
                                {!isSidebarCollapsed && (
                                    <span className="text-[14px]">{item.label}</span>
                                )}
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                flex items-center gap-3 px-4 py-[11px] rounded-lg transition-all mb-1
                ${isSidebarCollapsed ? 'justify-center' : ''}
                ${isActive
                                    ? 'bg-emerald-50 text-emerald-600 font-medium'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
              `}
                            title={isSidebarCollapsed ? item.label : undefined}
                        >
                            {item.icon}
                            {!isSidebarCollapsed && (
                                <span className="text-[14px]">{item.label}</span>
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

