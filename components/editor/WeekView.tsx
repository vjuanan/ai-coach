'use client';

import { DayCard } from './DayCard';
import { WeeklySummaryCard } from './WeeklySummaryCard';
import { useEditorStore } from '@/lib/store';
import type { DraftMesocycle } from '@/lib/store';

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
    const { blockBuilderDayId } = useEditorStore();

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

    return (
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
    );
}

