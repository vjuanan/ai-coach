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
    Check,
    TrendingUp,
    Trash2
} from 'lucide-react';
import { useState, useEffect } from 'react';
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
            label: 'Classic',
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
    const { addBlock, selectedBlockId, selectBlock, mesocycles, deleteBlock, toggleBlockProgression } = useEditorStore();
    const [isProgression, setIsProgression] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [blockToDelete, setBlockToDelete] = useState<string | null>(null);

    // Find the current day to show added blocks
    let currentDay = null;
    for (const meso of mesocycles) {
        const found = meso.days.find(d => d.id === dayId);
        if (found) {
            currentDay = found;
            break;
        }
    }

    // Find the selected block to sync progression toggle
    let selectedBlock = null;
    if (selectedBlockId) {
        for (const meso of mesocycles) {
            for (const day of meso.days) {
                const found = day.blocks.find(b => b.id === selectedBlockId);
                if (found) {
                    selectedBlock = found;
                    break;
                }
            }
            if (selectedBlock) break;
        }
    }

    // Sync toggle with selected block's progression_id
    const hasProgression = Boolean(selectedBlock?.progression_id);

    // Update local state when selected block changes
    useEffect(() => {
        setIsProgression(hasProgression);
    }, [hasProgression, selectedBlockId]);

    // Handle toggle change - toggle progression for existing block
    const handleProgressionToggle = (checked: boolean) => {
        setIsProgression(checked);
        if (selectedBlockId) {
            // Toggle progression for existing selected block
            toggleBlockProgression(selectedBlockId, checked);
        }
    };

    // Check if a block is empty (no meaningful content)
    const isBlockEmpty = (block: { type: string; format: string | null; config: Record<string, unknown> }): boolean => {
        const config = block.config;
        switch (block.type) {
            case 'strength_linear':
                return !config.sets && !config.reps && !config.exercise;
            case 'metcon_structured':
                const movements = config.movements as string[] || [];
                return !block.format && movements.length === 0 && !config.time_cap;
            case 'free_text':
                const content = config.content as string;
                return !content || (typeof content === 'string' && content.trim() === '');
            case 'warmup':
            case 'accessory':
            case 'skill':
                const exercises = config.exercises as unknown[] || [];
                const notes = config.notes as string;
                return exercises.length === 0 && (!notes || (typeof notes === 'string' && notes.trim() === ''));
            default:
                const keys = Object.keys(config).filter(k => k !== 'is_completed');
                return keys.length === 0 || keys.every(k => {
                    const val = config[k];
                    return val === null || val === undefined || val === '' ||
                        (Array.isArray(val) && val.length === 0);
                });
        }
    };

    const handleDeleteBlock = (e: React.MouseEvent, block: { id: string; type: string; format: string | null; config: Record<string, unknown> }) => {
        e.stopPropagation();
        if (isBlockEmpty(block)) {
            deleteBlock(block.id);
        } else {
            setBlockToDelete(block.id);
            setShowConfirmDelete(true);
        }
    };

    const handleAddBlock = (type: BlockType) => {
        const option = blockTypeOptions.find(o => o.type === type);
        // Default to "STANDARD" (Series x Reps) for all structured blocks
        // Only free_text remains without a format
        const format = type !== 'free_text' ? 'STANDARD' as WorkoutFormat : undefined;
        addBlock(dayId, type, format, undefined, isProgression);
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
                    Guardar y Salir
                </button>
            </div>

            {/* Main Content - Split into Block Selector and Speed Editor */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Column - Block Type Selector */}
                <div className="w-[240px] flex-shrink-0 border-r border-slate-200 dark:border-slate-700 overflow-y-auto bg-slate-50/50 dark:bg-cv-bg-tertiary/50">
                    <div className="p-3">
                        {/* Progression Toggle - Fixed at top */}
                        <div className="mb-4 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-cv-text-primary flex items-center gap-1.5">
                                        <TrendingUp size={14} className={isProgression ? 'text-cv-accent' : 'text-slate-400'} />
                                        Progresión
                                    </span>
                                    <span className="text-[10px] text-cv-text-tertiary leading-tight mt-0.5">
                                        Copiar en todas las semanas
                                    </span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={isProgression}
                                        onChange={(e) => handleProgressionToggle(e.target.checked)}
                                    />
                                    <div className={`w-9 h-5 rounded-full transition-colors ${isProgression ? 'bg-cv-accent' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                    <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${isProgression ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </div>
                            </label>
                        </div>

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
                </div>

                {/* Right Column - Speed Editor */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30 dark:bg-cv-bg-tertiary/10">
                    {/* Added Blocks List - Horizontal Horizontal Scrolling */}
                    {currentDay && currentDay.blocks.length > 0 && (
                        <div className="flex-shrink-0 p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-cv-bg-secondary z-10">
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {[...currentDay.blocks]
                                    .sort((a, b) => a.order_index - b.order_index)
                                    .map((block, index) => {
                                        const isActive = selectedBlockId === block.id;
                                        const blockOption = blockTypeOptions.find(o => o.type === block.type);
                                        const Icon = blockOption?.icon || Dumbbell;

                                        return (
                                            <div
                                                key={block.id}
                                                onClick={() => selectBlock(block.id)}
                                                className={`
                                                    group relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left min-w-[150px] cursor-pointer
                                                    ${isActive
                                                        ? 'bg-white dark:bg-cv-bg-primary border-cv-accent shadow-sm ring-1 ring-cv-accent/10'
                                                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                    }
                                                `}
                                            >
                                                {/* Delete X Button - Visible on Hover */}
                                                <button
                                                    onClick={(e) => handleDeleteBlock(e, block)}
                                                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-red-600 hover:scale-110 z-50"
                                                    title="Eliminar bloque"
                                                >
                                                    <X size={10} className="stroke-[3]" />
                                                </button>

                                                <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-cv-accent text-white' : 'bg-slate-200 dark:bg-slate-700 text-cv-text-tertiary'
                                                    }`}>
                                                    <Icon size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-semibold truncate ${isActive ? 'text-cv-text-primary' : 'text-cv-text-secondary'}`}>
                                                        {block.name || blockOption?.label || "Sin nombre"}
                                                    </p>
                                                    <div className="flex items-center gap-1">
                                                        <p className="text-[10px] text-cv-text-tertiary truncate">
                                                            {block.format}
                                                        </p>
                                                        {Boolean(block.config?.is_completed) && (
                                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                                                <Check size={6} className="text-white stroke-[3]" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* Editor Content */}
                    <div className="flex-1 overflow-hidden relative">
                        {selectedBlockId ? (
                            <div className="h-full">
                                <BlockEditor blockId={selectedBlockId} autoFocusFirst={true} />
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                    <Zap size={24} className="text-slate-300 dark:text-slate-600" />
                                </div>
                                <h3 className="text-sm font-semibold text-cv-text-primary mb-1">
                                    Selecciona un bloque
                                </h3>
                                <p className="text-xs text-cv-text-tertiary">
                                    Añade bloques desde la izquierda o selecciona uno arriba.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog for Non-Empty Blocks */}
            {showConfirmDelete && blockToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-cv-bg-secondary rounded-xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5">
                            <h3 className="text-lg font-semibold text-cv-text-primary mb-2 flex items-center gap-2">
                                <Trash2 size={20} className="text-red-500" />
                                ¿Eliminar bloque?
                            </h3>
                            <p className="text-sm text-cv-text-secondary mb-4">
                                Este bloque tiene contenido. ¿Estás seguro de que deseas eliminarlo?
                            </p>

                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => {
                                        setShowConfirmDelete(false);
                                        setBlockToDelete(null);
                                    }}
                                    className="px-4 py-2 text-sm text-cv-text-secondary hover:text-cv-text-primary font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        deleteBlock(blockToDelete);
                                        setShowConfirmDelete(false);
                                        setBlockToDelete(null);
                                    }}
                                    className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
// Trigger redeploy Thu Feb  5 16:59:45 -03 2026
