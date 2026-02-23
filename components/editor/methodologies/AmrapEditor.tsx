'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Clock, RotateCw } from 'lucide-react';
import { SmartExerciseInput } from '../SmartExerciseInput';
import type { AMRAPConfig, RFTConfig } from '@/lib/supabase/types';

interface CircuitItem {
    id: string;
    exercise: string;
    targetValue: number | '';
    targetUnit: 'reps' | 'seconds' | 'meters' | 'calories';
}

interface CircuitEditorProps {
    config: Partial<AMRAPConfig & RFTConfig>;
    onChange: (key: string, value: unknown) => void;
    onBatchChange?: (updates: Record<string, unknown>) => void;
    mode: 'AMRAP' | 'RFT' | 'FOR_TIME' | 'CHIPPER';
}

export function CircuitEditor({ config, onChange, onBatchChange, mode }: CircuitEditorProps) {
    const [items, setItems] = useState<CircuitItem[]>(() => {
        const savedItems = (config as any).items;
        if (savedItems && Array.isArray(savedItems)) {
            return savedItems.map((item: any, idx: number) => {
                const rawValue = item?.targetValue ?? item?.reps;
                const parsed = typeof rawValue === 'number'
                    ? rawValue
                    : Number.parseInt(String(rawValue || '').replace(/[^0-9]/g, ''), 10);
                return {
                    id: item?.id || `item-${idx + 1}`,
                    exercise: item?.exercise || '',
                    targetValue: Number.isFinite(parsed) && parsed > 0 ? parsed : '',
                    targetUnit: (item?.targetUnit === 'seconds' || item?.targetUnit === 'meters' || item?.targetUnit === 'calories' || item?.targetUnit === 'reps')
                        ? item.targetUnit
                        : (typeof item?.reps === 'string' && item.reps.toLowerCase().includes('m')
                            ? 'meters'
                            : (typeof item?.reps === 'string' && item.reps.toLowerCase().includes('s')
                                ? 'seconds'
                                : (typeof item?.reps === 'string' && item.reps.toLowerCase().includes('cal') ? 'calories' : 'reps'))),
                };
            });
        }

        const oldMovements = (config.movements as any[]) || [];
        if (oldMovements.length > 0) {
            return oldMovements.map((m, idx) => {
                let exerciseName = '';
                if (typeof m === 'string') exerciseName = m;
                else if (typeof m === 'object' && m && 'name' in m) exerciseName = m.name;

                return {
                    id: `legacy-item-${idx + 1}`,
                    exercise: exerciseName,
                    targetValue: '',
                    targetUnit: 'reps' as const,
                };
            });
        }

        return [{ id: crypto.randomUUID(), exercise: '', targetValue: '', targetUnit: 'reps' }];
    });

    const onChangeRef = useRef(onChange);
    const onBatchChangeRef = useRef(onBatchChange);

    useEffect(() => {
        onChangeRef.current = onChange;
        onBatchChangeRef.current = onBatchChange;
    }, [onChange, onBatchChange]);

    useEffect(() => {
        const batchUpdater = onBatchChangeRef.current;
        if (batchUpdater) {
            batchUpdater({
                items: items,
                movements: items.map(i => i.exercise)
            });
        } else {
            onChangeRef.current('items', items);
            onChangeRef.current('movements', items.map(i => i.exercise));
        }
    }, [items]);

    const addItem = () => {
        setItems(prev => [...prev, { id: crypto.randomUUID(), exercise: '', targetValue: '', targetUnit: 'reps' }]);
    };

    const removeItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const updateItem = (
        index: number,
        field: 'exercise' | 'targetValue' | 'targetUnit',
        value: string | number
    ) => {
        setItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const showDurationInput = mode === 'AMRAP';
    const showRoundsInput = mode === 'RFT' || mode === 'CHIPPER';
    const showTimeCapInput = mode === 'RFT' || mode === 'CHIPPER' || mode === 'FOR_TIME';

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Config Row: Inputs based on Mode */}
            {(showDurationInput || showRoundsInput || showTimeCapInput) && (
                <div className="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-cv-bg-tertiary/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                    <>
                        {showDurationInput && (
                            <div className="flex-1 min-w-[140px]">
                                <label className="block text-xs font-semibold text-cv-text-secondary mb-1.5 uppercase tracking-wide">
                                    Duración Total (min)
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cv-text-tertiary" />
                                        <input
                                            type="number"
                                            value={config.minutes || ''}
                                            onChange={(e) => onChange('minutes', e.target.value ? parseInt(e.target.value, 10) : null)}
                                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-cv-bg-secondary focus:ring-2 focus:ring-cv-accent/20 focus:border-cv-accent transition-all font-semibold text-cv-text-primary"
                                            placeholder="12"
                                        />
                                    </div>
                                </div>
                                <p className="text-[11px] text-cv-text-tertiary mt-1 leading-snug">
                                    Minutos máximos para acumular rondas.
                                </p>
                            </div>
                        )}
                        {showRoundsInput && (
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
                                            onChange={(e) => onChange('rounds', parseInt(e.target.value, 10) || 0)}
                                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-cv-bg-secondary focus:ring-2 focus:ring-cv-accent/20 focus:border-cv-accent transition-all font-semibold text-cv-text-primary"
                                            placeholder={mode === 'CHIPPER' ? '1' : '5'}
                                        />
                                    </div>
                                </div>
                                <p className="text-[11px] text-cv-text-tertiary mt-1 leading-snug">
                                    {mode === 'CHIPPER'
                                        ? 'Usa 1 si el chipper se hace una sola pasada.'
                                        : 'Cantidad total de rondas del circuito.'}
                                </p>
                            </div>
                        )}
                        {showTimeCapInput && (
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
                                            onChange={(e) => onChange('timeCap', parseInt(e.target.value, 10) || null)}
                                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-cv-bg-secondary focus:ring-2 focus:ring-cv-accent/20 focus:border-cv-accent transition-all font-semibold text-cv-text-primary"
                                            placeholder="15"
                                        />
                                    </div>
                                </div>
                                <p className="text-[11px] text-cv-text-tertiary mt-1 leading-snug">
                                    Minutos maximos para completar el bloque.
                                </p>
                            </div>
                        )}
                    </>
                </div>
            )}

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
                <p className="text-[11px] text-cv-text-tertiary mb-3 leading-snug">
                    En cada fila define ejercicio + variable numérica.
                </p>

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

                            <div className="grid grid-cols-[90px_120px] gap-2 shrink-0">
                                <input
                                    type="number"
                                    min={1}
                                    value={item.targetValue}
                                    onChange={(e) => updateItem(index, 'targetValue', e.target.value ? Number.parseInt(e.target.value, 10) : '')}
                                    placeholder="Valor"
                                    className="w-full text-sm text-center bg-slate-50 dark:bg-slate-800 border-none rounded-lg py-2 focus:ring-1 focus:ring-cv-accent/50"
                                />
                                <select
                                    value={item.targetUnit}
                                    onChange={(e) => updateItem(index, 'targetUnit', e.target.value as 'reps' | 'seconds' | 'meters' | 'calories')}
                                    className="w-full text-sm text-center bg-slate-50 dark:bg-slate-800 border-none rounded-lg py-2 focus:ring-1 focus:ring-cv-accent/50"
                                >
                                    <option value="reps">Reps</option>
                                    <option value="seconds">Segundos</option>
                                    <option value="meters">Metros</option>
                                    <option value="calories">Calorías</option>
                                </select>
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
