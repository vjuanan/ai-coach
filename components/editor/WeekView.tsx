'use client';

import { DayCard } from './DayCard';
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
        days: DraftDay[];
    };
}

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function WeekView({ mesocycle }: WeekViewProps) {
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

    return (
        <div className="space-y-4">
            {/* Week Focus Header */}
            {mesocycle.focus && (
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-px bg-cv-border" />
                    <div className="px-4 py-1.5 rounded-full bg-cv-accent-muted text-cv-accent text-sm font-medium">
                        Enfoque: {mesocycle.focus}
                    </div>
                    <div className="flex-1 h-px bg-cv-border" />
                </div>
            )}

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-3">
                {days.map((day, index) => (
                    <DayCard
                        key={day.id}
                        day={day}
                        dayName={DAY_NAMES[index]}
                    />
                ))}
            </div>
        </div>
    );
}
