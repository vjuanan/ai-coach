'use client';

import { useEditorStore } from '@/lib/store';
import { WorkoutBlockCard } from './WorkoutBlockCard';
import { Plus, Moon, MoreHorizontal, Sun, Target, Trash2 } from 'lucide-react';
import type { BlockType, WorkoutFormat } from '@/lib/supabase/types';
import * as Popover from '@radix-ui/react-popover';
import { useDroppable } from '@dnd-kit/core';

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

interface DraftDay {
    id: string;
    tempId?: string;
    mesocycle_id: string;
    day_number: number;
    name: string | null;
    is_rest_day: boolean;
    notes: string | null;
    stimulus_id?: string | null;
    blocks: DraftWorkoutBlock[];
    isDirty?: boolean;
}

interface DayCardProps {
    day: DraftDay;
    dayName: string;
    compact?: boolean;
    isActiveInBuilder?: boolean;
}

const blockTypeOptions: { type: BlockType; label: string; color: string }[] = [
    { type: 'warmup', label: 'Calentamiento', color: 'bg-green-500' },
    { type: 'strength_linear', label: 'Fuerza', color: 'bg-red-500' },
    { type: 'metcon_structured', label: 'MetCon', color: 'bg-cv-accent' },
    { type: 'accessory', label: 'Accesorio', color: 'bg-purple-500' },
    { type: 'skill', label: 'Habilidad', color: 'bg-blue-500' },
    { type: 'free_text', label: 'Texto Libre', color: 'bg-gray-500' },
];

export function DayCard({ day, dayName, compact = false, isActiveInBuilder = false }: DayCardProps) {
    const { addBlock, toggleRestDay, selectDay, selectBlock, selectedDayId, dropTargetDayId, updateDay, stimulusFeatures, clearDay, enterBlockBuilder, blockBuilderMode, draggedBlockId } = useEditorStore();

    // Setup droppable
    const { isOver, setNodeRef } = useDroppable({
        id: `day-${day.id}`,
        disabled: day.is_rest_day,
    });

    const isSelected = selectedDayId === day.id;
    const isDropTarget = isOver || dropTargetDayId === day.id;
    const isDragging = draggedBlockId !== null;

    // Resolve Stimulus Color
    const activeStimulus = day.stimulus_id ? stimulusFeatures.find(s => s.id === day.stimulus_id) : null;

    const handleOpenBlockBuilder = (e: React.MouseEvent) => {
        e.stopPropagation();
        enterBlockBuilder(day.id);
    };

    // COMPACT MODE - Simplified card for compressed Week View
    if (compact) {
        return (
            <div
                className={`
                    cv-card h-full min-h-[100px] flex flex-col p-2.5
                    bg-white dark:bg-cv-bg-secondary
                    ${day.is_rest_day ? 'opacity-60' : ''}
                    transition-all duration-200
                `}
            >
                {/* Compact Header */}
                <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-xs font-bold text-cv-text-primary truncate">
                        {dayName}
                    </h4>
                </div>

                {/* Compact Content */}
                {day.is_rest_day ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Moon size={14} className="text-slate-400" />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                        {day.blocks.length > 0 ? (
                            day.blocks.slice(0, 3).map(block => (
                                <div
                                    key={block.id}
                                    className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800/50 rounded text-[10px] text-cv-text-secondary truncate"
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${blockTypeOptions.find(o => o.type === block.type)?.color || 'bg-slate-400'}`} />
                                    <span className="truncate">{block.name || block.type}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-cv-text-tertiary">
                                <Plus size={12} className="opacity-40" />
                            </div>
                        )}
                        {day.blocks.length > 3 && (
                            <p className="text-[9px] text-cv-text-tertiary text-center">
                                +{day.blocks.length - 3} más
                            </p>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // REST DAY CARD - Elegant empty state
    if (day.is_rest_day) {
        return (
            <div
                className={`
                    cv-card h-full flex flex-col p-4 
                    bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-800/30 dark:to-slate-900/20
                    border-slate-200 dark:border-slate-700
                    ${isSelected ? 'ring-2 ring-cv-accent' : ''}
                    transition-all duration-200 cursor-pointer
                `}
                onClick={() => selectDay(day.id)}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h3 className="text-base font-bold text-cv-text-primary">{dayName}</h3>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleRestDay(day.id); }}
                        className="cv-btn-ghost p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Editar día"
                    >
                        <MoreHorizontal size={16} />
                    </button>
                </div>

                {/* Rest Day Content */}
                <div className="flex-1 flex flex-col items-center justify-center text-cv-text-tertiary">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                        <Moon size={28} className="text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">Día de Descanso</p>
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleRestDay(day.id); }}
                        className="mt-4 flex items-center gap-1.5 text-xs text-cv-accent hover:text-cv-accent/80 transition-colors"
                    >
                        <Sun size={12} />
                        Convertir a entrenamiento
                    </button>
                </div>
            </div>
        );
    }

    // TRAINING DAY CARD - Full redesign
    return (
        <div
            ref={setNodeRef}
            className={`
                cv-card h-full flex flex-col p-4 relative
                ${isSelected ? 'shadow-lg' : ''}
                ${isDropTarget && isDragging ? 'ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-lg scale-[1.02]' : ''}
                ${isDragging && !isDropTarget ? 'opacity-80' : ''}
                transition-all duration-200 cursor-pointer hover:shadow-md
            `}
            onClick={() => !isActiveInBuilder && selectDay(day.id)}
            style={activeStimulus ? { borderColor: activeStimulus.color + '40' } : {}}
        >
            {/* Stimulus Blur Effect */}
            {activeStimulus && (
                <div
                    className="absolute inset-x-0 top-0 h-24 opacity-15 pointer-events-none blur-xl z-0"
                    style={{ backgroundColor: activeStimulus.color }}
                />
            )}

            {/* Drop Zone Indicator */}
            {isDropTarget && isDragging && (
                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                    <div className="px-4 py-2 bg-emerald-500 text-white rounded-full text-sm font-medium shadow-lg animate-pulse">
                        Soltar aquí
                    </div>
                </div>
            )}

            {/* Header - Only show when NOT in builder mode */}
            {!isActiveInBuilder && (
                <div className="relative z-10 flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex-1">
                        <h3 className="text-base font-bold text-cv-text-primary">{dayName}</h3>
                        {activeStimulus && (
                            <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider mt-0.5 inline-block"
                                style={{
                                    color: activeStimulus.color,
                                    borderColor: activeStimulus.color + '40',
                                    backgroundColor: activeStimulus.color + '10'
                                }}
                            >
                                {activeStimulus.name}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {/* Stimulus Selector */}
                        <Popover.Root>
                            <Popover.Trigger asChild>
                                <button
                                    className="cv-btn-ghost p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-sm hover:text-cv-accent"
                                    title="Cambiar foco del día"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Target size={14} className={activeStimulus ? '' : 'opacity-40'} style={activeStimulus ? { color: activeStimulus.color } : {}} />
                                </button>
                            </Popover.Trigger>
                            <Popover.Portal>
                                <Popover.Content
                                    className="min-w-[220px] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-200"
                                    sideOffset={5}
                                >
                                    <p className="text-xs font-semibold text-cv-text-tertiary mb-2 px-2">Foco / Estímulo</p>
                                    <div className="space-y-1">
                                        <button
                                            onClick={() => updateDay(day.id, { stimulus_id: null })}
                                            className="w-full text-left px-2 py-1.5 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-cv-text-secondary flex items-center gap-2"
                                        >
                                            <div className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600" />
                                            <span>Sin asignar</span>
                                        </button>
                                        {stimulusFeatures.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => updateDay(day.id, { stimulus_id: s.id })}
                                                className="w-full text-left px-2 py-1.5 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-cv-text-primary flex items-center gap-2"
                                            >
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                                                <span>{s.name}</span>
                                            </button>
                                        ))}
                                        {stimulusFeatures.length === 0 && (
                                            <p className="text-xs text-cv-text-tertiary px-2 italic">Configura estímulos en ajustes</p>
                                        )}
                                    </div>
                                    <Popover.Arrow className="fill-white dark:fill-slate-900 border-t border-l border-slate-200 dark:border-slate-700" />
                                </Popover.Content>
                            </Popover.Portal>
                        </Popover.Root>

                        <button
                            onClick={(e) => { e.stopPropagation(); toggleRestDay(day.id); }}
                            className="cv-btn-ghost p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-sm opacity-60 hover:opacity-100 hover:text-indigo-500"
                            title="Marcar como descanso"
                        >
                            <Moon size={14} />
                        </button>
                        {/* More Options Menu */}
                        <Popover.Root>
                            <Popover.Trigger asChild>
                                <button
                                    className="cv-btn-ghost p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-sm"
                                    title="Más opciones"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreHorizontal size={16} />
                                </button>
                            </Popover.Trigger>
                            <Popover.Portal>
                                <Popover.Content
                                    className="min-w-[180px] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 z-50 animate-in fade-in zoom-in-95 duration-200"
                                    sideOffset={5}
                                    align="end"
                                >
                                    <div className="space-y-0.5">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                clearDay(day.id);
                                            }}
                                            className="w-full text-left px-2 py-2 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                            <span>Limpiar contenido</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleRestDay(day.id);
                                            }}
                                            className="w-full text-left px-2 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-cv-text-secondary flex items-center gap-2 transition-colors"
                                        >
                                            <Moon size={14} />
                                            <span>Marcar como descanso</span>
                                        </button>
                                    </div>
                                    <Popover.Arrow className="fill-white dark:fill-slate-900 border-t border-l border-slate-200 dark:border-slate-700" />
                                </Popover.Content>
                            </Popover.Portal>
                        </Popover.Root>
                    </div>
                </div>
            )}

            {/* Workout Blocks - Cards within Card style */}
            <div className="flex-1 space-y-3 mb-8 overflow-y-auto p-4 -m-4">
                {day.blocks
                    .sort((a, b) => a.order_index - b.order_index)
                    .map(block => (
                        <WorkoutBlockCard key={block.id} block={block} />
                    ))
                }

                {/* Empty State - Clickable to open Block Builder */}
                {day.blocks.length === 0 && (
                    <div
                        className={`
                            h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-cv-text-tertiary cursor-pointer transition-colors
                            ${isDropTarget && isDragging
                                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20'
                                : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:border-cv-accent/50'
                            }
                        `}
                        onClick={handleOpenBlockBuilder}
                    >
                        <Plus size={20} className="mb-2 opacity-40" />
                        <p className="text-sm">Aún no hay bloques</p>
                        <p className="text-xs opacity-60 mt-1">Click para añadir</p>
                    </div>
                )}
            </div>

            {/* Add Block Button - Opens Block Builder Mode */}
            <div className="flex-shrink-0 group/add">
                <button
                    className="w-full py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-cv-text-secondary group-hover/add:text-cv-accent group-hover/add:border-cv-accent group-hover/add:bg-cv-accent/5 group-hover/add:shadow-[0_0_20px_rgba(var(--color-cv-accent-rgb),0.15)] group-hover/add:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                    onClick={handleOpenBlockBuilder}
                >
                    <Plus size={16} className="group-hover/add:stroke-[2.5] transition-all" />
                    <span className="text-sm">Añadir Bloque</span>
                </button>
            </div>
        </div>
    );
}
