'use client';

import { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '@/lib/store';
import { useExerciseCache } from '@/hooks/useExerciseCache';
import { SmartExerciseInput } from './SmartExerciseInput';
import { EmomEditor } from './methodologies/EmomEditor';
import { CircuitEditor } from './methodologies/AmrapEditor';
import { TabataEditor } from './methodologies/TabataEditor';
import { ProgressionPreview } from './ProgressionPreview';
import { getTrainingMethodologies } from '@/lib/actions';
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
    Percent, // Nuevo icono para % 1RM
    HelpCircle,
    Check,
    Link
} from 'lucide-react';
import type { BlockType, WorkoutFormat, WorkoutConfig, TrainingMethodology, TrainingMethodologyFormField } from '@/lib/supabase/types';
import type { LucideIcon } from 'lucide-react';

interface BlockEditorProps {
    blockId: string;
    autoFocusFirst?: boolean;
}

// Icon mapping for methodology icons
const iconMap: Record<string, LucideIcon> = {
    Clock, Timer, Flame, Zap, Dumbbell, Activity, TrendingUp, TrendingDown,
    Heart, Layers, RefreshCw, Skull, ListOrdered, Puzzle, Repeat,
    Repeat2: Repeat, HelpCircle
};

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
    const firstInputRef = useRef<HTMLInputElement>(null);

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
        : trainingMethodologies.find(m => m.code === block?.format);

    // Auto-expand category of current methodology (must be before any return)
    useEffect(() => {
        if (currentMethodology && !expandedCategory) {
            setExpandedCategory(currentMethodology.category);
        }
    }, [currentMethodology, expandedCategory]);

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

    const handleFormatChange = (format: string) => {
        // Find methodology and apply its default values
        const methodology = trainingMethodologies.find(m => m.code === format);
        if (methodology) {
            const newConfig = { ...config, ...methodology.default_values } as WorkoutConfig;
            updateBlock(blockId, { format: format as WorkoutFormat, config: newConfig });
        } else {
            updateBlock(blockId, { format: format as WorkoutFormat });
        }
    };

    // Category grouping for better display
    // NOTE: 'strength' (Classic) is excluded because it's its own block type, not a methodology
    const categoryOrder = ['metcon', 'hiit', 'conditioning'];
    const groupedMethodologies = categoryOrder.reduce((acc, cat) => {
        acc[cat] = trainingMethodologies.filter(m => m.category === cat);
        return acc;
    }, {} as Record<string, TrainingMethodology[]>);

    const categoryLabels: Record<string, string> = {
        metcon: 'MetCon',
        hiit: 'HIIT',
        strength: 'Classic',
        conditioning: 'Acondicionamiento'
    };

    const categoryIcons: Record<string, LucideIcon> = {
        metcon: Zap,
        hiit: Timer,
        strength: Dumbbell,
        conditioning: Heart
    };

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
        free_text: 'Texto Libre'
    };

    // Validation Logic - Simplified: just need a name (or content for free_text)
    const validateBlock = (): boolean => {
        if (!block) return false;

        // For free_text, require content
        if (block.type === 'free_text') {
            const config = block.config || {};
            return Boolean(config.content);
        }

        // For Strength (Classic), require a name (Exercise)
        if (block.type === 'strength_linear') {
            return Boolean(block.name && block.name.trim().length > 0);
        }

        // For structured blocks (Metcon, Warmup, etc), require a methodology (format)
        // The block name is optional/hidden for these types.
        if (['metcon_structured', 'warmup', 'accessory', 'skill'].includes(block.type)) {
            return Boolean(block.format);
        }

        // Default fallback
        return true;
    };

    const isValid = validateBlock();

    return (
        <div className="flex flex-col h-full bg-white dark:bg-cv-bg-secondary">
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">

                {/* 1. METHODOLOGY SELECTOR (For Structured types) - NOW FIRST */}
                {(block.type === 'metcon_structured' || block.type === 'warmup' || block.type === 'accessory' || block.type === 'skill') && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-cv-text-secondary">
                                Metodología de Entrenamiento
                            </label>

                            {/* Progression Toggle - Now here for structured blocks */}
                            <ProgressionSettings
                                blockId={blockId}
                                progressionId={block.progression_id}
                                showSelector={showProgressionSelector}
                                setShowSelector={setShowProgressionSelector}
                                onToggle={toggleBlockProgression}
                            />
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cv-accent"></div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Categories Tabs - Horizontal Row */}
                                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                    {categoryOrder.map(category => {
                                        const items = groupedMethodologies[category] || [];
                                        if (items.length === 0) return null;

                                        const isExpanded = expandedCategory === category;
                                        const hasSelectedItem = items.some(m => m.code === block?.format);
                                        const CategoryIcon = categoryIcons[category] || Dumbbell;

                                        return (
                                            <button
                                                key={category}
                                                onClick={() => setExpandedCategory(category)}
                                                className={`
                                                    flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap border
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

                                {/* Active Category Options */}
                                {expandedCategory && (
                                    <div className="bg-slate-50 dark:bg-cv-bg-tertiary/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="flex flex-wrap gap-2">
                                            {(groupedMethodologies[expandedCategory] || []).map(m => {
                                                const IconComponent = iconMap[m.icon] || Dumbbell;
                                                const isSelected = block?.format === m.code;

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
                            </div>
                        )}

                        {/* Methodology Description */}
                        {currentMethodology && (
                            <p className="mt-2 text-xs text-cv-text-tertiary italic">
                                {currentMethodology.description}
                            </p>
                        )}
                    </div>
                )}

                {/* 2. BLOCK NAME / EXERCISE INPUT */}
                {/* Logic: 
                    - For 'strength_linear' (Classic), keep the SmartExerciseInput (Search).
                    - For 'free_text', keep it simple (or label it differently).
                    - For MetCons/Structure, it should be a "Title" input, NOT a search, and arguably optional or auto-filled. 
                      User requested: "El nombre del ejercicio no tiene sentido que este arriba".
                      Let's make it a simple "Nombre del Bloque (Opcional)" input for MetCons.
                */}
                {/* 2. BLOCK NAME / EXERCISE INPUT (ONLY FOR STRENGTH) */}
                {block.type === 'strength_linear' && (
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
                            />
                        </div>

                        <SmartExerciseInput
                            value={block.name || ''}
                            onChange={(val) => updateBlock(blockId, { name: val || null })}
                            placeholder="Buscar ejercicio en la biblioteca..."
                            className="cv-input"
                            inputRef={firstInputRef}
                        />
                    </div>
                )}

                {/* 3. SPECIALIZED EDITORS */}
                {currentMethodology && (
                    <div className="animate-in fade-in duration-300">
                        {/* EMOM Editor */}
                        {currentMethodology.code === 'EMOM' && (
                            <EmomEditor
                                config={config}
                                onChange={handleConfigChange}
                            />
                        )}

                        {/* AMRAP Editor */}
                        {currentMethodology.code === 'AMRAP' && (
                            <CircuitEditor
                                mode="AMRAP"
                                config={config}
                                onChange={handleConfigChange}
                            />
                        )}

                        {/* RFT / Rounds For Time */}
                        {(currentMethodology.code === 'RFT' || currentMethodology.code === 'For Time') && (
                            <CircuitEditor
                                mode="RFT"
                                config={config}
                                onChange={handleConfigChange}
                            />
                        )}

                        {/* Chipper */}
                        {currentMethodology.code === 'Chipper' && (
                            <CircuitEditor
                                mode="CHIPPER"
                                config={config}
                                onChange={handleConfigChange}
                            />
                        )}

                        {/* Tabata */}
                        {currentMethodology.code === 'Tabata' && (
                            <TabataEditor
                                config={config}
                                onChange={handleConfigChange}
                            />
                        )}

                        {/* Fallback to Dynamic Form for others (or if specialized is not covered) */}
                        {!['EMOM', 'AMRAP', 'RFT', 'For Time', 'Chipper', 'Tabata'].includes(currentMethodology.code) && (
                            <DynamicMethodologyForm
                                methodology={currentMethodology}
                                config={config}
                                onChange={handleConfigChange}
                            />
                        )}
                    </div>
                )}

                {/* 4. FALLBACK FORMS (No Methodology) */}
                {!currentMethodology && (
                    <>
                        {block.type === 'strength_linear' && (
                            <StrengthForm config={config} onChange={handleConfigChange} blockName={block.name} />
                        )}

                        {block.type === 'free_text' && (
                            <FreeTextForm config={config} onChange={handleConfigChange} />
                        )}

                        {(block.type === 'warmup' || block.type === 'accessory' || block.type === 'skill') && !block.format && (
                            <GenericMovementForm config={config} onChange={handleConfigChange} />
                        )}
                    </>
                )}

                {/* 5. NOTES (Always visible) */}
                <div>
                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                        Notas
                    </label>
                    <textarea
                        value={(config.notes as string) || ''}
                        onChange={(e) => handleConfigChange('notes', e.target.value)}
                        placeholder="Focus on quality, tempo, etc."
                        className="cv-input min-h-[60px] resize-none"
                    />
                </div>

                {/* 5.5. PROGRESSION PREVIEW - Show all weeks when progression is active */}
                {(() => {
                    console.log('[DEBUG_PROG] BlockEditor Render Preview?', {
                        id: block.id,
                        progId: block.progression_id,
                        hasProgId: Boolean(block.progression_id)
                    });
                    return block.progression_id;
                })() && (
                        <ProgressionPreview
                            currentBlockId={blockId}
                            progressionId={block.progression_id as string}
                        />
                    )}

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

            </div>
        </div>
    );
}

// ============================================
// DYNAMIC METHODOLOGY FORM
// ============================================
interface DynamicFormProps {
    methodology: TrainingMethodology;
    config: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
}

function DynamicMethodologyForm({ methodology, config, onChange }: DynamicFormProps) {
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
}

function DynamicField({ field, value, onChange, allConfig, onConfigChange }: DynamicFieldProps) {
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
                        <option key={opt} value={opt}>{opt}</option>
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
            if (onConfigChange) {
                const newValue = !showTempo;
                onConfigChange('show_tempo', newValue);
                if (!newValue) {
                    onChange(''); // Clear value
                }
            }
        };

        return (
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
        );
    }

    if (field.type === 'number' || (field.label && field.label.includes('%')) || field.key === 'percentage') {
        const displayValue = typeof value === 'string'
            ? parseInt(value.replace('%', ''))
            : value;

        return (
            <div className="flex items-center gap-2 bg-white dark:bg-cv-bg-secondary px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-sm font-semibold text-cv-text-primary whitespace-nowrap">{field.label}</span>
                <input
                    type="number"
                    min={0}
                    value={(displayValue as number) || ''}
                    onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder={field.placeholder ? field.placeholder.replace('%', '') : '0'}
                    className="bg-transparent border-none p-0 text-base focus:ring-0 text-cv-text-primary font-bold placeholder:text-slate-300 w-14 text-center"
                />
            </div>
        );
    }

    // Default: text input
    return (
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
    value: string[];
    onChange: (value: string[]) => void;
    help?: string;
}

function MovementsListField({ label, value, onChange, help }: MovementsListProps) {
    const movements = value || [];

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
    blockName?: string | null;
}

function StrengthForm({ config, onChange, blockName }: FormProps) {
    const showTempo = config.show_tempo === true || (!!config.tempo && config.tempo !== '');

    // Check if current exercise needs distance
    const { searchLocal } = useExerciseCache();
    const exercise = blockName ? searchLocal(blockName).find(e => e.name === blockName) : null;
    const showDistance = exercise?.tracking_parameters?.distance === true;

    // Toggles
    const [intensityType, setIntensityType] = useState<'% 1RM' | 'RPE' | 'Weight'>((config.percentage ? '% 1RM' : config.rpe ? 'RPE' : 'Weight'));

    // Update intensity type if config changes externally (or checking initial state more robustly)
    useEffect(() => {
        if (config.percentage) setIntensityType('% 1RM');
        else if (config.rpe) setIntensityType('RPE');
    }, [config.percentage, config.rpe]);


    const toggleTempo = () => {
        const newValue = !showTempo;
        onChange('show_tempo', newValue);
        if (!newValue) {
            onChange('tempo', ''); // Clear tempo if hidden
        }
    };

    return (
        <div className="animate-in fade-in duration-300 space-y-4">

            {/* MAIN GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                {/* 1. SERIES */}
                <InputCard
                    label="SERIES"
                    value={config.sets as string | number}
                    onChange={(val) => onChange('sets', val)}
                    type="number"
                    icon={Layers}
                    presets={[3, 4, 5]}
                />

                {/* 2. REPS / DISTANCE */}
                {showDistance ? (
                    <InputCard
                        label="DISTANCIA"
                        subLabel={exercise?.name || 'Ejercicio'}
                        value={config.distance as string}
                        onChange={(val) => onChange('distance', val)}
                        type="text"
                        icon={Activity}
                        presets={['200m', '400m', '800m', '1k']}
                        placeholder="400m"
                        isDistance
                    />
                ) : (
                    <InputCard
                        label="REPETICIONES"
                        value={config.reps as string}
                        onChange={(val) => onChange('reps', val)}
                        type="number-text" // Allow ranges like 5-8
                        icon={Repeat}
                        presets={[5, 8, 10, 12, 15]}
                        placeholder="10"
                    />
                )}

                {/* 3. INTENSITY */}
                <InputCard
                    label={intensityType}
                    value={(intensityType === '% 1RM' ? config.percentage : config.rpe) as string | number}
                    onChange={(val) => {
                        if (intensityType === '% 1RM') onChange('percentage', val);
                        else onChange('rpe', val);
                    }}
                    type="number"
                    icon={intensityType === '% 1RM' ? Percent : Flame}
                    presets={intensityType === '% 1RM' ? [60, 70, 75, 80] : [7, 8, 9, 10]}
                    headerAction={
                        <button
                            onClick={() => setIntensityType(prev => prev === '% 1RM' ? 'RPE' : '% 1RM')}
                            className="text-xs font-semibold text-cv-accent hover:text-cv-accent/80 transition-colors"
                        >
                            {intensityType === '% 1RM' ? 'Usar RPE' : 'Usar %'}
                        </button>
                    }
                />

                {/* 4. DESCANSO */}
                <InputCard
                    label="DESCANSO"
                    value={config.rest as string}
                    onChange={(val) => onChange('rest', val)}
                    type="text"
                    icon={Clock}
                    presets={['1:30', '2:00', '3:00']}
                    placeholder="2:00"
                />

            </div>

            {/* SECONDARY ROW: TEMPO & WEIGHT (Optional) */}
            <div className="flex flex-wrap gap-3">
                {/* Tempo Toggle Button */}
                <button
                    onClick={toggleTempo}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${showTempo
                        ? 'bg-cv-accent/10 border-cv-accent text-cv-accent'
                        : 'bg-white dark:bg-cv-bg-secondary border-slate-200 dark:border-slate-700 text-cv-text-secondary hover:border-cv-accent/50'
                        }`}
                >
                    <Timer size={16} />
                    <span className="text-sm font-semibold">Tempo</span>
                    {showTempo && <span className="text-xs ml-1 bg-white/50 px-1.5 py-0.5 rounded">ON</span>}
                </button>

                {showTempo && (
                    <div className="flex-1 max-w-[200px] bg-white dark:bg-cv-bg-secondary px-3 py-2 rounded-xl border border-cv-accent animate-in fade-in slide-in-from-left-2">
                        <label className="text-xs uppercase tracking-wider font-bold text-cv-accent mb-1 block">Tempo</label>
                        <input
                            type="text"
                            value={(config.tempo as string) || ''}
                            onChange={(e) => onChange('tempo', e.target.value)}
                            placeholder="30X1"
                            className="w-full bg-transparent border-none p-0 text-lg font-bold text-cv-text-primary placeholder:text-slate-300 focus:ring-0"
                            autoFocus
                        />
                    </div>
                )}
            </div>

        </div>
    );
}

// ----------------------------------------------------------------------
// NEW COMPONENT: InputCard
// ----------------------------------------------------------------------
interface InputCardProps {
    label: string;
    subLabel?: string;
    value: string | number;
    onChange: (val: any) => void;
    type?: 'number' | 'text' | 'number-text';
    icon?: LucideIcon;
    presets?: (string | number)[];
    placeholder?: string;
    headerAction?: React.ReactNode;
    isDistance?: boolean;
}

function InputCard({
    label,
    subLabel,
    value,
    onChange,
    type = 'text',
    icon: Icon,
    presets = [],
    placeholder,
    headerAction,
    isDistance
}: InputCardProps) {

    const handleIncrement = (amount: number) => {
        if (typeof value === 'number') {
            onChange(value + amount);
        } else if (typeof value === 'string' && !isNaN(Number(value))) {
            onChange(Number(value) + amount);
        } else {
            // If empty or text, start at amount
            onChange(amount);
        }
    };

    return (
        <div className="bg-white dark:bg-cv-bg-secondary rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5">
                    {Icon && <Icon size={14} className="text-cv-text-tertiary group-hover:text-cv-accent transition-colors" />}
                    <span className="text-[10px] uppercase tracking-wider font-bold text-cv-text-tertiary group-hover:text-cv-text-secondary transition-colors">
                        {label}
                    </span>
                </div>
                {headerAction}
            </div>

            {/* Input Area */}
            <div className="flex items-baseline justify-center gap-1 my-1 z-10">
                <input
                    type={type === 'number' ? 'number' : 'text'}
                    value={value || ''}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (type === 'number') onChange(val ? Number(val) : '');
                        else onChange(val);
                    }}
                    placeholder={placeholder || '-'}
                    className="bg-transparent border-none p-0 text-3xl font-bold text-cv-text-primary placeholder:text-slate-200 dark:placeholder:text-slate-700 text-center w-full focus:ring-0"
                />
                {isDistance && <span className="text-sm font-medium text-cv-text-tertiary">meters</span>}
                {label === '% 1RM' && <span className="text-sm font-medium text-cv-text-tertiary">%</span>}
            </div>

            {/* Controls / Presets */}
            <div className="flex items-center justify-center gap-1 z-10 mt-auto">
                {type === 'number' && (
                    <>
                        <button
                            onClick={() => handleIncrement(-1)}
                            className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                        >
                            <TrendingDown size={12} />
                        </button>
                    </>
                )}

                {/* Scrollable Presets */}
                <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-[120px] px-1">
                    {presets.map(preset => (
                        <button
                            key={preset}
                            onClick={() => onChange(preset)}
                            className={`
                                flex-shrink-0 px-2 py-1 rounded-md text-[10px] font-semibold transition-all border
                                ${value == preset
                                    ? 'bg-cv-accent text-white border-cv-accent'
                                    : 'bg-slate-50 dark:bg-slate-800 text-cv-text-secondary border-slate-100 dark:border-slate-700 hover:border-cv-accent/30'}
                            `}
                        >
                            {preset}
                        </button>
                    ))}
                </div>

                {type === 'number' && (
                    <>
                        <button
                            onClick={() => handleIncrement(1)}
                            className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                        >
                            <TrendingUp size={12} />
                        </button>
                    </>
                )}
            </div>

            {/* Background Decoration */}
            <div className="absolute -bottom-4 -right-4 text-slate-50 dark:text-slate-800/50 pointer-events-none group-hover:scale-110 transition-transform">
                {Icon && <Icon size={64} strokeWidth={1} />}
            </div>
        </div>
    );
}

// ============================================
// GENERIC MOVEMENT FORM

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

// ============================================
// GENERIC MOVEMENT FORM (Warmup, Accessory, Skill)
// ============================================
function GenericMovementForm({ config, onChange }: FormProps) {
    const movements = (config.movements as string[]) || [];

    const addMovement = () => {
        onChange('movements', [...movements, '']);
    };

    const updateMovement = (index: number, value: string) => {
        const updated = [...movements];
        updated[index] = value;
        onChange('movements', updated);
    };

    const removeMovement = (index: number) => {
        onChange('movements', movements.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                    Movimientos / Ejercicios
                </label>
                <div className="space-y-2">
                    {movements.map((movement, index) => (
                        <div key={index} className="flex gap-2">
                            <div className="flex-1">
                                <SmartExerciseInput
                                    value={movement}
                                    onChange={(val) => updateMovement(index, val)}
                                    placeholder="e.g. 3x10 Banded Good Mornings"
                                    className="cv-input"
                                />
                            </div>
                            <button
                                onClick={() => removeMovement(index)}
                                className="cv-btn-ghost p-2 text-red-400 self-start mt-0.5"
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
                        Add Movement
                    </button>
                </div>
            </div>
        </div>
    );
}
// Force redeploy - Thu Feb  5 17:00:43 -03 2026

interface ProgressionSettingsProps {
    blockId: string;
    progressionId?: string | null;
    showSelector: boolean;
    setShowSelector: (show: boolean) => void;
    onToggle: (blockId: string, active: boolean, variable?: any) => void;
}

function ProgressionSettings({ blockId, progressionId, showSelector, setShowSelector, onToggle }: ProgressionSettingsProps) {
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

                    {/* FUERZA Section */}
                    <div className="mb-3">
                        <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Fuerza</span>
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
