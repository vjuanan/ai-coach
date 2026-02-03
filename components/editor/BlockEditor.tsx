'use client';

import { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '@/lib/store';
import { ExerciseAutocomplete } from './ExerciseAutocomplete';
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
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    Calendar
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
        selectNextBlock,
        selectPrevBlock,
        selectNextDayFirstBlock,
        selectPrevDayFirstBlock,
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
    const categoryOrder = ['metcon', 'hiit', 'strength', 'conditioning'];
    const groupedMethodologies = categoryOrder.reduce((acc, cat) => {
        acc[cat] = methodologies.filter(m => m.category === cat);
        return acc;
    }, {} as Record<string, TrainingMethodology[]>);

    const categoryLabels: Record<string, string> = {
        metcon: 'MetCon',
        hiit: 'HIIT',
        strength: 'Fuerza',
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
        strength_linear: 'Fuerza',
        metcon_structured: 'MetCon',
        accessory: 'Accesorio',
        skill: 'Habilidad',
        free_text: 'Texto Libre'
    };

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
                    onClick={() => selectBlock(null)}
                    title="Confirmar y cerrar"
                    className="flex items-center gap-1.5 px-3 py-2 bg-cv-accent text-white rounded-lg font-medium text-sm hover:bg-cv-accent/90 transition-colors shadow-sm"
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
                    {block.type === 'strength_linear' ? (
                        <ExerciseAutocomplete
                            value={block.name || ''}
                            onChange={(val) => updateBlock(blockId, { name: val || null })}
                            placeholder="Buscar ejercicio..."
                            className="cv-input"
                            inputRef={firstInputRef}
                        />
                    ) : (
                        <input
                            ref={firstInputRef}
                            type="text"
                            value={block.name || ''}
                            onChange={(e) => updateBlock(blockId, { name: e.target.value || null })}
                            placeholder="e.g., Metcon A, Warm-up"
                            className="cv-input"
                        />
                    )}
                </div>

                {/* Methodology Selector - Collapsible Categories */}
                {(block.type === 'metcon_structured' || block.type === 'warmup' || block.type === 'accessory' || block.type === 'strength_linear') && (
                    <div>
                        <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                            Metodología de Entrenamiento
                        </label>

                        {loading ? (
                            <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cv-accent"></div>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {categoryOrder.map(category => {
                                    const items = groupedMethodologies[category] || [];
                                    if (items.length === 0) return null;

                                    const isExpanded = expandedCategory === category;
                                    const hasSelectedItem = items.some(m => m.code === block?.format);
                                    const CategoryIcon = categoryIcons[category] || Dumbbell;

                                    return (
                                        <div key={category} className="rounded-lg overflow-hidden">
                                            {/* Category Header - Clickable */}
                                            <button
                                                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                                                className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all ${hasSelectedItem
                                                    ? 'bg-cv-accent/10 border border-cv-accent/30'
                                                    : 'bg-cv-bg-tertiary hover:bg-cv-bg-secondary'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <CategoryIcon size={14} className={hasSelectedItem ? 'text-cv-accent' : 'text-cv-text-tertiary'} />
                                                    <span className={`text-sm font-medium ${hasSelectedItem ? 'text-cv-accent' : 'text-cv-text-primary'}`}>
                                                        {categoryLabels[category]}
                                                    </span>
                                                    {hasSelectedItem && (
                                                        <span className="text-xs bg-cv-accent text-white px-1.5 py-0.5 rounded">
                                                            {items.find(m => m.code === block?.format)?.name}
                                                        </span>
                                                    )}
                                                </div>
                                                {isExpanded ? (
                                                    <ChevronDown size={14} className="text-cv-text-tertiary" />
                                                ) : (
                                                    <ChevronRight size={14} className="text-cv-text-tertiary" />
                                                )}
                                            </button>

                                            {/* Expanded Options */}
                                            {isExpanded && (
                                                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-cv-bg-tertiary/50 animate-in slide-in-from-top-2 duration-200">
                                                    {items.map(m => {
                                                        const IconComponent = iconMap[m.icon] || Dumbbell;
                                                        const isSelected = block?.format === m.code;

                                                        return (
                                                            <button
                                                                key={m.code}
                                                                onClick={() => handleFormatChange(m.code)}
                                                                title={m.description}
                                                                className={`
                                                                    px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                                                                    flex items-center gap-1.5
                                                                    ${isSelected
                                                                        ? 'bg-cv-accent text-white shadow-sm'
                                                                        : 'bg-white dark:bg-cv-bg-secondary text-cv-text-secondary hover:text-cv-text-primary hover:bg-slate-100 dark:hover:bg-cv-bg-primary border border-slate-200 dark:border-slate-700'}
                                                                `}
                                                            >
                                                                <IconComponent size={12} />
                                                                {m.name}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
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

            {/* Navigation Footer */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-cv-bg-tertiary/80">
                {/* Block Navigation */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={selectPrevBlock}
                        disabled={!hasPrevBlock}
                        title="Bloque anterior"
                        className={`p-2 rounded-lg transition-colors ${hasPrevBlock
                            ? 'hover:bg-slate-200 dark:hover:bg-slate-700 text-cv-text-secondary'
                            : 'text-cv-text-tertiary/40 cursor-not-allowed'
                            }`}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-xs text-cv-text-tertiary px-1">
                        {currentBlockIndex + 1}/{totalBlocks}
                    </span>
                    <button
                        onClick={selectNextBlock}
                        disabled={!hasNextBlock}
                        title="Bloque siguiente"
                        className={`p-2 rounded-lg transition-colors ${hasNextBlock
                            ? 'hover:bg-slate-200 dark:hover:bg-slate-700 text-cv-text-secondary'
                            : 'text-cv-text-tertiary/40 cursor-not-allowed'
                            }`}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* Separator */}
                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600" />

                {/* Day Navigation */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={selectPrevDayFirstBlock}
                        disabled={!hasPrevDay}
                        title="Día anterior"
                        className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${hasPrevDay
                            ? 'hover:bg-slate-200 dark:hover:bg-slate-700 text-cv-text-secondary'
                            : 'text-cv-text-tertiary/40 cursor-not-allowed'
                            }`}
                    >
                        <ChevronLeft size={14} />
                        <Calendar size={14} />
                    </button>
                    <span className="text-xs text-cv-text-tertiary px-1">Día</span>
                    <button
                        onClick={selectNextDayFirstBlock}
                        disabled={!hasNextDay}
                        title="Día siguiente"
                        className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${hasNextDay
                            ? 'hover:bg-slate-200 dark:hover:bg-slate-700 text-cv-text-secondary'
                            : 'text-cv-text-tertiary/40 cursor-not-allowed'
                            }`}
                    >
                        <Calendar size={14} />
                        <ChevronRight size={14} />
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

    return (
        <div className="space-y-4">
            {fields.map((field: TrainingMethodologyFormField) => (
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
}

function DynamicField({ field, value, onChange }: DynamicFieldProps) {
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

    if (field.type === 'number') {
        return (
            <div>
                <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                <input
                    type="number"
                    min={1}
                    value={(value as number) || ''}
                    onChange={(e) => onChange(parseInt(e.target.value) || null)}
                    placeholder={field.placeholder}
                    className="cv-input-mono"
                />
                {field.help && (
                    <p className="text-xs text-cv-text-tertiary mt-1">{field.help}</p>
                )}
            </div>
        );
    }

    // Default: text input
    return (
        <div>
            <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <input
                type="text"
                value={(value as string) || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={field.placeholder}
                className="cv-input"
            />
            {field.help && (
                <p className="text-xs text-cv-text-tertiary mt-1">{field.help}</p>
            )}
        </div>
    );
}

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
                            <ExerciseAutocomplete
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
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                        Series
                    </label>
                    <input
                        type="number"
                        min={1}
                        value={(config.sets as number) || ''}
                        onChange={(e) => onChange('sets', parseInt(e.target.value) || null)}
                        placeholder="5"
                        className="cv-input-mono"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                        Repeticiones
                    </label>
                    <input
                        type="text"
                        value={(config.reps as string) || ''}
                        onChange={(e) => onChange('reps', e.target.value)}
                        placeholder="5 or 3-3-3"
                        className="cv-input-mono"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                    Carga / Porcentaje
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <input
                        type="text"
                        value={(config.percentage as string) || ''}
                        onChange={(e) => onChange('percentage', e.target.value)}
                        placeholder="75%"
                        className="cv-input-mono"
                    />
                    <input
                        type="text"
                        value={(config.rpe as string) || ''}
                        onChange={(e) => onChange('rpe', e.target.value)}
                        placeholder="RPE 8"
                        className="cv-input-mono"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                    Tempo (opcional)
                </label>
                <input
                    type="text"
                    value={(config.tempo as string) || ''}
                    onChange={(e) => onChange('tempo', e.target.value)}
                    placeholder="31X1"
                    className="cv-input-mono"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                    Descanso
                </label>
                <input
                    type="text"
                    value={(config.rest as string) || ''}
                    onChange={(e) => onChange('rest', e.target.value)}
                    placeholder="2:00 or As needed"
                    className="cv-input"
                />
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
                className="cv-input min-h-[200px] resize-none font-mono text-sm"
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
                                <ExerciseAutocomplete
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
