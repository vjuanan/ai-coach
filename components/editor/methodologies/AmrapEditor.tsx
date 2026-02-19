'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, RotateCw, Dumbbell } from 'lucide-react';
import { SmartExerciseInput } from '../SmartExerciseInput';
import type { AMRAPConfig, RFTConfig } from '@/lib/supabase/types';

interface CircuitItem {
    id: string;
    exercise: string;
    reps: string;
}

interface CircuitEditorProps {
    config: Partial<AMRAPConfig & RFTConfig>;
    onChange: (key: string, value: unknown) => void;
    onBatchChange?: (updates: Record<string, unknown>) => void;
    mode: 'AMRAP' | 'RFT' | 'CHIPPER'; // CHIPPER acts like RFT usually but linear
}

export function CircuitEditor({ config, onChange, onBatchChange, mode }: CircuitEditorProps) {
    // Local state for circuit items
    const [items, setItems] = useState<CircuitItem[]>(() => {
        const savedItems = (config as any).items;
        if (savedItems && Array.isArray(savedItems)) return savedItems;

        // Fallback backward compatibility
        const oldMovements = (config.movements as any[]) || [];
        if (oldMovements.length > 0) {
            return oldMovements.map(m => {
                let exerciseName = '';
                if (typeof m === 'string') exerciseName = m;
                else if (typeof m === 'object' && m && 'name' in m) exerciseName = m.name;

                return {
                    id: crypto.randomUUID(),
                    exercise: exerciseName,
                    reps: ''
                };
            });
        }

        return [{ id: crypto.randomUUID(), exercise: '', reps: '' }];
    });

    useEffect(() => {
        if (onBatchChange) {
            onBatchChange({
                items: items,
                movements: items.map(i => i.exercise)
            });
        } else {
            onChange('items', items);
            onChange('movements', items.map(i => i.exercise));
        }
    }, [items]);

    const addItem = () => {
        setItems(prev => [...prev, { id: crypto.randomUUID(), exercise: '', reps: '' }]);
    };

    const removeItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: 'exercise' | 'reps', value: string) => {
        setItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Config Row: Inputs based on Mode */}
            <div className="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-cv-bg-tertiary/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                {mode === 'AMRAP' && (
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-xs font-semibold text-cv-text-secondary mb-1.5 uppercase tracking-wide">
                            Time Cap / Duración
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cv-text-tertiary" />
                                <input
                                    type="number"
                                    value={config.minutes || ''}
                                    onChange={(e) => onChange('minutes', parseInt(e.target.value) || 0)}
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-cv-bg-secondary focus:ring-2 focus:ring-cv-accent/20 focus:border-cv-accent transition-all font-semibold text-cv-text-primary"
                                    placeholder="Minutos"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {(mode === 'RFT' || mode === 'CHIPPER') && (
                    <>
                        <div className="flex-1 min-w-[120px]">
                            <label className="block text-xs font-semibold text-cv-text-secondary mb-1.5 uppercase tracking-wide">
                                Rondas
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <RotateCw size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cv-text-tertiary" />
                                    <input
                                        type="number"
                                        value={config.rounds || ''}
                                        onChange={(e) => onChange('rounds', parseInt(e.target.value) || 0)}
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-cv-bg-secondary focus:ring-2 focus:ring-cv-accent/20 focus:border-cv-accent transition-all font-semibold text-cv-text-primary"
                                        placeholder={mode === 'CHIPPER' ? '1' : '5'}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 min-w-[140px]">
                            <label className="block text-xs font-semibold text-cv-text-secondary mb-1.5 uppercase tracking-wide">
                                Time Cap (Opcional)
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cv-text-tertiary" />
                                    <input
                                        type="number"
                                        value={config.timeCap || ''}
                                        onChange={(e) => onChange('timeCap', parseInt(e.target.value) || null)}
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-cv-bg-secondary focus:ring-2 focus:ring-cv-accent/20 focus:border-cv-accent transition-all font-semibold text-cv-text-primary"
                                        placeholder="No limit"
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Circuit Builder */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-cv-text-secondary">
                        Ejercicios del Circuito
                    </label>
                    <span className="text-xs text-cv-text-tertiary bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                        {items.length} ejercicios
                    </span>
                </div>

                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div
                            key={item.id || index}
                            className="group flex gap-3 p-3 bg-white dark:bg-cv-bg-secondary border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all items-center"
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-cv-text-tertiary shrink-0">
                                {index + 1}
                            </div>

                            <div className="flex-1 space-y-1">
                                <SmartExerciseInput
                                    value={item.exercise}
                                    onChange={(val) => updateItem(index, 'exercise', val)}
                                    placeholder="Buscar ejercicio en la biblioteca..."
                                    className="cv-input bg-transparent border-none shadow-none focus:ring-0 px-0 py-0 text-sm font-medium h-auto placeholder:text-slate-400"
                                />
                            </div>

                            <div className="w-24 shrink-0">
                                <input
                                    type="text"
                                    value={item.reps}
                                    onChange={(e) => updateItem(index, 'reps', e.target.value)}
                                    placeholder="Reps"
                                    className="w-full text-sm text-center bg-slate-50 dark:bg-slate-800 border-none rounded-lg py-2 focus:ring-1 focus:ring-cv-accent/50"
                                />
                            </div>

                            <button
                                onClick={() => removeItem(index)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    onClick={addItem}
                    className="mt-3 w-full py-3 border border-dashed border-cv-border rounded-xl text-cv-text-tertiary hover:text-cv-accent hover:border-cv-accent/50 hover:bg-cv-accent/5 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                >
                    <Plus size={16} />
                    Añadir Ejercicio
                </button>
            </div>
        </div>
    );
}
