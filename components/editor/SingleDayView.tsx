'use client';

import { useMemo } from 'react';
import { DayCard } from './DayCard';
import { ChevronDown, Calendar } from 'lucide-react';
import type { DraftMesocycle } from '@/lib/store';

interface SingleDayViewProps {
    mesocycle: DraftMesocycle;
    dayId: string;
    onSelectDay: (dayId: string) => void;
}

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function SingleDayView({ mesocycle, dayId, onSelectDay }: SingleDayViewProps) {

    // Ensure we have 7 days structure like in WeekView
    const days = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const dayNumber = i + 1;
            const existingDay = mesocycle.days.find(d => d.day_number === dayNumber);

            if (existingDay) return existingDay;

            // Create placeholder day
            return {
                id: `placeholder-${mesocycle.id}-${dayNumber}`,
                tempId: `placeholder-${mesocycle.id}-${dayNumber}`,
                mesocycle_id: mesocycle.id,
                day_number: dayNumber,
                name: null,
                is_rest_day: false,
                notes: null,
                stimulus_id: null,
                blocks: [],
                isDirty: false
            };
        });
    }, [mesocycle]);

    const currentDay = days.find(d => d.id === dayId);

    // If for some reason the dayId is not found (e.g. initial load glitch), fallback to first day
    const displayDay = currentDay || days[0];
    const displayDayIndex = displayDay.day_number - 1;

    return (
        <div className="h-full flex flex-col bg-slate-50/50 dark:bg-cv-bg-primary/50">
            {/* Day Selector Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-cv-bg-secondary flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cv-accent/10 rounded-lg text-cv-accent">
                        <Calendar size={20} />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] uppercase font-bold text-cv-text-tertiary tracking-wider">
                            Día Seleccionado
                        </label>
                        <div className="relative group">
                            <select
                                value={dayId}
                                onChange={(e) => onSelectDay(e.target.value)}
                                className="appearance-none bg-transparent font-bold text-lg text-cv-text-primary pr-8 cursor-pointer focus:outline-none"
                            >
                                {days.map((day, index) => (
                                    <option key={day.id} value={day.id}>
                                        {DAY_NAMES[index]}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-cv-text-secondary pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-xs text-cv-text-tertiary">
                        Semana {mesocycle.week_number}
                    </p>
                </div>
            </div>

            {/* Content Area - Single Large Day Card */}
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="h-full max-w-2xl mx-auto">
                    <DayCard
                        day={displayDay}
                        dayName={DAY_NAMES[displayDayIndex]}
                        isActiveInBuilder={true}
                    />
                </div>
            </div>
        </div>
    );
}
