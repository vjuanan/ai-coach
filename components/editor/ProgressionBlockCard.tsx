'use client';

import { useState } from 'react';
import { useEditorStore } from '@/lib/store';
import { ChevronDown, ChevronUp, Calendar, ArrowRight, Layers, Repeat, Percent, Clock, Timer } from 'lucide-react';
import type { WorkoutConfig } from '@/lib/supabase/types';

interface ProgressionBlockCardProps {
    blockId: string;
    weekNumber: number;
    dayName: string;
    config: WorkoutConfig;
    name: string | null;
    type: string;
    format: string | null;
    isCurrentWeek: boolean;
    isCurrent: boolean;
    onUpdate: (blockId: string, updates: { config: WorkoutConfig }) => void;
}

export function ProgressionBlockCard({
    blockId,
    weekNumber,
    dayName,
    config,
    name,
    type,
    isCurrentWeek,
    isCurrent,
    onUpdate
}: ProgressionBlockCardProps) {
    const [isExpanded, setIsExpanded] = useState(isCurrent);
    const { selectWeek } = useEditorStore();

    const handleConfigChange = (key: string, value: unknown) => {
        onUpdate(blockId, {
            config: { ...config, [key]: value } as WorkoutConfig
        });
    };

    const handleGoToWeek = () => {
        selectWeek(weekNumber);
    };

    const isStrength = type === 'strength_linear';

    const sets = 'sets' in config ? config.sets : undefined;
    const reps = 'reps' in config ? config.reps : undefined;
    const percentage = 'percentage' in config ? config.percentage : undefined;
    const rest = 'rest' in config ? config.rest : undefined;
    const tempo = 'tempo' in config ? config.tempo : undefined;
    const showTempo = 'show_tempo' in config ? config.show_tempo : false;
    const notes = 'notes' in config ? config.notes : undefined;

    return (
        <div
            className={`
                rounded-xl border transition-all duration-200 overflow-hidden
                ${isCurrent
                    ? 'bg-white dark:bg-cv-bg-secondary border-cv-accent shadow-sm ring-1 ring-cv-accent/20'
                    : isCurrentWeek
                        ? 'bg-slate-50/50 dark:bg-cv-bg-tertiary/30 border-slate-200 dark:border-slate-700'
                        : 'bg-white dark:bg-cv-bg-secondary border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }
            `}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-3 py-2.5 cursor-pointer bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <span className={`
                        text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider
                        ${isCurrent
                            ? 'bg-cv-accent text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-cv-text-tertiary'
                        }
                    `}>
                        Week {weekNumber}
                    </span>

                    <div className="flex items-center gap-1.5 text-cv-text-secondary">
                        <span className="text-xs font-medium">{dayName}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {!isCurrent && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleGoToWeek();
                            }}
                            className="p-1.5 rounded-md text-cv-text-tertiary hover:text-cv-accent hover:bg-cv-accent/5 transition-all"
                        >
                            <ArrowRight size={14} />
                        </button>
                    )}
                    <div className={`text-cv-text-tertiary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={14} />
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-1 duration-200">
                    <div className="h-px w-full bg-slate-100 dark:bg-slate-800 mb-3" />

                    {isStrength ? (
                        <div className="grid grid-cols-4 gap-2">
                            <MiniInput
                                label="SERIES"
                                value={sets}
                                onChange={(v) => handleConfigChange('sets', parseInt(v) || null)}
                                type="number"
                                placeholder="3"
                                icon={Layers}
                            />
                            <MiniInput
                                label="REPS"
                                value={reps}
                                onChange={(v) => handleConfigChange('reps', v)}
                                type="text"
                                placeholder="5"
                                icon={Repeat}
                            />
                            <MiniInput
                                label="INTENSIDAD"
                                value={percentage}
                                onChange={(v) => handleConfigChange('percentage', v)}
                                type="number"
                                placeholder="75"
                                suffix="%"
                                icon={Percent}
                            />
                            <MiniInput
                                label="REST"
                                value={rest}
                                onChange={(v) => handleConfigChange('rest', v)}
                                type="text"
                                placeholder="2m"
                                icon={Clock}
                            />

                            {(showTempo || tempo) && (
                                <div className="col-span-4 mt-1">
                                    <MiniInput
                                        label="TEMPO"
                                        value={tempo}
                                        onChange={(v) => handleConfigChange('tempo', v)}
                                        type="text"
                                        placeholder="30X1"
                                        icon={Timer}
                                        fullWidth
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-xs text-cv-text-tertiary italic p-1">
                            {name || 'Sin nombre'}
                        </div>
                    )}

                    {/* Notes */}
                    <div className="mt-2.5">
                        <input
                            type="text"
                            value={notes !== undefined ? String(notes) : ''}
                            onChange={(e) => handleConfigChange('notes', e.target.value)}
                            className="w-full bg-transparent text-xs text-cv-text-secondary placeholder:text-cv-text-tertiary/50 border-b border-transparent hover:border-slate-200 focus:border-cv-accent focus:ring-0 px-0 py-1 transition-colors"
                            placeholder="Añadir notas..."
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// Mini Input Component equivalent to the new design
function MiniInput({
    label,
    value,
    onChange,
    type,
    placeholder,
    suffix,
    icon: Icon,
    fullWidth
}: {
    label: string,
    value: any,
    onChange: (v: string) => void,
    type: string,
    placeholder: string,
    suffix?: string,
    icon?: any,
    fullWidth?: boolean
}) {
    return (
        <div className={`
            bg-slate-50 dark:bg-slate-900/50 rounded-lg p-1.5 border border-slate-100 dark:border-slate-800
            hover:border-slate-300 dark:hover:border-slate-700 transition-colors group
            ${fullWidth ? 'flex items-center gap-3' : 'flex flex-col gap-0.5'}
        `}>
            <div className="flex items-center gap-1 text-[9px] font-bold text-cv-text-tertiary uppercase tracking-wider">
                {Icon && <Icon size={10} className="stroke-[2.5px] opacity-70" />}
                <span>{label}</span>
            </div>
            <div className="flex items-baseline justify-center">
                <input
                    type={type}
                    value={value !== undefined ? String(value) : ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={`
                        bg-transparent border-none p-0 text-cv-text-primary font-bold focus:ring-0 text-center
                        ${fullWidth ? 'text-sm text-left w-full pl-1' : 'text-sm w-full'}
                    `}
                    placeholder={placeholder}
                />
                {suffix && <span className="text-[10px] text-cv-text-tertiary ml-0.5 font-medium">{suffix}</span>}
            </div>
        </div>
    );
}
