'use client';

import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
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

import { TableInputWithPresets } from './TableInputWithPresets';

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

    // Determine progression variable for highlighting
    const progressionVariable = progressionBlocks[0]?.config?.progression_variable as string | undefined;

    // Check if any block has distance data
    const hasDistance = progressionVariable === 'distance' || progressionBlocks.some(b => (b.config as any)?.distance);

    const handleBlockUpdate = (blockId: string, key: keyof WorkoutConfig, value: any, currentConfig: WorkoutConfig) => {
        const newConfig = { ...currentConfig, [key]: value };

        // Check if we are updating a global value that might have overrides in series_details
        // If so, we clear the overrides so the global value takes precedence (sync behavior)
        if (newConfig.series_details && Array.isArray(newConfig.series_details)) {
            let detailKeyToRemove: string | null = null;

            if (key === 'reps') detailKeyToRemove = 'reps';
            else if (key === 'percentage') detailKeyToRemove = 'weight_percentage';
            else if (key === 'rest') detailKeyToRemove = 'rest_time';
            else if (key === 'distance') detailKeyToRemove = 'distance';
            // Note: RPE is not currently editable in ProgressionPreview, but if it was:
            // else if (key === 'rpe') detailKeyToRemove = 'rpe';

            if (detailKeyToRemove) {
                newConfig.series_details = newConfig.series_details.map((s: any) => {
                    if (!s) return s;
                    const newDetail = { ...s };
                    delete newDetail[detailKeyToRemove!];
                    return newDetail;
                });
            }
        }

        updateBlock(blockId, { config: newConfig });
    };

    // Style helpers for columns
    const getColumnHeaderStyle = (variable: string) => {
        const isTarget = progressionVariable === variable;
        return `p-0 text-center font-semibold text-xs uppercase tracking-wider align-middle ${isTarget
            ? 'text-cv-accent bg-cv-accent/10 border-b-2 border-cv-accent'
            : 'text-cv-text-secondary border-b-2 border-transparent'
            }`;
    };

    const getColumnCellStyle = (variable: string, isCurrentRow: boolean) => {
        const isTarget = progressionVariable === variable;
        return `px-3 py-3 text-center transition-colors ${isTarget
            ? isCurrentRow
                ? 'bg-cv-accent/10' // slightly darker overlap? or same? Let's use specific logic.
                : 'bg-cv-accent/5'
            : ''
            }`;
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
                {progressionVariable && (
                    <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${progressionVariable === 'percentage'
                        ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                        : progressionVariable === 'distance'
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>
                        {progressionVariable === 'percentage' ? (hasDistance ? 'Velocidad y Potencia' : 'Fuerza') : progressionVariable === 'distance' ? 'Distancia' : 'Volumen'}
                    </span>
                )}
            </div>

            {/* Progression Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                            <th className="p-0 text-left font-semibold text-cv-text-secondary text-xs uppercase tracking-wider w-32 align-middle border-b-2 border-transparent">
                                <div className="h-14 flex items-center px-3">
                                    Semana
                                </div>
                            </th>
                            <th className={getColumnHeaderStyle('sets')}>
                                <div className="relative h-14 flex items-center justify-center px-3">
                                    <span>Series</span>
                                    {progressionVariable === 'sets' && (
                                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-extrabold bg-cv-accent/10 text-cv-accent px-1.5 py-0.5 rounded uppercase tracking-wider border border-cv-accent/20 whitespace-nowrap">
                                            Progresión
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th className={getColumnHeaderStyle('reps')}>
                                <div className="relative h-14 flex items-center justify-center px-3">
                                    <span>Reps</span>
                                    {progressionVariable === 'reps' && (
                                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-extrabold bg-cv-accent/10 text-cv-accent px-1.5 py-0.5 rounded uppercase tracking-wider border border-cv-accent/20 whitespace-nowrap">
                                            Progresión
                                        </span>
                                    )}
                                </div>
                            </th>
                            {hasDistance && (
                                <th className={getColumnHeaderStyle('distance')}>
                                    <div className="relative h-14 flex items-center justify-center px-3">
                                        <span>Dist.</span>
                                        {progressionVariable === 'distance' && (
                                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-extrabold bg-cv-accent/10 text-cv-accent px-1.5 py-0.5 rounded uppercase tracking-wider border border-cv-accent/20 whitespace-nowrap">
                                                Progresión
                                            </span>
                                        )}
                                    </div>
                                </th>
                            )}
                            <th className={getColumnHeaderStyle('percentage')}>
                                <div className="relative h-14 flex items-center justify-center px-3">
                                    <span>%</span>
                                    {progressionVariable === 'percentage' && (
                                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-extrabold bg-cv-accent/10 text-cv-accent px-1.5 py-0.5 rounded uppercase tracking-wider border border-cv-accent/20 whitespace-nowrap">
                                            Progresión
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th className={getColumnHeaderStyle('rest')}>
                                <div className="relative h-14 flex items-center justify-center px-3">
                                    <span>Rest</span>
                                    {progressionVariable === 'rest' && (
                                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-extrabold bg-cv-accent/10 text-cv-accent px-1.5 py-0.5 rounded uppercase tracking-wider border border-cv-accent/20 whitespace-nowrap">
                                            Progresión
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th className={getColumnHeaderStyle('tempo')}>
                                <div className="relative h-14 flex items-center justify-center px-3">
                                    <span>Tempo</span>
                                    {progressionVariable === 'tempo' && (
                                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-extrabold bg-cv-accent/10 text-cv-accent px-1.5 py-0.5 rounded uppercase tracking-wider border border-cv-accent/20 whitespace-nowrap">
                                            Progresión
                                        </span>
                                    )}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {progressionBlocks.map((block) => {
                            const isCurrentRow = block.blockId === currentBlockId;
                            const config = block.config;

                            return (
                                <tr
                                    key={block.blockId}
                                    className={`
                                        border-b border-slate-100 dark:border-slate-800 last:border-0
                                        ${isCurrentRow
                                            ? 'bg-cv-accent/10 dark:bg-cv-accent/5 ring-1 ring-inset ring-cv-accent/30 z-10 relative'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                                        }
                                        transition-colors
                                    `}
                                >
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`
                                                inline-flex items-center justify-center w-6 h-6 rounded font-bold text-[10px]
                                                ${isCurrentRow
                                                    ? 'bg-cv-accent text-white shadow-sm shadow-cv-accent/30'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-cv-text-secondary'
                                                }
                                            `}>
                                                {block.weekNumber}
                                            </span>
                                            <div className="flex flex-col leading-tight">
                                                <span className="text-xs font-medium text-cv-text-primary">{block.dayName}</span>
                                            </div>
                                        </div>
                                    </td>

                                    <td className={getColumnCellStyle('sets', isCurrentRow)}>
                                        <TableInputWithPresets
                                            value={(config as any).sets || ''}
                                            onChange={(val) => handleBlockUpdate(block.blockId, 'sets', parseInt(val) || 0, config)}
                                            presets={[3, 4, 5, 6]}
                                            placeholder="-"
                                            width="w-16"
                                            inputClassName="w-16 px-2 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-cv-accent/50 font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </td>

                                    <td className={getColumnCellStyle('reps', isCurrentRow)}>
                                        <TableInputWithPresets
                                            value={(config as any).reps || ''}
                                            onChange={(val) => handleBlockUpdate(block.blockId, 'reps', parseInt(val) || 0, config)}
                                            presets={[5, 8, 10, 12, 15]}
                                            placeholder="-"
                                            width="w-16"
                                            inputClassName="w-16 px-2 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-cv-accent/50 font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </td>

                                    {hasDistance && (
                                        <td className={getColumnCellStyle('distance', isCurrentRow)}>
                                            <TableInputWithPresets
                                                value={(config as any).distance || ''}
                                                onChange={(val) => handleBlockUpdate(block.blockId, 'distance', val, config)}
                                                presets={['200m', '400m', '800m', '1600m']}
                                                placeholder="-"
                                                width="w-16"
                                                inputClassName="w-16 px-2 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-cv-accent/50 font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </td>
                                    )}

                                    <td className={getColumnCellStyle('percentage', isCurrentRow)}>
                                        <TableInputWithPresets
                                            value={(config as any).percentage || ''}
                                            onChange={(val) => handleBlockUpdate(block.blockId, 'percentage', parseInt(val) || 0, config)}
                                            presets={[60, 65, 70, 75, 80, 85, 90]}
                                            placeholder="-"
                                            step={2.5}
                                            width="w-16"
                                            inputClassName="w-16 px-2 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-cv-accent/50 font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </td>

                                    <td className={getColumnCellStyle('rest', isCurrentRow)}>
                                        <TableInputWithPresets
                                            value={(config as any).rest || ''}
                                            onChange={(val) => handleBlockUpdate(block.blockId, 'rest', parseInt(val) || 0, config)}
                                            presets={[60, 90, 120, 180]}
                                            placeholder="-"
                                            step={30}
                                            width="w-16"
                                            inputClassName="w-16 px-2 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-cv-accent/50 font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </td>

                                    <td className={getColumnCellStyle('tempo', isCurrentRow)}>
                                        <input
                                            type="text"
                                            value={(config as any).tempo || ''}
                                            onChange={(e) => handleBlockUpdate(block.blockId, 'tempo', e.target.value, config)}
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
