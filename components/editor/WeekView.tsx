'use client';

import { DayCard } from './DayCard';
import { WeeklySummaryCard } from './WeeklySummaryCard';
import { useEditorStore } from '@/lib/store';
import type { DraftMesocycle } from '@/lib/store';
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';

// Define the type here since it's not exported
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

interface WeekViewProps {
    mesocycle: {
        id: string;
        week_number: number;
        focus: string | null;
        attributes?: Record<string, unknown> | null;
        days: DraftDay[];
    };
    programGlobalFocus?: string | null;
    compressed?: boolean;
}

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function WeekView({ mesocycle, programGlobalFocus, compressed = false }: WeekViewProps) {
    const {
        blockBuilderDayId,
        setDraggedBlock,
        setDropTarget,
        moveBlockToDay,
        moveProgressionToDay,
        draggedBlockId
    } = useEditorStore();

    // Pointer sensor with activation constraint (5px movement to start drag)
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    // Find the block being dragged for the overlay
    const getDraggedBlock = (blockId?: string): DraftWorkoutBlock | null => {
        const searchId = blockId || draggedBlockId;
        if (!searchId) return null;

        // Search in all mesocycle days
        for (const meso of [mesocycle]) {
            for (const day of meso.days) {
                const block = day.blocks.find(b => b.id === searchId);
                if (block) return block;
            }
        }
        return null;
    };

    const handleDragStart = (event: DragStartEvent) => {
        const blockId = event.active.id as string;
        setDraggedBlock(blockId);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const overId = event.over?.id as string | undefined;
        // Only set drop target if it's a day (not a block)
        if (overId?.startsWith('day-')) {
            const dayId = overId.replace('day-', '');
            setDropTarget(dayId);
        } else {
            setDropTarget(null);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setDraggedBlock(null);
            setDropTarget(null);
            return;
        }

        const blockId = active.id as string;
        const overId = over.id as string;

        // Check if dropping on a day
        if (overId.startsWith('day-')) {
            const targetDayId = overId.replace('day-', '');

            // Find the block using the blockId from the event
            const draggedBlock = getDraggedBlock(blockId);

            if (draggedBlock) {
                // Check if dropping on a different day than current
                if (draggedBlock.day_id !== targetDayId) {
                    // Find the target day to get its day_number
                    const targetDay = mesocycle.days.find(d => d.id === targetDayId);

                    if (draggedBlock.progression_id && targetDay) {
                        // Move all progression blocks to the same day number across all weeks
                        moveProgressionToDay(draggedBlock.progression_id, targetDay.day_number);
                    } else {
                        // Simple move for non-progression blocks
                        moveBlockToDay(blockId, targetDayId);
                    }
                }
            }
        }

        setDraggedBlock(null);
        setDropTarget(null);
    };

    const handleDragCancel = () => {
        setDraggedBlock(null);
        setDropTarget(null);
    };

    // Ensure we have 7 days
    const days = Array.from({ length: 7 }, (_, i) => {
        const dayNumber = i + 1;
        const existingDay = mesocycle.days.find(d => d.day_number === dayNumber);

        if (existingDay) return existingDay;

        // Create placeholder day
        return {
            id: `placeholder-${mesocycle.id}-${dayNumber}`,
            mesocycle_id: mesocycle.id,
            day_number: dayNumber,
            name: null,
            is_rest_day: false,
            notes: null,
            blocks: [],
        };
    });

    // Compressed mode: simple 2-column grid with smaller cards
    if (compressed) {
        return (
            <div className="h-full flex flex-col p-2">
                <div className="grid grid-cols-2 gap-2 auto-rows-fr">
                    {days.map((day, index) => (
                        <DayCard
                            key={day.id}
                            day={day}
                            dayName={DAY_NAMES[index]}
                            compact={true}
                            isActiveInBuilder={day.id === blockBuilderDayId}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // Split days for Bento Grid layout
    // Row 1: Monday, Tuesday, Wednesday, Thursday (indices 0-3)
    // Row 2: Friday, Saturday, Sunday (indices 4-6) + Weekly Summary
    const row1Days = days.slice(0, 4);
    const row2Days = days.slice(4, 7);
    const draggedBlock = getDraggedBlock();

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="h-full flex flex-col">
                {/* BENTO GRID LAYOUT */}
                {/* Desktop: 4 cols x 2 rows | Tablet: 2 cols x 4 rows | Mobile: 1 col stack */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 grid-rows-[repeat(auto-fit,minmax(0,1fr))] xl:grid-rows-2 gap-4 min-h-0">
                    {/* Row 1: Monday - Thursday */}
                    {row1Days.map((day, index) => (
                        <DayCard
                            key={day.id}
                            day={day}
                            dayName={DAY_NAMES[index]}
                        />
                    ))}

                    {/* Row 2: Friday - Sunday + Weekly Summary */}
                    {row2Days.map((day, index) => (
                        <DayCard
                            key={day.id}
                            day={day}
                            dayName={DAY_NAMES[index + 4]}
                        />
                    ))}

                    {/* Weekly Summary - 8th slot */}
                    <WeeklySummaryCard mesocycle={mesocycle} programGlobalFocus={programGlobalFocus} />
                </div>
            </div>

            {/* Drag Overlay - Shows a preview of the block being dragged */}
            <DragOverlay dropAnimation={null}>
                {draggedBlock ? (
                    <div className="bg-white dark:bg-cv-bg-secondary rounded-lg shadow-xl border-2 border-cv-accent p-3 opacity-90 max-w-[200px]">
                        <div className="flex items-center gap-2">
                            <GripVertical size={14} className="text-cv-accent" />
                            <span className="text-sm font-medium text-cv-text-primary truncate">
                                {draggedBlock.name || 'Bloque'}
                            </span>
                        </div>
                        {draggedBlock.progression_id && (
                            <p className="text-xs text-cv-accent mt-1">
                                ↔ Se moverá en todas las semanas
                            </p>
                        )}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
