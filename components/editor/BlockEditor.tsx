'use client';

import { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '@/lib/store';
import { SmartExerciseInput } from './SmartExerciseInput';
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
    HelpCircle,
    Check,
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
        selectedDayId
    } = useEditorStore();
    const [methodologies, setMethodologies] = useState<TrainingMethodology[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const firstInputRef = useRef<HTMLInputElement>(null);

    // Load methodologies from database
    useEffect(() => {
        async function loadMethodologies() {
            try {
                const data = await getTrainingMethodologies();
                setMethodologies(data);
            } catch (error) {
                console.error('Error loading methodologies:', error);
            } finally {
                setLoading(false);
            }
        }
        loadMethodologies();
    }, []);

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
    const currentMethodology = methodologies.find(m => m.code === block?.format);

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
        const methodology = methodologies.find(m => m.code === format);
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
        acc[cat] = methodologies.filter(m => m.category === cat);
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

        // For all other types, just require a name
        return Boolean(block.name && block.name.trim().length > 0);
    };

    const isValid = validateBlock();

    return (
        <div className="flex flex-col h-full">
            {/* Header with Save Button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-cv-bg-tertiary dark:to-cv-bg-secondary">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cv-accent/10 flex items-center justify-center">
                        <Dumbbell size={16} className="text-cv-accent" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-cv-text-primary">
                            {block.name || blockTypeLabels[block.type] || 'Bloque'}
                        </p>
                        <p className="text-xs text-cv-text-tertiary">
                            {currentBlockIndex + 1} de {totalBlocks} bloques
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        if (isValid) {
                            // Mark as completed when clicking OK
                            // Use explicit update to ensure it captures current state correctly
                            const newConfig = { ...block.config, is_completed: true };
                            updateBlock(blockId, { config: newConfig as WorkoutConfig });
                            selectBlock(null);
                        }
                    }}
                    disabled={!isValid}
                    title={isValid ? "Confirmar y cerrar" : "Completa los campos requeridos (Sets/Reps, Movimientos, etc.)"}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm
                        ${isValid
                            ? 'bg-cv-accent text-white hover:bg-cv-accent/90'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'}`}
                >
                    <Check size={16} />
                    <span className="hidden sm:inline">OK</span>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Block Name */}
                <div>
                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                        Nombre del Bloque / Ejercicio Principal
                    </label>
                    <SmartExerciseInput
                        value={block.name || ''}
                        onChange={(val) => updateBlock(blockId, { name: val || null })}
                        placeholder="Buscar ejercicio..."
                        className="cv-input"
                        inputRef={firstInputRef}
                    />
                </div>

                {/* Methodology Selector - Collapsible Categories */}
                {/* NOTE: strength_linear (Classic) is excluded - it has its own form */}
                {(block.type === 'metcon_structured' || block.type === 'warmup' || block.type === 'accessory') && (
                    <div>
                        <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                            Metodología de Entrenamiento
                        </label>

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
                                                        ? 'bg-cv-accent text-white border-cv-accent shadow-sm'
                                                        : hasSelectedItem
                                                            ? 'bg-cv-accent/10 text-cv-accent border-cv-accent/30 hover:bg-cv-accent/20'
                                                            : 'bg-white dark:bg-cv-bg-secondary text-cv-text-secondary border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
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
                                                                ? 'bg-white dark:bg-cv-bg-primary text-cv-accent border-cv-accent shadow-sm ring-1 ring-cv-accent/20'
                                                                : 'bg-white dark:bg-cv-bg-secondary text-cv-text-secondary hover:text-cv-text-primary hover:bg-slate-50 dark:hover:bg-cv-bg-primary border-slate-200 dark:border-slate-700'
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

                {/* Dynamic Form based on Methodology */}
                {currentMethodology && (
                    <DynamicMethodologyForm
                        methodology={currentMethodology}
                        config={config}
                        onChange={handleConfigChange}
                    />
                )}

                {/* Fallback to type-specific forms when no methodology */}
                {!currentMethodology && (
                    <>
                        {block.type === 'strength_linear' && (
                            <StrengthForm config={config} onChange={handleConfigChange} />
                        )}

                        {block.type === 'free_text' && (
                            <FreeTextForm config={config} onChange={handleConfigChange} />
                        )}

                        {(block.type === 'warmup' || block.type === 'accessory' || block.type === 'skill') && !block.format && (
                            <GenericMovementForm config={config} onChange={handleConfigChange} />
                        )}
                    </>
                )}

                {/* Notes Field - Always visible */}
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

                {/* Delete Button */}
                <button
                    onClick={() => { deleteBlock(blockId); selectBlock(null); }}
                    className="w-full py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                    <Trash2 size={14} />
                    Eliminar Bloque
                </button>
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

    if (field.type === 'number') {
        return (
            <div className="flex items-center gap-2 bg-white dark:bg-cv-bg-secondary px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-sm font-semibold text-cv-text-primary whitespace-nowrap">{field.label}</span>
                <input
                    type="number"
                    min={1}
                    value={(value as number) || ''}
                    onChange={(e) => onChange(parseInt(e.target.value) || null)}
                    placeholder={field.placeholder || '0'}
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
// STRENGTH FORM (Fallback for strength_linear)
// ============================================
interface FormProps {
    config: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
}

function StrengthForm({ config, onChange }: FormProps) {
    const showTempo = config.show_tempo === true || (!!config.tempo && config.tempo !== '');

    const toggleTempo = () => {
        const newValue = !showTempo;
        onChange('show_tempo', newValue);
        if (!newValue) {
            onChange('tempo', ''); // Clear tempo if hidden
        }
    };

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex flex-wrap items-center gap-3">
                {/* Sets */}
                <div className="flex items-center gap-2 bg-white dark:bg-cv-bg-secondary px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-semibold text-cv-text-primary">Series</span>
                    <input
                        type="number"
                        min={1}
                        value={(config.sets as number) || ''}
                        onChange={(e) => onChange('sets', parseInt(e.target.value) || null)}
                        placeholder="3"
                        className="bg-transparent border-none p-0 text-base focus:ring-0 text-cv-text-primary font-bold placeholder:text-slate-300 w-12 text-center"
                    />
                </div>

                {/* Reps */}
                <div className="flex items-center gap-2 bg-white dark:bg-cv-bg-secondary px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-semibold text-cv-text-primary">Reps</span>
                    <input
                        type="text"
                        value={(config.reps as string) || ''}
                        onChange={(e) => onChange('reps', e.target.value)}
                        placeholder="10"
                        className="bg-transparent border-none p-0 text-base focus:ring-0 text-cv-text-primary font-bold placeholder:text-slate-300 w-14 text-center"
                    />
                </div>

                {/* % */}
                <div className="flex items-center gap-2 bg-white dark:bg-cv-bg-secondary px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-semibold text-cv-text-primary">% 1RM</span>
                    <input
                        type="text"
                        value={(config.percentage as string) || ''}
                        onChange={(e) => onChange('percentage', e.target.value)}
                        placeholder="75%"
                        className="bg-transparent border-none p-0 text-base focus:ring-0 text-cv-text-primary font-medium placeholder:text-slate-300 w-16 text-center"
                    />
                </div>

                {/* RPE */}
                <div className="flex items-center gap-2 bg-white dark:bg-cv-bg-secondary px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-semibold text-cv-text-primary">RPE</span>
                    <input
                        type="text"
                        value={(config.rpe as string) || ''}
                        onChange={(e) => onChange('rpe', e.target.value)}
                        placeholder="8"
                        className="bg-transparent border-none p-0 text-base focus:ring-0 text-cv-text-primary font-medium placeholder:text-slate-300 w-10 text-center"
                    />
                </div>

                {/* Descanso */}
                <div className="flex items-center gap-2 bg-white dark:bg-cv-bg-secondary px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-semibold text-cv-text-primary">Descanso</span>
                    <input
                        type="text"
                        value={(config.rest as string) || ''}
                        onChange={(e) => onChange('rest', e.target.value)}
                        placeholder="2:00"
                        className="bg-transparent border-none p-0 text-base focus:ring-0 text-cv-text-primary font-medium placeholder:text-slate-300 w-14 text-center"
                    />
                </div>

                {/* Tempo with toggle */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${showTempo ? 'bg-white dark:bg-cv-bg-secondary border-slate-200 dark:border-slate-700' : 'border-dashed border-slate-300 dark:border-slate-600'}`}>
                    <button
                        onClick={toggleTempo}
                        type="button"
                        className={`w-8 h-4 rounded-full transition-colors relative focus:outline-none ${showTempo ? 'bg-cv-accent' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                        <span className={`block w-3 h-3 bg-white rounded-full transition-transform absolute top-0.5 left-0.5 ${showTempo ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-sm font-semibold ${showTempo ? 'text-cv-text-primary' : 'text-cv-text-tertiary'}`}>Tempo</span>
                    {showTempo && (
                        <input
                            type="text"
                            value={(config.tempo as string) || ''}
                            onChange={(e) => onChange('tempo', e.target.value)}
                            placeholder="30X1"
                            className="bg-transparent border-none p-0 text-base focus:ring-0 text-cv-text-primary font-medium placeholder:text-slate-300 w-16 text-center animate-in fade-in duration-150"
                        />
                    )}
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
