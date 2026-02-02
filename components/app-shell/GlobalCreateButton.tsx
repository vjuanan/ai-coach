'use client';

import { useState, useRef, useEffect } from 'react';
import { useEscapeKey } from '@/hooks/use-escape-key';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, Users, Building2, Dumbbell, Loader2 } from 'lucide-react';
import { ProgramSetupWizard } from './ProgramSetupWizard';

export function GlobalCreateButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const pathname = usePathname();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEscapeKey(() => setIsOpen(false), isOpen);

    const handleCreateProgram = () => {
        setIsOpen(false);
        setIsWizardOpen(true);
    };

    const menuItems = [
        {
            label: 'Nuevo Atleta',
            icon: <Users size={16} />,
            href: '/athletes/new',
            color: 'text-blue-400'
        },
        {
            label: 'Nuevo Gimnasio',
            icon: <Building2 size={16} />,
            href: '/gyms/new',
            color: 'text-purple-400'
        },
        {
            label: 'Nuevo Programa',
            icon: <Dumbbell size={16} />,
            action: handleCreateProgram,
            color: 'text-cv-accent'
        },
    ];

    return (
        <>
            <div className="relative" ref={dropdownRef}>
                {/* Main Button */}
                <button
                    onClick={() => {
                        if (pathname === '/programs') {
                            handleCreateProgram();
                        } else {
                            setIsOpen(!isOpen);
                        }
                    }}
                    className="cv-btn-primary flex items-center justify-center w-10 h-10 p-0"
                    title="Crear..."
                >
                    <Plus size={20} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 py-2 bg-cv-bg-secondary border border-cv-border rounded-lg shadow-cv-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {menuItems.map((item, index) => (
                            item.href ? (
                                <a
                                    key={index}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-cv-text-secondary hover:text-cv-text-primary hover:bg-cv-bg-tertiary transition-colors"
                                >
                                    <span className={item.color}>{item.icon}</span>
                                    <span className="text-sm font-medium">{item.label}</span>
                                </a>
                            ) : (
                                <button
                                    key={index}
                                    onClick={item.action}
                                    className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-cv-text-secondary hover:text-cv-text-primary hover:bg-cv-bg-tertiary transition-colors"
                                >
                                    <span className={item.color}>{item.icon}</span>
                                    <span className="text-sm font-medium">{item.label}</span>
                                </button>
                            )
                        ))}
                    </div>
                )}
            </div>

            {/* Program Setup Wizard Modal */}
            <ProgramSetupWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
            />
        </>
    );
}

