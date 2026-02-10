'use client';

import { useState, useEffect } from 'react';
import { SmartExerciseInput } from './SmartExerciseInput';
import { useExerciseCache } from '@/hooks/useExerciseCache';
import { Trash2, Plus, Dumbbell, Activity, Timer, RotateCcw } from 'lucide-react';
import type { TrainingMethodology } from '@/lib/supabase/types';

interface GenericMovementFormProps {
    config: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
    methodology?: TrainingMethodology;
}

interface MovementObject {
    name: string;
    description?: string; // For legacy string-only compatibility or extra notes
    quantity?: string;    // "10", "5-8"
    weight?: string;      // "20kg"
    distance?: string;    // "400m"
    time?: string;        // "5:00"
    // potentially other structured fields
}

// Helper to parse existing data which might be strings or objects
const parseMovements = (data: unknown[]): MovementObject[] => {
    if (!Array.isArray(data)) return [];
    return data.map(item => {
        if (typeof item === 'string') {
            return { name: item }; // Legacy: entire string is name for now, user will split it
        }
        return item as MovementObject;
    });
};

export function GenericMovementForm({ config, onChange, methodology }: GenericMovementFormProps) {
    // Show rounds for specific methodologies AND for Warmup (generic use case)
    // Only NOT show if explicitly forbidden, but default to showing for flexibility
    // logic: if methodology is "Quality" or "Not For Time" OR if it's undefined (Warmup often is undefined or Generic)
    const showRounds = true;

    // Config values
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
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* 1. Rounds Input (Conditional) */}
            {showRounds && (
                <div className="bg-white dark:bg-cv-bg-secondary p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                    <div className="flex items-center gap-2 text-cv-text-secondary">
                        <RotateCcw size={16} />
                        <span className="text-sm font-semibold">Rondas / Vueltas</span>
                    </div>
                    <input
                        type="text"
                        value={rounds}
                        onChange={(e) => onChange('rounds', e.target.value)}
                        placeholder="Ej: 3, 4, 5-10-15"
                        className="flex-1 bg-transparent border-none p-0 text-sm font-bold text-cv-text-primary text-right focus:ring-0 placeholder:text-slate-300"
                    />
                </div>
            )}

            {/* 2. Movements List */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-cv-text-secondary">
                        Movimientos
                    </label>
                    <span className="text-xs text-cv-text-tertiary">
                        {movements.length} ejercicios
                    </span>
                </div>

                <div className="space-y-2">
                    {movements.map((movement, index) => (
                        <MovementRow
                            key={index}
                            movement={movement}
                            onChange={(updates) => updateMovement(index, updates)}
                            onRemove={() => removeMovement(index)}
                        />
                    ))}

                    {/* New "Add Movement" Input (replaces button) */}
                    <div className="p-3 rounded-xl border border-dashed border-cv-border bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center gap-3">
                            <Plus size={16} className="text-slate-400" />
                            <div className="flex-1">
                                <SmartExerciseInput
                                    value=""
                                    onChange={() => { }} // Controlled by onSelect mostly, but need empty default
                                    onSelect={(ex) => addMovement(ex.name)}
                                    placeholder="Añadir ejercicio..."
                                    className="bg-transparent border-none p-0 text-sm text-cv-text-primary placeholder:text-slate-400 focus:ring-0 w-full"
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
// Sub-component: MovementRow
// Handles strict validation and attribute inputs
// ----------------------------------------------------------------------

interface MovementRowProps {
    movement: MovementObject;
    onChange: (updates: Partial<MovementObject>) => void;
    onRemove: () => void;
}

function MovementRow({ movement, onChange, onRemove }: MovementRowProps) {
    const { searchLocal } = useExerciseCache();

    // Check if valid exercise
    // We assume strict matching for attributes to appear
    const exerciseMatch = searchLocal(movement.name).find(e => e.name.toLowerCase() === movement.name.toLowerCase());
    const isValid = !!exerciseMatch;

    // Attributes based on exercise tracking params
    const showDistance = exerciseMatch?.tracking_parameters?.distance;
    const showTime = exerciseMatch?.tracking_parameters?.time;
    // Default to Reps/Quantity if not pure distance/time or if explicitly set?
    // User said: "puts attributes of distance/time for some exercises".
    // "Quantity" handles reps, calories, etc if not distance/time.

    return (
        <div className={`p-3 rounded-xl border transition-all duration-200 
            ${isValid
                ? 'bg-white dark:bg-cv-bg-secondary border-slate-200 dark:border-slate-700 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800/50 border-transparent'
            }`}
        >
            <div className="flex gap-3">
                {/* Drag Handle (Optional, maybe later) */}

                {/* Exercise Input */}
                <div className="flex-1 min-w-0">
                    <SmartExerciseInput
                        value={movement.name}
                        onChange={(val) => onChange({ name: val })}
                        placeholder="Buscar ejercicio..."
                        className={`w-full bg-transparent ${isValid ? 'font-bold text-cv-text-primary' : 'font-medium text-cv-text-secondary placeholder:text-slate-400'}`}
                        autoFocus={false}
                    />

                    {/* Validation Hint (if empty or invalid) */}
                    {!isValid && movement.name && (
                        <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
                            Selecciona un ejercicio de la lista para añadir atributos
                        </p>
                    )}
                </div>

                {/* Remove Button */}
                <button
                    onClick={onRemove}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Attributes Row - Only visible if Valid */}
            {isValid && (
                <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-1">

                    {/* Distance Input */}
                    {showDistance && (
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-cv-bg-tertiary px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <Activity size={12} className="text-cv-text-tertiary" />
                            <input
                                type="text"
                                value={movement.distance || ''}
                                onChange={(e) => onChange({ distance: e.target.value })}
                                placeholder="Distancia (m/km)"
                                className="w-24 bg-transparent border-none p-0 text-xs font-semibold text-cv-text-primary placeholder:text-slate-300 focus:ring-0"
                            />
                        </div>
                    )}

                    {/* Time/Duration Input */}
                    {showTime && (
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-cv-bg-tertiary px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <Timer size={12} className="text-cv-text-tertiary" />
                            <input
                                type="text"
                                value={movement.time || ''}
                                onChange={(e) => onChange({ time: e.target.value })}
                                placeholder="Tiempo"
                                className="w-20 bg-transparent border-none p-0 text-xs font-semibold text-cv-text-primary placeholder:text-slate-300 focus:ring-0"
                            />
                        </div>
                    )}

                    {/* Generic Quantity/Reps (Always valid unless strictly distance/time only?) 
                        Usually good to have a catch-all "Quantity" or "Reps" 
                    */}
                    {!showDistance && !showTime && (
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-cv-bg-tertiary px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] font-bold text-cv-text-tertiary uppercase">Reps</span>
                            <input
                                type="text"
                                value={movement.quantity || ''}
                                onChange={(e) => onChange({ quantity: e.target.value })}
                                placeholder="Cantidad"
                                className="w-20 bg-transparent border-none p-0 text-xs font-semibold text-cv-text-primary placeholder:text-slate-300 focus:ring-0"
                            />
                        </div>
                    )}

                    {/* Notes / Details */}
                    <div className="flex-1 min-w-[100px]">
                        <input
                            type="text"
                            value={movement.description || ''}
                            onChange={(e) => onChange({ description: e.target.value })}
                            placeholder="Detalles / Notas (opcional)"
                            className="w-full bg-transparent border-none p-0 text-xs text-cv-text-secondary placeholder:text-slate-300 focus:ring-0 text-right"
                        />
                    </div>

                </div>
            )}
        </div>
    );
}
