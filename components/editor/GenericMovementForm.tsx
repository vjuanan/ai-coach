'use client';

import { useState } from 'react';
import { SmartExerciseInput } from './SmartExerciseInput';
import { useExerciseCache } from '@/hooks/useExerciseCache';
import { Trash2, Plus, RotateCcw, Repeat, Activity, Flame, Clock, FileText } from 'lucide-react';
import type { TrainingMethodology } from '@/lib/supabase/types';
import { InputCard } from './InputCard';

interface GenericMovementFormProps {
    config: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
    methodology?: TrainingMethodology;
}

interface MovementObject {
    name: string;
    sets?: string | number; // Added sets
    reps?: string | number;
    weight?: string;
    distance?: string;
    time?: string;
    rpe?: number;
    rest?: string;
    notes?: string;

    // Legacy / Compat
    quantity?: string;
    description?: string;
}

// Helper to parse existing data
const parseMovements = (data: unknown[]): MovementObject[] => {
    if (!Array.isArray(data)) return [];
    return data.map(item => {
        if (typeof item === 'string') {
            return { name: item };
        }
        return item as MovementObject;
    });
};

export function GenericMovementForm({ config, onChange, methodology }: GenericMovementFormProps) {
    const showRounds = true;
    const movements = parseMovements((config.movements as unknown[]) || []);
    const rounds = (config.rounds as string) || '';

    const handleMovementsChange = (newMovements: MovementObject[]) => {
        onChange('movements', newMovements);
    };

    const addMovement = (name: string) => {
        if (!name) return;
        handleMovementsChange([...movements, { name }]);
    };

    const updateMovement = (index: number, updates: Partial<MovementObject>) => {
        const updated = [...movements];
        updated[index] = { ...updated[index], ...updates };
        handleMovementsChange(updated);
    };

    const removeMovement = (index: number) => {
        handleMovementsChange(movements.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300 border-2 border-red-500 p-2 rounded-xl relative">
            <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-bl-xl font-mono">DEBUG: V3 - SERIES FIX</div>
            {/* 1. Global Rounds Input - Reduced Width */}
            {showRounds && (
                <div className="max-w-md"> {/* Limited width */}
                    <InputCard
                        label="RONDAS / VUELTAS"
                        value={rounds}
                        onChange={(val) => onChange('rounds', val)}
                        type="text"
                        icon={RotateCcw}
                        placeholder="Ej: 3, 4, 5"
                        presets={[3, 4, 5]}
                    />
                </div>
            )}

            {/* 2. Movements List */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-cv-text-secondary">
                        Movimientos
                    </label>
                    <span className="text-xs text-cv-text-tertiary">
                        {movements.length} ejercicios
                    </span>
                </div>

                <div className="space-y-4">
                    {movements.map((movement, index) => (
                        <MovementCard
                            key={index}
                            index={index}
                            movement={movement}
                            onChange={(updates) => updateMovement(index, updates)}
                            onRemove={() => removeMovement(index)}
                        />
                    ))}

                    {/* Add Movement Input */}
                    <div className="p-4 rounded-xl border border-dashed border-cv-border bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center gap-3">
                            <Plus size={18} className="text-slate-400" />
                            <div className="flex-1">
                                <SmartExerciseInput
                                    value=""
                                    onChange={() => { }}
                                    onSelect={(ex) => addMovement(ex.name)}
                                    placeholder="Añadir ejercicio..."
                                    className="bg-transparent border-none p-0 text-sm font-medium text-cv-text-primary placeholder:text-slate-400 focus:ring-0 w-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// Sub-component: MovementCard
// ----------------------------------------------------------------------

interface MovementCardProps {
    index: number;
    movement: MovementObject;
    onChange: (updates: Partial<MovementObject>) => void;
    onRemove: () => void;
}

function MovementCard({ index, movement, onChange, onRemove }: MovementCardProps) {
    const { searchLocal } = useExerciseCache();

    // Check validity
    const exerciseMatch = searchLocal(movement.name).find(e => e.name.toLowerCase() === movement.name.toLowerCase());
    const isValid = !!exerciseMatch;

    // Attributes
    const showDistance = exerciseMatch?.tracking_parameters?.distance;

    return (
        <div className={`rounded-xl border transition-all duration-200 overflow-hidden
            ${isValid
                ? 'bg-slate-50/50 dark:bg-cv-bg-secondary/50 border-slate-200 dark:border-slate-700'
                : 'bg-slate-50 dark:bg-slate-800/50 border-transparent'
            }`}
        >
            {/* Header: Exercise Name & Actions */}
            <div className="p-3 flex gap-3 items-center border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-500">
                    {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                    <SmartExerciseInput
                        value={movement.name}
                        onChange={(val) => onChange({ name: val })}
                        placeholder="Buscar ejercicio..."
                        className={`w-full bg-transparent ${isValid ? 'font-bold text-cv-text-primary text-base' : 'font-medium text-cv-text-secondary placeholder:text-slate-400'}`}
                    />
                    {!isValid && movement.name && (
                        <p className="text-[10px] text-amber-500 mt-1">Selecciona de la lista</p>
                    )}
                </div>

                <button
                    onClick={onRemove}
                    className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Inputs Grid - Only if Valid */}
            {isValid && (
                <div className="p-3 bg-white dark:bg-cv-bg-secondary space-y-3">
                    {/* Metrics Grid (4 columns) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* 1. Series (Sets) - NEW */}
                        <InputCard
                            label="SERIES"
                            value={movement.sets as string}
                            onChange={(val) => onChange({ sets: val })}
                            type="number-text"
                            icon={RotateCcw} // Reusing same icon, or could use Layers/Clone
                            presets={[2, 3, 4]}
                            placeholder="3"
                        />

                        {/* 2. Reps / Distance */}
                        {showDistance ? (
                            <InputCard
                                label="DISTANCIA"
                                value={movement.distance || ''}
                                onChange={(val) => onChange({ distance: val })}
                                type="text"
                                icon={Activity}
                                presets={['200m', '400m', '800m', '1km']}
                                placeholder="400m"
                                isDistance
                            />
                        ) : (
                            <InputCard
                                label="REPETICIONES"
                                value={(movement.reps || movement.quantity) as string}
                                onChange={(val) => onChange({ reps: val, quantity: val })} // sync both
                                type="number-text"
                                icon={Repeat}
                                presets={[8, 10, 12, 15]}
                                placeholder="10"
                            />
                        )}

                        {/* 3. Intensity / RPE / Weight */}
                        <InputCard
                            label="INTENSIDAD / RPE"
                            value={(movement.rpe || movement.weight) as string}
                            onChange={(val) => {
                                // Simple heuristic: if number < 11, assume RPE.
                                if (typeof val === 'number' && val <= 10) onChange({ rpe: val, weight: undefined });
                                else onChange({ weight: val ? String(val) : undefined, rpe: undefined });
                            }}
                            type="text"
                            icon={Flame}
                            presets={[7, 8, 9]}
                            placeholder="RPE 8"
                        />

                        {/* 4. Rest */}
                        <InputCard
                            label="DESCANSO"
                            value={movement.rest as string}
                            onChange={(val) => onChange({ rest: val })}
                            type="text"
                            icon={Clock}
                            presets={['0:00', '0:30', '1:00']}
                            placeholder="-"
                        />
                    </div>

                    {/* Notes (Full Width) */}
                    <div className="bg-slate-50 dark:bg-cv-bg-tertiary/30 rounded-xl border border-slate-100 dark:border-slate-800 p-2 flex flex-col group focus-within:ring-1 ring-cv-accent/50 transition-all">
                        <div className="flex items-center gap-1.5 mb-1">
                            <FileText size={12} className="text-cv-text-tertiary" />
                            <span className="text-[9px] uppercase font-bold text-cv-text-tertiary">Notas</span>
                        </div>
                        <textarea
                            value={movement.notes || movement.description || ''}
                            onChange={(e) => onChange({ notes: e.target.value, description: e.target.value })}
                            placeholder="Notas técnicas..."
                            className="w-full min-h-[40px] bg-transparent border-none p-0 text-xs text-cv-text-primary placeholder:text-slate-300 focus:ring-0 resize-none"
                            rows={1}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
