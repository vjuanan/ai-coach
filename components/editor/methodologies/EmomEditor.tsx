'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, Repeat, ArrowRight } from 'lucide-react';
import { SmartExerciseInput } from '../SmartExerciseInput';
import type { EMOMConfig } from '@/lib/supabase/types';

interface EmomEditorProps {
    config: Partial<EMOMConfig>;
    onChange: (key: string, value: unknown) => void;
    blockType?: 'warmup' | 'metcon_structured' | 'accessory' | 'skill' | 'finisher' | string;
}

interface MinuteSlot {
    minutes: number[]; // e.g. [1, 3, 5] or just [1]
    movement: string;
    reps: string;
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
    const interval = (config.interval as number) || 1; // Every 1 min default
    const isWarmup = blockType === 'warmup';

    // Parse slots from config or initialize
    // We'll store slots as: { id: string, label: string, movement: string, reps: string }
    const [slots, setSlots] = useState<{ id: string; label: string; movement: string; reps: string }[]>(() => {
        // Try to recover from existing config if available
        const savedSlots = (config as any).slots;
        if (savedSlots && Array.isArray(savedSlots)) return savedSlots;

        // Fallback: If movements exist in the old array format, try to map them
        const oldMovements = (config.movements as string[]) || [];
        if (oldMovements.length > 0) {
            return oldMovements.map((m, i) => ({
                id: crypto.randomUUID(),
                label: `Minuto ${i + 1}`,
                movement: m,
                reps: ''
            }));
        }

        // Default empty slot
        return [{ id: crypto.randomUUID(), label: 'Minuto 1', movement: '', reps: '' }];
    });

    // Update config when slots change
    useEffect(() => {
        onChange('slots', slots);
        // Also sync 'movements' for backward compatibility or summary views
        onChange('movements', slots.map(s => s.movement));
    }, [slots, onChange]);

    const addSlot = () => {
        setSlots(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                label: `Minuto ${prev.length + 1}`,
                movement: '',
                reps: ''
            }
        ]);
    };

    const removeSlot = (index: number) => {
        setSlots(prev => prev.filter((_, i) => i !== index));
    };

    const updateSlot = (index: number, field: 'movement' | 'reps' | 'label', value: string) => {
        setSlots(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Config Row: Duration & Interval */}
            <div className={`flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-cv-bg-tertiary/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 ${isWarmup ? 'justify-center' : ''}`}>
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
                                onChange={(e) => onChange('minutes', parseInt(e.target.value) || 0)}
                                className={`w-full py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-cv-bg-secondary focus:ring-2 focus:ring-cv-accent/20 focus:border-cv-accent transition-all font-semibold text-cv-text-primary ${isWarmup ? 'pl-9 pr-9 text-center' : 'pl-9 pr-3'}`}
                                placeholder="10"
                            />
                        </div>
                        <span className="text-sm font-medium text-cv-text-tertiary">min</span>
                    </div>
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
                                onChange={(e) => onChange('interval', parseInt(e.target.value) || 1)}
                                className={`w-full py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-cv-bg-secondary focus:ring-2 focus:ring-cv-accent/20 focus:border-cv-accent transition-all font-semibold text-cv-text-primary ${isWarmup ? 'pl-9 pr-9 text-center' : 'pl-9 pr-3'}`}
                                placeholder="1"
                            />
                        </div>
                        <span className="text-sm font-medium text-cv-text-tertiary">min</span>
                    </div>
                </div>
            </div>

            {/* Slots Builder */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-cv-text-secondary">
                        Distribución de Minutos
                    </label>
                    <span className="text-xs text-cv-text-tertiary bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                        {slots.length} intervalos definidos
                    </span>
                </div>

                <div className="space-y-3">
                    {slots.map((slot, index) => (
                        <div
                            key={slot.id || index}
                            className="group relative flex gap-3 p-3 bg-white dark:bg-cv-bg-secondary border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md hover:border-cv-accent/30 transition-all items-start"
                        >
                            {/* Minute Label/Input */}
                            <div className="w-24 pt-1">
                                <input
                                    type="text"
                                    value={slot.label}
                                    onChange={(e) => updateSlot(index, 'label', e.target.value)}
                                    className="w-full text-xs font-bold text-cv-accent bg-cv-accent/5 border border-cv-accent/20 rounded-md px-2 py-1.5 text-center focus:ring-1 focus:ring-cv-accent focus:bg-white transition-all uppercase tracking-wide"
                                    placeholder="MIN 1"
                                />
                                {index < slots.length - 1 && (
                                    <div className="flex justify-center my-1">
                                        <div className="w-0.5 h-6 bg-slate-100 dark:bg-slate-700/50"></div>
                                    </div>
                                )}
                            </div>

                            {/* Divider Arrow */}
                            <div className="pt-2 text-slate-300 dark:text-slate-600">
                                <ArrowRight size={16} />
                            </div>

                            {/* Inputs */}
                            <div className="flex-1 space-y-2">
                                <SmartExerciseInput
                                    value={slot.movement}
                                    onChange={(val) => updateSlot(index, 'movement', val)}
                                    placeholder="Buscar ejercicio en la biblioteca..."
                                    className="cv-input bg-transparent border-none shadow-none focus:ring-0 px-0 py-0 text-sm font-medium h-auto placeholder:text-slate-400"
                                />
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={slot.reps}
                                        onChange={(e) => updateSlot(index, 'reps', e.target.value)}
                                        placeholder="Ej: 15 reps, 40 segs work..."
                                        className="text-xs text-cv-text-secondary bg-slate-50 dark:bg-slate-800 border-none rounded-md px-2 py-1 flex-1 focus:ring-1 focus:ring-cv-accent/50"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <button
                                onClick={() => removeSlot(index)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                title="Eliminar intervalo"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    onClick={addSlot}
                    className="mt-3 w-full py-3 border border-dashed border-cv-border rounded-xl text-cv-text-tertiary hover:text-cv-accent hover:border-cv-accent/50 hover:bg-cv-accent/5 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                >
                    <Plus size={16} />
                    Añadir Intervalo
                </button>
            </div>
        </div>
    );
}
