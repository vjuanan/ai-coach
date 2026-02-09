'use client';

import { useMemo, useState } from 'react';
import { DayCard } from './DayCard';
import { ChevronDown, Calendar, Check } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
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
                <div className="flex items-center gap-1">
                    <div className="p-1 bg-cv-accent/10 rounded-lg text-cv-accent">
                        <Calendar size={18} />
                    </div>

                    <Popover.Root>
                        <Popover.Trigger asChild>
                            <button className="flex items-center gap-0.5 focus:outline-none hover:bg-slate-50 dark:hover:bg-slate-800 rounded px-1 -ml-1 transition-colors">
                                <span className="font-bold text-lg text-cv-text-primary text-left">
                                    {DAY_NAMES[days.findIndex(d => d.id === dayId)] || 'Seleccionar'}
                                </span>
                                <ChevronDown size={14} className="text-cv-text-secondary mt-0.5" />
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content
                                className="min-w-[160px] bg-white dark:bg-cv-bg-secondary rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 z-50 animate-in fade-in zoom-in-95 duration-200"
                                sideOffset={4}
                                align="start"
                            >
                                <div className="flex flex-col gap-0.5">
                                    {days.map((day, index) => (
                                        <button
                                            key={day.id}
                                            onClick={() => onSelectDay(day.id)}
                                            className={`
                                                w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between
                                                ${day.id === dayId
                                                    ? 'bg-cv-accent/10 text-cv-accent font-medium'
                                                    : 'text-cv-text-primary hover:bg-slate-100 dark:hover:bg-slate-800'}
                                            `}
                                        >
                                            <span>{DAY_NAMES[index]}</span>
                                            {day.id === dayId && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
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
