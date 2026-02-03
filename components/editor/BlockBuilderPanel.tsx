'use client';

import { useEditorStore } from '@/lib/store';
import { BlockEditor } from './BlockEditor';
import {
    X,
    Flame,
    Dumbbell,
    Zap,
    ListOrdered,
    Sparkles,
    FileText,
    Check
} from 'lucide-react';
import type { BlockType, WorkoutFormat } from '@/lib/supabase/types';

interface BlockBuilderPanelProps {
    dayId: string;
    dayName: string;
    onClose: () => void;
}

// Block type options with icons
const blockTypeOptions: {
    type: BlockType;
    label: string;
    description: string;
    color: string;
    bgColor: string;
    icon: React.ElementType;
}[] = [
        {
            type: 'warmup',
            label: 'Calentamiento',
            description: 'Preparación y movilidad',
            color: 'text-emerald-600 dark:text-emerald-400',
            bgColor: 'bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50',
            icon: Flame
        },
        {
            type: 'strength_linear',
            label: 'Fuerza',
            description: 'Series, reps y porcentajes',
            color: 'text-red-600 dark:text-red-400',
            bgColor: 'bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50',
            icon: Dumbbell
        },
        {
            type: 'metcon_structured',
            label: 'MetCon',
            description: 'AMRAP, EMOM, For Time',
            color: 'text-cv-accent',
            bgColor: 'bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50',
            icon: Zap
        },
        {
            type: 'accessory',
            label: 'Accesorio',
            description: 'Trabajo complementario',
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50',
            icon: ListOrdered
        },
        {
            type: 'skill',
            label: 'Habilidad',
            description: 'Práctica técnica',
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50',
            icon: Sparkles
        },
        {
            type: 'free_text',
            label: 'Texto Libre',
            description: 'Notas y comentarios',
            color: 'text-slate-600 dark:text-slate-400',
            bgColor: 'bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800',
            icon: FileText
        },
    ];

export function BlockBuilderPanel({ dayId, dayName, onClose }: BlockBuilderPanelProps) {
    const { addBlock, selectedBlockId, selectBlock, mesocycles } = useEditorStore();

    // Find the current day to show added blocks
    let currentDay = null;
    for (const meso of mesocycles) {
        const found = meso.days.find(d => d.id === dayId);
        if (found) {
            currentDay = found;
            break;
        }
    }

    const handleAddBlock = (type: BlockType) => {
        const option = blockTypeOptions.find(o => o.type === type);
        const format = type === 'strength_linear' ? 'STANDARD' as WorkoutFormat : undefined;
        addBlock(dayId, type, format, option?.label);
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-cv-bg-secondary">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-cv-bg-tertiary dark:to-cv-bg-secondary">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cv-accent to-cv-accent/70 flex items-center justify-center shadow-lg shadow-cv-accent/20">
                        <Zap size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-cv-text-primary text-lg">Block Builder</h2>
                        <p className="text-xs text-cv-text-tertiary">
                            Añadiendo bloques a <span className="font-semibold text-cv-accent">{dayName}</span>
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-4 py-2 bg-cv-accent text-white rounded-xl font-medium text-sm hover:bg-cv-accent/90 transition-colors shadow-sm"
                >
                    <Check size={16} />
                    Listo
                </button>
            </div>

            {/* Main Content - Split into Block Selector and Speed Editor */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Column - Block Type Selector */}
                <div className="w-[240px] flex-shrink-0 border-r border-slate-200 dark:border-slate-700 overflow-y-auto bg-slate-50/50 dark:bg-cv-bg-tertiary/50">
                    <div className="p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-cv-text-tertiary mb-2 px-1">
                            Tipos de Bloque
                        </p>
                        <div className="space-y-1.5">
                            {blockTypeOptions.map((option) => {
                                const Icon = option.icon;
                                return (
                                    <button
                                        key={option.type}
                                        onClick={() => handleAddBlock(option.type)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${option.bgColor} group`}
                                    >
                                        <div className={`w-9 h-9 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm ${option.color}`}>
                                            <Icon size={18} />
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="font-semibold text-sm text-cv-text-primary">{option.label}</p>
                                            <p className="text-[10px] text-cv-text-tertiary">{option.description}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Added Blocks - Clickable List */}
                    {currentDay && currentDay.blocks.length > 0 && (
                        <div className="mx-3 mt-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-cv-text-tertiary mb-2 px-1">
                                Bloques Añadidos ({currentDay.blocks.length})
                            </p>
                            <div className="space-y-1">
                                {[...currentDay.blocks]
                                    .sort((a, b) => a.order_index - b.order_index)
                                    .map((block, index) => {
                                        const isActive = selectedBlockId === block.id;
                                        const blockOption = blockTypeOptions.find(o => o.type === block.type);
                                        const Icon = blockOption?.icon || Dumbbell;

                                        return (
                                            <button
                                                key={block.id}
                                                onClick={() => selectBlock(block.id)}
                                                className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all text-left ${isActive
                                                    ? 'bg-cv-accent/10 border border-cv-accent/30 shadow-sm'
                                                    : 'bg-white dark:bg-cv-bg-secondary hover:bg-slate-50 dark:hover:bg-cv-bg-tertiary border border-slate-200 dark:border-slate-700'
                                                    }`}
                                            >
                                                <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-cv-accent text-white' : 'bg-slate-100 dark:bg-slate-700 text-cv-text-secondary'
                                                    }`}>
                                                    <Icon size={12} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-medium truncate ${isActive ? 'text-cv-accent' : 'text-cv-text-primary'
                                                        }`}>
                                                        {block.name || blockOption?.label || `Bloque ${index + 1}`}
                                                    </p>
                                                    {block.format && (
                                                        <p className="text-[9px] text-cv-text-tertiary truncate">
                                                            {block.format}
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Speed Editor */}
                <div className="flex-1 overflow-y-auto">
                    {selectedBlockId ? (
                        <div className="p-4">
                            <div className="mb-3 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-cv-accent animate-pulse" />
                                <p className="text-xs font-semibold text-cv-text-tertiary uppercase tracking-wider">
                                    Editando Bloque
                                </p>
                            </div>
                            <BlockEditor blockId={selectedBlockId} autoFocusFirst={true} />
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                <Zap size={32} className="text-slate-300 dark:text-slate-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-cv-text-primary mb-2">
                                Selecciona un tipo de bloque
                            </h3>
                            <p className="text-sm text-cv-text-tertiary max-w-xs">
                                Haz click en uno de los tipos de bloque a la izquierda para añadirlo y editarlo aquí.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Hint */}
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-cv-bg-tertiary/30">
                <p className="text-xs text-center text-cv-text-tertiary">
                    Presiona <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 text-[10px] font-mono">ESC</kbd> o &quot;Listo&quot; para cerrar
                </p>
            </div>
        </div>
    );
}
