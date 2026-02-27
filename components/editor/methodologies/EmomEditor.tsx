'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Clock, Repeat } from 'lucide-react';
import { SmartExerciseInput } from '../SmartExerciseInput';
import type { EMOMConfig } from '@/lib/supabase/types';

interface EmomEditorProps {
    config: Partial<EMOMConfig>;
    onChange: (key: string, value: unknown) => void;
    blockType?: 'warmup' | 'metcon_structured' | 'accessory' | 'skill' | 'finisher' | string;
}

export function EmomEditor({ config, onChange, blockType }: EmomEditorProps) {
    // Local state for complex minute logic
    // We map the raw config to a more UI-friendly structure if needed
    // But for now let's try to stick to the config structure:
    // EMOMConfig { minutes: number, interval: number, movements: string[], notes? }
    // Wait, the current EMOMConfig in types.ts is:
    // { minutes: number; interval: number; movements: string[]; notes?: string; }
    // This seems too simple for "Minute 1: Snatch, Minute 2: Burpees" (Alternating EMOM)
    // We might need to extend the config structure to support explicit slots.
    // Let's add a 'slots' property to the config dynamically.

    const duration = (config.minutes as number) || 10;
    const interval = (config.interval as number) || 1;
    const isWarmup = blockType === 'warmup';
    const isE2MOMMode = interval === 2;

    const [slots, setSlots] = useState<{ id: string; movement: string; targetValue: number | ''; targetUnit: 'reps' | 'seconds' | 'meters' }[]>(() => {
        // Try to recover from new format first
        const savedSlots = (config as any).slots;
        if (savedSlots && Array.isArray(savedSlots)) {
            return savedSlots.map((slot: any, idx: number) => {
                const rawValue = slot?.targetValue ?? slot?.reps;
                const parsed = typeof rawValue === 'number'
                    ? rawValue
                    : Number.parseInt(String(rawValue || '').replace(/[^0-9]/g, ''), 10);
                const unit: 'reps' | 'seconds' | 'meters' =
                    slot?.targetUnit === 'seconds' || slot?.targetUnit === 'meters' || slot?.targetUnit === 'reps'
                        ? slot.targetUnit
                        : (typeof slot?.reps === 'string' && slot.reps.toLowerCase().includes('m')
                            ? 'meters'
                            : (typeof slot?.reps === 'string' && slot.reps.toLowerCase().includes('s') ? 'seconds' : 'reps'));
                return {
                    id: slot?.id || `slot-${idx + 1}`,
                    movement: slot?.movement || '',
                    targetValue: Number.isFinite(parsed) && parsed > 0 ? parsed : '',
                    targetUnit: unit
                };
            });
        }

        const oldMovements = (config.movements as string[]) || [];
        if (oldMovements.length > 0) {
            return oldMovements.map((m, i) => ({
                id: crypto.randomUUID(),
                movement: m,
                targetValue: '',
                targetUnit: 'reps' as const,
            }));
        }

        return [{ id: crypto.randomUUID(), movement: '', targetValue: '', targetUnit: 'reps' }];
    });

    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // Update config when slots change
    useEffect(() => {
        onChangeRef.current('slots', slots);
        onChangeRef.current('movements', slots.map(s => s.movement));
    }, [slots]);

    const addSlot = () => {
        setSlots(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                movement: '',
                targetValue: '',
                targetUnit: 'reps'
            }
        ]);
    };

    const removeSlot = (index: number) => {
        setSlots(prev => prev.filter((_, i) => i !== index));
    };

    const updateSlot = (
        index: number,
        field: 'movement' | 'targetValue' | 'targetUnit',
        value: string | number
    ) => {
        setSlots(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            {/* Top Config Row: Duration & Interval */}
            <div className={`flex flex-wrap items-center gap-2.5 bg-slate-50 dark:bg-cv-bg-tertiary/30 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/50 ${isWarmup ? 'justify-center' : ''}`}>
                <div className="flex-1 min-w-[120px]">
                    <label className={`block text-xs font-semibold text-cv-text-secondary mb-1.5 uppercase tracking-wide ${isWarmup ? 'text-center' : ''}`}>
                        Duración Total
                    </label>
                    <div className={`flex items-center gap-2 ${isWarmup ? 'justify-center' : ''}`}>
                        <div className={`relative flex-1 ${isWarmup ? 'max-w-[420px]' : ''}`}>
                            <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cv-text-tertiary" />
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => onChange('minutes', parseInt(e.target.value, 10) || 0)}
                                className={`w-full cv-input-compact rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-cv-bg-secondary focus:ring-1 focus:ring-cv-accent/20 focus:border-cv-accent transition-all font-semibold text-cv-text-primary cv-width-short ${isWarmup ? 'pl-9 pr-9 text-center' : 'pl-9 pr-3'}`}
                                placeholder="10"
                            />
                        </div>
                        <span className="text-sm font-medium text-cv-text-tertiary">min</span>
                    </div>
                    <p className={`text-[11px] text-cv-text-tertiary mt-1 leading-snug ${isWarmup ? 'text-center' : ''}`}>
                        Duración total del bloque.
                    </p>
                </div>

                <div className="flex-1 min-w-[120px]">
                    <label className={`block text-xs font-semibold text-cv-text-secondary mb-1.5 uppercase tracking-wide ${isWarmup ? 'text-center' : ''}`}>
                        Cada
                    </label>
                    <div className={`flex items-center gap-2 ${isWarmup ? 'justify-center' : ''}`}>
                        <div className={`relative flex-1 ${isWarmup ? 'max-w-[420px]' : ''}`}>
                            <Repeat size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cv-text-tertiary" />
                            <input
                                type="number"
                                value={interval}
                                onChange={(e) => onChange('interval', parseInt(e.target.value, 10) || 1)}
                                className={`w-full cv-input-compact rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-cv-bg-secondary focus:ring-1 focus:ring-cv-accent/20 focus:border-cv-accent transition-all font-semibold text-cv-text-primary cv-width-short ${isWarmup ? 'pl-9 pr-9 text-center' : 'pl-9 pr-3'}`}
                                placeholder="1"
                            />
                        </div>
                        <span className="text-sm font-medium text-cv-text-tertiary">min</span>
                    </div>
                    <p className={`text-[11px] text-cv-text-tertiary mt-1 leading-snug ${isWarmup ? 'text-center' : ''}`}>
                        Frecuencia de inicio: 1 = cada minuto, 2 = cada 2 minutos.
                    </p>
                </div>
            </div>

            {/* Slots Builder */}
            <div className="space-y-2.5">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-cv-text-secondary">
                        Distribución de Intervalos
                    </label>
                    <span className="text-xs text-cv-text-tertiary bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                        {slots.length} intervalos definidos
                    </span>
                </div>
                <p className="text-[11px] text-cv-text-tertiary mb-3 leading-snug">
                    En cada intervalo define ejercicio + variable numérica objetivo.
                </p>

                <div className="space-y-2.5">
                    {slots.map((slot, index) => (
                        <div
                            key={slot.id || index}
                            className="group relative grid grid-cols-1 md:grid-cols-[88px_minmax(0,1fr)_86px_110px_auto] gap-2 p-2.5 bg-white dark:bg-cv-bg-secondary border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md hover:border-cv-accent/30 transition-all items-start md:items-center"
                        >
                            {/* Interval label */}
                            <div className="md:pt-0">
                                <div className="w-full text-[10px] font-bold text-cv-accent bg-cv-accent/5 border border-cv-accent/20 rounded-md px-1.5 py-1.5 text-center uppercase tracking-wide">
                                    {isE2MOMMode ? `BLOQUE ${index + 1}` : `MINUTO ${index + 1}`}
                                </div>
                            </div>

                            {/* Exercise */}
                            <div className="min-w-0">
                                <SmartExerciseInput
                                    value={slot.movement}
                                    onChange={(val) => updateSlot(index, 'movement', val)}
                                    placeholder="Buscar ejercicio en la biblioteca..."
                                    className="cv-input cv-input-compact bg-transparent border-none shadow-none focus:ring-0 px-0 py-0 text-sm font-medium h-auto placeholder:text-slate-400 w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wide text-cv-text-tertiary mb-1">
                                    Valor
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={slot.targetValue}
                                    onChange={(e) => updateSlot(index, 'targetValue', e.target.value ? Number.parseInt(e.target.value, 10) : '')}
                                    placeholder={slot.targetUnit === 'seconds' ? '40' : slot.targetUnit === 'meters' ? '200' : '12'}
                                    className="w-full cv-input-compact text-sm text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1 font-semibold focus:ring-1 focus:ring-cv-accent/50"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wide text-cv-text-tertiary mb-1">
                                    Unidad
                                </label>
                                <select
                                    value={slot.targetUnit}
                                    onChange={(e) => updateSlot(index, 'targetUnit', e.target.value as 'reps' | 'seconds' | 'meters')}
                                    className="w-full cv-input-compact text-sm text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1 focus:ring-1 focus:ring-cv-accent/50"
                                >
                                    <option value="reps">Reps</option>
                                    <option value="seconds">Segundos</option>
                                    <option value="meters">Metros</option>
                                </select>
                            </div>

                            <button
                                onClick={() => removeSlot(index)}
                                className="md:mt-5 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                title="Eliminar intervalo"
                            >
                                <Trash2 size={16} />
                            </button>

                            <p className="md:col-start-2 md:col-end-5 text-[11px] text-cv-text-tertiary leading-snug">
                                Ejemplo: 12 reps, 40 seg o 200 m según la unidad elegida.
                            </p>
                        </div>
                    ))}
                </div>

                <button
                    onClick={addSlot}
                    className="mt-2.5 w-full py-2 border border-dashed border-cv-border rounded-lg text-cv-text-tertiary hover:text-cv-accent hover:border-cv-accent/50 hover:bg-cv-accent/5 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                >
                    <Plus size={16} />
                    Añadir Intervalo
                </button>
            </div>
        </div>
    );
}
