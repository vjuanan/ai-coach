'use client';

import { Target, TrendingUp, Dumbbell, Clock, Crosshair, MoreHorizontal, Copy } from 'lucide-react';
import type { DraftMesocycle } from '@/lib/store';
import { useEditorStore } from '@/lib/store';
import * as Popover from '@radix-ui/react-popover';
import { useState } from 'react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

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
    programGlobalFocus?: string | null;
}

export function WeeklySummaryCard({ mesocycle, programGlobalFocus }: WeeklySummaryCardProps) {
    const { copyWeekToFutureWeeks } = useEditorStore();
    const [showCopyConfirm, setShowCopyConfirm] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

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
            {/* Mesocycle Goal Banner - Show if programGlobalFocus exists */}
            {programGlobalFocus && (
                <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-cv-accent/15 via-purple-500/10 to-cv-accent/5 border border-cv-accent/20">
                    <div className="flex items-center gap-2 mb-1">
                        <Crosshair size={14} className="text-cv-accent" />
                        <span className="text-xs font-semibold text-cv-accent uppercase tracking-wide">
                            🎯 Objetivo del Mesociclo
                        </span>
                    </div>
                    <p className="text-sm font-medium text-cv-text-primary leading-snug whitespace-pre-wrap">
                        {programGlobalFocus}
                    </p>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cv-accent/10 flex items-center justify-center">
                        <Target size={16} className="text-cv-accent" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-cv-text-primary">Resumen Semanal</h3>
                        <div className="flex items-center gap-2 text-xs text-cv-text-tertiary">
                            <span>Semana {mesocycle.week_number}</span>
                            {focus && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-cv-text-tertiary/40" />
                                    <span className="text-cv-accent font-medium">{focus}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* More Options Menu */}
                <Popover.Root>
                    <Popover.Trigger asChild>
                        <button
                            className="cv-btn-ghost p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-sm"
                            title="Más opciones"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreHorizontal size={16} />
                        </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Content
                            className="min-w-[220px] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 z-50 animate-in fade-in zoom-in-95 duration-200"
                            sideOffset={5}
                            align="end"
                        >
                            <div className="space-y-0.5">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowCopyConfirm(true);
                                    }}
                                    className="w-full text-left px-2 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-cv-text-secondary flex items-center gap-2 transition-colors"
                                >
                                    <Copy size={14} />
                                    <span>Copiar semana a futuras</span>
                                </button>
                            </div>
                            <Popover.Arrow className="fill-white dark:fill-slate-900 border-t border-l border-slate-200 dark:border-slate-700" />
                        </Popover.Content>
                    </Popover.Portal>
                </Popover.Root>
            </div>

            <ConfirmationModal
                isOpen={showCopyConfirm}
                onClose={() => setShowCopyConfirm(false)}
                onConfirm={async () => {
                    setIsCopying(true);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    copyWeekToFutureWeeks(mesocycle.id);
                    setIsCopying(false);
                    setShowCopyConfirm(false);
                }}
                title="¿Copiar semana completa?"
                description="Se reemplazará TODO el contenido (bloques, notas, descansos) de las semanas futuras con la estructura de esta semana."
                confirmText="Sí, reemplazar todo"
                cancelText="Cancelar"
                variant="danger"
                isLoading={isCopying}
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
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
            {
                (considerations) && (
                    <div className="flex-1 bg-white/60 dark:bg-slate-800/40 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                        {considerations && (
                            <div>
                                <span className="text-xs font-medium text-cv-text-tertiary">Notas:</span>
                                <p className="text-xs text-cv-text-secondary mt-0.5 line-clamp-3">{considerations}</p>
                            </div>
                        )}
                    </div>
                )
            }

            {/* Empty state if no focus */}
            {
                !focus && !considerations && !programGlobalFocus && (
                    <div className="flex-1 flex items-center justify-center text-cv-text-tertiary">
                        <p className="text-xs text-center">
                            Usa &quot;Estrategia&quot; para añadir<br />notas de enfoque semanal
                        </p>
                    </div>
                )
            }
        </div >
    );
}

