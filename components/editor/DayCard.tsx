'use client';

import { useEditorStore } from '@/lib/store';
import { WorkoutBlockCard } from './WorkoutBlockCard';
import { Plus, Moon, MoreHorizontal, Edit3, Sun } from 'lucide-react';
import type { BlockType } from '@/lib/supabase/types';

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
}

interface DraftDay {
    id: string;
    tempId?: string;
    mesocycle_id: string;
    day_number: number;
    name: string | null;
    is_rest_day: boolean;
    notes: string | null;
    blocks: DraftWorkoutBlock[];
    isDirty?: boolean;
}

interface DayCardProps {
    day: DraftDay;
    dayName: string;
}

const blockTypeOptions: { type: BlockType; label: string; color: string }[] = [
    { type: 'warmup', label: 'Calentamiento', color: 'bg-green-500' },
    { type: 'strength_linear', label: 'Fuerza', color: 'bg-red-500' },
    { type: 'metcon_structured', label: 'MetCon', color: 'bg-cv-accent' },
    { type: 'accessory', label: 'Accesorio', color: 'bg-purple-500' },
    { type: 'skill', label: 'Habilidad', color: 'bg-blue-500' },
    { type: 'free_text', label: 'Texto Libre', color: 'bg-gray-500' },
];

export function DayCard({ day, dayName }: DayCardProps) {
    const { addBlock, toggleRestDay, selectDay, selectedDayId, dropTargetDayId } = useEditorStore();

    const isSelected = selectedDayId === day.id;
    const isDropTarget = dropTargetDayId === day.id;

    const handleAddBlock = (type: BlockType) => {
        addBlock(day.id, type);
    };

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
                        <p className="text-xs text-cv-text-tertiary">Día {day.day_number}</p>
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
            className={`
                cv-card h-full flex flex-col p-4
                ${isSelected ? 'ring-2 ring-cv-accent shadow-lg' : ''}
                ${isDropTarget ? 'cv-drop-target ring-2 ring-cv-accent/50' : ''}
                transition-all duration-200 cursor-pointer hover:shadow-md
            `}
            onClick={() => selectDay(day.id)}
        >
            {/* Header - Improved hierarchy */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-cv-text-primary">{dayName}</h3>
                        {day.blocks.length > 0 && (
                            <span className="px-2 py-0.5 bg-cv-accent/10 text-cv-accent text-xs font-medium rounded-full">
                                {day.blocks.length} {day.blocks.length === 1 ? 'bloque' : 'bloques'}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-cv-text-tertiary mt-0.5">Día {day.day_number}</p>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleRestDay(day.id); }}
                        className="cv-btn-ghost p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors opacity-60 hover:opacity-100"
                        title="Marcar como descanso"
                    >
                        <Moon size={14} />
                    </button>
                    <button
                        className="cv-btn-ghost p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Más opciones"
                    >
                        <MoreHorizontal size={16} />
                    </button>
                </div>
            </div>

            {/* Workout Blocks - Cards within Card style */}
            <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
                {day.blocks
                    .sort((a, b) => a.order_index - b.order_index)
                    .map(block => (
                        <div
                            key={block.id}
                            className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow transition-shadow"
                        >
                            <WorkoutBlockCard block={block} />
                        </div>
                    ))
                }

                {/* Empty State - Elegant */}
                {day.blocks.length === 0 && (
                    <div className="h-32 bg-slate-50 dark:bg-slate-800/30 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-cv-text-tertiary">
                        <Plus size={20} className="mb-2 opacity-40" />
                        <p className="text-sm">Aún no hay bloques</p>
                        <p className="text-xs opacity-60 mt-1">Añade uno abajo</p>
                    </div>
                )}
            </div>

            {/* Add Block Button - Improved dropdown */}
            <div className="relative group/add flex-shrink-0">
                <button
                    className="w-full py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-cv-text-secondary hover:text-cv-accent hover:border-cv-accent hover:bg-cv-accent/5 transition-all flex items-center justify-center gap-2 font-medium"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Plus size={16} />
                    <span className="text-sm">Añadir Bloque</span>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-cv-bg-tertiary border border-slate-200 dark:border-cv-border rounded-xl shadow-xl opacity-0 invisible group-hover/add:opacity-100 group-hover/add:visible transition-all z-20 overflow-hidden">
                    <div className="p-1">
                        {blockTypeOptions.map(option => (
                            <button
                                key={option.type}
                                onClick={(e) => { e.stopPropagation(); handleAddBlock(option.type); }}
                                className="w-full px-3 py-2.5 text-left text-sm text-cv-text-secondary hover:text-cv-text-primary hover:bg-slate-50 dark:hover:bg-cv-bg-elevated flex items-center gap-3 rounded-lg transition-colors"
                            >
                                <span className={`w-3 h-3 rounded-full ${option.color}`} />
                                <span className="font-medium">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
