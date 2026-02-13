'use client';
// Force rebuild: 2026-02-11T12:00:00
console.log("BLOCK BUILDER PANEL LOADING - CHECK VERSION");


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
    Trash2,
    Link,
    Plus,
    Target
} from 'lucide-react';
import { useState, useEffect } from 'react';
import type { BlockType, WorkoutFormat, WorkoutConfig } from '@/lib/supabase/types';
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Wrapper for Horizontal List
function SortableBuilderItem({ id, children, isActive }: { id: string; children: React.ReactNode; isActive: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
}

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
    glowColor: string;
    icon: React.ElementType;
}[] = [
        {
            type: 'warmup',
            label: 'Calentamiento',
            description: 'Preparación y movilidad',
            color: 'text-emerald-600 dark:text-emerald-400',
            bgColor: 'bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50',
            glowColor: 'rgba(34, 197, 94, 0.7)',
            icon: Flame
        },
        {
            type: 'strength_linear',
            label: 'Classic',
            description: 'Series, reps y porcentajes',
            color: 'text-red-600 dark:text-red-400',
            bgColor: 'bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50',
            glowColor: 'rgba(239, 68, 68, 0.7)',
            icon: Dumbbell
        },
        {
            type: 'metcon_structured',
            label: 'MetCon',
            description: 'AMRAP, EMOM, For Time',
            color: 'text-cv-accent',
            bgColor: 'bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50',
            glowColor: 'rgba(134, 196, 163, 0.8)',
            icon: Zap
        },
        {
            type: 'accessory',
            label: 'Accesorio',
            description: 'Trabajo complementario',
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50',
            glowColor: 'rgba(168, 85, 247, 0.7)',
            icon: ListOrdered
        },
        {
            type: 'skill',
            label: 'Habilidad',
            description: 'Práctica técnica',
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50',
            glowColor: 'rgba(59, 130, 246, 0.7)',
            icon: Sparkles
        },
        {
            type: 'free_text',
            label: 'Texto Libre',
            description: 'Notas y comentarios',
            color: 'text-slate-600 dark:text-slate-400',
            bgColor: 'bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800',
            glowColor: 'rgba(100, 116, 139, 0.5)',
            icon: FileText
        },
        {
            type: 'finisher',
            label: 'Finisher',
            description: 'Dropsets, Rest-Pause, etc',
            color: 'text-rose-600 dark:text-rose-400',
            bgColor: 'bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50',
            glowColor: 'rgba(225, 29, 72, 0.7)',
            icon: Target
        },
    ];

// Check if a block is empty (no meaningful content)
export const isBlockEmpty = (block: { type: string; format: string | null; config: Record<string, unknown> }): boolean => {
    const config = block.config;
    switch (block.type) {
        case 'strength_linear':
            return !config.sets && !config.reps && !config.exercise;
        case 'metcon_structured': {
            const movements = config.movements as string[] || [];
            return !block.format && movements.length === 0 && !config.time_cap;
        }
        case 'free_text':
            const content = config.content as string;
            return !content || (typeof content === 'string' && content.trim() === '');
        case 'warmup':
        case 'accessory':
        case 'skill':
        case 'finisher': {
            // Check 'movements' (new standard) and 'exercises' (legacy)
            const movements = config.movements as unknown[] || [];
            const exercises = config.exercises as unknown[] || [];
            const notes = config.notes as string;
            return movements.length === 0 && exercises.length === 0 && (!notes || (typeof notes === 'string' && notes.trim() === ''));
        }
        default:
            const keys = Object.keys(config).filter(k => k !== 'is_completed');
            return keys.length === 0 || keys.every(k => {
                const val = config[k];
                return val === null || val === undefined || val === '' ||
                    (Array.isArray(val) && val.length === 0);
            });
    }
};

export function BlockBuilderPanel({ dayId, dayName, onClose }: BlockBuilderPanelProps) {
    const { addBlock, selectedBlockId, selectBlock, mesocycles, deleteBlock, toggleBlockProgression } = useEditorStore();
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [blockToDelete, setBlockToDelete] = useState<string | null>(null);
    const [showQuickAdd, setShowQuickAdd] = useState(false);

    // Find the current day to show added blocks
    let currentDay = null;
    for (const meso of mesocycles) {
        const found = meso.days.find(d => d.id === dayId);
        if (found) {
            currentDay = found;
            break;
        }
    }

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

        let initialConfig = undefined;
        if (type === 'strength_linear') {
            initialConfig = {
                sets: 4,
                reps: 10,
                percentage: 75,
                rest: '2:00'
            };
        }

        addBlock(dayId, type, format, undefined, false, initialConfig as any);
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-cv-bg-secondary">
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
                                        className={`w-full relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${option.bgColor} group hover:scale-[1.01] hover:-translate-y-0.5`}
                                        style={{ '--glow-color': option.glowColor } as React.CSSProperties}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px -2px ${option.glowColor}`;
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                                        }}
                                    >
                                        <div className={`w-9 h-9 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm ${option.color}`}>
                                            <Icon size={18} />
                                        </div>
                                        <div className="text-left flex-1 pr-12">
                                            <p className="font-semibold text-sm text-cv-text-primary">{option.label}</p>
                                            <p className="text-[10px] text-cv-text-tertiary">{option.description}</p>
                                        </div>

                                        {/* Hover Add Indicator */}
                                        <div className="absolute top-1/2 -translate-y-1/2 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/50 dark:bg-black/20 p-1.5 rounded-full backdrop-blur-sm scale-90 group-hover:scale-100 shadow-sm border border-black/5 dark:border-white/10">
                                            <Plus size={14} className="text-cv-text-primary" />
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
                    {currentDay && (
                        <div className="flex-shrink-0 px-3 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-cv-bg-secondary relative z-20 flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-3 overflow-x-auto pb-2 pt-2 pl-1 no-scrollbar" style={{ isolation: 'isolate' }}>
                                <SortableContext
                                    items={[...currentDay.blocks].sort((a, b) => a.order_index - b.order_index).map(b => `builder-${b.id}`)}
                                    strategy={horizontalListSortingStrategy}
                                >
                                    {currentDay.blocks.length > 0 ? (
                                        [...currentDay.blocks]
                                            .sort((a, b) => a.order_index - b.order_index)
                                            .map((block, index) => {
                                                const isActive = selectedBlockId === block.id;
                                                const blockOption = blockTypeOptions.find(o => o.type === block.type);
                                                const Icon = blockOption?.icon || Dumbbell;

                                                return (
                                                    <SortableBuilderItem key={block.id} id={`builder-${block.id}`} isActive={isActive}>
                                                        <div
                                                            onClick={(e) => {
                                                                // Prevent click if we were dragging (handled by dnd-kit mostly, but good practice)
                                                                selectBlock(block.id);
                                                            }}
                                                            className={`
                                                            group relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 text-left min-w-[150px] cursor-pointer
                                                            ${isActive
                                                                    ? 'bg-white dark:bg-cv-bg-primary border-cv-accent shadow-lg ring-2 ring-cv-accent/40 z-20'
                                                                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500 hover:z-30'
                                                                }
                                                            `}
                                                            style={!isActive ? { '--hover-shadow': blockOption?.glowColor || 'rgba(134, 196, 163, 0.5)' } as React.CSSProperties : undefined}
                                                        >
                                                            {/* Delete Trash Button - Visible on Hover - Minimalist Style */}
                                                            <button
                                                                onClick={(e) => handleDeleteBlock(e, block)}
                                                                className="
                                                                absolute top-1.5 right-1.5 
                                                                w-6 h-6 
                                                                rounded-full 
                                                                text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                                                                flex items-center justify-center 
                                                                opacity-0 group-hover:opacity-100 
                                                                transition-all duration-200 
                                                                z-50
                                                                "
                                                                title="Eliminar bloque"
                                                                onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on delete button
                                                            >
                                                                <Trash2 size={13} strokeWidth={2.5} />
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
                                                                    {/* Progression Indicator */}
                                                                    {Boolean((block as any).progression_id) && (
                                                                        <div className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 text-cv-accent bg-cv-accent/10">
                                                                            <Link size={8} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </SortableBuilderItem>
                                                );
                                            })
                                    ) : (
                                        <div className="text-xs text-cv-text-tertiary italic px-2">
                                            No hay bloques
                                        </div>
                                    )}
                                </SortableContext>
                            </div>
                            {/* Header Quick Add Button - Outside scroll container */}
                            <div className="relative flex-shrink-0 ml-1 z-40">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowQuickAdd(!showQuickAdd);
                                    }}
                                    className={`
                                        w-10 h-10 rounded-full border border-dashed border-slate-300 dark:border-slate-600 
                                        flex items-center justify-center text-slate-400 hover:text-cv-accent hover:border-cv-accent 
                                        hover:bg-cv-accent/5 transition-all duration-200
                                        ${showQuickAdd ? 'bg-cv-accent/10 border-cv-accent text-cv-accent ring-2 ring-cv-accent/20' : ''}
                                    `}
                                    title="Añadir bloque"
                                >
                                    <Plus size={20} />
                                </button>

                                {/* Quick Add Dropdown */}
                                {showQuickAdd && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-[60]"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowQuickAdd(false);
                                            }}
                                        />
                                        <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-cv-bg-secondary rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1.5 z-[70] animate-in fade-in zoom-in-95 duration-200">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-cv-text-tertiary mb-1 px-2 py-1">
                                                Añadir nuevo...
                                            </div>
                                            <div className="space-y-0.5">
                                                {blockTypeOptions.map((option) => {
                                                    const Icon = option.icon;
                                                    return (
                                                        <button
                                                            key={option.type}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAddBlock(option.type);
                                                                setShowQuickAdd(false);
                                                            }}
                                                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group"
                                                        >
                                                            <div className={`w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${option.color} group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors`}>
                                                                <Icon size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-semibold text-cv-text-primary">{option.label}</p>
                                                                <p className="text-[10px] text-cv-text-tertiary line-clamp-1">{option.description}</p>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Editor Content */}
                    <div className="flex-1 overflow-hidden relative">
                        {selectedBlockId ? (
                            <div className="h-full">
                                <BlockEditor blockId={selectedBlockId} autoFocusFirst={false} />
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
