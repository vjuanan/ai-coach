'use client';

import { useEditorStore } from '@/lib/store';
import { ProgressionBlockCard } from './ProgressionBlockCard';
import { TrendingUp, Layers } from 'lucide-react';
import type { WorkoutConfig } from '@/lib/supabase/types';

interface ProgressionPreviewProps {
    currentBlockId: string;
    progressionId: string;
}

interface ProgressionBlock {
    blockId: string;
    weekNumber: number;
    dayNumber: number;
    dayName: string | null;
    config: WorkoutConfig;
    name: string | null;
    type: string;
    format: string | null;
    isCurrentWeek: boolean;
}

const DAY_NAMES: Record<number, string> = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    7: 'Domingo'
};

export function ProgressionPreview({ currentBlockId, progressionId }: ProgressionPreviewProps) {
    const { mesocycles, selectedWeek, updateBlock } = useEditorStore();

    // Find all blocks with this progression_id across all weeks
    const progressionBlocks: ProgressionBlock[] = [];

    for (const meso of mesocycles) {
        for (const day of meso.days) {
            for (const block of day.blocks) {
                if (block.progression_id === progressionId) {
                    progressionBlocks.push({
                        blockId: block.id,
                        weekNumber: meso.week_number,
                        dayNumber: day.day_number,
                        dayName: day.name || DAY_NAMES[day.day_number] || `Día ${day.day_number}`,
                        config: block.config || {} as WorkoutConfig,
                        name: block.name,
                        type: block.type,
                        format: block.format,
                        isCurrentWeek: meso.week_number === selectedWeek
                    });
                }
            }
        }
    }

    // Sort by week number
    progressionBlocks.sort((a, b) => a.weekNumber - b.weekNumber);

    // If no blocks found, still show (shouldn't happen if progression_id is valid)
    if (progressionBlocks.length === 0) {
        return (
            <div className="mt-4 p-3 text-sm text-cv-text-tertiary italic bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                No se encontraron bloques vinculados a esta progresión.
            </div>
        );
    }

    const totalWeeks = progressionBlocks.length;
    const isGrid = totalWeeks <= 4;

    const handleBlockUpdate = (blockId: string, updates: { config: WorkoutConfig }) => {
        updateBlock(blockId, updates);
    };

    return (
        <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 text-cv-accent">
                    <TrendingUp size={16} className="stroke-[2.5]" />
                    <span className="text-sm font-bold">Vista de Progresión</span>
                </div>
                <div className="flex items-center gap-1 text-cv-text-tertiary">
                    <Layers size={12} />
                    <span className="text-xs">{totalWeeks} semanas</span>
                </div>
                {progressionBlocks[0]?.config?.progression_variable && (
                    <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${(progressionBlocks[0].config.progression_variable as string) === 'percentage'
                        ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>
                        {(progressionBlocks[0].config.progression_variable as string) === 'percentage' ? 'Fuerza' : 'Volumen'}
                    </span>
                )}
            </div>

            {/* Progression Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                            <th className="px-3 py-2 text-left font-semibold text-cv-text-secondary text-xs uppercase tracking-wider">Semana</th>
                            <th className="px-3 py-2 text-center font-semibold text-cv-text-secondary text-xs uppercase tracking-wider">Series</th>
                            <th className="px-3 py-2 text-center font-semibold text-cv-text-secondary text-xs uppercase tracking-wider">Reps</th>
                            <th className="px-3 py-2 text-center font-semibold text-cv-text-secondary text-xs uppercase tracking-wider">%</th>
                            <th className="px-3 py-2 text-center font-semibold text-cv-text-secondary text-xs uppercase tracking-wider">Rest</th>
                            <th className="px-3 py-2 text-center font-semibold text-cv-text-secondary text-xs uppercase tracking-wider">Tempo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {progressionBlocks.map((block, index) => {
                            const isCurrentRow = block.blockId === currentBlockId;
                            const config = block.config;

                            return (
                                <tr
                                    key={block.blockId}
                                    className={`
                                        border-b border-slate-100 dark:border-slate-800 last:border-0
                                        ${isCurrentRow
                                            ? 'bg-cv-accent/10 dark:bg-cv-accent/5 ring-2 ring-inset ring-cv-accent/30'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                                        }
                                        transition-colors
                                    `}
                                >
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`
                                                inline-flex items-center justify-center w-7 h-7 rounded font-bold text-xs
                                                ${isCurrentRow
                                                    ? 'bg-cv-accent text-white'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-cv-text-secondary'
                                                }
                                            `}>
                                                {block.weekNumber}
                                            </span>
                                            <span className="text-xs text-cv-text-tertiary">{block.dayName}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <input
                                            type="number"
                                            value={(config as any).sets || ''}
                                            onChange={(e) => handleBlockUpdate(block.blockId, {
                                                config: { ...config, sets: parseInt(e.target.value) || 0 } as WorkoutConfig
                                            })}
                                            className="w-16 px-2 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-cv-accent/50 font-semibold"
                                        />
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <input
                                            type="number"
                                            value={(config as any).reps || ''}
                                            onChange={(e) => handleBlockUpdate(block.blockId, {
                                                config: { ...config, reps: parseInt(e.target.value) || 0 } as WorkoutConfig
                                            })}
                                            className="w-16 px-2 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-cv-accent/50 font-semibold"
                                        />
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <input
                                            type="number"
                                            value={(config as any).percentage || ''}
                                            onChange={(e) => handleBlockUpdate(block.blockId, {
                                                config: { ...config, percentage: parseInt(e.target.value) || 0 } as WorkoutConfig
                                            })}
                                            className="w-16 px-2 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-cv-accent/50 font-semibold"
                                        />
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <input
                                            type="number"
                                            value={(config as any).rest || ''}
                                            onChange={(e) => handleBlockUpdate(block.blockId, {
                                                config: { ...config, rest: parseInt(e.target.value) || 0 } as WorkoutConfig
                                            })}
                                            className="w-16 px-2 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-cv-accent/50 font-semibold"
                                        />
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <input
                                            type="text"
                                            value={(config as any).tempo || ''}
                                            onChange={(e) => handleBlockUpdate(block.blockId, {
                                                config: { ...config, tempo: e.target.value } as WorkoutConfig
                                            })}
                                            className="w-20 px-2 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-cv-accent/50 font-mono text-xs"
                                            placeholder="30X1"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
