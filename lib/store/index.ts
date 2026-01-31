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
    WorkoutConfig
} from '@/lib/supabase/types';

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
}

export interface DraftDay {
    id: string;
    tempId?: string;
    mesocycle_id: string;
    day_number: number;
    name: string | null;
    is_rest_day: boolean;
    notes: string | null;
    stimulus_id?: string | null; // Added stimulus_id
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
    programClient: Client | null;
    programAttributes: Record<string, unknown> | null;

    // Global Configs
    stimulusFeatures: Array<{ id: string; name: string; color: string; }>;

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

    // Actions
    initializeEditor: (programId: string, name: string, client: Client | null, attributes?: Record<string, unknown> | null, stimulusFeatures?: any[]) => void;
    loadMesocycles: (mesocycles: DraftMesocycle[]) => void;
    resetEditor: () => void;

    // Selection
    selectWeek: (week: number) => void;
    selectDay: (dayId: string | null) => void;
    selectBlock: (blockId: string | null) => void;

    // Block operations
    addBlock: (dayId: string, type: BlockType, format?: WorkoutFormat) => void;
    updateBlock: (blockId: string, updates: Partial<DraftWorkoutBlock>) => void;
    deleteBlock: (blockId: string) => void;
    reorderBlocks: (dayId: string, blockIds: string[]) => void;
    duplicateBlock: (blockId: string, targetDayId?: string) => void;

    // Day operations
    updateDay: (dayId: string, updates: Partial<DraftDay>) => void;
    toggleRestDay: (dayId: string) => void;

    // Mesocycle operations
    updateMesocycle: (weekNumber: number, updates: Partial<DraftMesocycle>) => void;

    // Drag & Drop
    setDraggedBlock: (blockId: string | null) => void;
    setDropTarget: (dayId: string | null) => void;
    moveBlockToDay: (blockId: string, targetDayId: string) => void;

    // Persistence
    markAsClean: () => void;
}

const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useEditorStore = create<EditorState>()(
    persist(
        (set, get) => ({
            // Initial state
            programId: null,
            programName: '',
            programClient: null,
            programAttributes: null,
            stimulusFeatures: [],
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

            // Initialize editor with a program
            initializeEditor: (programId, name, client, attributes, stimulusFeatures) => {
                set({
                    programId,
                    programName: name,
                    programClient: client,
                    programAttributes: attributes || null,
                    stimulusFeatures: stimulusFeatures || [],
                    selectedWeek: 1,
                    selectedDayId: null,
                    selectedBlockId: null,
                    hasUnsavedChanges: false,
                });
            },

            // Load mesocycles from database
            loadMesocycles: (mesocycles) => {
                set({ mesocycles, isLoading: false });
            },

            resetEditor: () => {
                set({
                    programId: null,
                    programName: '',
                    programClient: null,
                    programAttributes: null,
                    stimulusFeatures: [],
                    mesocycles: [],
                    selectedWeek: 1,
                    selectedDayId: null,
                    selectedBlockId: null,
                    referenceBlock: null,
                    hasUnsavedChanges: false,
                });
            },

            // Selection actions
            selectWeek: (week) => set({ selectedWeek: week, selectedDayId: null, selectedBlockId: null }),
            selectDay: (dayId) => set({ selectedDayId: dayId, selectedBlockId: null, referenceBlock: null }),
            selectBlock: (blockId) => {
                const { mesocycles } = get();
                let referenceBlock: DraftWorkoutBlock | null = null;

                // Find selected block
                let selectedBlock: DraftWorkoutBlock | null = null;
                let currentMesoIndex = -1;
                let currentDayIndex = -1;

                if (blockId) {
                    mesocycles.forEach((meso, mIdx) => {
                        meso.days.forEach((day, dIdx) => {
                            const found = day.blocks.find(b => b.id === blockId);
                            if (found) {
                                selectedBlock = found;
                                currentMesoIndex = mIdx; // Assuming mesocycles are sorted by week
                                currentDayIndex = dIdx;
                            }
                        });
                    });
                }

                // Find reference block (Previous Week, Same Day, Same Order)
                if (selectedBlock && currentMesoIndex > 0) {
                    const prevMeso = mesocycles[currentMesoIndex - 1]; // Previous week
                    // Try to match by day_number (more robust than index)
                    const currentDayNumber = mesocycles[currentMesoIndex].days[currentDayIndex].day_number;
                    const prevDay = prevMeso.days.find(d => d.day_number === currentDayNumber);

                    if (prevDay) {
                        // Try to match by order_index
                        const foundRef = prevDay.blocks.find(b => b.order_index === selectedBlock!.order_index);
                        if (foundRef) {
                            referenceBlock = foundRef;
                        }
                    }
                }

                set({ selectedBlockId: blockId, referenceBlock });
            },

            // Add a new block to a day
            addBlock: (dayId, type, format) => {
                const { mesocycles } = get();
                const tempId = generateTempId();

                const newBlock: DraftWorkoutBlock = {
                    id: tempId,
                    tempId,
                    day_id: dayId,
                    order_index: 0,
                    type,
                    format: format || null,
                    name: null,
                    config: type === 'free_text' ? { content: '' } : {} as WorkoutConfig,
                    isDirty: true,
                };

                const updatedMesocycles = mesocycles.map(meso => ({
                    ...meso,
                    days: meso.days.map(day => {
                        if (day.id === dayId) {
                            const newOrderIndex = day.blocks.length;
                            return {
                                ...day,
                                blocks: [...day.blocks, { ...newBlock, order_index: newOrderIndex }],
                                isDirty: true,
                            };
                        }
                        return day;
                    }),
                }));

                set({
                    mesocycles: updatedMesocycles,
                    hasUnsavedChanges: true,
                    selectedBlockId: tempId,
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

            // Delete a block
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
                            const newBlock: DraftWorkoutBlock = {
                                ...sourceBlock!,
                                id: tempId,
                                tempId,
                                day_id: finalTargetDayId,
                                order_index: day.blocks.length,
                                isDirty: true,
                            };
                            return { ...day, blocks: [...day.blocks, newBlock], isDirty: true };
                        }
                        return day;
                    }),
                }));

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
