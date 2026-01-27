'use client';

import { useEditorStore } from '@/lib/store';
import { WorkoutBlockCard } from './WorkoutBlockCard';
import { Plus, Moon, MoreHorizontal } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

    if (day.is_rest_day) {
        return (
            <div
                className={`
          cv-card min-h-[300px] flex flex-col opacity-60
          ${isSelected ? 'ring-2 ring-cv-accent' : ''}
        `}
                onClick={() => selectDay(day.id)}
            >
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-sm font-semibold text-cv-text-primary">{dayName}</h3>
                        <p className="text-xs text-cv-text-tertiary">Día {day.day_number}</p>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleRestDay(day.id); }}
                        className="cv-btn-ghost p-1"
                    >
                        <MoreHorizontal size={16} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-cv-text-tertiary">
                    <Moon size={32} className="mb-2 opacity-50" />
                    <p className="text-sm font-medium">Día de Descanso</p>
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleRestDay(day.id); }}
                        className="mt-4 text-xs text-cv-accent hover:underline"
                    >
                        Convertir a día de entrenamiento
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`
        cv-card min-h-[300px] flex flex-col transition-all
        ${isSelected ? 'ring-2 ring-cv-accent' : ''}
        ${isDropTarget ? 'cv-drop-target' : ''}
      `}
            onClick={() => selectDay(day.id)}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-sm font-semibold text-cv-text-primary">{dayName}</h3>
                    <p className="text-xs text-cv-text-tertiary">Day {day.day_number}</p>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleRestDay(day.id); }}
                        className="cv-btn-ghost p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Marcar como descanso"
                    >
                        <Moon size={14} />
                    </button>
                    <button className="cv-btn-ghost p-1">
                        <MoreHorizontal size={16} />
                    </button>
                </div>
            </div>

            {/* Workout Blocks */}
            <div className="flex-1 space-y-2 mb-3">
                {day.blocks
                    .sort((a, b) => a.order_index - b.order_index)
                    .map(block => (
                        <WorkoutBlockCard key={block.id} block={block} />
                    ))
                }

                {day.blocks.length === 0 && (
                    <div className="h-20 border border-dashed border-cv-border rounded-lg flex items-center justify-center text-cv-text-tertiary text-sm">
                        Aún no hay bloques
                    </div>
                )}
            </div>

            {/* Add Block Button */}
            <div className="relative group/add">
                <button
                    className="w-full py-2 border border-dashed border-cv-border rounded-lg text-cv-text-tertiary hover:text-cv-text-primary hover:border-cv-text-tertiary transition-all flex items-center justify-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Plus size={14} />
                    <span className="text-xs">Añadir Bloque</span>
                </button>

                {/* Dropdown */}
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-cv-bg-tertiary border border-cv-border rounded-lg shadow-cv-lg opacity-0 invisible group-hover/add:opacity-100 group-hover/add:visible transition-all z-10">
                    {blockTypeOptions.map(option => (
                        <button
                            key={option.type}
                            onClick={(e) => { e.stopPropagation(); handleAddBlock(option.type); }}
                            className="w-full px-3 py-2 text-left text-sm text-cv-text-secondary hover:text-cv-text-primary hover:bg-cv-bg-elevated flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg"
                        >
                            <span className={`w-2 h-2 rounded-full ${option.color}`} />
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
