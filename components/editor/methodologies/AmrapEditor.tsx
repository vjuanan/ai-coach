'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Clock, RotateCw, Search } from 'lucide-react';
import { SmartExerciseInput } from '../SmartExerciseInput';
import type { AMRAPConfig, RFTConfig } from '@/lib/supabase/types';
import { normalizeNumericInputValue, toNumberOrEmpty, toNumberOrNull } from '@/lib/input-sanitizers';

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
    showMetaControls?: boolean;
}

export function CircuitEditor({ config, onChange, onBatchChange, mode, showMetaControls = true }: CircuitEditorProps) {
    const rowGridCols = 'md:grid-cols-[32px_minmax(0,1fr)_minmax(6rem,0.8fr)_minmax(7.25rem,0.9fr)_2.25rem]';
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
        <div className="space-y-4 animate-in fade-in duration-300">
            {/* Top Config Row: Inputs based on Mode */}
            {showMetaControls && (showDurationInput || showRoundsInput || showTimeCapInput) && (
                <div className="cv-meta-bar">
                    <>
                        {showDurationInput && (
                            <div className="cv-meta-item">
                                <label className="text-[10px] font-bold text-cv-text-secondary uppercase tracking-wide whitespace-nowrap">
                                    Duración (min)
                                </label>
                                <div className="relative">
                                    <Clock size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-cv-text-tertiary" />
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={2}
                                        value={normalizeNumericInputValue(config.minutes as string | number | null | undefined)}
                                        onChange={(e) => onChange('minutes', toNumberOrNull(e.target.value))}
                                        className="cv-width-short cv-meta-input-fit pl-7 pr-1 text-sm"
                                        placeholder="12"
                                    />
                                </div>
                            </div>
                        )}
                        {showRoundsInput && (
                            <div className="cv-meta-item">
                                <label className="text-[10px] font-bold text-cv-text-secondary uppercase tracking-wide whitespace-nowrap">
                                    Rondas
                                </label>
                                <div className="relative">
                                    <RotateCw size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-cv-text-tertiary" />
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={2}
                                        value={normalizeNumericInputValue(config.rounds as string | number | null | undefined)}
                                        onChange={(e) => onChange('rounds', toNumberOrNull(e.target.value) ?? 0)}
                                        className="cv-width-short cv-meta-input-fit pl-7 pr-1 text-sm"
                                        placeholder={mode === 'CHIPPER' ? '1' : '5'}
                                    />
                                </div>
                            </div>
                        )}
                        {showTimeCapInput && (
                            <div className="cv-meta-item">
                                <label className="text-[10px] font-bold text-cv-text-secondary uppercase tracking-wide whitespace-nowrap">
                                    Time Cap
                                </label>
                                <div className="relative">
                                    <Clock size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-cv-text-tertiary" />
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={2}
                                        value={normalizeNumericInputValue(config.timeCap as string | number | null | undefined)}
                                        onChange={(e) => onChange('timeCap', toNumberOrNull(e.target.value))}
                                        className="cv-width-short cv-meta-input-fit pl-7 pr-1 text-sm"
                                        placeholder="15"
                                    />
                                </div>
                            </div>
                        )}
                    </>
                </div>
            )}

            {/* Circuit Builder */}
            <div className="space-y-2.5">
                <div className="flex items-center mb-3">
                    <label className="text-sm font-medium text-cv-text-secondary">
                        Movimientos
                    </label>
                </div>

                <div className="space-y-2.5">
                    {items.map((item, index) => (
                        <div
                            key={item.id || index}
                            data-circuit-row
                            className={`group grid grid-cols-1 ${rowGridCols} gap-2 p-2.5 bg-white dark:bg-cv-bg-secondary border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-all items-start md:items-center`}
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-cv-text-tertiary shrink-0">
                                {index + 1}
                            </div>

                            <div className="relative min-w-0">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        const row = e.currentTarget.closest('[data-circuit-row]');
                                        const input = (row?.querySelector('[data-smart-exercise-input] input')
                                            || row?.querySelector('input')) as HTMLInputElement | null;
                                        input?.focus();
                                    }}
                                    className="cv-row-action-icon hidden md:flex"
                                    aria-label={`Buscar ejercicio fila ${index + 1}`}
                                >
                                    <Search size={16} />
                                </button>
                                <SmartExerciseInput
                                    value={item.exercise}
                                    onChange={(val) => updateItem(index, 'exercise', val)}
                                    placeholder="Buscar ejercicio en la biblioteca..."
                                    className="cv-input cv-input-compact bg-transparent border-none shadow-none focus:ring-0 pl-0 pr-8 py-0 text-sm font-medium h-auto placeholder:text-slate-400"
                                    showSearchIcon={false}
                                />
                            </div>

                            <div className="flex items-center justify-center">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={2}
                                    value={normalizeNumericInputValue(item.targetValue)}
                                    onChange={(e) => updateItem(index, 'targetValue', toNumberOrEmpty(e.target.value))}
                                    placeholder={item.targetUnit === 'seconds' ? '40' : item.targetUnit === 'meters' ? '200' : item.targetUnit === 'calories' ? '20' : '12'}
                                    className="cv-width-short cv-target-input"
                                />
                            </div>

                            <div className="flex items-center justify-center">
                                <select
                                    value={item.targetUnit}
                                    onChange={(e) => updateItem(index, 'targetUnit', e.target.value as 'reps' | 'seconds' | 'meters' | 'calories')}
                                    className="cv-width-time cv-target-unit"
                                >
                                    <option value="reps">Reps</option>
                                    <option value="seconds">Segundos</option>
                                    <option value="meters">Metros</option>
                                    <option value="calories">Calorías</option>
                                </select>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    onClick={() => removeItem(index)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={addItem}
                    className="mt-2.5 w-full py-2 border border-dashed border-cv-border rounded-lg text-cv-text-tertiary hover:text-cv-accent hover:border-cv-accent/50 hover:bg-cv-accent/5 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                >
                    <Plus size={16} />
                    Añadir Ejercicio
                </button>
            </div>
        </div>
    );
}
