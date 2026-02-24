'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useEditorStore } from '@/lib/store';
import { useExerciseCache } from '@/hooks/useExerciseCache';
import { SmartExerciseInput } from './SmartExerciseInput';
import { ExerciseEditModal } from './ExerciseEditModal';
import { EmomEditor } from './methodologies/EmomEditor';
import { CircuitEditor } from './methodologies/AmrapEditor';
import { TabataEditor } from './methodologies/TabataEditor';
import { ProgressionPreview } from './ProgressionPreview';
import { GenericMovementForm } from './GenericMovementForm';
import { getTrainingMethodologies } from '@/lib/actions';
import {
    formatMethodologyOptionLabel,
    normalizeMethodologyCode,
    normalizeTrainingMethodologies,
} from '@/lib/training-methodologies';
import {
    X,
    Clock,
    Repeat,
    Timer,
    Flame,
    Zap,
    Plus,
    Trash2,
    Dumbbell,
    Activity,
    TrendingUp,
    TrendingDown,
    Heart,
    Layers,
    RefreshCw,
    Skull,
    ListOrdered,
    Puzzle,
    Percent,
    HelpCircle,
    Check,
    Link,
    FileText,
    Route,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    Target

} from 'lucide-react';
import { TableInputWithPresets } from './TableInputWithPresets';
import { InputCard } from './InputCard';
import { useAthleteRm } from '@/hooks/useAthleteRm';
import { useAthleteBenchmarks } from '@/hooks/useAthleteBenchmarks'; // New Hook
import { useBlockValidator } from '@/hooks/useBlockValidator';
import type { BlockType, WorkoutFormat, WorkoutConfig, TrainingMethodology, TrainingMethodologyFormField } from '@/lib/supabase/types';

interface SeriesDetail {
    reps?: string | number;
    weight?: string;
    percentage?: number;
    rpe?: number;
    distance?: string;
    time?: string;
    rest?: string;
    notes?: string;
}
import type { LucideIcon } from 'lucide-react';

interface BlockEditorProps {
    blockId: string;
    autoFocusFirst?: boolean;
}

// Icon mapping for methodology icons
const iconMap: Record<string, LucideIcon> = {
    Clock, Timer, Flame, Zap, Dumbbell, Activity, TrendingUp, TrendingDown,
    Heart, Layers, RefreshCw, Skull, ListOrdered, Puzzle, Repeat,
    Repeat2: Repeat, HelpCircle, Target
};

const SPECIALIZED_METHOD_CODES = ['EMOM', 'EMOM_ALT', 'E2MOM', 'AMRAP', 'RFT', 'FOR_TIME', 'CHIPPER', 'TABATA'];

export function BlockEditor({ blockId, autoFocusFirst = true }: BlockEditorProps) {
    const {
        mesocycles,
        updateBlock,
        selectBlock,
        deleteBlock,

        blockBuilderDayId,
        selectedDayId,
        trainingMethodologies,
        setTrainingMethodologies,
        toggleBlockProgression
    } = useEditorStore();
    // const [methodologies, setMethodologies] = useState<TrainingMethodology[]>([]); // Removed local state
    const [loading, setLoading] = useState(trainingMethodologies.length === 0);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [showProgressionSelector, setShowProgressionSelector] = useState(false);
    const [showEditExerciseModal, setShowEditExerciseModal] = useState(false);
    const firstInputRef = useRef<HTMLInputElement>(null);
    const normalizedMethodologies = useMemo(
        () => normalizeTrainingMethodologies(trainingMethodologies),
        [trainingMethodologies]
    );

    // Validation Hook
    const { validateBlock } = useBlockValidator();

    // Check if current exercise has distance tracking (for progression selector)
    const { searchLocal } = useExerciseCache();

    // Load methodologies from database (only if not already loaded)
    useEffect(() => {
        async function loadMethodologies() {
            if (trainingMethodologies.length > 0) {
                setLoading(false);
                return;
            }

            try {
                const data = await getTrainingMethodologies();
                setTrainingMethodologies(data);
            } catch (error) {
                console.error('Error loading methodologies:', error);
            } finally {
                setLoading(false);
            }
        }
        loadMethodologies();
    }, [trainingMethodologies.length, setTrainingMethodologies]);

    // Auto-focus first input when editor opens
    useEffect(() => {
        if (autoFocusFirst && firstInputRef.current) {
            setTimeout(() => {
                firstInputRef.current?.focus();
            }, 100);
        }
    }, [autoFocusFirst, blockId]);

    // Find the block first (needed for methodology auto-expand)
    let block: {
        id: string;
        type: string;
        format: string | null;
        name: string | null;
        config: WorkoutConfig;
        progression_id?: string | null;
    } | null = null;

    for (const meso of mesocycles) {
        for (const day of meso.days) {
            const found = day.blocks.find(b => b.id === blockId);
            if (found) {
                block = found;
                break;
            }
        }
    }

    // Get current methodology (needed before hooks)
    // CRITICAL FIX: Ignore methodology for 'strength_linear' blocks to ensure they use the specialized StrengthForm (Big Inputs)
    // instead of falling back to the generic DynamicMethodologyForm (Small Inputs) if a matching format (like 'STANDARD') exists.
    const currentMethodology = block?.type === 'strength_linear'
        ? undefined
        : normalizedMethodologies.find(
            (m) => normalizeMethodologyCode(m.code) === normalizeMethodologyCode(block?.format || '')
        );
    const currentMethodologyCode = normalizeMethodologyCode(currentMethodology?.code || '');
    const isSpecializedMethod = SPECIALIZED_METHOD_CODES.includes(currentMethodologyCode);
    const isFinisherBlock = block?.type === 'finisher';
    const finisherMethods = useMemo(
        () => normalizedMethodologies.filter((m) => m.category === 'finisher'),
        [normalizedMethodologies]
    );

    // Finisher blocks should open directly with finisher methodologies (no extra click on "Finishers").
    useEffect(() => {
        if (!block) return;

        if (isFinisherBlock && finisherMethods.length > 0 && (!currentMethodology || currentMethodology.category !== 'finisher')) {
            const defaultMethod = finisherMethods[0];
            const mergedConfig = { ...(block.config || {}), ...defaultMethod.default_values } as WorkoutConfig;
            updateBlock(blockId, {
                format: defaultMethod.code as WorkoutFormat,
                config: mergedConfig
            });
            return;
        }

        if (currentMethodology && !expandedCategory) {
            setExpandedCategory(currentMethodology.category);
        }
    }, [block, blockId, currentMethodology, expandedCategory, finisherMethods, isFinisherBlock, updateBlock]);

    // Backfill missing numeric defaults in existing blocks so export and validation remain coherent.
    useEffect(() => {
        if (!block || !currentMethodology) return;
        if (!['metcon_structured', 'warmup', 'accessory', 'skill', 'finisher'].includes(block.type)) return;

        const fields = currentMethodology.form_config?.fields || [];
        const updates: Record<string, unknown> = {};

        for (const field of fields) {
            if (field.type === 'movements_list') continue;
            if (typeof field.default === 'undefined') continue;

            const currentValue = (block.config || {})[field.key as keyof WorkoutConfig];
            const isMissing = currentValue === undefined || currentValue === null || currentValue === '';
            if (isMissing) {
                updates[field.key] = field.default;
            }
        }

        if (Object.keys(updates).length > 0) {
            updateBlock(blockId, {
                config: { ...(block.config || {}), ...updates } as WorkoutConfig,
            });
        }
    }, [
        block,
        blockId,
        currentMethodology,
        updateBlock,
    ]);

    // Early return if block not found (after all hooks)
    if (!block) {
        return (
            <div className="p-4 text-center text-cv-text-tertiary">
                Bloque no encontrado
            </div>
        );
    }

    const config = block.config || {};

    const handleConfigChange = (key: string, value: unknown) => {
        updateBlock(blockId, {
            config: { ...config, [key]: value } as WorkoutConfig,
        });
    };

    const handleBatchConfigChange = (updates: Record<string, unknown>) => {
        updateBlock(blockId, {
            config: { ...config, ...updates } as WorkoutConfig,
        });
    };

    const handleFormatChange = (format: string) => {
        const normalizedFormat = normalizeMethodologyCode(format);
        // Find methodology and apply its default values
        const methodology = normalizedMethodologies.find(
            (m) => normalizeMethodologyCode(m.code) === normalizedFormat
        );
        if (methodology) {
            const newConfig = { ...config, ...methodology.default_values } as WorkoutConfig;
            updateBlock(blockId, { format: normalizedFormat as WorkoutFormat, config: newConfig });
        } else {
            updateBlock(blockId, { format: normalizedFormat as WorkoutFormat });
        }
    };

    // Category grouping for better display
    // NOTE: 'strength' (Classic) is excluded because it's its own block type, not a methodology
    // Category grouping with STRICT filtering based on block type
    // Category grouping with STRICT filtering based on block type
    const categoryOrder = ['metcon', 'hiit', 'strength', 'conditioning', 'finisher'];

    // Define allowed categories for each block type
    const allowedCategories: Record<string, string[]> = {
        'finisher': ['finisher'],
        'metcon_structured': ['metcon', 'hiit'],
        'conditioning': ['conditioning'],
        'strength_linear': ['strength'],
        'warmup': ['strength', 'metcon', 'conditioning', 'hiit'],
        'skill': ['strength'],
        'accessory': ['strength'],
    };

    const groupedMethodologies = categoryOrder.reduce((acc, cat) => {
        const blockType = block?.type || 'undefined';
        const allowed = allowedCategories[blockType];
        const isAllowed = !block?.type || (allowed && allowed.includes(cat));

        if (isAllowed) {
            let methods = normalizedMethodologies.filter(m => m.category === cat);
            // For warmup blocks, Classic = only Series x Reps (STANDARD)
            if (blockType === 'warmup' && cat === 'strength') {
                methods = methods.filter(m => m.code === 'STANDARD');
            }
            if (methods.length > 0) {
                acc[cat] = methods;
            }
        }
        return acc;
    }, {} as Record<string, TrainingMethodology[]>);

    const categoryLabels: Record<string, string> = {
        metcon: 'MetCon',
        hiit: 'HIIT',
        strength: 'Classic',
        conditioning: 'Acondicionamiento',
        finisher: 'Finishers'
    };

    const categoryIcons: Record<string, LucideIcon> = {
        metcon: Zap,
        hiit: Timer,
        strength: Dumbbell,
        conditioning: Heart,
        finisher: Target
    };

    // Navigation info - find current block position
    // Navigation info - find current block position
    const dayId = blockBuilderDayId || selectedDayId;
    let currentDay = null;
    let currentDayIndex = -1;
    let totalDays = 0;

    for (const meso of mesocycles) {
        const dayIndex = meso.days.findIndex(d => d.id === dayId);
        if (dayIndex !== -1) {
            currentDay = meso.days[dayIndex];
            currentDayIndex = dayIndex;
            totalDays = meso.days.filter(d => !d.is_rest_day).length;
            break;
        }
    }

    const sortedBlocks = currentDay ? [...currentDay.blocks].sort((a, b) => a.order_index - b.order_index) : [];
    const currentBlockIndex = sortedBlocks.findIndex(b => b.id === blockId);
    const totalBlocks = sortedBlocks.length;
    const hasPrevBlock = currentBlockIndex > 0;
    const hasNextBlock = currentBlockIndex < totalBlocks - 1;
    const hasPrevDay = currentDayIndex > 0;
    const hasNextDay = currentDayIndex < totalDays - 1;

    // Block type labels
    const blockTypeLabels: Record<string, string> = {
        warmup: 'Calentamiento',
        strength_linear: 'Classic',
        metcon_structured: 'MetCon',
        accessory: 'Accesorio',
        skill: 'Habilidad',
        free_text: 'Texto Libre',
        finisher: 'Finisher'
    };

    // Validation Logic - Using Hook
    // Cast block to any because the hook expects a specific shape that matches checks but Typescript might be strict about exact nullable types
    const { isValid, missingFields } = block ? validateBlock(block as any) : { isValid: false, missingFields: [] };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-cv-bg-secondary relative">
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">

                {/* 1. METHODOLOGY SELECTOR (For Structured types) - NOW FIRST */}
                {(block.type === 'metcon_structured' || block.type === 'warmup' || block.type === 'accessory' || block.type === 'skill' || block.type === 'finisher') && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-cv-text-secondary">
                                Metodología de Entrenamiento
                            </label>

                            {/* Progression Toggle - Not for warmup */}
                            {block.type !== 'warmup' && (
                                <ProgressionSettings
                                    blockId={blockId}
                                    progressionId={block.progression_id}
                                    showSelector={showProgressionSelector}
                                    setShowSelector={setShowProgressionSelector}
                                    onToggle={toggleBlockProgression}
                                    showDistance={false}
                                />
                            )}
                        </div>

                        {
                            loading ? (
                                <div className="flex items-center justify-center py-4">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cv-accent"></div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {isFinisherBlock ? (
                                        <div className="bg-slate-50 dark:bg-cv-bg-tertiary/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <div className="flex flex-wrap gap-2">
                                                {(groupedMethodologies.finisher || []).map(m => {
                                                    const IconComponent = iconMap[m.icon] || Dumbbell;
                                                    const isSelected = normalizeMethodologyCode(block?.format || '') === normalizeMethodologyCode(m.code);

                                                    return (
                                                        <button
                                                            key={m.code}
                                                            onClick={() => handleFormatChange(m.code)}
                                                            title={m.description}
                                                            className={`
                                                            px-3 py-2 rounded-lg text-xs font-medium transition-all
                                                            flex items-center gap-2 border flex-1 min-w-[120px] justify-center
                                                            ${isSelected
                                                                    ? 'bg-white dark:bg-cv-bg-primary text-cv-accent border-cv-accent shadow-md ring-1 ring-cv-accent/20 scale-[1.02]'
                                                                    : 'bg-white dark:bg-cv-bg-secondary text-cv-text-secondary hover:text-cv-accent hover:bg-slate-50 dark:hover:bg-cv-bg-primary border-slate-200 dark:border-slate-700 hover:border-cv-accent/30 hover:shadow-sm hover:-translate-y-0.5'
                                                                }
                                                        `}
                                                        >
                                                            <IconComponent size={14} />
                                                            {m.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Categories Tabs - Horizontal Row */}
                                            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                                {categoryOrder.map(category => {
                                                    const items = groupedMethodologies[category] || [];
                                                    if (items.length === 0) return null;

                                                    const isExpanded = expandedCategory === category;
                                                    const hasSelectedItem = items.some(
                                                        (m) => normalizeMethodologyCode(m.code) === normalizeMethodologyCode(block?.format || '')
                                                    );
                                                    const CategoryIcon = categoryIcons[category] || Dumbbell;

                                                    return (
                                                        <button
                                                            key={category}
                                                            onClick={() => {
                                                                setExpandedCategory(category);
                                                                // Auto-select if category has only 1 methodology
                                                                const catItems = groupedMethodologies[category] || [];
                                                                if (catItems.length === 1) {
                                                                    handleFormatChange(catItems[0].code);
                                                                }
                                                            }}
                                                            className={`
                                                            flex-1 justify-center items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap border flex
                                                            ${isExpanded
                                                                    ? 'bg-cv-accent text-white border-cv-accent shadow-md scale-105'
                                                                    : hasSelectedItem
                                                                        ? 'bg-cv-accent/10 text-cv-accent border-cv-accent/30 hover:bg-cv-accent/20 hover:shadow-sm hover:scale-105'
                                                                        : 'bg-white dark:bg-cv-bg-secondary text-cv-text-secondary border-slate-200 dark:border-slate-700 hover:border-cv-accent/50 hover:text-cv-accent hover:shadow-sm hover:scale-105'
                                                                }
                                                        `}
                                                        >
                                                            <CategoryIcon size={14} />
                                                            <span>{categoryLabels[category]}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Active Category Options - Only show if more than 1 option */}
                                            {expandedCategory && (groupedMethodologies[expandedCategory]?.length ?? 0) > 1 && (
                                                <div className="bg-slate-50 dark:bg-cv-bg-tertiary/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <div className="flex flex-wrap gap-2">
                                                        {(groupedMethodologies[expandedCategory] || []).map(m => {
                                                            const IconComponent = iconMap[m.icon] || Dumbbell;
                                                            const isSelected = normalizeMethodologyCode(block?.format || '') === normalizeMethodologyCode(m.code);

                                                            return (
                                                                <button
                                                                    key={m.code}
                                                                    onClick={() => handleFormatChange(m.code)}
                                                                    title={m.description}
                                                                    className={`
                                                                    px-3 py-2 rounded-lg text-xs font-medium transition-all
                                                                    flex items-center gap-2 border flex-1 min-w-[120px] justify-center
                                                                    ${isSelected
                                                                            ? 'bg-white dark:bg-cv-bg-primary text-cv-accent border-cv-accent shadow-md ring-1 ring-cv-accent/20 scale-[1.02]'
                                                                            : 'bg-white dark:bg-cv-bg-secondary text-cv-text-secondary hover:text-cv-accent hover:bg-slate-50 dark:hover:bg-cv-bg-primary border-slate-200 dark:border-slate-700 hover:border-cv-accent/30 hover:shadow-sm hover:-translate-y-0.5'
                                                                        }
                                                                `}
                                                                >
                                                                    <IconComponent size={14} />
                                                                    {m.name}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )
                        }

                        {/* Methodology Description */}
                        {
                            currentMethodology && block.type !== 'warmup' && (
                                <p className="mt-2 text-xs text-cv-text-tertiary italic">
                                    {currentMethodology.description}
                                </p>
                            )
                        }
                    </div >
                )
                }

                {/* 2. BLOCK NAME / EXERCISE INPUT */}
                {/* Logic: 
                    - For 'strength_linear' (Classic), keep the SmartExerciseInput (Search).
                    - For 'free_text', keep it simple (or label it differently).
                    - For MetCons/Structure, it should be a "Title" input, NOT a search, and arguably optional or auto-filled. 
                      User requested: "El nombre del ejercicio no tiene sentido que este arriba".
                      Let's make it a simple "Nombre del Bloque (Opcional)" input for MetCons.
                */}
                {/* 2. BLOCK NAME / EXERCISE INPUT (ONLY FOR STRENGTH) */}
                {
                    block.type === 'strength_linear' && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-cv-text-secondary">
                                    Ejercicio Principal
                                </label>

                                {/* Progression Toggle - Here for Strength blocks */}
                                <ProgressionSettings
                                    blockId={blockId}
                                    progressionId={block.progression_id}
                                    showSelector={showProgressionSelector}
                                    setShowSelector={setShowProgressionSelector}
                                    onToggle={toggleBlockProgression}
                                    showDistance={(() => {
                                        const ex = block.name ? searchLocal(block.name).find(e => e.name === block.name) : null;
                                        return ex?.tracking_parameters?.distance === true;
                                    })()}
                                />
                            </div>



                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <SmartExerciseInput
                                        value={block.name || ''}
                                        onChange={(val) => updateBlock(blockId, { name: val || null })}
                                        placeholder="Buscar ejercicio en la biblioteca..."
                                        className="cv-input"
                                        inputRef={firstInputRef}
                                    />
                                </div>
                                {block.name && searchLocal(block.name).find(e => e.name.toLowerCase() === block.name?.toLowerCase()) && (
                                    <button
                                        onClick={() => setShowEditExerciseModal(true)}
                                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors border border-slate-200"
                                        title="Editar detalles del ejercicio"
                                    >
                                        <div className="flex items-center gap-2">
                                            {/* We use a pencil icon, but let's reuse one from lucide if available or import it */}
                                            {/* Since we didn't import Pencil, using component approach or adding import */}
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                <path d="m15 5 4 4" />
                                            </svg>
                                        </div>
                                    </button>
                                )}
                            </div>

                            {/* Validation Warning */}
                            {block.name && block.name.trim().length > 0 && !searchLocal(block.name).find(e => e.name.toLowerCase() === block.name?.toLowerCase()) && (
                                <p className="text-xs text-amber-500 mt-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                                    <AlertCircle size={12} />
                                    <span>Selecciona un ejercicio válido de la lista para continuar</span>
                                </p>
                            )}

                            {/* Edit Modal */}
                            {block.name && (
                                <ExerciseEditModal
                                    isOpen={showEditExerciseModal}
                                    onClose={() => setShowEditExerciseModal(false)}
                                    exercise={searchLocal(block.name).find(e => e.name.toLowerCase() === block.name?.toLowerCase())}
                                    onSuccess={(updatedExercise) => {
                                        // Update block name if changed
                                        if (updatedExercise.name !== block.name) {
                                            updateBlock(blockId, { name: updatedExercise.name });
                                        }
                                        // Force UI refresh handled by cache hook, but key change might be good if needed
                                    }}
                                />
                            )}
                        </div>
                    )
                }

                {/* 3. SPECIALIZED EDITORS */}
                {
                    currentMethodology && (
                        <div className="animate-in fade-in duration-300">
                            {/* EMOM Editor */}
                            {(currentMethodologyCode === 'EMOM' || currentMethodologyCode === 'EMOM_ALT' || currentMethodologyCode === 'E2MOM') && (
                                <EmomEditor
                                    key={blockId}
                                    config={config as any}
                                    onChange={handleConfigChange}
                                    blockType={block.type}
                                />
                            )}

                            {/* AMRAP Editor */}
                            {currentMethodologyCode === 'AMRAP' && (
                                <CircuitEditor
                                    key={blockId}
                                    mode="AMRAP"
                                    config={config as any}
                                    onChange={handleConfigChange}
                                    onBatchChange={handleBatchConfigChange}
                                />
                            )}

                            {/* RFT / Rounds For Time */}
                            {currentMethodologyCode === 'RFT' && (
                                <CircuitEditor
                                    key={blockId}
                                    mode="RFT"
                                    config={config as any}
                                    onChange={handleConfigChange}
                                    onBatchChange={handleBatchConfigChange}
                                />
                            )}

                            {/* For Time */}
                            {currentMethodologyCode === 'FOR_TIME' && (
                                <CircuitEditor
                                    key={blockId}
                                    mode="FOR_TIME"
                                    config={config as any}
                                    onChange={handleConfigChange}
                                    onBatchChange={handleBatchConfigChange}
                                />
                            )}

                            {/* Chipper */}
                            {currentMethodologyCode === 'CHIPPER' && (
                                <CircuitEditor
                                    key={blockId}
                                    mode="CHIPPER"
                                    config={config as any}
                                    onChange={handleConfigChange}
                                    onBatchChange={handleBatchConfigChange}
                                />
                            )}

                            {/* Tabata */}
                            {currentMethodologyCode === 'TABATA' && (
                                <TabataEditor
                                    key={blockId}
                                    config={config as any}
                                    onChange={handleConfigChange}
                                />
                            )}

                            {/* Fallback to GenericMovementForm for Warmup/Accessory/Skill/Finisher with methodology */}
                            {['warmup', 'accessory', 'skill', 'finisher'].includes(block.type) && !isSpecializedMethod && (
                                <GenericMovementForm
                                    key={blockId}
                                    config={config}
                                    onChange={handleConfigChange}
                                    methodology={currentMethodology}
                                    blockType={block.type}
                                />
                            )}

                            {/* Fallback to Dynamic Form for others (Metcon) */}
                            {!['warmup', 'accessory', 'skill', 'finisher'].includes(block.type) && !isSpecializedMethod && (
                                <DynamicMethodologyForm
                                    key={blockId}
                                    methodology={currentMethodology}
                                    config={config}
                                    onChange={handleConfigChange}
                                    onBatchChange={handleBatchConfigChange}
                                />
                            )}
                        </div>
                    )
                }

                {/* 4. FALLBACK FORMS (No Methodology) */}
                {/* 4. FALLBACK FORMS (No Methodology) */}
                {
                    !currentMethodology && (
                        <>
                            {block.type === 'strength_linear' && (
                                <StrengthForm key={blockId} config={config} onChange={handleConfigChange} onBatchChange={handleBatchConfigChange} blockName={block.name} />
                            )}

                            {block.type === 'free_text' && (
                                <FreeTextForm key={blockId} config={config} onChange={handleConfigChange} />
                            )}

                            {(block.type === 'warmup' || block.type === 'accessory' || block.type === 'skill' || block.type === 'finisher') && !currentMethodology && (
                                <GenericMovementForm key={blockId} config={config} onChange={handleConfigChange} methodology={currentMethodology} blockType={block.type} />
                            )}

                            {/* CRITICAL UI FIX: Force user to select a methodology for MetCon */}
                            {block.type === 'metcon_structured' && (
                                <div className="p-6 text-center border-2 border-dashed border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/30 rounded-xl">
                                    <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                                    <h3 className="text-sm font-bold text-cv-text-primary mb-1">
                                        Selecciona un tipo de MetCon
                                    </h3>
                                    <p className="text-xs text-cv-text-secondary max-w-[200px] mx-auto">
                                        Debes elegir una metodología (EMOM, AMRAP, For Time, etc.) arriba para configurar este bloque.
                                    </p>
                                </div>
                            )}
                        </>
                    )
                }

                {/* 5. NOTES (Visible for all except Strength, which has it inline) */}
                {/* Se elimina dependencia de texto libre en bloques de estímulo:
                    la configuración clave debe vivir en inputs estructurados por modalidad. */}

                {/* 5.5. PROGRESSION PREVIEW - Show all weeks when progression is active */}
                {
                    block.progression_id && (
                        <ProgressionPreview
                            currentBlockId={blockId}
                            progressionId={block.progression_id}
                        />
                    )
                }

                {/* 6. DELETE BUTTON */}
                {/* 6. BOTTOM ACTIONS (DELETE + LISTO) */}
                <div className="flex items-center gap-3 pt-4 mt-auto border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => { deleteBlock(blockId); selectBlock(null); }}
                        className="flex-1 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-[1.02] flex items-center justify-center gap-2 text-sm font-medium"
                    >
                        <Trash2 size={16} />
                        Eliminar
                    </button>

                    <button
                        onClick={() => {
                            if (isValid) {
                                const newConfig = { ...block.config, is_completed: true };
                                updateBlock(blockId, { config: newConfig as WorkoutConfig });
                                selectBlock(null);
                            }
                        }}
                        disabled={!isValid}
                        className={`flex-1 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm font-bold shadow-sm border
                            ${isValid
                                ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02]'
                                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}`}
                    >
                        <Check size={16} className="stroke-[3]" />
                        LISTO
                    </button>
                </div>

                {/* Validation Errors Display */}
                {!isValid && missingFields.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg p-3 text-xs animate-in slide-in-from-bottom-2 fade-in">
                        <p className="font-semibold text-amber-600 mb-1 flex items-center gap-1.5">
                            <AlertCircle size={14} />
                            Faltan datos requeridos:
                        </p>
                        <ul className="list-disc pl-5 space-y-0.5 text-amber-700/80 dark:text-amber-500/80">
                            {missingFields.map((field, idx) => (
                                // eslint-disable-next-line react/no-array-index-key
                                <li key={idx}>{field}</li>
                            ))}
                        </ul>
                    </div>
                )}

            </div >
        </div >
    );
}

// ============================================
// DYNAMIC METHODOLOGY FORM
// ============================================
interface DynamicFormProps {
    methodology: TrainingMethodology;
    config: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
    onBatchChange?: (updates: Record<string, unknown>) => void;
}

function DynamicMethodologyForm({ methodology, config, onChange, onBatchChange }: DynamicFormProps) {
    const fields = methodology.form_config?.fields || [];

    // Group fields: Keep movements_list separate, group others
    const simpleFields = fields.filter(f => f.type !== 'movements_list');
    const complexFields = fields.filter(f => f.type === 'movements_list');

    return (
        <div className="space-y-3">
            {/* Compact row for simple inputs - Single horizontal line wrapping if needed */}
            {simpleFields.length > 0 && (
                <div className="flex flex-wrap gap-3 items-end">
                    {simpleFields.map((field: TrainingMethodologyFormField) => (
                        <div key={field.key}>
                            <DynamicField
                                field={field}
                                value={config[field.key]}
                                onChange={(value) => onChange(field.key, value)}
                                allConfig={config}
                                onConfigChange={onChange}
                                onBatchConfigChange={onBatchChange}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Full width for complex fields */}
            {complexFields.map((field: TrainingMethodologyFormField) => (
                <DynamicField
                    key={field.key}
                    field={field}
                    value={config[field.key]}
                    onChange={(value) => onChange(field.key, value)}
                />
            ))}
        </div>
    );
}

interface DynamicFieldProps {
    field: TrainingMethodologyFormField;
    value: unknown;
    onChange: (value: unknown) => void;
    // Optional props for advanced fields like Tempo that need context
    allConfig?: Record<string, unknown>;
    onConfigChange?: (key: string, value: unknown) => void;
    onBatchConfigChange?: (updates: Record<string, unknown>) => void;
}

function DynamicField({ field, value, onChange, allConfig, onConfigChange, onBatchConfigChange }: DynamicFieldProps) {
    if (field.type === 'movements_list') {
        return (
            <MovementsListField
                label={field.label}
                value={(value as string[]) || []}
                onChange={onChange}
                help={field.help}
            />
        );
    }

    if (field.type === 'select' && field.options) {
        return (
            <div>
                <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                    {field.label}
                </label>
                <select
                    value={(value as string) || (field.default as string) || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="cv-input"
                >
                    {field.options.map(opt => (
                        <option key={opt} value={opt}>{formatMethodologyOptionLabel(opt)}</option>
                    ))}
                </select>
                {field.help && (
                    <p className="text-xs text-cv-text-tertiary mt-1">{field.help}</p>
                )}
            </div>
        );
    }

    // Special handling for 'tempo' with toggle
    if (field.key === 'tempo') {
        const showTempo = allConfig?.show_tempo === true || (!!value && value !== '');

        const toggleTempo = () => {
            const newValue = !showTempo;
            if (!newValue && onBatchConfigChange) {
                // Batch update: turn off show_tempo AND clear tempo value
                onBatchConfigChange({
                    'show_tempo': false,
                    [field.key]: ''
                });
            } else if (onConfigChange) {
                onConfigChange('show_tempo', newValue);
                if (!newValue) {
                    onChange(''); // Fallback if no batch support (shouldn't happen with new code)
                }
            }
        };

        return (
            <div className="space-y-1">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${showTempo ? 'bg-white dark:bg-cv-bg-secondary border-slate-200 dark:border-slate-700' : 'border-dashed border-slate-300 dark:border-slate-600'}`}>
                    <button
                        onClick={toggleTempo}
                        type="button"
                        className={`w-8 h-4 rounded-full transition-colors relative focus:outline-none ${showTempo ? 'bg-cv-accent' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                        <span className={`block w-3 h-3 bg-white rounded-full transition-transform absolute top-0.5 left-0.5 ${showTempo ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-sm font-semibold whitespace-nowrap ${showTempo ? 'text-cv-text-primary' : 'text-cv-text-tertiary'}`}>{field.label}</span>
                    {showTempo && (
                        <input
                            type="text"
                            value={(value as string) || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="30X1"
                            className="bg-transparent border-none p-0 text-base focus:ring-0 text-cv-text-primary font-medium placeholder:text-slate-300 w-16 text-center animate-in fade-in duration-150"
                        />
                    )}
                </div>
                {field.help && (
                    <p className="text-[11px] text-cv-text-tertiary leading-snug max-w-[240px]">{field.help}</p>
                )}
            </div>
        );
    }

    if (field.type === 'number') {
        const displayValue = typeof value === 'string'
            ? parseInt(value.replace('%', ''))
            : value;

        return (
            <div className="space-y-1">
                <div className="flex items-center gap-2 bg-white dark:bg-cv-bg-secondary px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-semibold text-cv-text-primary whitespace-nowrap">{field.label}</span>
                    <input
                        type="number"
                        min={0}
                        value={(displayValue as number) || ''}
                        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : null)}
                        placeholder={field.placeholder ? field.placeholder.replace('%', '') : '0'}
                        className="bg-transparent border-none p-0 text-base focus:ring-0 text-cv-text-primary font-bold placeholder:text-slate-300 w-14 text-center"
                    />
                </div>
                {field.help && (
                    <p className="text-[11px] text-cv-text-tertiary leading-snug max-w-[240px]">{field.help}</p>
                )}
            </div>
        );
    }

    // Default: text input
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 bg-white dark:bg-cv-bg-secondary px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-sm font-semibold text-cv-text-primary whitespace-nowrap">{field.label}</span>
                <input
                    type="text"
                    value={(value as string) || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                    className="bg-transparent border-none p-0 text-base focus:ring-0 text-cv-text-primary font-medium placeholder:text-slate-300 w-16 text-center"
                />
            </div>
            {field.help && (
                <p className="text-[11px] text-cv-text-tertiary leading-snug max-w-[240px]">{field.help}</p>
            )}
        </div>
    );
}

// -------------------------------------------------------------
// Force sync for this change
// -------------------------------------------------------------

// ============================================
// MOVEMENTS LIST FIELD
// ============================================
interface MovementsListProps {
    label: string;
    value: unknown[];
    onChange: (value: string[]) => void;
    help?: string;
}

function MovementsListField({ label, value, onChange, help }: MovementsListProps) {
    const toMovementText = (entry: unknown): string => {
        if (typeof entry === 'string') return entry;
        if (!entry || typeof entry !== 'object') return '';

        const record = entry as Record<string, unknown>;
        const candidates = [record.name, record.exercise, record.movement];
        for (const candidate of candidates) {
            if (typeof candidate === 'string') return candidate;
            if (candidate && typeof candidate === 'object') {
                const nested = toMovementText(candidate);
                if (nested) return nested;
            }
        }
        return '';
    };

    const movements = Array.isArray(value) ? value.map(toMovementText) : [];

    const addMovement = () => {
        onChange([...movements, '']);
    };

    const updateMovement = (index: number, val: string) => {
        const updated = [...movements];
        updated[index] = val;
        onChange(updated);
    };

    const removeMovement = (index: number) => {
        onChange(movements.filter((_, i) => i !== index));
    };

    return (
        <div>
            <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                {label}
            </label>
            {help && (
                <p className="text-xs text-cv-text-tertiary mb-2">{help}</p>
            )}
            <div className="space-y-2">
                {movements.map((movement, index) => (
                    <div key={index} className="flex gap-2">
                        <div className="flex-1">
                            <SmartExerciseInput
                                value={movement}
                                onChange={(val) => updateMovement(index, val)}
                                placeholder={`Movimiento ${index + 1} (ej: 10 Burpees)`}
                                className="cv-input"
                            />
                        </div>
                        <button
                            onClick={() => removeMovement(index)}
                            className="cv-btn-ghost text-red-400 p-2"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                <button
                    onClick={addMovement}
                    className="w-full py-2 border border-dashed border-cv-border rounded-lg text-cv-text-tertiary hover:text-cv-text-primary hover:border-cv-text-tertiary transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={14} />
                    Añadir Movimiento
                </button>
            </div>
        </div>
    );
}

// ============================================
// STRENGTH FORM (Redesigned)
// ============================================
interface FormProps {
    config: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
    onBatchChange?: (updates: Record<string, unknown>) => void;
    blockName?: string | null;
}

function StrengthForm({ config, onChange, onBatchChange, blockName }: FormProps) {
    const showTempo = config.show_tempo === true || (!!config.tempo && config.tempo !== '');

    // Check if current exercise needs distance
    const { searchLocal } = useExerciseCache();
    const exercise = blockName ? searchLocal(blockName).find(e => e.name === blockName) : null;
    const showDistance = exercise?.tracking_parameters?.distance === true;
    const showSets = exercise?.tracking_parameters?.sets !== false;

    // Toggles
    const [intensityType, setIntensityType] = useState<'% 1RM' | 'RPE' | 'Weight'>((config.rpe && !config.percentage ? 'RPE' : '% 1RM'));
    const [showBreakdown, setShowBreakdown] = useState(false);

    // Update intensity type if config changes externally (or checking initial state more robustly)
    useEffect(() => {
        if (config.percentage) setIntensityType('% 1RM');
        else if (config.rpe) setIntensityType('RPE');
    }, [config.percentage, config.rpe]);

    // Initialize defaults to middle values


    // RM Calculation Setup
    const { getBenchmark } = useAthleteBenchmarks();
    const calculatedWeight = (intensityType === '% 1RM' && config.percentage && blockName)
        ? (() => {
            const rm = getBenchmark(blockName);
            if (!rm) return null;
            let pct = 0;
            if (typeof config.percentage === 'number') pct = config.percentage;
            else if (typeof config.percentage === 'string') pct = parseInt(config.percentage.replace('%', ''), 10);

            if (isNaN(pct) || pct <= 0) return null;
            return Math.round((rm * pct) / 100);
        })()
        : null;

    // Series Details Logic
    const setsCount = parseInt(config.sets as string) || 4; // Default to 4 for display if not set yet
    const seriesDetails = (config.series_details as SeriesDetail[]) || [];

    // Initialize/Sync series details when sets change or global values change
    // We want to persist existing details if they exist, but resize array if sets change.
    // However, actively syncing EVERY global change to details might be aggressive if user wants custom.
    // Strategy: 
    // - On render/breakdown toggle: ensure array length matches sets.
    // - On Global Change: Update ALL series details to match global.

    // Helper to get series detail or default
    const getSeriesDetail = (index: number): SeriesDetail => {
        const detail = seriesDetails[index] || {};
        return {
            reps: detail.reps !== undefined ? detail.reps : config.reps as string | number,
            distance: detail.distance !== undefined ? detail.distance : config.distance as string,
            percentage: detail.percentage !== undefined ? detail.percentage : config.percentage as number,
            rpe: detail.rpe !== undefined ? detail.rpe : config.rpe as number,
            weight: detail.weight !== undefined ? detail.weight : config.weight as string,
            rest: detail.rest !== undefined ? detail.rest : config.rest as string,
            time: detail.time !== undefined ? detail.time : '',
        };
    };

    const updateSeriesDetail = (index: number, updates: Partial<SeriesDetail>) => {
        const newDetails = [...seriesDetails];
        // Ensure array is filled up to index
        for (let i = 0; i <= index; i++) {
            if (!newDetails[i]) newDetails[i] = getSeriesDetail(i);
        }
        newDetails[index] = { ...newDetails[index], ...updates };
        onChange('series_details', newDetails);
    };

    const handleGlobalChange = (key: string, value: unknown) => {
        // Update global config
        onChange(key, value);

        // If breakdown is active (or data exists), we might want to sync globals to all rows?
        // User Rule: "Default to global, but allow breakdown".
        // Typical behavior: Changing global overwrites ALL specifics? Or only those that matched before?
        // Let's go with: Changing global overwrites ALL specifics to keep it simple and consistent ("Reset to Global").
        // We will do this by CLEARING the specific overrides for that key in series_details? 
        // Or strictly updating them.

        // Actually, if we just update global 'config', the `getSeriesDetail` function falls back to global value 
        // IF the specific value is undefined. 
        // So clearing the specific key in `series_details` effectively resets it to global.

        if (seriesDetails.length > 0) {
            const newDetails = seriesDetails.map(d => {
                const dCopy = { ...d };
                // Remove the specific key so it falls back to global
                // keys mapping:
                if (key === 'reps') delete dCopy.reps;
                if (key === 'distance') delete dCopy.distance;
                if (key === 'percentage') delete dCopy.percentage;
                if (key === 'rpe') delete dCopy.rpe;
                if (key === 'rest') delete dCopy.rest;
                return dCopy;
            });
            // We prefer 'onBatchChange' if available to do it atomically, but onChange is single key.
            // We can't easily dual-update via `onChange`.
            // So for now, we accept that Global update might leave old specific values if we don't clear them.
            // BUT, to keep it "Minimalist", let's say: Global is Global. 
            // If user wants to edit specific, they use breakdown.
            // If they touch Global, it's a "Reset All" for that attribute.

            // To implement "Reset All" for that attribute, we'd need to write 'series_details' too.
            // Since we can't do two `onChange` calls reliably without batch, we'll try:
            if (key === 'sets') {
                // Resize logic is handled by the consumer (us) resizing rendering. 
                // Actual array resizing happens when we write back to series_details.
                // We don't strictly need to resize the DB array immediately.
            } else {
                // Update series_details to remove the overrides
                onChange('series_details', newDetails);
            }
        }
    };

    const toggleTempo = () => {
        const newValue = !showTempo;
        if (!newValue && onBatchChange) {
            onBatchChange({
                'show_tempo': false,
                'tempo': ''
            });
        } else {
            onChange('show_tempo', newValue);
            if (!newValue) {
                onChange('tempo', ''); // Clear tempo if hidden (fallback)
            }
        }
    };

    return (
        <div className="animate-in fade-in duration-300 space-y-4">

            {/* MAIN GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                {/* 1. SERIES */}
                {showSets && (
                    <InputCard
                        label="SERIES"
                        value={config.sets as string | number}
                        onChange={(val) => handleGlobalChange('sets', val)}
                        type="number"
                        icon={Layers}
                        presets={[3, 4, 5]}
                        isInvalid={!config.sets}
                        headerAction={
                            <button
                                onClick={() => setShowBreakdown(!showBreakdown)}
                                className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${showBreakdown
                                    ? 'bg-cv-accent text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-cv-text-tertiary hover:text-cv-accent'
                                    }`}
                            >
                                <span>DESGLOSAR</span>
                                {showBreakdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                        }
                    />
                )}

                {/* 2. REPS / DISTANCE */}
                {showDistance ? (
                    <InputCard
                        label="DISTANCIA"
                        subLabel={exercise?.name || 'Ejercicio'}
                        value={config.distance as string}
                        onChange={(val) => handleGlobalChange('distance', val)}
                        type="text"
                        icon={Activity}
                        presets={['200m', '400m', '800m']}
                        placeholder="400m"
                        isDistance
                        isInvalid={!config.distance}
                    />
                ) : (
                    <InputCard
                        label="REPETICIONES"
                        value={config.reps as string | number}
                        onChange={(val) => handleGlobalChange('reps', val)}
                        type="number" // Strictly numbers
                        icon={Repeat}
                        presets={[8, 10, 12]}
                        placeholder="10"
                        isInvalid={!config.reps}
                    />
                )}

                {/* 3. INTENSITY */}
                <InputCard
                    label={intensityType}
                    value={(intensityType === '% 1RM' ? config.percentage : config.rpe) as string | number}
                    onChange={(val) => {
                        if (intensityType === '% 1RM') handleGlobalChange('percentage', val);
                        else handleGlobalChange('rpe', val);
                    }}
                    type="number"
                    icon={intensityType === '% 1RM' ? Percent : Flame}
                    presets={intensityType === '% 1RM' ? [70, 75, 80] : [8, 9, 10]}
                    isInvalid={intensityType === '% 1RM' ? !config.percentage : !config.rpe}
                    headerAction={
                        <button
                            onClick={() => setIntensityType(prev => prev === '% 1RM' ? 'RPE' : '% 1RM')}
                            className="text-xs font-semibold text-cv-accent hover:text-cv-accent/80 transition-colors"
                        >
                            {intensityType === '% 1RM' ? 'Usar RPE' : 'Usar %'}
                        </button>
                    }
                    badge={calculatedWeight ? `≈ ${calculatedWeight} kg` : undefined}
                />

                {/* 4. DESCANSO */}
                <InputCard
                    label="DESCANSO"
                    value={config.rest as string}
                    onChange={(val) => handleGlobalChange('rest', val)}
                    type="time" // strictly time format MM:SS
                    icon={Clock}
                    presets={['1:30', '2:00', '3:00']}
                    placeholder="00:00"
                    isInvalid={!config.rest}
                />

            </div>

            {/* BREAKDOWN PANEL */}
            {showBreakdown && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 p-2 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-cv-text-tertiary uppercase tracking-wider text-center">
                        <div className="w-8">#</div>
                        <div>{showDistance ? 'DISTANCIA' : 'REPS'}</div>
                        <div>INTENSIDAD</div>
                        <div>DESCANSO</div>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {Array.from({ length: setsCount }).map((_, i) => {
                            const detail = getSeriesDetail(i);
                            return (
                                <div key={i} className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 p-2 items-center hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                    <div className="w-8 text-center font-bold text-cv-text-secondary text-sm">{i + 1}</div>

                                    {/* Reps/Distance */}
                                    <TableInputWithPresets
                                        type="text"
                                        value={showDistance ? (detail.distance || '') : (detail.reps || '')}
                                        onChange={(val) => updateSeriesDetail(i, showDistance ? { distance: val } : { reps: val })}
                                        presets={showDistance ? ['200m', '400m', '800m'] : [5, 8, 10, 12]}
                                        placeholder="-"
                                    />

                                    {/* Intensity */}
                                    <div className="flex justify-center w-full">
                                        {intensityType === '% 1RM' ? (
                                            <TableInputWithPresets
                                                value={detail.percentage || ''}
                                                onChange={(val) => updateSeriesDetail(i, { percentage: parseInt(val) || 0 })}
                                                presets={[70, 75, 80, 85]}
                                                placeholder="-"
                                                suffix={<span className="text-[10px] text-slate-400">%</span>}
                                            />
                                        ) : (
                                            <TableInputWithPresets
                                                value={detail.rpe || ''}
                                                onChange={(val) => updateSeriesDetail(i, { rpe: parseInt(val) || 0 })}
                                                presets={[7, 8, 9, 10]}
                                                placeholder="-"
                                                suffix={<span className="text-[10px] text-slate-400">RPE</span>}
                                            />
                                        )}
                                    </div>

                                    {/* Rest */}
                                    <TableInputWithPresets
                                        type="text"
                                        value={detail.rest || ''}
                                        onChange={(val) => updateSeriesDetail(i, { rest: val })}
                                        presets={['1:30', '2:00', '3:00']}
                                        placeholder="-"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}


            {/* SECONDARY ROW: TEMPO & NOTES */}
            <div className="flex flex-wrap gap-4 items-stretch">
                {/* Tempo Group */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTempo}
                        className={`h-full flex items-center gap-2 px-3 pl-4 rounded-xl border transition-all ${showTempo
                            ? 'bg-cv-accent/10 border-cv-accent text-cv-accent'
                            : 'bg-white dark:bg-cv-bg-secondary border-slate-200 dark:border-slate-700 text-cv-text-secondary hover:border-cv-accent/50'
                            }`}
                        title="Activar configuración de Tempo"
                    >
                        <Timer size={16} />
                        <span className="text-sm font-semibold">Tempo</span>
                        {showTempo && <span className="text-[10px] ml-0.5 bg-white/60 dark:bg-black/20 px-1.5 py-0.5 rounded font-bold">ON</span>}
                    </button>

                    {showTempo && (
                        <div className="w-[80px] h-full bg-white dark:bg-cv-bg-secondary px-1 py-1 rounded-xl border border-cv-accent flex flex-col justify-center animate-in fade-in slide-in-from-left-2">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-cv-accent text-center leading-none mb-0.5">Tempo</span>
                            <input
                                type="text"
                                value={(config.tempo as string) || ''}
                                onChange={(e) => onChange('tempo', e.target.value)}
                                placeholder="30X1"
                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-cv-text-primary placeholder:text-slate-300 focus:ring-0 text-center leading-none"
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                {/* Notes Input - Takes remaining space */}
                <div className="flex-1 min-w-[140px] relative group h-11">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cv-accent transition-colors pointer-events-none flex items-center justify-center">
                        <FileText size={18} strokeWidth={2} />
                    </div>
                    <input
                        type="text"
                        value={(config.notes as string) || ''}
                        onChange={(e) => onChange('notes', e.target.value)}
                        placeholder="Notas técnicas (opcional)..."
                        className="w-full h-full pl-[34px] pr-3 bg-white dark:bg-cv-bg-secondary border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-cv-text-primary placeholder:text-slate-400 focus:ring-0 focus:border-cv-accent focus:ring-1 focus:ring-cv-accent/20 transition-all m-0"
                    />
                </div>
            </div>

        </div>
    );
}



// ============================================
// FREE TEXT FORM
// ============================================
function FreeTextForm({ config, onChange }: FormProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                Contenido
            </label>
            <textarea
                value={(config.content as string) || ''}
                onChange={(e) => onChange('content', e.target.value)}
                placeholder="Enter any freeform workout or notes..."
                className="cv-input min-h-[200px] resize-none text-sm"
            />
        </div>
    );
}



interface ProgressionSettingsProps {
    blockId: string;
    progressionId?: string | null;
    showSelector: boolean;
    setShowSelector: (show: boolean) => void;
    onToggle: (blockId: string, active: boolean, variable?: any) => void;
    showDistance?: boolean;
}

function ProgressionSettings({ blockId, progressionId, showSelector, setShowSelector, onToggle, showDistance = false }: ProgressionSettingsProps) {
    return (
        <div className="flex items-center gap-3 relative">
            <label className="flex items-center gap-2 cursor-pointer group select-none">
                <span className={`text-xs font-semibold transition-colors ${progressionId ? 'text-cv-accent' : 'text-cv-text-tertiary group-hover:text-cv-text-secondary'}`}>
                    Progresión
                </span>
                <div className="relative w-8 h-4">
                    <input
                        type="checkbox"
                        className="sr-only"
                        checked={Boolean(progressionId)}
                        onChange={(e) => {
                            if (e.target.checked) {
                                setShowSelector(true);
                            } else {
                                onToggle(blockId, false);
                            }
                        }}
                    />
                    <div className={`w-8 h-4 rounded-full transition-colors ${progressionId ? 'bg-cv-accent' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                    <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform ${progressionId ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
            </label>
            {progressionId && (
                <div className="text-cv-accent animate-in fade-in zoom-in duration-200" title="Progresión activa">
                    <Link size={14} />
                </div>
            )}

            {/* Progression Variable Selector */}
            {showSelector && (
                <div className="absolute top-8 right-0 z-50 w-64 p-3 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">

                    {/* VELOCIDAD Y POTENCIA / FUERZA Section */}
                    <div className="mb-3">
                        <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">{showDistance ? 'Velocidad y Potencia' : 'Fuerza'}</span>
                            <div className="flex-1 h-px bg-orange-200 dark:bg-orange-900/50"></div>
                        </div>
                        <button
                            onClick={() => {
                                onToggle(blockId, true, 'percentage');
                                setShowSelector(false);
                            }}
                            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-transparent hover:border-orange-200 dark:hover:border-orange-800 flex items-center gap-3 transition-all group"
                        >
                            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                                <Percent size={18} strokeWidth={2.5} />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-slate-800 dark:text-white">% 1RM</div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">Intensidad progresiva</div>
                            </div>
                        </button>
                    </div>

                    {/* DISTANCIA Section - Only for distance exercises */}
                    {showDistance && (
                        <div className="mb-3">
                            <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Distancia</span>
                                <div className="flex-1 h-px bg-blue-200 dark:bg-blue-900/50"></div>
                            </div>
                            <button
                                onClick={() => {
                                    onToggle(blockId, true, 'distance');
                                    setShowSelector(false);
                                }}
                                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 flex items-center gap-3 transition-all group"
                            >
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                                    <Route size={18} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-slate-800 dark:text-white">Distancia</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Más metros por semana</div>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* VOLUMEN Section */}
                    <div>
                        <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Volumen</span>
                            <div className="flex-1 h-px bg-emerald-200 dark:bg-emerald-900/50"></div>
                        </div>
                        <div className="space-y-1">
                            {[
                                { id: 'sets', label: 'Series', sub: 'Más sets por semana', icon: Layers },
                                { id: 'reps', label: 'Repeticiones', sub: 'Más reps por serie', icon: Repeat },
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        onToggle(blockId, true, opt.id as any);
                                        setShowSelector(false);
                                    }}
                                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 flex items-center gap-3 transition-all group"
                                >
                                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                                        <opt.icon size={18} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-800 dark:text-white">{opt.label}</div>
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{opt.sub}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => setShowSelector(false)}
                        className="mt-3 w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-center py-1.5 border-t border-slate-100 dark:border-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            )}
        </div>
    );
}
