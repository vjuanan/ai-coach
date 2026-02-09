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

    // If no blocks found or only current block, don't show preview
    if (progressionBlocks.length <= 1) {
        return null;
    }

    const totalWeeks = progressionBlocks.length;

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

            {/* Progression Cards */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {progressionBlocks.map((block) => (
                    <ProgressionBlockCard
                        key={block.blockId}
                        blockId={block.blockId}
                        weekNumber={block.weekNumber}
                        dayName={block.dayName || ''}
                        config={block.config}
                        name={block.name}
                        type={block.type}
                        format={block.format}
                        isCurrentWeek={block.isCurrentWeek}
                        isCurrent={block.blockId === currentBlockId}
                        onUpdate={handleBlockUpdate}
                    />
                ))}
            </div>
        </div>
    );
}

