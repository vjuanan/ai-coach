'use client';

import { useEditorStore } from '@/lib/store';
import { GripVertical, Copy, Trash2, ChevronDown, TrendingUp, Check, X, Link } from 'lucide-react';
import { useState, useRef } from 'react';
import type { BlockType, WorkoutFormat } from '@/lib/supabase/types';
import { useDraggable } from '@dnd-kit/core';
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
}

interface WorkoutBlockCardProps {
    block: DraftWorkoutBlock;
}

const blockTypeStyles: Record<string, { color: string; label: string; hoverClass: string }> = {
    warmup: { color: 'modality-warmup', label: 'Calentamiento', hoverClass: 'hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-md hover:-translate-y-0.5' },
    strength_linear: { color: 'modality-strength', label: 'Fuerza', hoverClass: 'hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-md hover:-translate-y-0.5' },
    metcon_structured: { color: 'modality-metcon', label: 'MetCon', hoverClass: 'hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-md hover:-translate-y-0.5' },
    accessory: { color: 'modality-accessory', label: 'Accesorio', hoverClass: 'hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-md hover:-translate-y-0.5' },
    skill: { color: 'modality-skill', label: 'Habilidad', hoverClass: 'hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-md hover:-translate-y-0.5' },
    free_text: { color: 'border-l-4 border-l-gray-500', label: 'Notas', hoverClass: 'hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-md hover:-translate-y-0.5' },
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

export function WorkoutBlockCard({ block }: WorkoutBlockCardProps) {
    const { selectBlock, selectedBlockId, deleteBlock, deleteProgression, duplicateBlock, enterBlockBuilder, draggedBlockId } = useEditorStore();
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const wasDraggingRef = useRef(false);
    const { getBenchmark } = useAthleteBenchmarks();

    // Setup draggable
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: block.id,
    });

    // Track drag state to prevent onClick after drag
    if (isDragging && !wasDraggingRef.current) {
        wasDraggingRef.current = true;
    }

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
    } : undefined;

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
        switch (block.type) {
            case 'strength_linear':
                const sets = config.sets as number;
                const reps = config.reps as string;
                const percentage = config.percentage as string;

                // Calculate weight for preview
                let calculatedWeight: number | null = null;

                if (percentage && (block.name || config.exercise)) {
                    const exerciseName = (config.exercise as string) || block.name || '';
                    const rm = getBenchmark(exerciseName);
                    const pct = parseInt(percentage.replace('%', ''), 10);

                    if (rm && !isNaN(pct) && pct > 0) {
                        calculatedWeight = Math.round((rm * pct) / 100);
                    }
                }

                return (
                    <div className="text-sm min-h-[1.25rem]">
                        {sets && reps ? `${sets} x ${reps}` : ''}
                        {percentage && <span className="text-cv-accent ml-1">@ {percentage}</span>}
                        {calculatedWeight !== null && (
                            <span className="text-cv-text-tertiary ml-1 text-xs">({calculatedWeight} kg)</span>
                        )}
                    </div>
                );

            case 'metcon_structured':
                const format = block.format;
                const movements = config.movements as string[] || [];
                return (
                    <div className="min-h-[1.25rem]">
                        {format && (
                            <span className="cv-badge-accent mb-1">{formatLabels[format] || format}</span>
                        )}
                        {movements.length > 0 && (
                            <div className="text-xs text-cv-text-tertiary mt-1 truncate">
                                {movements.slice(0, 2).join(', ')}
                                {movements.length > 2 && ` +${movements.length - 2} más`}
                            </div>
                        )}
                    </div>
                );

            case 'warmup':
            case 'accessory':
            case 'skill':
                // Check both 'exercises' (old?) and 'movements' (new generic form)
                const items = (config.movements as string[]) || (config.exercises as string[]) || [];
                const notes = config.notes as string;

                if (items.length === 0 && !notes) return <div className="min-h-[1.25rem]" />;

                return (
                    <div className="text-xs text-cv-text-tertiary min-h-[1.25rem]">
                        {items.length > 0 ? (
                            <div className="flex flex-col gap-0.5">
                                {items.slice(0, 2).map((item, i) => (
                                    <div key={i} className="truncate">• {item}</div>
                                ))}
                                {items.length > 2 && <div className="italic">+ {items.length - 2} más</div>}
                            </div>
                        ) : (
                            <div className="italic truncate">{notes}</div>
                        )}
                    </div>
                );

            case 'free_text':
                const content = config.content as string;
                return (
                    <div className="text-xs text-cv-text-tertiary truncate min-h-[1.25rem]">
                        {content || ''}
                    </div>
                );

            default:
                return <div className="min-h-[1.25rem]" />;
        }
    };

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                {...listeners}
                {...attributes}
                className={`
                    group/block relative bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm cursor-grab active:cursor-grabbing touch-none
                    transition-all duration-150
                    ${blockStyle.color}
                    ${!isBeingDragged && !isSelected ? blockStyle.hoverClass : ''}
                    ${isSelected ? 'ring-2 ring-cv-accent' : ''}
                    ${isBeingDragged ? 'opacity-50 scale-95 shadow-none' : ''}
                `}
                onClick={(e) => {
                    e.stopPropagation();
                    // Prevent click if we just finished dragging
                    if (wasDraggingRef.current) {
                        wasDraggingRef.current = false;
                        return;
                    }
                    enterBlockBuilder(block.day_id);
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
                                {/* Green Tick for Completed Blocks */}
                                {Boolean(config.is_completed) && (
                                    <div title="Bloque completado">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center">
                                            <Check size={8} className="text-white stroke-[3]" />
                                        </div>
                                    </div>
                                )}
                                {block.progression_id && (
                                    <div title="Progresión vinculada">
                                        <Link size={10} className="text-cv-accent" />
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
