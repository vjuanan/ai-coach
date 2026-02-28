'use client';

import { useEditorStore } from '@/lib/store';
import { BlockEditor } from './BlockEditor';
import { useExerciseCache } from '@/hooks/useExerciseCache'; // Import for validation
import { useBlockValidator } from '@/hooks/useBlockValidator';
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
    Target,
    AlertCircle,
    AlertTriangle
} from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import type { BlockType, WorkoutFormat, WorkoutConfig } from '@/lib/supabase/types';
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Wrapper for Horizontal List
function SortableBuilderItem({ id, children, isActive }: { id: string; children: React.ReactNode; isActive: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const localRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (isActive && localRef.current) {
            // Add a small delay to ensure DOM and layout are ready
            const timer = setTimeout(() => {
                localRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isActive]);

    const setRefs = (node: HTMLDivElement | null) => {
        setNodeRef(node);
        localRef.current = node;
    };

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
    };

    return (
        <div ref={setRefs} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
}

interface BlockBuilderPanelProps {
    dayId: string;
    dayName: string;
    onClose: () => void;
}

// Block type options with icons — Uniform styling (all same gray)
const UNIFORM_COLOR = 'text-slate-400 dark:text-slate-500';
const UNIFORM_BG = 'bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50';

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
            description: 'Movilidad y activación',
            color: 'text-orange-600 dark:text-orange-400',
            bgColor: 'bg-orange-100 dark:bg-orange-900/40 hover:bg-orange-200 dark:hover:bg-orange-900/60',
            glowColor: 'rgba(234, 88, 12, 0.85)',
            icon: Flame
        },
        {
            type: 'strength_linear',
            label: 'Classic',
            description: 'Series, reps y porcentajes',
            color: 'text-red-600 dark:text-red-400',
            bgColor: 'bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60',
            glowColor: 'rgba(239, 68, 68, 0.85)',
            icon: Dumbbell
        },
        {
            type: 'metcon_structured',
            label: 'MetCon',
            description: 'AMRAP, EMOM, For Time',
            color: 'text-cv-accent',
            bgColor: 'bg-teal-100 dark:bg-teal-900/40 hover:bg-teal-200 dark:hover:bg-teal-900/60',
            glowColor: 'rgba(134, 196, 163, 0.9)',
            icon: Zap
        },
        {
            type: 'accessory',
            label: 'Accesorio',
            description: 'Trabajo complementario',
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-100 dark:bg-purple-900/40 hover:bg-purple-200 dark:hover:bg-purple-900/60',
            glowColor: 'rgba(168, 85, 247, 0.85)',
            icon: ListOrdered
        },
        {
            type: 'skill',
            label: 'Habilidad',
            description: 'Práctica técnica',
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-900/60',
            glowColor: 'rgba(59, 130, 246, 0.85)',
            icon: Sparkles
        },
        {
            type: 'finisher',
            label: 'Finisher',
            description: 'Dropsets, Rest-Pause, etc',
            color: 'text-amber-600 dark:text-amber-400',
            bgColor: 'bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60',
            glowColor: 'rgba(217, 119, 6, 0.85)',
            icon: Target
        },
        {
            type: 'free_text',
            label: 'Texto Libre',
            description: 'Notas y comentarios',
            color: 'text-slate-600 dark:text-slate-400',
            bgColor: 'bg-slate-200 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-800',
            glowColor: 'rgba(100, 116, 139, 0.7)',
            icon: FileText
        },
    ];

const activeBlockClassByType: Record<string, string> = {
    warmup: 'cv-block-active-warmup',
    strength_linear: 'cv-block-active-strength',
    metcon_structured: 'cv-block-active-metcon',
    accessory: 'cv-block-active-accessory',
    skill: 'cv-block-active-skill',
    finisher: 'cv-block-active-finisher',
    free_text: 'cv-block-active-free',
};

const activeIconClassByType: Record<string, string> = {
    warmup: 'cv-block-icon-active-warmup',
    strength_linear: 'cv-block-icon-active-strength',
    metcon_structured: 'cv-block-icon-active-metcon',
    accessory: 'cv-block-icon-active-accessory',
    skill: 'cv-block-icon-active-skill',
    finisher: 'cv-block-icon-active-finisher',
    free_text: 'cv-block-icon-active-free',
};

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
    const { addBlock, selectedBlockId, selectBlock, mesocycles, deleteBlock, toggleBlockProgression, blockBuilderSection } = useEditorStore();
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [blockToDelete, setBlockToDelete] = useState<string | null>(null);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const { searchLocal } = useExerciseCache();
    const { validateBlock } = useBlockValidator();

    // State for discarding incomplete block confirmation
    const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
    const [pendingBlockType, setPendingBlockType] = useState<BlockType | null>(null);
    const [pendingSelectBlockId, setPendingSelectBlockId] = useState<string | null>(null);
    const [blockToDiscardId, setBlockToDiscardId] = useState<string | null>(null);

    // State for Rich Tooltip
    const [hoveredBlock, setHoveredBlock] = useState<{ block: any, rect: DOMRect } | null>(null);


    // Find the current day to show added blocks
    const currentDay = mesocycles
        .flatMap(m => m.days)
        .find(d => d.id === dayId);

    // Calculate visible blocks based on current section
    const visibleBlocks = useMemo(() => {
        if (!currentDay) return [];

        return [...currentDay.blocks]
            .filter(b => {
                const isWarmupBlock = b.section === 'warmup' || b.type === 'warmup';

                if (blockBuilderSection === 'warmup') {
                    // If in Warmup section, ONLY show warmup blocks
                    return isWarmupBlock;
                } else {
                    // If in Main/Training section, ONLY show non-warmup blocks
                    return !isWarmupBlock;
                }
            })
            .sort((a, b) => a.order_index - b.order_index);
    }, [currentDay, blockBuilderSection]);

    const handleDeleteBlock = (e: React.MouseEvent, block: { id: string; type: string; format: string | null; config: Record<string, unknown> }) => {
        e.stopPropagation();
        if (isBlockEmpty(block)) {
            deleteBlock(block.id);
        } else {
            setBlockToDelete(block.id);
            setShowConfirmDelete(true);
        }
    };

    // Helper to check if a block is COMPLETE (Safe to leave without warning)
    // Replaced by useBlockValidator hook
    const isBlockComplete = (block: any): boolean => {
        const { isValid } = validateBlock(block);
        return isValid;
    };

    const handleAddBlock = (type: BlockType) => {
        // CHECK 1: Is there a currently selected block?
        if (selectedBlockId) {
            // Find the full block object
            const currentBlock = currentDay?.blocks.find(b => b.id === selectedBlockId);

            if (currentBlock) {
                // CHECK 2: Is it empty? If so, just delete it silently (auto-cleanup)
                if (isBlockEmpty(currentBlock)) {
                    deleteBlock(currentBlock.id);
                    // Continue to add...
                }
                // CHECK 3: Is it INCOMPLETE? If so, warn user.
                else if (!isBlockComplete(currentBlock)) {
                    setPendingBlockType(type);
                    setPendingSelectBlockId(null);
                    setBlockToDiscardId(currentBlock.id);
                    setShowConfirmDiscard(true);
                    return; // STOP HERE
                }
                // Else: It is complete. Safe to just add new block below/after it.
            }
        }

        performAddBlock(type);
    };

    const performAddBlock = (type: BlockType) => {
        const stimulusPickerBlockTypes: BlockType[] = ['metcon_structured', 'warmup', 'accessory', 'skill', 'finisher'];
        const usesStimulusPicker = stimulusPickerBlockTypes.includes(type);
        // Keep explicit default only for strength blocks; structured blocks open with stimulus picker.
        const format = type === 'strength_linear'
            ? 'STANDARD' as WorkoutFormat
            : (usesStimulusPicker || type === 'free_text')
                ? undefined
                : 'STANDARD' as WorkoutFormat;

        let initialConfig = undefined;
        if (type === 'strength_linear') {
            initialConfig = {
                sets: 4,
                reps: 10,
                percentage: '75',
                rest: '2:00'
            };
        }

        // IMPORTANT: Use blockBuilderSection explicitly to ensure correct placement
        // If blockBuilderSection is null (shouldn't be in this view), default to 'main'
        const targetSection = blockBuilderSection || 'main';

        addBlock(dayId, type, format, undefined, false, initialConfig as any, targetSection);
    };



    const resetDiscardFlow = () => {
        setShowConfirmDiscard(false);
        setBlockToDiscardId(null);
        setPendingBlockType(null);
        setPendingSelectBlockId(null);
    };

    const confirmDiscardAndContinue = () => {
        if (blockToDiscardId) {
            deleteBlock(blockToDiscardId);
        }

        if (pendingBlockType) {
            performAddBlock(pendingBlockType);
        } else if (pendingSelectBlockId) {
            selectBlock(pendingSelectBlockId);
        }

        resetDiscardFlow();
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
                                    items={visibleBlocks.map(b => `builder-${b.id}`)}
                                    strategy={horizontalListSortingStrategy}
                                >
                                    {visibleBlocks.length > 0 ? (
                                        visibleBlocks.map((block) => {
                                            const isActive = selectedBlockId === block.id;
                                            const blockOption = blockTypeOptions.find(o => o.type === block.type);
                                            const Icon = blockOption?.icon || Dumbbell;

                                            return (
                                                <SortableBuilderItem key={block.id} id={`builder-${block.id}`} isActive={isActive}>
                                                    <div
                                                        onClick={(e) => {
                                                            // STRICT VALIDATION ON SWITCH
                                                            // If currently selected block is incomplete, PREVENT switching
                                                            if (selectedBlockId && selectedBlockId !== block.id) {
                                                                const currentBlock = currentDay?.blocks.find(b => b.id === selectedBlockId);
                                                                if (currentBlock) {
                                                                    const { isValid } = validateBlock(currentBlock as any);
                                                                    if (!isValid && !isBlockEmpty(currentBlock)) {
                                                                        // Show dialog to user: Finish or Discard
                                                                        setPendingBlockType(null); // Not adding new, just switching
                                                                        setPendingSelectBlockId(block.id);
                                                                        setBlockToDiscardId(currentBlock.id);
                                                                        setShowConfirmDiscard(true);
                                                                        return;
                                                                    }
                                                                }
                                                            }
                                                            selectBlock(block.id);
                                                        }}
                                                        className={`
                                                            group relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 text-left w-[160px] flex-shrink-0 cursor-pointer
                                                            ${isActive
                                                                ? `cv-block-active ${activeBlockClassByType[block.type] || 'cv-block-active-free'} z-20`
                                                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500 hover:z-30'
                                                            }
                                                            `}
                                                        style={undefined}
                                                        onMouseEnter={(e) => {
                                                            setHoveredBlock({
                                                                block,
                                                                rect: e.currentTarget.getBoundingClientRect()
                                                            });
                                                        }}
                                                        onMouseLeave={() => setHoveredBlock(null)}
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

                                                        <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${isActive ? `cv-block-icon-active ${activeIconClassByType[block.type] || 'cv-block-icon-active-free'}` : 'bg-slate-200 dark:bg-slate-700 text-cv-text-tertiary'}`}>
                                                            <Icon size={14} />
                                                        </div>
                                                        <div className="flex-1 min-w-0 overflow-hidden pr-6">
                                                            <p className={`text-xs font-semibold truncate ${isActive ? 'text-cv-text-primary' : 'text-cv-text-secondary'}`}>
                                                                {block.name || blockOption?.label || "Sin nombre"}
                                                            </p>
                                                            <div className="flex items-center gap-1">
                                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium">
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
                                            No hay bloques en {blockBuilderSection === 'warmup' ? 'calentamiento' : 'entrenamiento'}
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

            {/* Confirmation Dialog for Non-Empty Blocks (DELETE) */}
            {showConfirmDiscard && blockToDiscardId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-cv-bg-secondary rounded-xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5">
                            <h3 className="text-lg font-semibold text-cv-text-primary mb-2 flex items-center gap-2">
                                <AlertTriangle size={20} className="text-amber-500" />
                                Bloque incompleto
                            </h3>
                            <p className="text-sm text-cv-text-secondary mb-4">
                                El bloque actual tiene datos incompletos. ¿Querés descartarlo para continuar?
                            </p>

                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={resetDiscardFlow}
                                    className="px-4 py-2 text-sm text-cv-text-secondary hover:text-cv-text-primary font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDiscardAndContinue}
                                    className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors"
                                >
                                    Descartar y continuar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

            {/* Rich Tooltip Portal */}
            <BlockTooltip hoverState={hoveredBlock} />
        </div>
    );
}

// Rich Tooltip Component
function BlockTooltip({ hoverState }: { hoverState: { block: any, rect: DOMRect } | null }) {
    if (!hoverState) return null;

    const { block, rect } = hoverState;
    const config = block.config || {};

    // Determine content based on block type
    let content = null;
    let title = block.name || "Sin nombre";
    let subtitle = block.format || block.type;

    const getMovementLabel = (value: unknown): string => {
        if (typeof value === 'string') return value.trim();
        if (!value || typeof value !== 'object') return '';

        const record = value as Record<string, unknown>;
        const candidates = [record.name, record.exercise, record.movement];
        for (const candidate of candidates) {
            if (typeof candidate === 'string') {
                const normalized = candidate.trim();
                if (normalized) return normalized;
            }
            if (candidate && typeof candidate === 'object') {
                const nested = getMovementLabel(candidate);
                if (nested) return nested;
            }
        }
        return '';
    };

    // Helper to format list of movements
    const renderMovementList = (movements: any[]) => {
        if (!movements || movements.length === 0) return <p className="text-xs text-slate-400 italic">Sin ejercicios</p>;
        return (
            <div className="flex flex-col gap-1 mt-1">
                {movements.slice(0, 5).map((m: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-300">
                        <div className="w-1 h-1 rounded-full bg-cv-accent flex-shrink-0" />
                        <span className="truncate">{getMovementLabel(m) || "Ejercicio"}</span>
                    </div>
                ))}
                {movements.length > 5 && (
                    <p className="text-[10px] text-slate-500 pl-2.5">
                        +{movements.length - 5} más...
                    </p>
                )}
            </div>
        );
    };

    if (block.type === 'strength_linear') {
        const sets = config.sets || '-';
        const reps = config.reps || '-';
        const load = config.percentage ? `${config.percentage}%` : (config.weight ? `${config.weight}kg` : '-');

        content = (
            <div className="flex flex-col gap-2">
                <div className="grid grid-cols-3 gap-2 text-center bg-white/5 rounded p-1.5">
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Series</p>
                        <p className="font-semibold text-white">{sets}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Reps</p>
                        <p className="font-semibold text-white">{reps}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Carga</p>
                        <p className="font-semibold text-white">{load}</p>
                    </div>
                </div>
                {config.exercise && (
                    <p className="text-xs text-cv-accent font-medium mt-1">
                        {config.exercise.name}
                    </p>
                )}
            </div>
        );
    } else if (block.type === 'metcon_structured') {
        content = (
            <div className="flex flex-col gap-1.5">
                {config.time_cap && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded w-fit mb-1">
                        <Sparkles size={10} />
                        <span>Time Cap: {config.time_cap}</span>
                    </div>
                )}
                {renderMovementList(config.movements)}
            </div>
        );
    } else if (['warmup', 'accessory', 'skill', 'finisher'].includes(block.type)) {
        // Try to find movements list in known locations
        const movements = config.movements || config.exercises || [];
        content = renderMovementList(movements);
    } else if (block.type === 'free_text') {
        content = (
            <p className="text-xs text-slate-300 italic line-clamp-4">
                {config.content || "Sin contenido"}
            </p>
        );
    }

    return (
        <div
            className="fixed z-[100] max-w-[220px] w-max bg-slate-900/95 backdrop-blur-md border border-slate-700/50 shadow-xl rounded-xl p-3 text-left animate-in fade-in zoom-in-95 duration-150 pointer-events-none"
            style={{
                top: rect.top - 8,
                left: rect.left + rect.width / 2,
                transform: 'translate(-50%, -100%)',
            }}
        >
            <div className="mb-2 border-b border-white/10 pb-2">
                <p className="font-semibold text-white text-sm leading-tight mb-0.5">{title}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{subtitle}</p>
            </div>
            {content}

            {/* Arrow */}
            <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900/95"
            />
        </div>
    );
}
