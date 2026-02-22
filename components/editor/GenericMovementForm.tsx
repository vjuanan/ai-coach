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
    blockType?: string; // Added blockType
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

export function GenericMovementForm({ config, onChange, methodology, blockType }: GenericMovementFormProps) {
    // Logic for displaying inputs based on methodology
    // Force git update: 4
    const isMetconLike = methodology?.category === 'metcon' || methodology?.category === 'hiit';
    const isStrengthLike = methodology?.category === 'strength';
    const isStandard = methodology?.code === 'STANDARD';

    const isWarmUp = blockType === 'warmup';
    const [warmupMode, setWarmupMode] = useState<'rounds' | 'sets'>('rounds');

    // Strict display rules:
    // - Rounds: Only for Metcon/HIIT, but NEVER for STANDARD
    // - Sets: Only for Strength/Standard
    // - If no methodology selected (undefined), show NEITHER
    // - [NEW] Warmup blocks ALWAYS show Rounds OR Sets mutually exclusive
    const showRounds = (isMetconLike && !isStandard) || (isWarmUp && warmupMode === 'rounds');
    const showGlobalSets = (methodology?.code === 'SUPER_SET' || methodology?.code === 'GIANT_SET');
    const showSetsPerMovement = (!isWarmUp && (isStrengthLike || isStandard) && !showGlobalSets) || (isWarmUp && warmupMode === 'sets');

    const movements = parseMovements((config.movements as unknown[]) || []);
    const rounds = (config.rounds as string) || '';
    const globalSets = (config.sets as string) || '';

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
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {isWarmUp && (
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg w-fit shrink-0">
                        <button
                            onClick={() => setWarmupMode('rounds')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${warmupMode === 'rounds'
                                ? 'bg-white dark:bg-cv-bg-primary shadow-sm text-cv-accent'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            Por Vueltas
                        </button>
                        <button
                            onClick={() => setWarmupMode('sets')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${warmupMode === 'sets'
                                ? 'bg-white dark:bg-cv-bg-primary shadow-sm text-cv-accent'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            Por Series
                        </button>
                    </div>
                )}

                {/* 1. Global Rounds/Sets Input - Only if methodology supports it */}
                {(showRounds || showGlobalSets) && (
                    <div className="max-w-md w-full"> {/* Limited width */}
                        <InputCard
                            label={showRounds ? "RONDAS / VUELTAS" : "SERIES"}
                            value={showRounds ? rounds : globalSets}
                            onChange={(val) => onChange(showRounds ? 'rounds' : 'sets', val)}
                            type="text"
                            icon={RotateCcw}
                            placeholder={showRounds ? "Ej: 3, 4, 5" : "3"}
                            presets={[2, 3, 4, 5]}
                        />
                    </div>
                )}
            </div>

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
                            showSets={showSetsPerMovement}
                            isWarmUp={isWarmUp}
                        />
                    ))}

                    {/* Add Movement Input */}
                    <div className="max-w-md p-4 rounded-xl border border-dashed border-cv-border bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center gap-3">
                            <Plus size={18} className="text-slate-400" />
                            <div className="flex-1">
                                <SmartExerciseInput
                                    value=""
                                    onChange={() => { }}
                                    onSelect={(ex) => addMovement(ex.name)}
                                    placeholder="Añadir ejercicio..."
                                    className="bg-transparent border-none p-0 text-sm font-medium text-cv-text-primary placeholder:text-slate-400 focus:ring-0 focus:outline-none w-full"
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
    showSets: boolean;
    isWarmUp: boolean;
}

function MovementCard({ index, movement, onChange, onRemove, showSets, isWarmUp }: MovementCardProps) {
    const { searchLocal } = useExerciseCache();

    // Check validity
    const exerciseMatch = searchLocal(movement.name).find(e => e.name.toLowerCase() === movement.name.toLowerCase());
    const isValid = !!exerciseMatch;

    // Attributes
    const showDistance = exerciseMatch?.tracking_parameters?.distance;

    // Check if it's a Warm Up block to hide RPE and Rest
    // We can check if the methodology passed down (if any) is 'warmup' OR if the parent component told us so.
    // BUT the prop is not yet passed to MovementCard. We need to thread it.

    // Actually, `GenericMovementForm` doesn't pass `blockType` to `MovementCard` yet.
    // Let's assume we will pass it. 
    // Wait, I need to update the props of MovementCard first in the same file.

    return (
        <div className={`rounded-xl border transition-all duration-200
            ${isValid
                ? 'bg-slate-50/50 dark:bg-cv-bg-secondary/50 border-slate-200 dark:border-slate-700'
                : 'bg-slate-50 dark:bg-slate-800/50 border-transparent'
            }`}
        >
            {/* ... Header ... */}
            {/* Header: Exercise Name & Actions */}
            <div className="p-2.5 flex gap-3 items-center border-b border-slate-100 dark:border-slate-800/50 rounded-t-xl">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-500">
                    {index + 1}
                </div>

                <div className="flex-1 min-w-0 z-10"> {/* Added z-index for search */}
                    <SmartExerciseInput
                        value={movement.name}
                        onChange={(val) => onChange({ name: val })}
                        placeholder="Buscar ejercicio..."
                        className={`w-full bg-transparent focus:outline-none focus:ring-0 border-none ${isValid ? 'font-bold text-cv-text-primary text-base' : 'font-medium text-cv-text-secondary placeholder:text-slate-400'}`}
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
                <div className="p-2.5 bg-white dark:bg-cv-bg-secondary rounded-b-xl flex flex-col lg:flex-row gap-2.5">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 flex-1">
                        {/* 1. Series (Sets) - CONDITIONALLY SHOWN */}
                        {showSets && (
                            <InputCard
                                label="SERIES"
                                value={movement.sets as string | number}
                                onChange={(val) => onChange({ sets: val })}
                                type="number"
                                icon={RotateCcw} // Reusing same icon, or could use Layers/Clone
                                presets={[2, 3, 4]}
                                placeholder="3"
                                isInvalid={!movement.sets}
                            />
                        )}

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
                                isInvalid={!movement.distance}
                            />
                        ) : (
                            <InputCard
                                label="REPETICIONES"
                                value={(movement.reps || movement.quantity) as string | number}
                                onChange={(val) => onChange({ reps: val, quantity: val })} // sync both
                                type="number"
                                icon={Repeat}
                                presets={[8, 10, 12, 15]}
                                placeholder="10"
                                isInvalid={!(movement.reps || movement.quantity)}
                            />
                        )}

                        {/* 3. Intensity / RPE / Weight - HIDDEN FOR WARM UP */}
                        {!isWarmUp && (
                            <InputCard
                                label="INTENSIDAD / RPE"
                                value={(movement.rpe || movement.weight) as string | number}
                                onChange={(val) => {
                                    // Simple heuristic: if number < 11, assume RPE.
                                    if (typeof val === 'number' && val <= 10) onChange({ rpe: val, weight: undefined });
                                    else onChange({ weight: val ? String(val) : undefined, rpe: undefined });
                                }}
                                type="number"
                                icon={Flame}
                                presets={[7, 8, 9]}
                                placeholder="RPE 8"
                                isInvalid={!movement.rpe && !movement.weight}
                            />
                        )}

                        {/* 4. Rest - HIDDEN FOR WARM UP */}
                        {!isWarmUp && (
                            <InputCard
                                label="DESCANSO"
                                value={movement.rest as string}
                                onChange={(val) => onChange({ rest: val })}
                                type="time"
                                icon={Clock}
                                presets={['0:00', '0:30', '1:00']}
                                placeholder="00:00"
                                isInvalid={!movement.rest}
                            />
                        )}
                    </div>

                    {/* Notes (Right Side / Full Width on mobile) */}
                    <div className="bg-slate-50 dark:bg-cv-bg-tertiary/30 rounded-xl border border-slate-100 dark:border-slate-800 p-2 flex flex-col group focus-within:ring-1 ring-cv-accent/50 transition-all w-full lg:w-1/3 min-h-[80px]">
                        <div className="flex items-center gap-1.5 mb-1">
                            <FileText size={12} className="text-cv-text-tertiary" />
                            <span className="text-[9px] uppercase font-bold text-cv-text-tertiary">Notas</span>
                        </div>
                        <textarea
                            value={movement.notes || movement.description || ''}
                            onChange={(e) => onChange({ notes: e.target.value, description: e.target.value })}
                            placeholder="Notas técnicas..."
                            className="w-full h-full bg-transparent border-none p-0 text-xs text-cv-text-primary placeholder:text-slate-300 focus:ring-0 resize-none flex-1"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
