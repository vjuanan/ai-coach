'use client';

import { useState, useEffect } from 'react';
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

    useEffect(() => {
        // Update either 'movements' (array) or 'movement' (single string for internal compatibility)
        // We'll prefer saving as 'movements' array related logic if possible, but keeping 'movement' as the first one for simple cases.
        onChange('movements', exercises);
        onChange('movement', exercises[0] || '');
    }, [exercises, onChange]);

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

    const totalTimeSeconds = rounds * (workSeconds + restSeconds) - restSeconds; // Subtract last rest? Usually included. let's say included.
    const totalMinutes = Math.floor(totalTimeSeconds / 60);
    const totalSecondsRem = totalTimeSeconds % 60;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Config Row */}
            <div className="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-cv-bg-tertiary/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <div className="flex-1 min-w-[100px]">
                    <label className="block text-xs font-semibold text-cv-text-secondary mb-1.5 uppercase tracking-wide">
                        Rondas
                    </label>
                    <div className="relative">
                        <RotateCw size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cv-text-tertiary" />
                        <input
                            type="number"
                            value={rounds}
                            onChange={(e) => onChange('rounds', parseInt(e.target.value, 10) || 0)}
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-cv-bg-secondary focus:ring-2 focus:ring-cv-accent/20 focus:border-cv-accent transition-all font-semibold text-cv-text-primary"
                        />
                    </div>
                    <p className="text-[11px] text-cv-text-tertiary mt-1 leading-snug">
                        Cantidad de rondas del protocolo Tabata.
                    </p>
                </div>

                <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs font-semibold text-cv-text-secondary mb-1.5 uppercase tracking-wide text-green-600 dark:text-green-400">
                        Trabajo (s)
                    </label>
                    <div className="relative">
                        <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500/70" />
                        <input
                            type="number"
                            value={workSeconds}
                            onChange={(e) => onChange('workSeconds', parseInt(e.target.value, 10) || 0)}
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-cv-bg-secondary focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-semibold text-cv-text-primary"
                        />
                    </div>
                    <p className="text-[11px] text-cv-text-tertiary mt-1 leading-snug">
                        Segundos de esfuerzo por cada ronda.
                    </p>
                </div>

                <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs font-semibold text-cv-text-secondary mb-1.5 uppercase tracking-wide text-orange-600 dark:text-orange-400">
                        Descanso (s)
                    </label>
                    <div className="relative">
                        <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500/70" />
                        <input
                            type="number"
                            value={restSeconds}
                            onChange={(e) => onChange('restSeconds', parseInt(e.target.value, 10) || 0)}
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-cv-bg-secondary focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-semibold text-cv-text-primary"
                        />
                    </div>
                    <p className="text-[11px] text-cv-text-tertiary mt-1 leading-snug">
                        Segundos de recuperacion entre rondas.
                    </p>
                </div>
            </div>

            <div className="text-xs text-cv-text-tertiary italic text-center">
                Tiempo Total Estimado: {totalMinutes}:{totalSecondsRem.toString().padStart(2, '0')}
            </div>

            {/* Exercises List */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-cv-text-secondary">
                        Ejercicios Tabata
                    </label>
                    <span className="text-xs text-cv-text-tertiary bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                        {exercises.length} movimientos
                    </span>
                </div>
                <p className="text-[11px] text-cv-text-tertiary mb-3 leading-snug">
                    Carga uno o varios ejercicios. Si agregas mas de uno, se alternan en las rondas.
                </p>

                <div className="space-y-3">
                    {exercises.map((ex, index) => (
                        <div
                            key={index}
                            className="flex gap-3 p-3 bg-white dark:bg-cv-bg-secondary border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm transition-all items-center group"
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-cv-text-tertiary shrink-0">
                                {String.fromCharCode(65 + index)}
                            </div>

                            <div className="flex-1">
                                <SmartExerciseInput
                                    value={ex}
                                    onChange={(val) => updateExercise(index, val)}
                                    placeholder="Buscar ejercicio en la biblioteca..."
                                    className="cv-input bg-transparent border-none shadow-none focus:ring-0 px-0 py-0 text-sm font-medium h-auto placeholder:text-slate-400 w-full"
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
                    className="mt-3 w-full py-3 border border-dashed border-cv-border rounded-xl text-cv-text-tertiary hover:text-cv-accent hover:border-cv-accent/50 hover:bg-cv-accent/5 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                >
                    <Plus size={16} />
                    Añadir Ejercicio Alternativo
                </button>
            </div>
        </div>
    );
}
