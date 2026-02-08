'use client';

import { useState } from 'react';
import { useEditorStore } from '@/lib/store';
import { ChevronDown, ChevronUp, Calendar, ArrowRight } from 'lucide-react';
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

    // Determine if this is a strength/classic block based on type
    const isStrength = type === 'strength_linear';

    // Type-safe accessors for config values
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
                rounded-lg border transition-all duration-200
                ${isCurrent
                    ? 'bg-cv-accent/5 border-cv-accent/30 ring-1 ring-cv-accent/20'
                    : isCurrentWeek
                        ? 'bg-slate-50 dark:bg-cv-bg-tertiary/50 border-slate-200 dark:border-slate-700'
                        : 'bg-white dark:bg-cv-bg-secondary border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }
            `}
        >
            {/* Header - Always visible */}
            <div
                className="flex items-center justify-between px-3 py-2 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    {/* Week Badge */}
                    <span className={`
                        text-xs font-bold px-2 py-0.5 rounded
                        ${isCurrent
                            ? 'bg-cv-accent text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-cv-text-secondary'
                        }
                    `}>
                        S{weekNumber}
                    </span>

                    {/* Day Name */}
                    <div className="flex items-center gap-1 text-cv-text-secondary">
                        <Calendar size={12} />
                        <span className="text-xs">{dayName}</span>
                    </div>

                    {/* Current indicator */}
                    {isCurrent && (
                        <span className="text-xs text-cv-accent font-medium">(actual)</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Quick preview of values when collapsed */}
                    {!isExpanded && isStrength && (
                        <div className="flex items-center gap-1.5 text-xs text-cv-text-tertiary">
                            {sets && <span>{String(sets)}x{reps ? String(reps) : '?'}</span>}
                            {percentage && <span>@{String(percentage)}%</span>}
                        </div>
                    )}

                    {/* Go to week button */}
                    {!isCurrent && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleGoToWeek();
                            }}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-cv-text-tertiary hover:text-cv-accent transition-colors"
                            title={`Ir a Semana ${weekNumber}`}
                        >
                            <ArrowRight size={14} />
                        </button>
                    )}

                    {/* Expand/Collapse */}
                    <div className="text-cv-text-tertiary">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </div>
            </div>

            {/* Expanded Content - Editable Fields */}
            {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-700/50 animate-in fade-in slide-in-from-top-1 duration-200">
                    {isStrength ? (
                        /* Strength Block Fields */
                        <div className="flex flex-wrap gap-2">
                            {/* Sets */}
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-cv-bg-tertiary px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700">
                                <span className="text-xs font-medium text-cv-text-secondary">Series</span>
                                <input
                                    type="number"
                                    min={1}
                                    value={sets !== undefined ? String(sets) : ''}
                                    onChange={(e) => handleConfigChange('sets', parseInt(e.target.value) || null)}
                                    className="bg-transparent border-none p-0 text-sm focus:ring-0 text-cv-text-primary font-bold w-8 text-center"
                                    placeholder="3"
                                />
                            </div>

                            {/* Reps */}
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-cv-bg-tertiary px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700">
                                <span className="text-xs font-medium text-cv-text-secondary">Reps</span>
                                <input
                                    type="text"
                                    value={reps !== undefined ? String(reps) : ''}
                                    onChange={(e) => handleConfigChange('reps', e.target.value)}
                                    className="bg-transparent border-none p-0 text-sm focus:ring-0 text-cv-text-primary font-bold w-10 text-center"
                                    placeholder="5"
                                />
                            </div>

                            {/* Percentage */}
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-cv-bg-tertiary px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700">
                                <span className="text-xs font-medium text-cv-text-secondary">%</span>
                                <input
                                    type="number"
                                    value={percentage !== undefined ? String(percentage) : ''}
                                    onChange={(e) => handleConfigChange('percentage', e.target.value)}
                                    className="bg-transparent border-none p-0 text-sm focus:ring-0 text-cv-text-primary font-medium w-10 text-center"
                                    placeholder="75"
                                />
                            </div>

                            {/* Rest */}
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-cv-bg-tertiary px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700">
                                <span className="text-xs font-medium text-cv-text-secondary">Desc</span>
                                <input
                                    type="text"
                                    value={rest !== undefined ? String(rest) : ''}
                                    onChange={(e) => handleConfigChange('rest', e.target.value)}
                                    className="bg-transparent border-none p-0 text-sm focus:ring-0 text-cv-text-primary font-medium w-8 text-center"
                                    placeholder="2m"
                                />
                            </div>

                            {/* Tempo (if visible) */}
                            {(showTempo || tempo) && (
                                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-cv-bg-tertiary px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700">
                                    <span className="text-xs font-medium text-cv-text-secondary">Tempo</span>
                                    <input
                                        type="text"
                                        value={tempo !== undefined ? String(tempo) : ''}
                                        onChange={(e) => handleConfigChange('tempo', e.target.value)}
                                        className="bg-transparent border-none p-0 text-sm focus:ring-0 text-cv-text-primary font-medium w-12 text-center"
                                        placeholder="30X1"
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Non-strength block - show notes only */
                        <div className="text-xs text-cv-text-tertiary italic">
                            {name || 'Sin nombre'}
                        </div>
                    )}

                    {/* Notes - Always available for all block types */}
                    <div className="mt-2">
                        <input
                            type="text"
                            value={notes !== undefined ? String(notes) : ''}
                            onChange={(e) => handleConfigChange('notes', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-cv-bg-tertiary text-xs text-cv-text-secondary px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-cv-accent/30 focus:border-cv-accent/30"
                            placeholder="Notas para esta semana..."
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
