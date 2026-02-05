'use client';

import { useEditorStore } from '@/lib/store';
import { GripVertical, Copy, Trash2, ChevronDown } from 'lucide-react';
import type { BlockType, WorkoutFormat } from '@/lib/supabase/types';

interface DraftWorkoutBlock {
    id: string;
    tempId?: string;
    day_id: string;
    order_index: number;
    type: string;
    format: string | null;
    name: string | null;
    config: Record<string, unknown>;
    isDirty?: boolean;
}

interface WorkoutBlockCardProps {
    block: DraftWorkoutBlock;
}

const blockTypeStyles: Record<string, { color: string; label: string }> = {
    warmup: { color: 'modality-warmup', label: 'Calentamiento' },
    strength_linear: { color: 'modality-strength', label: 'Fuerza' },
    metcon_structured: { color: 'modality-metcon', label: 'MetCon' },
    accessory: { color: 'modality-accessory', label: 'Accesorio' },
    skill: { color: 'modality-skill', label: 'Habilidad' },
    free_text: { color: 'border-l-4 border-l-gray-500', label: 'Notas' },
};

const formatLabels: Record<string, string> = {
    AMRAP: 'AMRAP',
    EMOM: 'EMOM',
    RFT: 'Rondas Por Tiempo',
    Chipper: 'Chipper',
    Ladder: 'Ladder',
    Tabata: 'Tabata',
    'Not For Time': 'Sin Tiempo',
    'For Time': 'Por Tiempo',
};

export function WorkoutBlockCard({ block }: WorkoutBlockCardProps) {
    const { selectBlock, selectedBlockId, deleteBlock, duplicateBlock } = useEditorStore();

    const isSelected = selectedBlockId === block.id;
    const style = blockTypeStyles[block.type] || blockTypeStyles.free_text;
    const config = block.config as Record<string, unknown>;

    const getBlockPreview = () => {
        switch (block.type) {
            case 'strength_linear':
                const sets = config.sets as number;
                const reps = config.reps as string;
                const percentage = config.percentage as string;
                return (
                    <div className="text-sm">
                        {sets && reps ? `${sets} x ${reps}` : 'Configurar...'}
                        {percentage && <span className="text-cv-accent ml-1">@ {percentage}</span>}
                    </div>
                );

            case 'metcon_structured':
                const format = block.format;
                const movements = config.movements as string[] || [];
                return (
                    <div>
                        {format && (
                            <span className="cv-badge-accent mb-1">{formatLabels[format] || format}</span>
                        )}
                        {movements.length > 0 && (
                            <div className="text-xs text-cv-text-tertiary mt-1 truncate">
                                {movements.slice(0, 2).join(', ')}
                                {movements.length > 2 && ` +${movements.length - 2} más`}
                            </div>
                        )}
                        {!format && movements.length === 0 && (
                            <span className="text-cv-text-tertiary text-xs">Configurar entreno...</span>
                        )}
                    </div>
                );

            case 'free_text':
                const content = config.content as string;
                return (
                    <div className="text-xs text-cv-text-tertiary truncate">
                        {content || 'Añadir notas...'}
                    </div>
                );

            default:
                return <span className="text-cv-text-tertiary text-xs">Configurar...</span>;
        }
    };

    return (
        <div
            className={`
        group relative bg-cv-bg-tertiary rounded-lg p-2 cursor-pointer
        transition-all hover:bg-cv-bg-elevated
        ${style.color}
        ${isSelected ? 'ring-2 ring-cv-accent' : ''}
      `}
            onClick={(e) => { e.stopPropagation(); selectBlock(block.id); }}
        >
            {/* Drag Handle */}
            <div className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                <GripVertical size={12} className="text-cv-text-tertiary" />
            </div>

            {/* Content */}
            <div className="pl-4">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-2xs uppercase tracking-wider text-cv-text-tertiary font-medium">
                        {block.name || style.label}
                    </span>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}
                            className="p-1 rounded hover:bg-cv-bg-secondary text-cv-text-tertiary hover:text-cv-text-primary"
                            title="Duplicar"
                        >
                            <Copy size={12} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                            className="p-1 rounded hover:bg-cv-bg-secondary text-cv-text-tertiary hover:text-red-400"
                            title="Eliminar"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>

                {getBlockPreview()}
            </div>
        </div>
    );
}
