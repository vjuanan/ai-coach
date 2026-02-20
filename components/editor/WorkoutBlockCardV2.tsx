'use client';

import { useEditorStore } from '@/lib/store';
import { GripVertical, Copy, Trash2, ChevronDown, TrendingUp, Check, X, Link } from 'lucide-react';
import { useState, useRef } from 'react';
import type { BlockType, WorkoutFormat } from '@/lib/supabase/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';
import { useAthleteBenchmarks } from '@/hooks/useAthleteBenchmarks'; // New Hook

interface DraftWorkoutBlock {
    id: string;
    tempId?: string;
    day_id: string;
    order_index: number;
    type: string;
    format: string | null;
    name: string | null;
    config: Record<string, unknown>;
    isDirty?: boolean;
    progression_id?: string | null;
    section?: 'warmup' | 'main' | 'cooldown';
}

interface WorkoutBlockCardV2Props {
    block: DraftWorkoutBlock;
}

// Uniform styles for all blocks
const UNIFORM_BLOCK_STYLE = {
    color: 'border-l-4 border-slate-200 dark:border-slate-700',
    hoverClass: 'hover:border-slate-300 dark:hover:border-slate-500'
};

const blockTypeStyles: Record<string, { color: string; label: string; hoverClass: string }> = {
    warmup: { color: 'border-l-4 border-l-orange-500 dark:border-l-orange-400', label: 'Calentamiento', hoverClass: 'hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-none' },
    strength_linear: { color: 'border-l-4 border-l-red-500 dark:border-l-red-400', label: 'Fuerza', hoverClass: 'hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-none' },
    metcon_structured: { color: 'border-l-4 border-l-teal-500 dark:border-l-teal-400', label: 'MetCon', hoverClass: 'hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-none' },
    metcon: { color: 'border-l-4 border-l-teal-500 dark:border-l-teal-400', label: 'MetCon', hoverClass: 'hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-none' },
    accessory: { color: 'border-l-4 border-l-purple-500 dark:border-l-purple-400', label: 'Accesorio', hoverClass: 'hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-none' },
    skill: { color: 'border-l-4 border-l-blue-500 dark:border-l-blue-400', label: 'Habilidad', hoverClass: 'hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-none' },
    free_text: { color: 'border-l-4 border-l-slate-400 dark:border-l-slate-500', label: 'Notas', hoverClass: 'hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-none' },
    finisher: { color: 'border-l-4 border-l-amber-500 dark:border-l-amber-400', label: 'Finisher', hoverClass: 'hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-none' },
};

const formatLabels: Record<string, string> = {
    AMRAP: 'AMRAP',
    EMOM: 'EMOM',
    RFT: 'Rondas Por Tiempo',
    Chipper: 'Chipper',
    Ladder: 'Ladder',
    Tabata: 'Tabata',
    'Not For Time': 'Sin Tiempo',
    'For Time': 'Por Tiempo',
};

export function WorkoutBlockCardV2({ block }: WorkoutBlockCardV2Props) {
    const { selectBlock, selectedBlockId, deleteBlock, deleteProgression, duplicateBlock, enterBlockBuilder, draggedBlockId } = useEditorStore();
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const wasDraggingRef = useRef(false);
    const { getBenchmark } = useAthleteBenchmarks();

    // Setup sortable
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: block.id,
    });

    // Track drag state to prevent onClick after drag
    if (isDragging && !wasDraggingRef.current) {
        wasDraggingRef.current = true;
    }

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isSelected = selectedBlockId === block.id;
    const blockStyle = blockTypeStyles[block.type] || blockTypeStyles.free_text;
    const config = block.config as Record<string, unknown>;
    const isBeingDragged = isDragging || draggedBlockId === block.id;



    // Determine if block has meaningful content
    const isBlockEmpty = (): boolean => {
        switch (block.type) {
            case 'strength_linear':
                const sets = config.sets as number;
                const reps = config.reps as string;
                const exercise = config.exercise as string;
                return !sets && !reps && !exercise;
            case 'metcon_structured':
                const format = block.format;
                const movements = config.movements as string[] || [];
                const timeCap = config.time_cap as number;
                return !format && movements.length === 0 && !timeCap;
            case 'free_text':
                const content = config.content as string;
                return !content || content.trim() === '';
            case 'warmup':
            case 'accessory':
            case 'skill':
            case 'finisher':
                const exercises = config.exercises as unknown[] || [];
                const notes = config.notes as string;
                return exercises.length === 0 && (!notes || notes.trim() === '');
            default:
                // Check if config has any meaningful data
                const keys = Object.keys(config).filter(k => k !== 'is_completed');
                return keys.length === 0 || keys.every(k => {
                    const val = config[k];
                    return val === null || val === undefined || val === '' ||
                        (Array.isArray(val) && val.length === 0);
                });
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (block.progression_id) {
            setShowDeleteAlert(true);
        } else if (isBlockEmpty()) {
            // Block is empty, delete immediately
            deleteBlock(block.id);
        } else {
            // Block has content, ask for confirmation
            setShowConfirmDelete(true);
        }
    };

    const getBlockPreview = () => {
        let pillText = '';
        let primaryMetric = '';
        let secondaryMetric: React.ReactNode = null;
        let exerciseList: { name: string; reps: string }[] = [];
        let footerText: React.ReactNode = null;

        switch (block.type) {
            case 'strength_linear': {
                const sets = config.sets as number;
                const reps = config.reps as string;
                const distance = config.distance as string;
                const percentage = config.percentage as string;
                const weight = config.weight as string | number;
                const rpe = config.rpe as string | number;

                if (sets || reps || distance) {
                    if (distance) {
                        primaryMetric = `${sets || 0} × ${distance}`;
                    } else {
                        primaryMetric = `${sets || 0} × ${reps || 0}`;
                    }
                }

                // Calculate weight for preview
                let calculatedWeight: number | null = null;
                if (percentage && (block.name || config.exercise)) {
                    const exerciseName = (config.exercise as string) || block.name || '';
                    const rm = getBenchmark(exerciseName);
                    const pctString = String(percentage);
                    const pct = parseInt(pctString.replace('%', ''), 10);

                    if (rm && !isNaN(pct) && pct > 0) {
                        calculatedWeight = Math.round((rm * pct) / 100);
                    }
                }

                if (percentage || calculatedWeight !== null || weight || rpe) {
                    secondaryMetric = (
                        <div className="flex items-center gap-1">
                            {percentage && (
                                <span className="text-cv-accent bg-cv-accent/5 px-1 rounded text-xs">
                                    @ {percentage}% RM
                                </span>
                            )}
                            {rpe && !percentage && (
                                <span className="text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1 rounded text-xs font-medium">
                                    RPE {rpe}
                                </span>
                            )}
                            {calculatedWeight !== null && (
                                <span className="text-cv-text-secondary font-normal text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">
                                    {calculatedWeight} kg
                                </span>
                            )}
                            {!calculatedWeight && weight && (
                                <span className="text-cv-text-secondary font-normal text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">
                                    {weight} kg
                                </span>
                            )}
                        </div>
                    );
                }

                if (config.rest as string) {
                    footerText = (
                        <div className="flex items-center gap-1">
                            <span className="opacity-70">Descanso:</span>
                            <span>{config.rest as string}</span>
                        </div>
                    );
                }
                break;
            }

            case 'metcon':
            case 'metcon_structured': {
                const format = block.format;
                const items = (config as any).items as { exercise: string; reps: string }[] || [];
                const slots = (config as any).slots as { label: string; movement: string; reps: string }[] || [];
                const movements = config.movements as string[] || [];
                const minutes = (config as any).minutes as number;
                const rounds = (config as any).rounds as number;
                const timeCap = (config as any).timeCap as number;
                const workSeconds = (config as any).workSeconds as number;
                const restSeconds = (config as any).restSeconds as number;

                if (format) {
                    pillText = formatLabels[format] || format;
                }

                // Build meta line based on format
                if (format === 'AMRAP' && minutes) {
                    primaryMetric = `${minutes} min`;
                } else if (format === 'EMOM' && minutes) {
                    const interval = (config as any).interval as number;
                    primaryMetric = `${minutes} min` + (interval && interval > 1 ? ` / c/${interval} min` : '');
                } else if ((format === 'RFT' || format === 'For Time') && rounds) {
                    primaryMetric = `${rounds} rondas` + (timeCap ? ` · TC ${timeCap}'` : '');
                } else if (format === 'Chipper') {
                    primaryMetric = timeCap ? `TC ${timeCap}'` : '';
                } else if (format === 'Tabata') {
                    primaryMetric = `${rounds || 8}R · ${workSeconds || 20}s/${restSeconds || 10}s`;
                }

                // Build exercise list based on format
                if (items.length > 0) {
                    items.forEach(it => { if (it.exercise) exerciseList.push({ name: it.exercise, reps: it.reps }); });
                } else if (slots.length > 0) {
                    slots.forEach(s => { if (s.movement) exerciseList.push({ name: s.movement, reps: s.reps }); });
                } else if (movements.length > 0) {
                    movements.forEach(m => exerciseList.push({ name: m, reps: '' }));
                }
                break;
            }

            case 'warmup':
            case 'accessory':
            case 'skill':
            case 'finisher': {
                const rounds = config.rounds as number;
                if (rounds) {
                    primaryMetric = `${rounds} ${rounds === 1 ? 'Vuelta' : 'Vueltas'}`;
                }

                // Check both 'exercises' (old?) and 'movements' (new generic form)
                const items = (config.movements as any[]) || (config.exercises as string[]) || [];
                const notes = config.notes as string;

                items.forEach(item => {
                    const name = typeof item === 'string' ? item : item.name;
                    if (name) {
                        exerciseList.push({ name: name, reps: '' }); // Reps in accessory are not strictly separated in standard view yet
                    }
                });

                if (notes) {
                    footerText = <div className="italic truncate">{notes}</div>;
                }
                break;
            }

            case 'free_text': {
                const content = config.content as string;
                footerText = content || '';
                break;
            }

            default:
                break;
        }

        // --- Render the Unified Layout ---

        // Truncate exercise list if it's too long in warmup/accessory types (like it did before)
        const isListType = ['warmup', 'accessory', 'skill', 'finisher'].includes(block.type);
        const displayLimit = isListType ? 2 : exerciseList.length;
        const visibleExercises = exerciseList.slice(0, displayLimit);
        const extraCount = exerciseList.length - displayLimit;

        if (!pillText && !primaryMetric && !secondaryMetric && visibleExercises.length === 0 && !footerText) {
            return <div className="min-h-[1.25rem]" />;
        }

        return (
            <div className="flex flex-col gap-2 min-h-[1.25rem] mt-1">
                {/* Main Row: Pill + Metric + SubMetric */}
                {(pillText || primaryMetric || secondaryMetric) && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {pillText && (
                            <span
                                className="font-bold text-[10px] px-1.5 py-0.5 rounded leading-none tracking-wide uppercase"
                                style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
                            >
                                {pillText}
                            </span>
                        )}
                        {primaryMetric && (
                            <span className="text-sm text-cv-text-primary font-bold">
                                {primaryMetric}
                            </span>
                        )}
                        {secondaryMetric}
                    </div>
                )}

                {/* Body: Exercises */}
                {visibleExercises.length > 0 && (
                    <div className="flex flex-col gap-1 pl-0.5">
                        {visibleExercises.map((ex, i) => (
                            <div key={i} className="text-xs grid grid-cols-[min-content_1fr] items-baseline gap-2">
                                {ex.reps ? (
                                    <>
                                        <span className="font-bold text-cv-text-primary whitespace-nowrap text-right min-w-[2ch]">
                                            {ex.reps}
                                        </span>
                                        <span className="text-cv-text-secondary truncate">
                                            {ex.name}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-cv-text-secondary truncate col-span-2 flex items-center gap-1.5">
                                        {isListType && <span className="text-[10px] opacity-50">•</span>}
                                        {ex.name}
                                    </span>
                                )}
                            </div>
                        ))}
                        {extraCount > 0 && (
                            <div className="text-xs italic text-cv-text-tertiary pl-[3px]">
                                + {extraCount} más
                            </div>
                        )}
                    </div>
                )}

                {/* Footer: Notes / Rest */}
                {footerText && (
                    <div className="text-xs text-cv-text-tertiary">
                        {footerText}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                {...listeners}
                {...attributes}
                className={`
                    group/block relative bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing touch-none
                    transition-all duration-150
                    ${blockStyle.color}
                    ${!isBeingDragged && !isSelected ? blockStyle.hoverClass : ''}
                    ${isSelected ? 'ring-2 ring-cv-accent' : ''}
                    ${isBeingDragged ? 'opacity-50 scale-95' : ''}
                `}
                onClick={(e) => {
                    e.stopPropagation();
                    // Prevent click if we just finished dragging
                    if (wasDraggingRef.current) {
                        wasDraggingRef.current = false;
                        return;
                    }
                    // Fix: Explicitly pass section to enterBlockBuilder
                    // This ensures the BlockBuilderPanel switches to the correct tab (Warmup vs Training)
                    const targetSection = (block.section === 'warmup' || block.type === 'warmup') ? 'warmup' : 'main';
                    enterBlockBuilder(block.day_id, targetSection);
                    selectBlock(block.id);
                }}
            >
                {/* Card Inner Content */}
                <div className="p-2">
                    {/* Drag Handle - Visual indicator */}
                    <div
                        className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center opacity-40 group-hover/block:opacity-100 transition-opacity rounded-l-lg"
                    >
                        <GripVertical size={12} className="text-cv-text-tertiary" />
                    </div>

                    {/* Content */}
                    <div className="pl-4">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className="text-2xs uppercase tracking-wider text-cv-text-tertiary font-medium">
                                    {block.name || blockStyle.label}
                                </span>

                                {block.progression_id && (
                                    <div
                                        className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded text-[10px] font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30"
                                        title="Parte de una progresión"
                                    >
                                        <Link size={10} className="stroke-[2.5]" />
                                        <span>Progresión</span>
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}
                                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-cv-accent transition-all duration-200 hover:scale-110 hover:shadow-sm"
                                    title="Duplicar"
                                >
                                    <Copy size={13} />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-all duration-200 hover:scale-110 hover:shadow-sm group/delete"
                                    title="Eliminar bloque"
                                >
                                    <Trash2 size={14} className="group-hover/delete:stroke-[2.5]" />
                                </button>
                            </div>
                        </div>

                        {getBlockPreview()}
                    </div>
                </div>
            </div>

            {/* Custom Alert for Progression Deletion */}
            {showDeleteAlert && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-white dark:bg-cv-bg-secondary rounded-xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5">
                            <h3 className="text-lg font-semibold text-cv-text-primary mb-2 flex items-center gap-2">
                                <TrendingUp size={20} className="text-cv-accent" />
                                Eliminar Progresión
                            </h3>
                            <p className="text-sm text-cv-text-secondary mb-4">
                                Este bloque es parte de una progresión. ¿Qué deseas hacer?
                            </p>

                            <div className="space-y-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteProgression(block.progression_id!);
                                        setShowDeleteAlert(false);
                                    }}
                                    className="w-full flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:hover:bg-red-900/30 transition-colors text-red-700 dark:text-red-400 text-sm font-medium"
                                >
                                    <span>Eliminar TODA la progresión</span>
                                    <Trash2 size={16} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteBlock(block.id);
                                        setShowDeleteAlert(false);
                                    }}
                                    className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors text-cv-text-primary text-sm font-medium"
                                >
                                    <span>Eliminar solo este bloque</span>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-cv-bg-tertiary/50 p-3 flex justify-end">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeleteAlert(false);
                                }}
                                className="px-4 py-2 text-sm text-cv-text-secondary hover:text-cv-text-primary font-medium"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Confirmation Dialog for Non-Empty Blocks */}
            {showConfirmDelete && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-white dark:bg-cv-bg-secondary rounded-xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5">
                            <h3 className="text-lg font-semibold text-cv-text-primary mb-2 flex items-center gap-2">
                                <Trash2 size={20} className="text-red-500" />
                                ¿Eliminar bloque?
                            </h3>
                            <p className="text-sm text-cv-text-secondary mb-4">
                                Este bloque tiene contenido. ¿Estás seguro de que deseas eliminarlo?
                            </p>

                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowConfirmDelete(false);
                                    }}
                                    className="px-4 py-2 text-sm text-cv-text-secondary hover:text-cv-text-primary font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteBlock(block.id);
                                        setShowConfirmDelete(false);
                                    }}
                                    className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
