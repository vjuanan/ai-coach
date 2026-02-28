'use client';

import { useState } from 'react';
import { SmartExerciseInput } from './SmartExerciseInput';
import { useExerciseCache } from '@/hooks/useExerciseCache';
import { Trash2, Plus, RotateCcw, Repeat, Activity, Flame, Clock } from 'lucide-react';
import type { TrainingMethodology, TrainingMethodologyFormField } from '@/lib/supabase/types';
import { InputCard } from './InputCard';
import { formatMethodologyOptionLabel, normalizeMethodologyCode } from '@/lib/training-methodologies';

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
    weight?: string | number;
    distance?: string | number;
    time?: string;
    rpe?: number;
    rest?: string | number;
    notes?: string;

    // Legacy / Compat
    quantity?: string;
    description?: string;
}

type FieldValueSize = 'short' | 'medium' | 'time' | 'auto';

function dedupePresets(presets: (string | number)[]) {
    const seen = new Set<string>();
    return presets.filter((preset) => {
        const key = `${typeof preset}:${String(preset)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function selectStrategicPresets(presets: (string | number)[], maxVisible = 3) {
    if (maxVisible <= 0) return [];
    const unique = dedupePresets(presets);
    if (unique.length <= maxVisible) return unique;
    if (maxVisible === 1) return [unique[0]];
    if (maxVisible === 2) return [unique[0], unique[unique.length - 1]];

    const numericValues = unique
        .map((preset) => (typeof preset === 'number' ? preset : Number(preset)));
    const allNumeric = numericValues.every((value) => Number.isFinite(value));

    if (allNumeric) {
        const minValue = Math.min(...numericValues);
        const maxValue = Math.max(...numericValues);
        const middleTarget = (minValue + maxValue) / 2;

        const minIndex = numericValues.findIndex((value) => value === minValue);
        const maxIndex = numericValues.findIndex((value) => value === maxValue);

        let middleIndex = -1;
        let bestDistance = Number.POSITIVE_INFINITY;
        for (let i = 0; i < numericValues.length; i++) {
            if (i === minIndex || i === maxIndex) continue;
            const distance = Math.abs(numericValues[i] - middleTarget);
            if (distance < bestDistance) {
                bestDistance = distance;
                middleIndex = i;
            }
        }

        if (middleIndex === -1) middleIndex = Math.floor((unique.length - 1) / 2);
        return dedupePresets([unique[minIndex], unique[middleIndex], unique[maxIndex]]).slice(0, maxVisible);
    }

    const middleIndex = Math.floor((unique.length - 1) / 2);
    return dedupePresets([unique[0], unique[middleIndex], unique[unique.length - 1]]).slice(0, maxVisible);
}

function inferFieldPresets(field: TrainingMethodologyFormField): (string | number)[] {
    const key = field.key.toLowerCase();
    const placeholderNumber = Number.parseInt(String(field.placeholder || ''), 10);

    if (key === 'drops') return [2, 3, 4];
    if (key.includes('cluster') || key.includes('mini')) return [2, 3, 4];
    if (key === 'holdseconds') return [2, 3, 5];
    if (key === 'increment') return [1, 2, 3];
    if (key === 'totalreps') return [15, 20, 25];
    if (key.includes('weightreduction') && key.includes('pct')) return [15, 20, 25];
    if (key === 'loadkg') {
        if (Number.isFinite(placeholderNumber) && placeholderNumber >= 60) return [50, 60, 70];
        return [40, 50, 60];
    }
    if (key.includes('round') || key === 'sets') return [2, 3, 4, 5];
    if (key.includes('rep')) return [8, 10, 12];
    if (key.includes('minute') || key.includes('timecap') || key.includes('time_cap')) return [10, 12, 15];
    if (key.includes('rest') && key.includes('second')) return [30, 45, 60, 90];
    if (key.includes('work') && key.includes('second')) return [20, 30, 40];
    if (key.includes('percentage') || key.includes('pct') || key.includes('load')) return [70, 75, 80];
    if (key.includes('rpe') || key.includes('intensity')) return [7, 8, 9];

    return [];
}

function inferFieldValueSize(field: TrainingMethodologyFormField): FieldValueSize {
    const key = field.key.toLowerCase();

    if (key.includes('time') || key.includes('tempo')) return 'time';
    if (
        key.includes('round') ||
        key.includes('set') ||
        key.includes('rep') ||
        key.includes('rest') ||
        key.includes('work') ||
        key.includes('rpe') ||
        key.includes('pct') ||
        key.includes('percentage')
    ) {
        return 'short';
    }

    return 'medium';
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
    const methodologyCode = normalizeMethodologyCode(methodology?.code || '');
    const isMetconLike = methodology?.category === 'metcon' || methodology?.category === 'hiit';
    const isStrengthLike = methodology?.category === 'strength';
    const isStandard = methodologyCode === 'STANDARD';

    const isWarmUp = blockType === 'warmup';
    const isFinisherMethod = methodology?.category === 'finisher';
    const useCompactMovementCards = ['warmup', 'accessory', 'skill'].includes(blockType || '');
    const [warmupMode, setWarmupMode] = useState<'rounds' | 'sets'>('rounds');

    // Strict display rules:
    // - Rounds: Only for Metcon/HIIT, but NEVER for STANDARD
    // - Sets: Only for Strength/Standard
    // - If no methodology selected (undefined), show NEITHER
    // - [NEW] Warmup blocks ALWAYS show Rounds OR Sets mutually exclusive
    const showRounds = (isMetconLike && !isStandard) || (isWarmUp && warmupMode === 'rounds');
    const showGlobalSets = methodologyCode === 'SUPER_SET';
    const showGlobalRounds = methodologyCode === 'GIANT_SET';
    const showSetsPerMovement = (!isWarmUp && (isStrengthLike || isStandard) && !showGlobalSets && !showGlobalRounds) || (isWarmUp && warmupMode === 'sets');

    const movements = parseMovements((config.movements as unknown[]) || []);
    const rounds = (config.rounds as string | number) || '';
    const globalSets = (config.sets as string | number) || '';
    const movementField = (methodology?.form_config?.fields || []).find(
        (field) => field.type === 'movements_list' && field.key === 'movements'
    );
    const globalControlKey = isWarmUp
        ? (warmupMode === 'sets' ? 'sets' : 'rounds')
        : (showGlobalSets ? 'sets' : 'rounds');
    const globalControlLabel = isWarmUp
        ? (warmupMode === 'sets' ? 'SERIES BASE' : 'RONDAS')
        : (showGlobalSets ? 'SERIES' : 'RONDAS / VUELTAS');
    const globalControlValue = isWarmUp
        ? (warmupMode === 'sets' ? globalSets : rounds)
        : (showGlobalSets ? globalSets : rounds);
    const shouldShowGlobalControl = isWarmUp || showRounds || showGlobalSets || showGlobalRounds;
    const globalControlPresets = selectStrategicPresets([2, 3, 4, 5], 3);
    const methodologySimpleFields = (methodology?.form_config?.fields || [])
        .filter((field) => field.type !== 'movements_list')
        .filter((field) => !(field.key === 'rounds' && (showRounds || showGlobalRounds)))
        .filter((field) => !(field.key === 'sets' && (showGlobalSets || showSetsPerMovement)));

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
            <div className="cv-meta-bar">
                {isWarmUp && (
                    <div className="cv-meta-switch shrink-0">
                        <button
                            onClick={() => setWarmupMode('rounds')}
                            className={`px-2 py-0 text-[11px] font-bold rounded-md transition-all h-6 ${warmupMode === 'rounds'
                                ? 'bg-white dark:bg-cv-bg-primary shadow-sm text-cv-accent'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            Por Vueltas
                        </button>
                        <button
                            onClick={() => setWarmupMode('sets')}
                            className={`px-2 py-0 text-[11px] font-bold rounded-md transition-all h-6 ${warmupMode === 'sets'
                                ? 'bg-white dark:bg-cv-bg-primary shadow-sm text-cv-accent'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            Por Series
                        </button>
                    </div>
                )}

                {/* 1. Global Rounds/Sets Input - Only if methodology supports it */}
                {shouldShowGlobalControl && (
                    isWarmUp ? (
                        <div className="cv-meta-item shrink-0">
                            <div className="flex items-center justify-center gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-wide text-cv-text-tertiary whitespace-nowrap">
                                    {globalControlLabel}
                                </span>
                                <input
                                    type="number"
                                    min={1}
                                    value={globalControlValue}
                                    onChange={(e) => onChange(globalControlKey, e.target.value ? Number.parseInt(e.target.value, 10) : '')}
                                    placeholder={globalControlKey === 'sets' ? '3' : '5'}
                                    className="cv-width-short cv-input-micro bg-white dark:bg-cv-bg-secondary border border-slate-200 dark:border-slate-700 cv-radius-soft px-1 font-bold text-center text-base focus:ring-1 focus:ring-cv-accent/40 focus:border-cv-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                            <div className="flex flex-wrap justify-center gap-1">
                                {globalControlPresets.map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => onChange(globalControlKey, preset)}
                                        className={`cv-chip-compact cv-chip-micro text-[9px] px-0 rounded-md font-semibold transition-all border ${globalControlValue == preset
                                            ? 'bg-cv-accent text-white border-cv-accent'
                                            : 'bg-slate-50 dark:bg-slate-800 text-cv-text-secondary border-slate-200 dark:border-slate-700 hover:border-cv-accent/40'}`}
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <InputCard
                            label={globalControlLabel}
                            value={globalControlValue}
                            onChange={(val) => onChange(globalControlKey, val)}
                            type="number"
                            icon={RotateCcw}
                            placeholder={globalControlKey === 'sets' ? '3' : '5'}
                            presets={[2, 3, 4, 5]}
                            valueSize="short"
                            cardSize="short"
                            density="micro"
                            maxVisiblePresets={3}
                            layout="fit"
                        />
                    )
                )}

                {methodologySimpleFields.map((field) => (
                    <MethodologySimpleField
                        key={field.key}
                        field={field}
                        value={config[field.key]}
                        onChange={(nextValue) => onChange(field.key, nextValue)}
                        isFinisher={isFinisherMethod}
                    />
                ))}
            </div>

            {/* 2. Movements List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-cv-text-secondary">
                        {movementField?.label || 'Movimientos'}
                    </label>
                    <span className="text-xs text-cv-text-tertiary">
                        {movements.length} ejercicios
                    </span>
                </div>

                <div className={useCompactMovementCards ? 'flex flex-wrap justify-center gap-2' : 'space-y-3'}>
                    {movements.map((movement, index) => (
                        <div
                            key={index}
                            className={useCompactMovementCards ? 'w-full xl:basis-[calc(50%-0.5rem)] xl:max-w-[calc(50%-0.5rem)]' : ''}
                        >
                            <MovementCard
                                index={index}
                                movement={movement}
                                onChange={(updates) => updateMovement(index, updates)}
                                onRemove={() => removeMovement(index)}
                                showSets={showSetsPerMovement}
                                isWarmUp={isWarmUp}
                                layoutMode={useCompactMovementCards ? 'compact' : 'default'}
                            />
                        </div>
                    ))}

                    {/* Add Movement Input */}
                    <div className={`p-3 rounded-lg border border-dashed border-cv-border bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${useCompactMovementCards ? 'basis-full' : ''}`}>
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
// Sub-component: MethodologySimpleField
// ----------------------------------------------------------------------

interface MethodologySimpleFieldProps {
    field: TrainingMethodologyFormField;
    value: unknown;
    onChange: (value: unknown) => void;
    isFinisher: boolean;
    className?: string;
}

function shouldUseTwoLineLabel(field: TrainingMethodologyFormField) {
    const key = field.key.toLowerCase();
    return key === 'weightreductionpct'
        || key === 'startingloadpct'
        || key === 'loadkg'
        || key === 'intensitytarget'
        || key === 'restseconds'
        || key === 'holdseconds'
        || key === 'repsperdrop'
        || key === 'totalreps';
}

function MethodologySimpleField({ field, value, onChange, isFinisher, className = '' }: MethodologySimpleFieldProps) {
    const resolvedValue = value ?? field.default ?? '';
    const inferredSize = inferFieldValueSize(field);
    const inferredCardSize = inferredSize === 'time' ? 'time' : inferredSize === 'medium' ? 'medium' : 'short';
    const labelLines: 1 | 2 = isFinisher && shouldUseTwoLineLabel(field) ? 2 : 1;
    const fieldKey = field.key.toLowerCase();
    const isRepsPerMovementField = fieldKey === 'repspermovement';
    const resolvedLabel = isRepsPerMovementField ? 'REPS BASE' : field.label.toUpperCase();

    if (field.type === 'select' && field.options) {
        return (
            <div className={`cv-meta-item ${className}`}>
                <label className="text-[10px] font-bold uppercase tracking-wide text-cv-text-secondary whitespace-nowrap">
                    {field.label}
                </label>
                <select
                    value={String(resolvedValue)}
                    onChange={(e) => onChange(e.target.value)}
                    className="cv-meta-input-fit text-center text-sm px-1 cv-width-time"
                >
                    {field.options.map((option) => (
                        <option key={option} value={option}>
                            {formatMethodologyOptionLabel(option)}
                        </option>
                    ))}
                </select>
            </div>
        );
    }

    const inputType = field.type === 'number' ? 'number' : 'text';
    const normalizedValue = field.type === 'number'
        ? (typeof resolvedValue === 'number' ? resolvedValue : Number.parseInt(String(resolvedValue || '').replace(/[^0-9]/g, ''), 10) || '')
        : String(resolvedValue ?? '');

    return (
        <InputCard
            label={resolvedLabel}
            subLabel={undefined}
            value={normalizedValue}
            onChange={(nextValue) => {
                if (field.type === 'number') {
                    if (typeof nextValue === 'number') {
                        onChange(nextValue);
                        return;
                    }
                    const parsed = String(nextValue).trim() === '' ? null : Number.parseInt(String(nextValue), 10);
                    onChange(Number.isFinite(parsed as number) ? parsed : null);
                    return;
                }
                onChange(nextValue);
            }}
            type={inputType}
            placeholder={field.placeholder}
            presets={inferFieldPresets(field)}
            valueSize={inferredSize}
            cardSize={inferredCardSize}
            className={className}
            compact
            presetsPlacement="bottom"
            labelLines={labelLines}
            density="micro"
            layout="fit"
        />
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
    layoutMode: 'default' | 'compact';
}

function MovementCard({ index, movement, onChange, onRemove, showSets, isWarmUp, layoutMode }: MovementCardProps) {
    const { searchLocal } = useExerciseCache();
    const isCompactLayout = layoutMode === 'compact';

    // Check validity
    const exerciseMatch = searchLocal(movement.name).find(e => e.name.toLowerCase() === movement.name.toLowerCase());
    const isValid = !!exerciseMatch;

    // Attributes
    const showDistance = exerciseMatch?.tracking_parameters?.distance;
    const metricsCount = (showSets ? 1 : 0) + 1 + (isWarmUp ? 0 : 2);
    const metricsGridStyle = metricsCount === 1
        ? { gridTemplateColumns: 'minmax(0, 19rem)' }
        : metricsCount === 2
            ? { gridTemplateColumns: 'repeat(auto-fit, minmax(13rem, 1fr))' }
            : { gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))' };

    return (
        <div className={`rounded-lg border transition-all duration-200
            ${isValid
                ? 'bg-slate-50/50 dark:bg-cv-bg-secondary/50 border-slate-200 dark:border-slate-700'
                : 'bg-slate-50 dark:bg-slate-800/50 border-transparent'
            }`}
        >
            {/* ... Header ... */}
            {/* Header: Exercise Name & Actions */}
            <div className={`${isCompactLayout ? 'p-2 gap-2' : 'p-2.5 gap-2.5'} flex items-center border-b border-slate-100 dark:border-slate-800/50 rounded-t-lg`}>
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-500">
                    {index + 1}
                </div>

                <div className="flex-1 min-w-0 z-10"> {/* Added z-index for search */}
                    <SmartExerciseInput
                        value={movement.name}
                        onChange={(val) => onChange({ name: val })}
                        placeholder="Buscar ejercicio..."
                        className={`w-full bg-transparent focus:outline-none focus:ring-0 border-none ${isValid ? `font-bold text-cv-text-primary ${isCompactLayout ? 'text-[15px]' : 'text-base'}` : 'font-medium text-cv-text-secondary placeholder:text-slate-400'}`}
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
                <div className={`${isCompactLayout ? 'p-2 gap-1.5' : 'p-2.5 gap-2'} bg-white dark:bg-cv-bg-secondary rounded-b-lg flex flex-col`}>
                    {/* Metrics Grid */}
                    <div
                        className={`grid w-full gap-2 ${metricsCount === 1 ? 'justify-center mx-auto max-w-[17rem]' : ''}`}
                        style={metricsGridStyle}
                    >
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
                                valueSize="short"
                                cardSize="short"
                                density={isWarmUp ? 'micro' : 'compact'}
                                layout="fluid"
                            />
                        )}

                        {/* 2. Reps / Distance */}
                        {showDistance ? (
                            <InputCard
                                label="DISTANCIA"
                                value={movement.distance || ''}
                                onChange={(val) => onChange({ distance: val ? Number(val) : '' })}
                                type="number"
                                icon={Activity}
                                presets={[200, 400, 800, 1000]}
                                placeholder="400"
                                isDistance
                                isInvalid={!movement.distance}
                                valueSize="medium"
                                cardSize="medium"
                                density={isWarmUp ? 'micro' : 'compact'}
                                layout="fluid"
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
                                valueSize="short"
                                cardSize="short"
                                density={isWarmUp ? 'micro' : 'compact'}
                                layout="fluid"
                            />
                        )}

                        {/* 3. Intensity / RPE / Weight - HIDDEN FOR WARM UP */}
                        {!isWarmUp && (
                            <InputCard
                                label="INTENSIDAD (RPE/KG)"
                                value={(movement.rpe || movement.weight) as string | number}
                                onChange={(val) => {
                                    if (typeof val === 'number' && val <= 10) onChange({ rpe: val, weight: undefined });
                                    else onChange({ weight: val ? Number(val) : undefined, rpe: undefined });
                                }}
                                type="number"
                                icon={Flame}
                                presets={[7, 8, 9, 30, 40]}
                                placeholder="8"
                                isInvalid={!movement.rpe && !movement.weight}
                                valueSize="short"
                                cardSize="short"
                                layout="fluid"
                            />
                        )}

                        {/* 4. Rest - HIDDEN FOR WARM UP */}
                        {!isWarmUp && (
                            <InputCard
                                label="DESCANSO (seg)"
                                value={(movement.rest as string | number) || ''}
                                onChange={(val) => onChange({ rest: val })}
                                type="number"
                                icon={Clock}
                                presets={[15, 30, 45, 60, 90]}
                                placeholder="60"
                                isInvalid={!movement.rest}
                                valueSize="short"
                                cardSize="short"
                                layout="fluid"
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
