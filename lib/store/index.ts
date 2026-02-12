import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    Program,
    Mesocycle,
    Day,
    WorkoutBlock,
    Client,
    BlockType,
    WorkoutFormat,
    WorkoutConfig,
    TrainingMethodology
} from '@/lib/supabase/types';
// Removed uuid import to use local helper

// Helper functions for temp IDs
const generateTempId = () => `temp_${Math.random().toString(36).substr(2, 9)}`;
const generateProgressionId = () => `prog_${Math.random().toString(36).substr(2, 9)}`;

// ============================================
// Editor Store - Canvas State Management
// ============================================

export interface DraftWorkoutBlock {
    id: string;
    tempId?: string; // For new blocks not yet saved
    day_id: string;
    order_index: number;
    type: BlockType;
    format: WorkoutFormat | null;
    name: string | null;
    config: WorkoutConfig;
    isDirty?: boolean;
    progression_id?: string | null; // Added for progression system
}

export interface DraftDay {
    id: string;
    tempId?: string;
    mesocycle_id: string;
    day_number: number;
    name: string | null;
    is_rest_day: boolean;
    notes: string | null;
    stimulus_id?: string | null;
    blocks: DraftWorkoutBlock[];
    isDirty?: boolean;
}

export interface DraftMesocycle {
    id: string;
    tempId?: string;
    program_id: string;
    week_number: number;
    focus: string | null;
    attributes: Record<string, unknown> | null;
    days: DraftDay[];
    isDirty?: boolean;
}

interface EditorState {
    // Current program being edited
    programId: string | null;
    programName: string;
    programCoachName: string;
    programClient: Client | null;
    programAttributes: Record<string, unknown> | null;

    // Global Configs
    stimulusFeatures: Array<{ id: string; name: string; color: string; }>;
    trainingMethodologies: TrainingMethodology[];

    // Draft state (local changes)
    mesocycles: DraftMesocycle[];

    // UI State
    selectedWeek: number;
    selectedDayId: string | null;
    selectedBlockId: string | null;
    referenceBlock: DraftWorkoutBlock | null; // The block from previous week
    isLoading: boolean;
    isSaving: boolean;
    hasUnsavedChanges: boolean;

    // Drag state
    draggedBlockId: string | null;
    dropTargetDayId: string | null;

    // Block Builder Mode (for split-screen editing)
    blockBuilderMode: boolean;
    blockBuilderDayId: string | null;

    // Actions
    initializeEditor: (programId: string, name: string, coachName: string, client: Client | null, attributes?: Record<string, unknown> | null, stimulusFeatures?: any[]) => void;
    setProgramClient: (client: Client | null) => void;
    setTrainingMethodologies: (methodologies: TrainingMethodology[]) => void;
    loadMesocycles: (mesocycles: DraftMesocycle[]) => void;
    resetEditor: () => void;

    // Selection
    selectWeek: (week: number) => void;
    selectDay: (dayId: string | null) => void;
    selectBlock: (blockId: string | null) => void;

    // Block operations
    addBlock: (dayId: string, type: BlockType, format?: WorkoutFormat, name?: string, isProgression?: boolean, initialConfig?: WorkoutConfig) => void;
    updateBlock: (blockId: string, updates: Partial<DraftWorkoutBlock>) => void;
    deleteBlock: (blockId: string) => void;
    deleteProgression: (progressionId: string) => void; // New action
    reorderBlocks: (dayId: string, blockIds: string[]) => void;
    duplicateBlock: (blockId: string, targetDayId?: string) => void;
    toggleBlockProgression: (blockId: string, isProgression: boolean, progressionVariable?: 'sets' | 'reps' | 'percentage') => void;

    // Day operations
    updateDay: (dayId: string, updates: Partial<DraftDay>) => void;
    toggleRestDay: (dayId: string) => void;
    clearDay: (dayId: string) => void;

    // ... (rest of interface) - Fully fleshed out now
    updateMesocycle: (weekNumber: number, updates: Partial<DraftMesocycle>) => void;
    setDraggedBlock: (blockId: string | null) => void;
    setDropTarget: (dayId: string | null) => void;
    enterBlockBuilder: (dayId: string) => void;
    exitBlockBuilder: () => void;
    selectNextBlock: () => void;
    selectPrevBlock: () => void;
    selectNextDayFirstBlock: () => void;
    selectPrevDayFirstBlock: () => void;
    moveBlockToDay: (blockId: string, targetDayId: string) => void;
    moveProgressionToDay: (progressionId: string, targetDayNumber: number) => void;
    markAsClean: () => void;
}

export const useEditorStore = create<EditorState>()(
    persist(
        (set, get) => ({
            // Initial State
            programId: null,
            programName: '',
            programCoachName: '',
            programClient: null,
            programAttributes: null,
            stimulusFeatures: [],
            trainingMethodologies: [],
            mesocycles: [],
            selectedWeek: 1,
            selectedDayId: null,
            selectedBlockId: null,
            referenceBlock: null,
            isLoading: false,
            isSaving: false,
            hasUnsavedChanges: false,
            draggedBlockId: null,
            dropTargetDayId: null,
            blockBuilderMode: false,
            blockBuilderDayId: null,

            // Actions
            initializeEditor: (programId, name, coachName, client, attributes, stimulusFeatures) => {
                set({
                    programId,
                    programName: name,
                    programCoachName: coachName,
                    programClient: client,
                    programAttributes: attributes || null,
                    stimulusFeatures: stimulusFeatures || [],
                    hasUnsavedChanges: false
                });
            },

            setProgramClient: (client) => set({ programClient: client }),

            setTrainingMethodologies: (methodologies) => set({ trainingMethodologies: methodologies }),

            loadMesocycles: (mesocycles) => set({ mesocycles, hasUnsavedChanges: false }),

            resetEditor: () => set({
                programId: null,
                programName: '',
                programCoachName: '',
                programClient: null,
                mesocycles: [],
                hasUnsavedChanges: false,
                selectedDayId: null,
                selectedBlockId: null
            }),

            selectWeek: (week) => set({ selectedWeek: week }),
            selectDay: (dayId) => set({ selectedDayId: dayId }),
            selectBlock: (blockId) => set({ selectedBlockId: blockId }),
            addBlock: (dayId, type, format, name, isProgression = false, initialConfig) => {
                const { mesocycles } = get();
                const tempId = generateTempId();

                // Find the target day to get mesocycle and day number
                let targetMesoIndex = -1;
                let targetDayNumber = -1;

                for (let i = 0; i < mesocycles.length; i++) {
                    const day = mesocycles[i].days.find(d => d.id === dayId);
                    if (day) {
                        targetMesoIndex = i;
                        targetDayNumber = day.day_number;
                        break;
                    }
                }

                if (targetMesoIndex === -1) return;

                const progressionId = isProgression ? generateProgressionId() : null;

                // Determine config: Use provided initialConfig, or fallback to defaults
                let config = initialConfig || ({} as WorkoutConfig);

                // Special case for free_text if no config provided
                if (type === 'free_text' && !initialConfig) {
                    config = { content: '' };
                }

                const newBlockBase: DraftWorkoutBlock = {
                    id: tempId,
                    tempId,
                    day_id: dayId,
                    order_index: 0,
                    type,
                    format: format || null,
                    name: name || null,
                    config,
                    isDirty: true,
                    progression_id: progressionId
                };

                let updatedMesocycles = [...mesocycles];

                if (isProgression) {
                    // Add to ALL weeks on same day_number
                    updatedMesocycles = mesocycles.map(meso => ({
                        ...meso,
                        days: meso.days.map(day => {
                            if (day.day_number === targetDayNumber) {
                                const weekSpecificTempId = generateTempId();
                                const newOrderIndex = day.blocks.length;
                                return {
                                    ...day,
                                    blocks: [...day.blocks, {
                                        ...newBlockBase,
                                        id: weekSpecificTempId,
                                        tempId: weekSpecificTempId,
                                        day_id: day.id,
                                        order_index: newOrderIndex
                                    }],
                                    isDirty: true,
                                };
                            }
                            return day;
                        }),
                        isDirty: true
                    }));
                } else {
                    // Single add
                    updatedMesocycles = mesocycles.map(meso => ({
                        ...meso,
                        days: meso.days.map(day => {
                            if (day.id === dayId) {
                                const newOrderIndex = day.blocks.length;
                                return {
                                    ...day,
                                    blocks: [...day.blocks, { ...newBlockBase, order_index: newOrderIndex }],
                                    isDirty: true,
                                };
                            }
                            return day;
                        }),
                    }));
                }

                set({
                    mesocycles: updatedMesocycles,
                    hasUnsavedChanges: true,
                    selectedBlockId: isProgression ? null : tempId, // Don't verify selection if multiple added? Or select first?
                });
            },

            // Update a block
            updateBlock: (blockId, updates) => {
                const { mesocycles } = get();

                const updatedMesocycles = mesocycles.map(meso => ({
                    ...meso,
                    days: meso.days.map(day => ({
                        ...day,
                        blocks: day.blocks.map(block =>
                            block.id === blockId
                                ? { ...block, ...updates, isDirty: true }
                                : block
                        ),
                    })),
                }));

                set({ mesocycles: updatedMesocycles, hasUnsavedChanges: true });
            },

            // Delete a block (Single)
            deleteBlock: (blockId) => {
                const { mesocycles, selectedBlockId } = get();

                const updatedMesocycles = mesocycles.map(meso => ({
                    ...meso,
                    days: meso.days.map(day => ({
                        ...day,
                        blocks: day.blocks
                            .filter(block => block.id !== blockId)
                            .map((block, idx) => ({ ...block, order_index: idx })),
                    })),
                }));

                set({
                    mesocycles: updatedMesocycles,
                    hasUnsavedChanges: true,
                    selectedBlockId: selectedBlockId === blockId ? null : selectedBlockId,
                });
            },

            // Delete entire progression
            deleteProgression: (progressionId) => {
                const { mesocycles, selectedBlockId } = get();

                const updatedMesocycles = mesocycles.map(meso => ({
                    ...meso,
                    days: meso.days.map(day => ({
                        ...day,
                        blocks: day.blocks
                            .filter(block => block.progression_id !== progressionId)
                            .map((block, idx) => ({ ...block, order_index: idx })),
                    })),
                }));

                // If selected block was part of deleted progression, deselect it
                // We don't easily know if selectedBlockId was part of it without searching, 
                // but checking store state after update is fine or just deselecting if gone.

                set({
                    mesocycles: updatedMesocycles,
                    hasUnsavedChanges: true,
                    selectedBlockId: null, // Safest to just deselect
                });
            },

            // Reorder blocks within a day
            reorderBlocks: (dayId, blockIds) => {
                const { mesocycles } = get();

                const updatedMesocycles = mesocycles.map(meso => ({
                    ...meso,
                    days: meso.days.map(day => {
                        if (day.id === dayId) {
                            const reorderedBlocks = blockIds.map((id, idx) => {
                                const block = day.blocks.find(b => b.id === id);
                                return block ? { ...block, order_index: idx, isDirty: true } : null;
                            }).filter(Boolean) as DraftWorkoutBlock[];

                            return { ...day, blocks: reorderedBlocks, isDirty: true };
                        }
                        return day;
                    }),
                }));

                set({ mesocycles: updatedMesocycles, hasUnsavedChanges: true });
            },

            // Duplicate a block
            duplicateBlock: (blockId, targetDayId) => {
                const { mesocycles } = get();
                const tempId = generateTempId();

                let sourceBlock: DraftWorkoutBlock | null = null;
                for (const meso of mesocycles) {
                    for (const day of meso.days) {
                        const found = day.blocks.find(b => b.id === blockId);
                        if (found) {
                            sourceBlock = found;
                            break;
                        }
                    }
                }

                if (!sourceBlock) return;

                const finalTargetDayId = targetDayId || sourceBlock.day_id;

                const updatedMesocycles = mesocycles.map(meso => ({
                    ...meso,
                    days: meso.days.map(day => {
                        if (day.id === finalTargetDayId) {
                            // If duplicating a progression block, should we keep progression_id? 
                            // Usually Duplicate = New Instance, so NO progression_id or NEW progression_id?
                            // Default behavior: Independent copy.
                            const newBlock: DraftWorkoutBlock = {
                                ...sourceBlock!,
                                id: tempId,
                                tempId,
                                day_id: finalTargetDayId,
                                order_index: day.blocks.length,
                                isDirty: true,
                                progression_id: null // Reset progression on copy
                            };
                            return { ...day, blocks: [...day.blocks, newBlock], isDirty: true };
                        }
                        return day;
                    }),
                }));

                set({ mesocycles: updatedMesocycles, hasUnsavedChanges: true });
            },

            // Toggle progression for an existing block
            toggleBlockProgression: (blockId, isProgression, progressionVariable) => {
                const { mesocycles } = get();

                // 1. Find the source block
                let sourceBlock: DraftWorkoutBlock | null = null;
                let sourceDayNumber = -1;
                let sourceMesoIndex = -1;

                for (let i = 0; i < mesocycles.length; i++) {
                    const day = mesocycles[i].days.find(d => d.blocks.some(b => b.id === blockId));
                    if (day) {
                        sourceBlock = day.blocks.find(b => b.id === blockId) || null;
                        sourceDayNumber = day.day_number;
                        sourceMesoIndex = i;
                        break;
                    }
                }

                if (!sourceBlock) return;

                const progressionId = isProgression ? generateProgressionId() : null;
                let updatedMesocycles = [...mesocycles];

                if (isProgression) {
                    // LINKING: Apply ID to current block AND create copies in other weeks
                    updatedMesocycles = mesocycles.map((meso, idx) => {
                        // Skip if it's the source week, just update the block
                        if (idx === sourceMesoIndex) {
                            return {
                                ...meso,
                                days: meso.days.map(day => ({
                                    ...day,
                                    blocks: day.blocks.map(b =>
                                        b.id === blockId
                                            ? {
                                                ...b,
                                                progression_id: progressionId,
                                                config: {
                                                    ...b.config,
                                                    progression_variable: progressionVariable
                                                },
                                                isDirty: true
                                            }
                                            : b
                                    )
                                })),
                                isDirty: true
                            };
                        }

                        // For other weeks, find same day and ADD the block
                        return {
                            ...meso,
                            days: meso.days.map(day => {
                                if (day.day_number === sourceDayNumber) {
                                    const tempId = generateTempId();
                                    const newBlock = {
                                        ...sourceBlock!,
                                        id: tempId,
                                        tempId,
                                        day_id: day.id,
                                        order_index: day.blocks.length, // Append to end
                                        progression_id: progressionId,
                                        config: {
                                            ...sourceBlock!.config,
                                            progression_variable: progressionVariable
                                        },
                                        isDirty: true
                                    };
                                    return {
                                        ...day,
                                        blocks: [...day.blocks, newBlock],
                                        isDirty: true
                                    };
                                }
                                return day;
                            }),
                            isDirty: true
                        };
                    });
                } else {
                    // UNLINKING: Remove progression_id from ALL linked blocks (or just this one?)
                    // User usually wants to remove the attribute. 
                    // Let's remove it from ALL blocks with this progression_id to be consistent.
                    const currentProgressionId = sourceBlock.progression_id;
                    if (currentProgressionId) {
                        updatedMesocycles = mesocycles.map(meso => ({
                            ...meso,
                            days: meso.days.map(day => ({
                                ...day,
                                blocks: day.blocks.map(b =>
                                    b.progression_id === currentProgressionId
                                        ? {
                                            ...b,
                                            progression_id: null,
                                            config: {
                                                ...b.config,
                                                progression_variable: undefined
                                            },
                                            isDirty: true
                                        }
                                        : b
                                )
                            })),
                            isDirty: true
                        }));
                    }
                }

                set({ mesocycles: updatedMesocycles, hasUnsavedChanges: true });
            },

            // Update day
            updateDay: (dayId, updates) => {
                const { mesocycles } = get();

                const updatedMesocycles = mesocycles.map(meso => ({
                    ...meso,
                    days: meso.days.map(day =>
                        day.id === dayId ? { ...day, ...updates, isDirty: true } : day
                    ),
                }));

                set({ mesocycles: updatedMesocycles, hasUnsavedChanges: true });
            },

            // Toggle rest day
            toggleRestDay: (dayId) => {
                const { mesocycles } = get();

                const updatedMesocycles = mesocycles.map(meso => ({
                    ...meso,
                    days: meso.days.map(day =>
                        day.id === dayId
                            ? { ...day, is_rest_day: !day.is_rest_day, isDirty: true }
                            : day
                    ),
                }));

                set({ mesocycles: updatedMesocycles, hasUnsavedChanges: true });
            },

            // Clear day blocks
            clearDay: (dayId) => {
                const { mesocycles } = get();

                const updatedMesocycles = mesocycles.map(meso => ({
                    ...meso,
                    days: meso.days.map(day =>
                        day.id === dayId
                            ? { ...day, blocks: [], isDirty: true } // Remove all blocks
                            : day
                    ),
                }));

                set({ mesocycles: updatedMesocycles, hasUnsavedChanges: true });
            },

            // Update mesocycle
            updateMesocycle: (weekNumber, updates) => {
                const { mesocycles } = get();

                const updatedMesocycles = mesocycles.map(meso =>
                    meso.week_number === weekNumber
                        ? { ...meso, ...updates, isDirty: true }
                        : meso
                );

                set({ mesocycles: updatedMesocycles, hasUnsavedChanges: true });
            },

            // Drag & Drop
            setDraggedBlock: (blockId) => set({ draggedBlockId: blockId }),
            setDropTarget: (dayId) => set({ dropTargetDayId: dayId }),

            // Block Builder Mode
            enterBlockBuilder: (dayId) => set({
                blockBuilderMode: true,
                blockBuilderDayId: dayId,
                selectedDayId: dayId,
                selectedBlockId: null
            }),
            exitBlockBuilder: () => {
                const { blockBuilderDayId } = get();

                // 1. Immediate UI update - Close the builder first for speed
                set({
                    blockBuilderMode: false,
                    blockBuilderDayId: null
                });

                // If no day was being edited, we are done
                if (!blockBuilderDayId) return;

                // 2. Deferred cleanup - Remove empty blocks in next tick
                setTimeout(() => {
                    // Get fresh state in case something changed in the ms interim
                    const { mesocycles } = get();

                    // Find and clean empty blocks from the current day
                    const updatedMesocycles = mesocycles.map(meso => ({
                        ...meso,
                        days: meso.days.map(day => {
                            if (day.id === blockBuilderDayId) {
                                // Filter out empty blocks
                                const nonEmptyBlocks = day.blocks.filter(block => {
                                    // Check if block is empty using same logic as BlockBuilderPanel
                                    const config = block.config;
                                    switch (block.type) {
                                        case 'strength_linear':
                                            return config.sets || config.reps || config.exercise;
                                        case 'metcon_structured': {
                                            const movements = config.movements as string[] || [];
                                            return block.format || movements.length > 0 || config.time_cap;
                                        }
                                        case 'free_text':
                                            const content = config.content as string;
                                            return content && typeof content === 'string' && content.trim() !== '';
                                        case 'warmup':
                                        case 'accessory':
                                        case 'skill': {
                                            const movements = config.movements as unknown[] || [];
                                            const exercises = config.exercises as unknown[] || [];
                                            const notes = config.notes as string;
                                            return movements.length > 0 || exercises.length > 0 || (notes && typeof notes === 'string' && notes.trim() !== '');
                                        }
                                        default:
                                            const keys = Object.keys(config).filter(k => k !== 'is_completed');
                                            return keys.length > 0 && !keys.every(k => {
                                                const val = config[k];
                                                return val === null || val === undefined || val === '' ||
                                                    (Array.isArray(val) && val.length === 0);
                                            });
                                    }
                                });

                                // Re-index remaining blocks
                                const reindexedBlocks = nonEmptyBlocks.map((block, idx) => ({
                                    ...block,
                                    order_index: idx
                                }));

                                // Only mark as dirty if blocks were removed
                                const hasChanges = day.blocks.length !== reindexedBlocks.length;

                                return hasChanges
                                    ? { ...day, blocks: reindexedBlocks, isDirty: true }
                                    : day;
                            }
                            return day;
                        })
                    }));

                    // Only update if there were changes
                    if (updatedMesocycles !== mesocycles) {
                        set({
                            mesocycles: updatedMesocycles,
                            hasUnsavedChanges: true
                        });
                    }
                }, 50);
            },

            // Block Navigation - Next block in current day
            selectNextBlock: () => {
                const { mesocycles, selectedBlockId, selectedDayId, blockBuilderDayId } = get();
                const dayId = blockBuilderDayId || selectedDayId;
                if (!dayId || !selectedBlockId) return;

                // Find current day
                let currentDay = null;
                for (const meso of mesocycles) {
                    const found = meso.days.find(d => d.id === dayId);
                    if (found) {
                        currentDay = found;
                        break;
                    }
                }
                if (!currentDay) return;

                const sortedBlocks = [...currentDay.blocks].sort((a, b) => a.order_index - b.order_index);
                const currentIndex = sortedBlocks.findIndex(b => b.id === selectedBlockId);
                if (currentIndex < sortedBlocks.length - 1) {
                    set({ selectedBlockId: sortedBlocks[currentIndex + 1].id });
                }
            },

            // Block Navigation - Previous block in current day
            selectPrevBlock: () => {
                const { mesocycles, selectedBlockId, selectedDayId, blockBuilderDayId } = get();
                const dayId = blockBuilderDayId || selectedDayId;
                if (!dayId || !selectedBlockId) return;

                // Find current day
                let currentDay = null;
                for (const meso of mesocycles) {
                    const found = meso.days.find(d => d.id === dayId);
                    if (found) {
                        currentDay = found;
                        break;
                    }
                }
                if (!currentDay) return;

                const sortedBlocks = [...currentDay.blocks].sort((a, b) => a.order_index - b.order_index);
                const currentIndex = sortedBlocks.findIndex(b => b.id === selectedBlockId);
                if (currentIndex > 0) {
                    set({ selectedBlockId: sortedBlocks[currentIndex - 1].id });
                }
            },

            // Day Navigation - Next day, select first block
            selectNextDayFirstBlock: () => {
                const { mesocycles, selectedWeek, blockBuilderDayId, selectedDayId } = get();
                const currentMeso = mesocycles.find(m => m.week_number === selectedWeek);
                if (!currentMeso) return;

                const dayId = blockBuilderDayId || selectedDayId;
                const sortedDays = [...currentMeso.days].sort((a, b) => a.day_number - b.day_number);
                const currentDayIndex = sortedDays.findIndex(d => d.id === dayId);

                // Find next non-rest day
                for (let i = currentDayIndex + 1; i < sortedDays.length; i++) {
                    const nextDay = sortedDays[i];
                    if (!nextDay.is_rest_day) {
                        const firstBlock = nextDay.blocks.sort((a, b) => a.order_index - b.order_index)[0];
                        set({
                            selectedDayId: nextDay.id,
                            blockBuilderDayId: nextDay.id,
                            selectedBlockId: firstBlock?.id || null
                        });
                        return;
                    }
                }
            },

            // Day Navigation - Previous day, select first block
            selectPrevDayFirstBlock: () => {
                const { mesocycles, selectedWeek, blockBuilderDayId, selectedDayId } = get();
                const currentMeso = mesocycles.find(m => m.week_number === selectedWeek);
                if (!currentMeso) return;

                const dayId = blockBuilderDayId || selectedDayId;
                const sortedDays = [...currentMeso.days].sort((a, b) => a.day_number - b.day_number);
                const currentDayIndex = sortedDays.findIndex(d => d.id === dayId);

                // Find previous non-rest day
                for (let i = currentDayIndex - 1; i >= 0; i--) {
                    const prevDay = sortedDays[i];
                    if (!prevDay.is_rest_day) {
                        const firstBlock = prevDay.blocks.sort((a, b) => a.order_index - b.order_index)[0];
                        set({
                            selectedDayId: prevDay.id,
                            blockBuilderDayId: prevDay.id,
                            selectedBlockId: firstBlock?.id || null
                        });
                        return;
                    }
                }
            },

            moveBlockToDay: (blockId, targetDayId) => {
                const { mesocycles } = get();

                let movedBlock: DraftWorkoutBlock | null = null;

                // First pass: find and remove the block
                const withRemovedBlock = mesocycles.map(meso => ({
                    ...meso,
                    days: meso.days.map(day => {
                        const block = day.blocks.find(b => b.id === blockId);
                        if (block) {
                            movedBlock = block;
                            return {
                                ...day,
                                blocks: day.blocks.filter(b => b.id !== blockId),
                            };
                        }
                        return day;
                    }),
                }));

                if (!movedBlock) return;

                // Second pass: add to target day
                const updatedMesocycles = withRemovedBlock.map(meso => ({
                    ...meso,
                    days: meso.days.map(day => {
                        if (day.id === targetDayId) {
                            return {
                                ...day,
                                blocks: [
                                    ...day.blocks,
                                    {
                                        ...movedBlock!,
                                        day_id: targetDayId,
                                        order_index: day.blocks.length,
                                        isDirty: true,
                                    },
                                ],
                                isDirty: true,
                            };
                        }
                        return day;
                    }),
                }));

                set({
                    mesocycles: updatedMesocycles,
                    hasUnsavedChanges: true,
                    draggedBlockId: null,
                    dropTargetDayId: null,
                });
            },

            moveProgressionToDay: (progressionId, targetDayNumber) => {
                const { mesocycles } = get();

                const updatedMesocycles = mesocycles.map(meso => {
                    // Find the target day for this mesocycle
                    const targetDay = meso.days.find(d => d.day_number === targetDayNumber);
                    if (!targetDay) return meso;

                    // Find and collect blocks with this progression_id
                    let blockToMove: DraftWorkoutBlock | null = null;

                    const daysWithoutBlock = meso.days.map(day => {
                        const block = day.blocks.find(b => b.progression_id === progressionId);
                        if (block) {
                            blockToMove = block;
                            return {
                                ...day,
                                blocks: day.blocks.filter(b => b.progression_id !== progressionId),
                                isDirty: true,
                            };
                        }
                        return day;
                    });

                    if (!blockToMove) return meso;

                    // Add the block to the target day
                    const finalDays = daysWithoutBlock.map(day => {
                        if (day.id === targetDay.id) {
                            return {
                                ...day,
                                blocks: [
                                    ...day.blocks,
                                    {
                                        ...blockToMove!,
                                        day_id: day.id,
                                        order_index: day.blocks.length,
                                        isDirty: true,
                                    },
                                ],
                                isDirty: true,
                            };
                        }
                        return day;
                    });

                    return { ...meso, days: finalDays };
                });

                set({
                    mesocycles: updatedMesocycles,
                    hasUnsavedChanges: true,
                    draggedBlockId: null,
                    dropTargetDayId: null,
                });
            },

            // Mark all changes as saved
            markAsClean: () => {
                const { mesocycles } = get();

                const cleanedMesocycles = mesocycles.map(meso => ({
                    ...meso,
                    isDirty: false,
                    days: meso.days.map(day => ({
                        ...day,
                        isDirty: false,
                        blocks: day.blocks.map(block => ({ ...block, isDirty: false })),
                    })),
                }));

                set({ mesocycles: cleanedMesocycles, hasUnsavedChanges: false });
            },
        }),
        {
            name: 'cv-os-editor',
            partialize: (state) => ({
                programId: state.programId,
                programName: state.programName,
                programCoachName: state.programCoachName,
                mesocycles: state.mesocycles,
                selectedWeek: state.selectedWeek,
                hasUnsavedChanges: state.hasUnsavedChanges,
            }),
        }
    )
);

// ============================================
// App Store - Global App State
// ============================================

type ViewContext = 'athletes' | 'gyms';

interface AppState {
    // Context
    currentView: ViewContext;

    // Command Palette
    isCommandPaletteOpen: boolean;

    // Sidebar
    isSidebarCollapsed: boolean;

    // Actions
    setCurrentView: (view: ViewContext) => void;
    toggleCommandPalette: () => void;
    openCommandPalette: () => void;
    closeCommandPalette: () => void;
    toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
    currentView: 'athletes',
    isCommandPaletteOpen: false,
    isSidebarCollapsed: false,

    setCurrentView: (view) => set({ currentView: view }),
    toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
    openCommandPalette: () => set({ isCommandPaletteOpen: true }),
    closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
    toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));
