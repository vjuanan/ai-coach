'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, Building2, Dumbbell, Loader2, ChevronDown } from 'lucide-react';
import { createProgram } from '@/lib/actions';

export function GlobalCreateButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isCreatingProgram, setIsCreatingProgram] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

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

    const handleCreateProgram = async () => {
        setIsCreatingProgram(true);
        setIsOpen(false);
        try {
            const result = await createProgram('Nuevo Programa', null);
            console.log('DEBUG: createProgram raw result:', result);

            if (!result) {
                console.error('DEBUG: Result is null/undefined');
                alert('Error: No response from server');
                return;
            }

            if (result.error) {
                console.error('DEBUG: Server Action Error:', result.error);
                alert(`Error: ${result.error}`);
                return;
            }

            if (result.data) {
                console.log('DEBUG: Redirecting to', result.data.id);
                router.push(`/editor/${result.data.id}`);
            } else {
                console.error('DEBUG: No data and no error returned', result);
                alert(`Error: Invalid response: ${JSON.stringify(result)}`);
            }
        } catch (err: any) {
            console.error('DEBUG: Client Error calling createProgram:', err);
            alert(`Error inesperado: ${err.message || err}`);
        } finally {
            setIsCreatingProgram(false);
        }
    } finally {
        setIsCreatingProgram(false);
    }
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
    <div className="relative" ref={dropdownRef}>
        {/* Main Button */}
        <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={isCreatingProgram}
            className="cv-btn-primary flex items-center gap-2"
        >
            {isCreatingProgram ? (
                <Loader2 size={16} className="animate-spin" />
            ) : (
                <Plus size={16} />
            )}
            <span>+</span>
            <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
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
);
}
