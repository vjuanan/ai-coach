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

interface TableInputWithPresetsProps {
    value: string | number;
    onChange: (value: string) => void;
    presets: (string | number)[];
    type?: string;
    placeholder?: string;
    width?: string;
    min?: number;
    step?: number;
}

function TableInputWithPresets({
    value,
    onChange,
    presets,
    type = "number",
    placeholder,
    width = "w-16",
    min = 0,
    step = 1
}: TableInputWithPresetsProps) {
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative flex justify-center" ref={containerRef}>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                className={`${width} px-2 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-cv-accent/50 font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                placeholder={placeholder}
                min={min}
                step={step}
            />

            {isFocused && (
                <div className="absolute z-50 top-full mt-1 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg p-1.5 flex gap-1 min-w-max animate-in fade-in zoom-in-95 duration-100">
                    {presets.map((preset) => (
                        <button
                            key={preset}
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent closing immediately
                                onChange(preset.toString());
                                // Keep focus or close? Better to keep open for rapid changes or close? 
                                // User usually selects one. Let's close after selection? 
                                // Actually keeping it open might be annoying if it covers things, but closing is standard behavior for dropdowns.
                                // Let's try closing it.
                                setIsFocused(false);
                            }}
                            className={`
                                px-2 py-1 text-xs font-medium rounded transition-colors
                                ${value == preset
                                    ? 'bg-cv-accent text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }
                            `}
                        >
                            {preset}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

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

    const handleBlockUpdate = (blockId: string, updates: { config: WorkoutConfig }) => {
        updateBlock(blockId, updates);
    };

    // Style helpers for columns
    const getColumnHeaderStyle = (variable: string) => {
        const isTarget = progressionVariable === variable;
        return `px-3 py-2 text-center font-semibold text-xs uppercase tracking-wider ${isTarget
            ? 'text-cv-accent bg-cv-accent/10 border-b-2 border-cv-accent'
            : 'text-cv-text-secondary'
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
                        {progressionVariable === 'percentage' ? 'Velocidad y Potencia' : progressionVariable === 'distance' ? 'Distancia' : 'Volumen'}
                    </span>
                )}
            </div>

            {/* Progression Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                            <th className="px-3 py-2 text-left font-semibold text-cv-text-secondary text-xs uppercase tracking-wider w-32">Semana</th>
                            <th className={getColumnHeaderStyle('sets')}>Series</th>
                            <th className={getColumnHeaderStyle('reps')}>Reps</th>
                            {hasDistance && (
                                <th className={getColumnHeaderStyle('distance')}>Dist.</th>
                            )}
                            <th className={getColumnHeaderStyle('percentage')}>%</th>
                            <th className={getColumnHeaderStyle('rest')}>Rest</th>
                            <th className={getColumnHeaderStyle('tempo')}>Tempo</th>
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
                                            onChange={(val) => handleBlockUpdate(block.blockId, {
                                                config: { ...config, sets: parseInt(val) || 0 } as WorkoutConfig
                                            })}
                                            presets={[3, 4, 5, 6]}
                                            placeholder="-"
                                        />
                                    </td>

                                    <td className={getColumnCellStyle('reps', isCurrentRow)}>
                                        <TableInputWithPresets
                                            value={(config as any).reps || ''}
                                            onChange={(val) => handleBlockUpdate(block.blockId, {
                                                config: { ...config, reps: parseInt(val) || 0 } as WorkoutConfig
                                            })}
                                            presets={[5, 8, 10, 12, 15]}
                                            placeholder="-"
                                        />
                                    </td>

                                    {hasDistance && (
                                        <td className={getColumnCellStyle('distance', isCurrentRow)}>
                                            <TableInputWithPresets
                                                value={(config as any).distance || ''}
                                                onChange={(val) => handleBlockUpdate(block.blockId, {
                                                    config: { ...config, distance: val } as WorkoutConfig
                                                })}
                                                presets={['200m', '400m', '800m', '1600m']}
                                                placeholder="-"
                                            />
                                        </td>
                                    )}

                                    <td className={getColumnCellStyle('percentage', isCurrentRow)}>
                                        <TableInputWithPresets
                                            value={(config as any).percentage || ''}
                                            onChange={(val) => handleBlockUpdate(block.blockId, {
                                                config: { ...config, percentage: parseInt(val) || 0 } as WorkoutConfig
                                            })}
                                            presets={[60, 65, 70, 75, 80, 85, 90]}
                                            placeholder="-"
                                            step={2.5}
                                        />
                                    </td>

                                    <td className={getColumnCellStyle('rest', isCurrentRow)}>
                                        <TableInputWithPresets
                                            value={(config as any).rest || ''}
                                            onChange={(val) => handleBlockUpdate(block.blockId, {
                                                config: { ...config, rest: parseInt(val) || 0 } as WorkoutConfig
                                            })}
                                            presets={[60, 90, 120, 180]}
                                            placeholder="-"
                                            step={30}
                                        />
                                    </td>

                                    <td className={getColumnCellStyle('tempo', isCurrentRow)}>
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
