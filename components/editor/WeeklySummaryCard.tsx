'use client';

import { Target, TrendingUp, Dumbbell, Clock } from 'lucide-react';
import type { DraftMesocycle } from '@/lib/store';

interface WeeklySummaryCardProps {
    mesocycle: {
        id: string;
        week_number: number;
        focus: string | null;
        attributes?: Record<string, unknown> | null;
        days: Array<{
            blocks: Array<{
                type: string;
                config: Record<string, unknown>;
            }>;
        }>;
    };
}

export function WeeklySummaryCard({ mesocycle }: WeeklySummaryCardProps) {
    // Calculate weekly stats
    const totalBlocks = mesocycle.days.reduce((acc, day) => acc + day.blocks.length, 0);
    const trainingDays = mesocycle.days.filter(d => d.blocks.length > 0).length;

    // Count block types
    const strengthBlocks = mesocycle.days.reduce(
        (acc, day) => acc + day.blocks.filter(b => b.type === 'strength_linear').length,
        0
    );
    const metconBlocks = mesocycle.days.reduce(
        (acc, day) => acc + day.blocks.filter(b => b.type === 'metcon_structured').length,
        0
    );

    // Get strategy notes from attributes
    const attrs = (mesocycle.attributes || {}) as Record<string, unknown>;
    const considerations = (attrs.considerations as string) || '';
    const focus = (attrs.focus as string) || mesocycle.focus || '';

    return (
        <div className="cv-card h-full flex flex-col bg-gradient-to-br from-slate-50/80 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/30 border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cv-accent/10 flex items-center justify-center">
                        <Target size={16} className="text-cv-accent" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-cv-text-primary">Resumen Semanal</h3>
                        <p className="text-xs text-cv-text-tertiary">Semana {mesocycle.week_number}</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/60 dark:bg-slate-800/40 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-cv-text-tertiary mb-1">
                        <Clock size={12} />
                        <span className="text-xs">Días Entrenamiento</span>
                    </div>
                    <p className="text-xl font-bold text-cv-text-primary">{trainingDays}<span className="text-sm font-normal text-cv-text-tertiary">/7</span></p>
                </div>
                <div className="bg-white/60 dark:bg-slate-800/40 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-cv-text-tertiary mb-1">
                        <Dumbbell size={12} />
                        <span className="text-xs">Total Bloques</span>
                    </div>
                    <p className="text-xl font-bold text-cv-text-primary">{totalBlocks}</p>
                </div>
                <div className="bg-white/60 dark:bg-slate-800/40 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-red-500 mb-1">
                        <TrendingUp size={12} />
                        <span className="text-xs">Fuerza</span>
                    </div>
                    <p className="text-xl font-bold text-cv-text-primary">{strengthBlocks}</p>
                </div>
                <div className="bg-white/60 dark:bg-slate-800/40 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-cv-accent mb-1">
                        <TrendingUp size={12} />
                        <span className="text-xs">MetCon</span>
                    </div>
                    <p className="text-xl font-bold text-cv-text-primary">{metconBlocks}</p>
                </div>
            </div>

            {/* Focus/Notes */}
            {(focus || considerations) && (
                <div className="flex-1 bg-white/60 dark:bg-slate-800/40 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                    {focus && (
                        <div className="mb-2">
                            <span className="text-xs font-medium text-cv-accent">Enfoque:</span>
                            <p className="text-sm text-cv-text-primary mt-0.5">{focus}</p>
                        </div>
                    )}
                    {considerations && (
                        <div>
                            <span className="text-xs font-medium text-cv-text-tertiary">Notas:</span>
                            <p className="text-xs text-cv-text-secondary mt-0.5 line-clamp-3">{considerations}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Empty state if no focus */}
            {!focus && !considerations && (
                <div className="flex-1 flex items-center justify-center text-cv-text-tertiary">
                    <p className="text-xs text-center">
                        Usa "Estrategia" para añadir<br />notas de enfoque semanal
                    </p>
                </div>
            )}
        </div>
    );
}
