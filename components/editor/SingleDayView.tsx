'use client';

import { useMemo } from 'react';
import { DayCard } from './DayCard';
import { Calendar, Target, Moon, Trash2, MoreHorizontal } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import type { DraftMesocycle } from '@/lib/store';
import { useEditorStore } from '@/lib/store';

interface SingleDayViewProps {
    mesocycle: DraftMesocycle;
    dayId: string;
    onSelectDay: (dayId: string) => void;
}

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function SingleDayView({ mesocycle, dayId, onSelectDay }: SingleDayViewProps) {
    const { toggleRestDay, updateDay, stimulusFeatures, clearDay } = useEditorStore();

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

    // Resolve Stimulus Color
    const activeStimulus = displayDay.stimulus_id ? stimulusFeatures.find(s => s.id === displayDay.stimulus_id) : null;

    return (
        <div className="h-full flex flex-col bg-slate-50/50 dark:bg-cv-bg-primary/50">
            {/* Day Selector Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-cv-bg-secondary flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <div className="p-1 bg-cv-accent/10 rounded-lg text-cv-accent">
                        <Calendar size={18} />
                    </div>

                    {/* Active Stimulus Badge */}
                    {activeStimulus && (
                        <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider"
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

                {/* Right side: Actions + Week */}
                <div className="flex items-center gap-2">
                    {/* Stimulus Selector */}
                    <Popover.Root>
                        <Popover.Trigger asChild>
                            <button
                                className="cv-btn-ghost p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-sm hover:text-cv-accent"
                                title="Cambiar foco del día"
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
                                        onClick={() => updateDay(dayId, { stimulus_id: null })}
                                        className="w-full text-left px-2 py-1.5 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-cv-text-secondary flex items-center gap-2"
                                    >
                                        <div className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600" />
                                        <span>Sin asignar</span>
                                    </button>
                                    {stimulusFeatures.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => updateDay(dayId, { stimulus_id: s.id })}
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

                    {/* Rest Day Toggle */}
                    <button
                        onClick={() => toggleRestDay(dayId)}
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
                                        onClick={() => clearDay(dayId)}
                                        className="w-full text-left px-2 py-2 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                        <span>Limpiar contenido</span>
                                    </button>
                                    <button
                                        onClick={() => toggleRestDay(dayId)}
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

                    {/* Week indicator */}
                    <span className="text-xs text-cv-text-tertiary ml-2 border-l border-slate-200 dark:border-slate-700 pl-3">
                        Semana {mesocycle.week_number}
                    </span>
                </div>
            </div>

            {/* Content Area - Single Large Day Card */}
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="h-full max-w-2xl mx-auto">
                    <DayCard
                        key={displayDay.id}
                        day={displayDay}
                        dayName={DAY_NAMES[displayDayIndex]}
                        isActiveInBuilder={true}
                        hideHeader={true}
                    />
                </div>
            </div>
        </div>
    );
}
