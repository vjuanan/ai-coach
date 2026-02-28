'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Clock, RotateCw } from 'lucide-react';
import { SmartExerciseInput } from '../SmartExerciseInput';
import type { TabataConfig } from '@/lib/supabase/types';

interface TabataEditorProps {
    config: Partial<TabataConfig>;
    onChange: (key: string, value: unknown) => void;
}

export function TabataEditor({ config, onChange }: TabataEditorProps) {
    // Default values if not present
    const rounds = config.rounds || 8;
    const workSeconds = config.workSeconds || 20;
    const restSeconds = config.restSeconds || 10;

    // Movement logic: Tabata usually has one movement, but can have multiple (e.g. alternating).
    // We'll support a list of movements, mapped to 'movements' array if clear, or 'movement' string if single.
    // For backward compatibility, we check both.

    const [exercises, setExercises] = useState<string[]>(() => {
        if ((config as any).movements && Array.isArray((config as any).movements)) {
            return (config as any).movements;
        }
        if (config.movement) {
            return [config.movement];
        }
        return [''];
    });

    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        // Update either 'movements' (array) or 'movement' (single string for internal compatibility)
        // We'll prefer saving as 'movements' array related logic if possible, but keeping 'movement' as the first one for simple cases.
        onChangeRef.current('movements', exercises);
        onChangeRef.current('movement', exercises[0] || '');
    }, [exercises]);

    const addExercise = () => {
        setExercises(prev => [...prev, '']);
    };

    const removeExercise = (index: number) => {
        setExercises(prev => prev.filter((_, i) => i !== index));
    };

    const updateExercise = (index: number, val: string) => {
        setExercises(prev => {
            const updated = [...prev];
            updated[index] = val;
            return updated;
        });
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            {/* Config Row */}
            <div className="cv-meta-bar">
                <div className="cv-meta-item">
                    <label className="text-[10px] font-bold text-cv-text-secondary uppercase tracking-wide whitespace-nowrap">
                        Rondas
                    </label>
                    <div className="relative">
                        <RotateCw size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-cv-text-tertiary" />
                        <input
                            type="number"
                            value={rounds}
                            onChange={(e) => onChange('rounds', parseInt(e.target.value, 10) || 0)}
                            className="cv-width-short cv-meta-input-fit pl-7 pr-1 text-sm"
                        />
                    </div>
                </div>

                <div className="cv-meta-item">
                    <label className="text-[10px] font-bold text-cv-text-secondary uppercase tracking-wide whitespace-nowrap">
                        Trabajo (s)
                    </label>
                    <div className="relative">
                        <Clock size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-cv-text-tertiary" />
                        <input
                            type="number"
                            value={workSeconds}
                            onChange={(e) => onChange('workSeconds', parseInt(e.target.value, 10) || 0)}
                            className="cv-width-short cv-meta-input-fit pl-7 pr-1 text-sm"
                        />
                    </div>
                </div>

                <div className="cv-meta-item">
                    <label className="text-[10px] font-bold text-cv-text-secondary uppercase tracking-wide whitespace-nowrap">
                        Descanso (s)
                    </label>
                    <div className="relative">
                        <Clock size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-cv-text-tertiary" />
                        <input
                            type="number"
                            value={restSeconds}
                            onChange={(e) => onChange('restSeconds', parseInt(e.target.value, 10) || 0)}
                            className="cv-width-short cv-meta-input-fit pl-7 pr-1 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Exercises List */}
            <div className="space-y-2.5">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-cv-text-secondary">
                        Ejercicios Tabata
                    </label>
                    <span className="text-xs text-cv-text-tertiary bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                        {exercises.length} movimientos
                    </span>
                </div>

                <div className="space-y-2.5">
                    {exercises.map((ex, index) => (
                        <div
                            key={index}
                            className="flex gap-2 p-2.5 bg-white dark:bg-cv-bg-secondary border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm transition-all items-center group"
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-cv-text-tertiary shrink-0">
                                {String.fromCharCode(65 + index)}
                            </div>

                            <div className="flex-1">
                                <SmartExerciseInput
                                    value={ex}
                                    onChange={(val) => updateExercise(index, val)}
                                    placeholder="Buscar ejercicio en la biblioteca..."
                                    className="cv-input cv-input-compact bg-transparent border-none shadow-none focus:ring-0 px-0 py-0 text-sm font-medium h-auto placeholder:text-slate-400 w-full"
                                />
                            </div>

                            <button
                                onClick={() => removeExercise(index)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    onClick={addExercise}
                    className="mt-2.5 w-full py-2 border border-dashed border-cv-border rounded-lg text-cv-text-tertiary hover:text-cv-accent hover:border-cv-accent/50 hover:bg-cv-accent/5 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                >
                    <Plus size={16} />
                    Añadir Ejercicio Alternativo
                </button>
            </div>
        </div>
    );
}
