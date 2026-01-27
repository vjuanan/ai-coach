'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import {
    Search,
    Users,
    Building2,
    Dumbbell,
    FileText,
    ArrowRight,
    CornerDownLeft,
    Command
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
    id: string;
    type: 'athlete' | 'gym' | 'program' | 'template';
    title: string;
    subtitle?: string;
    href: string;
}

// Mock data - replace with actual Supabase queries
const mockResults: SearchResult[] = [
    { id: '1', type: 'athlete', title: 'John Doe', subtitle: 'Active program: Strength Block A', href: '/athletes/1' },
    { id: '2', type: 'athlete', title: 'Jane Smith', subtitle: 'Last session: 2 days ago', href: '/athletes/2' },
    { id: '3', type: 'gym', title: 'CrossFit Downtown', subtitle: '45 active members', href: '/gyms/1' },
    { id: '4', type: 'program', title: 'Hypertrophy Block A', subtitle: 'Week 3 of 4', href: '/editor/1' },
    { id: '5', type: 'template', title: 'Competition Prep Template', subtitle: '12 weeks', href: '/templates/1' },
];

const typeIcons = {
    athlete: <Users size={16} />,
    gym: <Building2 size={16} />,
    program: <Dumbbell size={16} />,
    template: <FileText size={16} />,
};

const typeColors = {
    athlete: 'text-blue-400',
    gym: 'text-purple-400',
    program: 'text-cv-accent',
    template: 'text-green-400',
};

export function CommandPalette() {
    const { isCommandPaletteOpen, closeCommandPalette } = useAppStore();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();

    // Filter results based on query
    const filteredResults = query.length > 0
        ? mockResults.filter(r =>
            r.title.toLowerCase().includes(query.toLowerCase()) ||
            r.subtitle?.toLowerCase().includes(query.toLowerCase())
        )
        : mockResults;

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isCommandPaletteOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < filteredResults.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredResults.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredResults[selectedIndex]) {
                    router.push(filteredResults[selectedIndex].href);
                    closeCommandPalette();
                    setQuery('');
                }
                break;
            case 'Escape':
                closeCommandPalette();
                setQuery('');
                break;
        }
    }, [isCommandPaletteOpen, filteredResults, selectedIndex, router, closeCommandPalette]);

    // Open with Cmd+K
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                useAppStore.getState().toggleCommandPalette();
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    return (
        <AnimatePresence>
            {isCommandPaletteOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="cv-overlay"
                        onClick={closeCommandPalette}
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50"
                    >
                        <div className="bg-cv-bg-secondary border border-cv-border rounded-xl shadow-cv-lg overflow-hidden">
                            {/* Search Input */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-cv-border">
                                <Search size={20} className="text-cv-text-tertiary" />
                                <input
                                    type="text"
                                    placeholder="Search athletes, gyms, programs..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="flex-1 bg-transparent text-cv-text-primary placeholder:text-cv-text-tertiary focus:outline-none"
                                    autoFocus
                                />
                                <kbd className="px-2 py-1 rounded bg-cv-bg-tertiary text-xs font-mono text-cv-text-tertiary">
                                    ESC
                                </kbd>
                            </div>

                            {/* Results */}
                            <div className="max-h-80 overflow-y-auto py-2">
                                {filteredResults.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-cv-text-tertiary">
                                        No results found for "{query}"
                                    </div>
                                ) : (
                                    filteredResults.map((result, index) => (
                                        <button
                                            key={result.id}
                                            onClick={() => {
                                                router.push(result.href);
                                                closeCommandPalette();
                                                setQuery('');
                                            }}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={`
                        w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                        ${index === selectedIndex
                                                    ? 'bg-cv-bg-tertiary'
                                                    : 'hover:bg-cv-bg-tertiary/50'}
                      `}
                                        >
                                            <span className={`${typeColors[result.type]}`}>
                                                {typeIcons[result.type]}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-cv-text-primary truncate">
                                                    {result.title}
                                                </p>
                                                {result.subtitle && (
                                                    <p className="text-xs text-cv-text-tertiary truncate">
                                                        {result.subtitle}
                                                    </p>
                                                )}
                                            </div>
                                            {index === selectedIndex && (
                                                <ArrowRight size={14} className="text-cv-text-tertiary" />
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between px-4 py-2 border-t border-cv-border bg-cv-bg-tertiary/50">
                                <div className="flex items-center gap-4 text-xs text-cv-text-tertiary">
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1 py-0.5 rounded bg-cv-bg-tertiary font-mono">↑↓</kbd>
                                        Navigate
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <CornerDownLeft size={12} />
                                        Open
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-cv-text-tertiary">
                                    <Command size={10} />
                                    <span>K to toggle</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
