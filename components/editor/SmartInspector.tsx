'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '@/lib/store';
import { X, Search, Zap, Dumbbell, Clock, Trophy, Flame } from 'lucide-react';
import { BlockEditor } from './BlockEditor';
import type { BlockType } from '@/lib/supabase/types';

interface SmartInspectorProps {
    isOpen: boolean;
    onClose: () => void;
}

// Quick preset chips for strength exercises
const QUICK_PRESETS = [
    { label: '5x5', sets: 5, reps: '5', icon: Dumbbell },
    { label: '3x10', sets: 3, reps: '10', icon: Dumbbell },
    { label: '4x8', sets: 4, reps: '8', icon: Dumbbell },
    { label: '5/3/1', sets: 3, reps: '5-3-1', icon: Zap },
    { label: 'EMOM', format: 'EMOM', icon: Clock },
    { label: 'AMRAP', format: 'AMRAP', icon: Flame },
];

export function SmartInspector({ isOpen, onClose }: SmartInspectorProps) {
    const { selectedBlockId, selectBlock, mesocycles, updateBlock, referenceBlock } = useEditorStore();
    const panelRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Find selected block for context
    let selectedBlock: any = null;
    if (selectedBlockId) {
        for (const meso of mesocycles) {
            for (const day of meso.days) {
                const found = day.blocks.find(b => b.id === selectedBlockId);
                if (found) {
                    selectedBlock = found;
                    break;
                }
            }
        }
    }

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Focus search input when panel opens in library mode
    useEffect(() => {
        if (isOpen && !selectedBlockId && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen, selectedBlockId]);

    // Handle click outside to close
    const handleClickOutside = useCallback((e: MouseEvent) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            // Add with slight delay to prevent immediate close
            const timer = setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
            }, 100);
            return () => {
                clearTimeout(timer);
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isOpen, handleClickOutside]);

    // Apply quick preset to current block
    const applyPreset = (preset: typeof QUICK_PRESETS[0]) => {
        if (!selectedBlockId) return;

        const updates: any = { config: { ...selectedBlock?.config } };
        if (preset.sets) updates.config.sets = preset.sets;
        if (preset.reps) updates.config.reps = preset.reps;
        if (preset.format) updates.format = preset.format;

        updateBlock(selectedBlockId, updates);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop with blur - subtle */}
            <div
                className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-40 transition-opacity duration-200"
                onClick={onClose}
            />

            {/* Floating Panel with Glassmorphism */}
            <div
                ref={panelRef}
                className={`
                    fixed right-4 top-20 bottom-4 w-[380px] z-50
                    bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
                    border border-slate-200 dark:border-slate-700
                    shadow-2xl rounded-2xl
                    flex flex-col
                    animate-in slide-in-from-right-4 duration-300 ease-out
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cv-accent to-cv-accent/70 flex items-center justify-center">
                            {selectedBlockId ? (
                                <Zap size={16} className="text-white" />
                            ) : (
                                <Search size={16} className="text-white" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-cv-text-primary text-base">
                                {selectedBlockId ? 'Speed Editor' : 'Librería'}
                            </h3>
                            <p className="text-xs text-cv-text-tertiary">
                                {selectedBlockId ? 'Edita el bloque seleccionado' : 'Buscar ejercicios y templates'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="cv-btn-ghost p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content - Contextual based on selection */}
                <div className="flex-1 overflow-y-auto">
                    {selectedBlockId && selectedBlock ? (
                        <>
                            {/* Reference Block Context (Previous Week) */}
                            {referenceBlock && (
                                <div className="mx-4 mt-4 p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 opacity-90">
                                    <div className="flex items-center gap-2 mb-2 text-cv-text-tertiary">
                                        <Clock size={12} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Semana Anterior</span>
                                    </div>
                                    <p className="text-sm font-medium text-cv-text-secondary mb-1">
                                        {referenceBlock.config.content || referenceBlock.name || 'Sin nombre'}
                                    </p>
                                    {referenceBlock.config.reps && (
                                        <div className="flex gap-2 text-xs text-cv-text-tertiary font-mono">
                                            <span>{referenceBlock.config.sets} sets</span>
                                            <span>x</span>
                                            <span>{referenceBlock.config.reps} reps</span>
                                            {referenceBlock.config.percentage && <span>@ {referenceBlock.config.percentage}</span>}
                                        </div>
                                    )}
                                    {/* Add other config previews as needed */}
                                </div>
                            )}

                            {/* "The Brain" - Quick Context */}
                            {selectedBlock.type === 'strength_linear' && (
                                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-100 dark:border-amber-800/30">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Trophy size={14} className="text-amber-600" />
                                        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                                            Historial del Atleta
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1.5 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-amber-200 dark:border-amber-700">
                                            <span className="text-xs text-amber-600 dark:text-amber-400">1RM Est.</span>
                                            <p className="text-lg font-bold text-cv-text-primary">--</p>
                                        </div>
                                        <div className="px-3 py-1.5 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-amber-200 dark:border-amber-700">
                                            <span className="text-xs text-amber-600 dark:text-amber-400">Last</span>
                                            <p className="text-lg font-bold text-cv-text-primary">--</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quick Chips */}
                            {selectedBlock.type === 'strength_linear' && (
                                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                                    <p className="text-xs font-medium text-cv-text-tertiary mb-2">Esquemas Rápidos</p>
                                    <div className="flex flex-wrap gap-2">
                                        {QUICK_PRESETS.slice(0, 4).map((preset) => (
                                            <button
                                                key={preset.label}
                                                onClick={() => applyPreset(preset)}
                                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-cv-accent/10 hover:text-cv-accent rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                                            >
                                                <preset.icon size={12} />
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Block Editor Form */}
                            <BlockEditor blockId={selectedBlockId} />
                        </>
                    ) : (
                        /* Library Mode - Search and Templates */
                        <div className="p-4 space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cv-text-tertiary" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Buscar ejercicios..."
                                    className="cv-input pl-10 w-full"
                                />
                            </div>

                            {/* Categories */}
                            <div>
                                <p className="text-xs font-medium text-cv-text-tertiary mb-2">Categorías</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { name: 'Fuerza', count: 42, color: 'bg-red-500' },
                                        { name: 'MetCon', count: 28, color: 'bg-cv-accent' },
                                        { name: 'Gimnásticos', count: 15, color: 'bg-blue-500' },
                                        { name: 'Olímpicos', count: 12, color: 'bg-purple-500' },
                                    ].map((cat) => (
                                        <button
                                            key={cat.name}
                                            className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                                        >
                                            <span className={`w-2 h-2 rounded-full ${cat.color}`} />
                                            <span className="text-sm font-medium text-cv-text-primary">{cat.name}</span>
                                            <span className="text-xs text-cv-text-tertiary ml-auto">{cat.count}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Recent/Templates */}
                            <div>
                                <p className="text-xs font-medium text-cv-text-tertiary mb-2">Mis Templates</p>
                                <div className="space-y-2">
                                    {[
                                        { name: 'Calentamiento A', type: 'warmup' },
                                        { name: 'Fuerza 5x5', type: 'strength' },
                                        { name: 'Chipper Clásico', type: 'metcon' },
                                    ].map((template) => (
                                        <div
                                            key={template.name}
                                            className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
                                        >
                                            <p className="text-sm font-medium text-cv-text-primary">{template.name}</p>
                                            <p className="text-xs text-cv-text-tertiary capitalize">{template.type}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer - Keyboard hint */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-2xl">
                    <p className="text-xs text-center text-cv-text-tertiary">
                        Presiona <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 text-[10px] font-mono">ESC</kbd> para cerrar
                    </p>
                </div>
            </div>
        </>
    );
}
