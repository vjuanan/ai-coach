'use client';
// Force rebuild timestamp: 2026-02-09T18:48:00


import { useCallback, useState, useMemo, useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import { getClient } from '@/lib/actions';
import { WeekView } from './WeekView';
// import { SmartInspector } from './SmartInspector';
import { SingleDayView } from './SingleDayView';
import { BlockBuilderPanel } from './BlockBuilderPanel';
import { MesocycleStrategyForm, type MesocycleStrategy } from './MesocycleStrategyForm';
import { ProgramAssignmentModal } from '@/components/programs/ProgramAssignmentModal';
import { useAutoSave, type SaveStatus } from './useAutoSave';
import {
    Undo,
    Redo,
    Download,
    Eye,
    Target,
    Loader2,
    CheckCircle2,
    ArrowLeft,
    Save,
    Zap,
    User,
    Users,
    ChevronDown,
    Building
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExportPreview } from '@/components/export';
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { GripVertical, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { calculateKgFromStats } from '@/hooks/useAthleteRm';
import { useExerciseCache } from '@/hooks/useExerciseCache';
import * as Popover from '@radix-ui/react-popover';

interface MesocycleEditorProps {
    programId: string;
    programName: string;
    isFullScreen?: boolean;
    onToggleFullScreen?: () => void;
}

export function MesocycleEditor({ programId, programName, isFullScreen = false, onToggleFullScreen }: MesocycleEditorProps) {
    const {
        mesocycles,
        selectedWeek,
        selectedBlockId,
        selectWeek,
        selectBlock,
        updateMesocycle,
        programAttributes,
        hasUnsavedChanges,
        programCoachName,
        blockBuilderMode,
        blockBuilderDayId,
        exitBlockBuilder,
        enterBlockBuilder,
        // Dnd Actions
        draggedBlockId,
        setDraggedBlock,
        setDropTarget,
        moveBlockToDay,
        moveProgressionToDay,
        programClient,
        setProgramClient,
        deleteBlock
    } = useEditorStore();

    // Local state for assignment
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [assignmentData, setAssignmentData] = useState<{ id: string | null, name: string | null, type: 'athlete' | 'gym' | null }>({
        id: programClient?.id || null,
        name: programClient?.name || null,
        type: programClient?.type as 'athlete' | 'gym' || null
    });

    useEffect(() => {
        setAssignmentData({
            id: programClient?.id || null,
            name: programClient?.name || null,
            type: programClient?.type as 'athlete' | 'gym' || null
        });
    }, [programClient]);

    // Dnd Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // ... (rest of Dnd handlers remain the same) 
    const handleDragStart = (event: DragStartEvent) => {
        const blockId = event.active.id as string;
        setDraggedBlock(blockId);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const overId = event.over?.id as string | undefined;
        if (overId?.startsWith('day-')) {
            const dayId = overId.replace('day-', '');
            setDropTarget(dayId);
        } else {
            setDropTarget(null);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setDraggedBlock(null);
            setDropTarget(null);
            return;
        }

        // Normalize IDs to handle both DayCard (raw ID) and BlockBuilder (builder- prefix)
        const normalizeId = (id: string) => id.toString().replace('builder-', '');

        const activeId = normalizeId(active.id as string);
        const overId = normalizeId(over.id as string);

        // Helper to find a block across all mesocycles
        const findBlock = (id: string) => {
            for (const meso of mesocycles) {
                for (const day of meso.days) {
                    const block = day.blocks.find(b => b.id === id);
                    if (block) return { block, day, meso };
                }
            }
            return null;
        };

        const source = findBlock(activeId);

        // CASE 1: Reordering within the same day (Source and Target are blocks in same day)
        const target = findBlock(overId); // Check if we dropped ON another block

        if (source && target && source.day.id === target.day.id) {
            // We are reordering within the same day
            if (source.block.order_index !== target.block.order_index) {
                const dayId = source.day.id;
                // Get current ordered IDs
                const currentOrderIds = source.day.blocks
                    .sort((a, b) => a.order_index - b.order_index)
                    .map(b => b.id);

                const oldIndex = currentOrderIds.indexOf(activeId);
                const newIndex = currentOrderIds.indexOf(overId);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newOrderIds = arrayMove(currentOrderIds, oldIndex, newIndex);
                    // Call store action
                    useEditorStore.getState().reorderBlocks(dayId, newOrderIds);
                }
            }
            setDraggedBlock(null);
            setDropTarget(null);
            return;
        }


        // CASE 2: Moving to a different Day (Target is a Day ID)
        let targetDayId: string | null = null;
        if (over.id.toString().startsWith('day-')) {
            targetDayId = over.id.toString().replace('day-', '');
        }

        if (targetDayId && source) {
            if (source.day.id !== targetDayId) {
                // Moving block to a different day
                moveBlockToDay(activeId, targetDayId);
            }
        }

        setDraggedBlock(null);
        setDropTarget(null);
    };

    const handleDragCancel = () => {
        setDraggedBlock(null);
        setDropTarget(null);
    };

    // Find dragged block for overlay
    const draggedBlockData = useMemo(() => {
        if (!draggedBlockId) return null;
        for (const meso of mesocycles) {
            for (const day of meso.days) {
                const block = day.blocks.find(b => b.id === draggedBlockId);
                if (block) return block;
            }
        }
        return null;
    }, [draggedBlockId, mesocycles]);


    // Auto-save hook
    const { status: saveStatus, forceSave } = useAutoSave({ programId, debounceMs: 500 });

    const [showExport, setShowExport] = useState(false);
    const [showStrategy, setShowStrategy] = useState(false);

    // Invalid Blocks Modal State
    const [showInvalidBlocksModal, setShowInvalidBlocksModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    const [invalidBlocksCount, setInvalidBlocksCount] = useState(0);
    const [invalidBlockIds, setInvalidBlockIds] = useState<string[]>([]);

    // Get current state for export
    const currentMesocycle = mesocycles.find(m => m.week_number === selectedWeek);
    const globalFocus = (programAttributes?.global_focus as string) || null;



    const router = useRouter();

    // Exercise Cache for validation
    const { searchLocal } = useExerciseCache();
    // Helper to validate a single block (duplicated logic from BlockEditor for safety)
    const validateBlockContent = (block: any): boolean => {
        if (block.type === 'strength_linear') {
            if (!block.name || block.name.trim().length === 0) return false;
            // Strict validation: must match an exercise in cache
            const match = searchLocal(block.name).find(e => e.name.toLowerCase() === block.name?.toLowerCase());
            return !!match;
        }
        if (['metcon_structured', 'warmup', 'accessory', 'skill'].includes(block.type)) {
            if (!block.format) return false;
            const movements = block.config.movements as any[] || [];
            if (movements.length > 0) {
                for (const m of movements) {
                    let name = '';
                    if (typeof m === 'string') name = m;
                    else if (typeof m === 'object' && m && 'name' in m) name = (m as any).name;

                    // Strictly require non-empty name and valid exercise
                    if (!name || name.trim().length === 0) return false;

                    const match = searchLocal(name).find(e => e.name.toLowerCase() === name.toLowerCase());
                    if (!match) return false;
                }
                return true;
            }
            return false; // Require at least one movement
        }
        return true; // Other types like free_text (if content exists) or defaults
    };

    // Handle Save & Exit with Validation
    // Generic Validation Helper
    const validateAndProceed = useCallback((actionCallback: () => void) => {
        // If not in block builder or no day selected, just proceed
        if (!blockBuilderDayId) {
            actionCallback();
            return;
        }

        // Find the day across ALL mesocycles (to be safe, though usually current)
        let dayFound: any = null;
        for (const m of mesocycles) {
            const d = m.days.find(day => day.id === blockBuilderDayId);
            if (d) {
                dayFound = d;
                break;
            }
        }

        if (dayFound) {
            // Check for invalid blocks
            const invalidBlocks = dayFound.blocks.filter((b: any) => !validateBlockContent(b));

            if (invalidBlocks.length > 0) {
                // Show custom modal instead of window.confirm
                setInvalidBlocksCount(invalidBlocks.length);
                setInvalidBlockIds(invalidBlocks.map((b: any) => b.id));
                setPendingAction(() => actionCallback);
                setShowInvalidBlocksModal(true);
            } else {
                // All valid
                actionCallback();
            }
        } else {
            // Day not found (weird), proceed
            actionCallback();
        }
    }, [blockBuilderDayId, mesocycles, validateBlockContent]);

    const handleConfirmDeleteInvalid = useCallback(() => {
        // Delete each invalid block
        invalidBlockIds.forEach((id) => {
            deleteBlock(id);
        });

        setShowInvalidBlocksModal(false);
        setInvalidBlockIds([]);

        // Execute the pending action
        if (pendingAction) {
            setTimeout(() => {
                pendingAction();
                setPendingAction(null);
            }, 50);
        }
    }, [invalidBlockIds, deleteBlock, pendingAction]);

    const handleCancelDeleteInvalid = useCallback(() => {
        setShowInvalidBlocksModal(false);
        setInvalidBlockIds([]);
        setPendingAction(null);
    }, []);

    // Handle Save & Exit (Button & Back Arrow)
    const handleSaveAndExit = useCallback(async () => {
        validateAndProceed(async () => {
            if (hasUnsavedChanges) {
                await forceSave();
            }
            exitBlockBuilder();
        });
    }, [validateAndProceed, hasUnsavedChanges, forceSave, exitBlockBuilder]);

    // Handle Week Change
    const handleWeekChange = (week: number) => {
        if (blockBuilderMode) {
            validateAndProceed(() => selectWeek(week));
        } else {
            selectWeek(week);
        }
    };

    // Handle Day Switching (Sidebar)
    const handleDaySwitch = (dayId: string) => {
        validateAndProceed(() => enterBlockBuilder(dayId));
    };

    // Handle ESC Navigation & Actions
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showExport) {
                    setShowExport(false); // Close export modal if open
                    return;
                }
                if (showStrategy) {
                    setShowStrategy(false); // Close strategy modal if open
                    return;
                }

                if (blockBuilderMode) {
                    handleSaveAndExit();
                } else {
                    // Save validation before exit
                    if (hasUnsavedChanges) {
                        forceSave();
                    }
                    router.push('/programs');
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [blockBuilderMode, exitBlockBuilder, hasUnsavedChanges, forceSave, router, showExport, showStrategy, handleSaveAndExit]);

    // Find day name for Block Builder
    const blockBuilderDayName = useMemo(() => {
        if (!blockBuilderDayId || !currentMesocycle) return '';
        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const day = currentMesocycle.days.find(d => d.id === blockBuilderDayId);
        return day ? dayNames[(day.day_number - 1) % 7] : '';
    }, [blockBuilderDayId, currentMesocycle]);

    // Extract current strategy from mesocycle attributes
    const currentStrategy = useMemo((): MesocycleStrategy | undefined => {
        if (!currentMesocycle?.attributes) return undefined;
        const attrs = currentMesocycle.attributes as Record<string, unknown>;
        return {
            focus: (attrs.focus as string) || currentMesocycle.focus || '',
            considerations: (attrs.considerations as string) || '',
            technicalClarifications: (attrs.technicalClarifications as string) || '',
            scalingAlternatives: (attrs.scalingAlternatives as string) || '',
        };
    }, [currentMesocycle]);

    // Build monthly export data with all weeks
    const exportWeeks = useMemo(() => {
        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const oneRmStats = (programClient?.details as any)?.oneRmStats;

        return mesocycles
            .sort((a, b) => a.week_number - b.week_number)
            .map(meso => ({
                weekNumber: meso.week_number,
                focus: meso.focus || '',
                days: meso.days
                    .filter(d => !d.is_rest_day && d.blocks.length > 0) // Only include non-rest days with blocks
                    .sort((a, b) => a.day_number - b.day_number)
                    .map(d => ({
                        name: dayNames[(d.day_number - 1) % 7] || `Día ${d.day_number}`,
                        blocks: d.blocks.map(b => ({
                            type: b.type,
                            name: b.name || b.type,
                            content: convertConfigToText(b.type, b.config, b.name, oneRmStats)
                        }))
                    }))
            }));
    }, [mesocycles, programClient]);

    // Build monthly strategy with progressions
    const monthlyStrategy = useMemo(() => {
        const firstMeso = mesocycles.find(m => m.week_number === 1);
        const firstAttrs = (firstMeso?.attributes || {}) as Record<string, unknown>;

        const progressionMap = new Map<string, { values: string[], variable?: string }>();
        mesocycles
            .sort((a, b) => a.week_number - b.week_number)
            .forEach(meso => {
                meso.days.forEach(day => {
                    day.blocks.forEach(block => {
                        // Check if block is part of a progression OR is explicitly strength_linear
                        // We prioritize progression_id but keep strength_linear for backward compatibility
                        const isProgression = block.progression_id || block.type === 'strength_linear';

                        if (isProgression && block.name) {
                            const config = block.config as Record<string, unknown>;
                            let value = '';

                            // Determine value based on progression_variable if available
                            const progressionVar = config.progression_variable as string;

                            if (block.type === 'strength_linear') {
                                const percentage = config.percentage as string || '';
                                const sets = config.sets as number || 0;
                                const reps = config.reps as number || 0;
                                const weight = config.weight as string || '';

                                if (progressionVar === 'percentage') value = percentage || '-';
                                else if (progressionVar === 'sets') value = sets ? `${sets} series` : '-';
                                else if (progressionVar === 'reps') value = reps ? `${reps} reps` : '-';
                                else if (progressionVar === 'distance') value = (config.distance as string) || '-';
                                else value = percentage || `${sets}x${reps}`; // Default fallback
                            } else if (block.type === 'metcon_structured') {
                                // For metcons, maybe show time cap, rounds, or just "Check"
                                value = (config.time_cap as string) || (config.rounds as string) || 'Active';
                            } else {
                                value = 'Active';
                            }

                            if (!progressionMap.has(block.name)) {
                                progressionMap.set(block.name, { values: [], variable: progressionVar });
                            }

                            const entry = progressionMap.get(block.name)!;
                            // Update variable if not set (or if changed, though usually consistent per ID)
                            if (!entry.variable && progressionVar) entry.variable = progressionVar;

                            // Fill gaps with dashes if missed weeks
                            while (entry.values.length < meso.week_number - 1) {
                                entry.values.push('-');
                            }
                            entry.values.push(value);
                        }
                    });
                });
            });

        const progressions = Array.from(progressionMap.entries()).map(([name, data]) => ({
            name,
            progression: data.values,
            variable: data.variable
        }));

        const objectives: string[] = [];
        mesocycles.forEach(meso => {
            const attrs = (meso.attributes || {}) as Record<string, unknown>;
            if (attrs.considerations && typeof attrs.considerations === 'string') {
                const lines = attrs.considerations.split('\n').filter(l => l.trim());
                objectives.push(...lines.slice(0, 1));
            }
        });

        return {
            focus: (firstAttrs.focus as string) || firstMeso?.focus || programName,
            duration: `${mesocycles.length} semanas`,
            objectives: Array.from(new Set(objectives)).slice(0, 4),
            progressions,
        };
    }, [mesocycles, programName]);

    const exportStrategy = currentStrategy;

    const handleSaveStrategy = useCallback((strategy: MesocycleStrategy) => {
        updateMesocycle(selectedWeek, {
            focus: strategy.focus,
            attributes: {
                ...(currentMesocycle?.attributes || {}),
                focus: strategy.focus,
                considerations: strategy.considerations,
                technicalClarifications: strategy.technicalClarifications,
                scalingAlternatives: strategy.scalingAlternatives,
            }
        });
        setShowStrategy(false);
    }, [selectedWeek, updateMesocycle, currentMesocycle]);

    const hasStrategy = Boolean(
        currentStrategy?.focus ||
        currentStrategy?.considerations ||
        currentStrategy?.technicalClarifications ||
        currentStrategy?.scalingAlternatives
    );

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="flex flex-col h-screen">
                {/* Editor Header - Refined with more height */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-cv-border bg-white/80 dark:bg-cv-bg-secondary/80 backdrop-blur-sm flex-shrink-0">
                    {/* Left Section - Breadcrumbs & Save Status */}
                    <div className="flex items-center gap-2">
                        {/* Back Button - Conditional behavior based on mode */}
                        {blockBuilderMode ? (
                            <button
                                onClick={handleSaveAndExit}
                                className="cv-btn-ghost p-1.5 rounded-lg flex items-center gap-1 text-cv-text-secondary hover:text-cv-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Guardar y Volver a Vista Semanal"
                            >
                                <ArrowLeft size={16} />
                            </button>
                        ) : (
                            <Link
                                href="/programs"
                                className="cv-btn-ghost p-1.5 rounded-lg flex items-center gap-1 text-cv-text-secondary hover:text-cv-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Volver a Programas"
                            >
                                <ArrowLeft size={16} />
                            </Link>
                        )}

                        <div className="w-px h-5 bg-cv-border" />

                        {/* Program Name (Editable feel) */}
                        <div>
                            {blockBuilderMode ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded flex items-center justify-center bg-cv-accent/10">
                                        <Zap size={12} className="text-cv-accent" />
                                    </div>
                                    <span className="text-sm font-bold text-cv-text-primary">Block Builder</span>
                                </div>
                            ) : (
                                <h2 className="text-sm font-semibold text-cv-text-primary flex items-center gap-1.5">
                                    {programName}
                                    {currentMesocycle?.focus && (
                                        <>
                                            <span className="text-cv-text-tertiary">/</span>
                                            <span className="text-cv-accent font-medium">{currentMesocycle.focus}</span>
                                        </>
                                    )}
                                </h2>
                            )}
                        </div>

                        {/* Assignment Badge */}
                        {!blockBuilderMode && (
                            <>
                                <div className="w-px h-5 bg-cv-border mx-2" />
                                {assignmentData.id ? (
                                    <Popover.Root>
                                        <Popover.Trigger asChild>
                                            <button className="flex items-center gap-2 px-2 py-1 rounded-md bg-cv-accent/5 hover:bg-cv-accent/10 text-xs text-cv-accent font-medium transition-colors">
                                                {assignmentData.type === 'athlete' ? <User size={12} /> : <Building size={12} />}
                                                <span>{assignmentData.name}</span>
                                                <ChevronDown size={12} />
                                            </button>
                                        </Popover.Trigger>
                                        <Popover.Portal>
                                            <Popover.Content className="z-50 w-48 bg-white dark:bg-[#1a1b1e] rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 p-1 animate-in fade-in zoom-in-95 duration-200" sideOffset={5}>
                                                <button
                                                    onClick={() => setShowAssignmentModal(true)}
                                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-left"
                                                >
                                                    <Users size={12} />
                                                    Editar asignación
                                                </button>
                                                <Link
                                                    href={assignmentData.type === 'athlete' ? `/athletes/${assignmentData.id}` : `/gyms/${assignmentData.id}`}
                                                    target='_blank'
                                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-left"
                                                >
                                                    <User size={12} />
                                                    Ver perfil
                                                </Link>
                                                <Popover.Arrow className="fill-white dark:fill-[#1a1b1e]" />
                                            </Popover.Content>
                                        </Popover.Portal>
                                    </Popover.Root>
                                ) : (
                                    <button
                                        onClick={() => setShowAssignmentModal(true)}
                                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                    >
                                        <Users size={12} />
                                        <span>Asignar</span>
                                    </button>
                                )}
                            </>
                        )}


                    </div>

                    {/* Center - Week Tabs */}
                    <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-cv-bg-tertiary rounded-lg p-0.5">
                        {[1, 2, 3, 4].map(week => (
                            <button
                                key={week}
                                onClick={() => handleWeekChange(week)}
                                className={`
                                px-3 py-1 rounded-md text-xs font-medium transition-all
                                ${selectedWeek === week
                                        ? 'bg-white dark:bg-cv-accent text-cv-text-primary dark:text-white shadow-sm'
                                        : 'text-cv-text-secondary hover:text-cv-text-primary hover:bg-white/50 dark:hover:bg-cv-bg-elevated'}
                            `}
                            >
                                Semana {week}
                            </button>
                        ))}
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex items-center gap-1">
                        {/* Manual Save Button - HIGHLIGHTED */}
                        {blockBuilderMode ? (
                            <button
                                onClick={handleSaveAndExit}
                                className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all mr-1 bg-green-500 hover:bg-green-600 text-white shadow-sm"
                                title="Guardar cambios y salir"
                            >
                                {saveStatus === 'saving' ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <CheckCircle2 size={14} />
                                )}
                                Guardar y Salir
                            </button>
                        ) : (
                            <button
                                onClick={() => forceSave()}
                                disabled={saveStatus === 'saving'}
                                className={`
                                px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all mr-1
                                ${hasUnsavedChanges
                                        ? 'bg-cv-accent text-white hover:bg-cv-accent/90 shadow-sm'
                                        : 'bg-transparent text-cv-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800'}
                            `}
                                title={hasUnsavedChanges ? 'Guardar cambios' : 'Todo guardado'}
                            >
                                {saveStatus === 'saving' ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : hasUnsavedChanges ? (
                                    <Save size={14} />
                                ) : (
                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                )}

                                {saveStatus === 'saving'
                                    ? 'Guardando...'
                                    : hasUnsavedChanges
                                        ? 'Guardar'
                                        : 'Guardado'}
                            </button>
                        )}


                        <div className="w-px h-4 bg-cv-border mx-1" />

                        {/* Strategy Button */}
                        <button
                            onClick={() => setShowStrategy(true)}
                            className={`cv-btn-ghost p-1.5 rounded-lg flex items-center justify-center relative transition-colors
                            ${hasStrategy ? 'text-cv-accent bg-cv-accent/5' : 'text-cv-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            title="Estrategia del Mesociclo"
                        >
                            <Target size={14} />
                            {hasStrategy && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cv-accent" />
                            )}
                        </button>

                        <div className="w-px h-4 bg-cv-border" />

                        <button className="cv-btn-ghost p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Undo">
                            <Undo size={14} />
                        </button>
                        <button className="cv-btn-ghost p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Redo">
                            <Redo size={14} />
                        </button>

                        <div className="w-px h-4 bg-cv-border" />

                        <button
                            onClick={() => setShowExport(true)}
                            className="cv-btn-ghost p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Preview"
                        >
                            <Eye size={14} />
                        </button>
                        <button
                            onClick={() => setShowExport(true)}
                            className="cv-btn-secondary px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-medium"
                            title="Exportar PDF"
                        >
                            <Download size={14} />
                            Exportar
                        </button>
                    </div>
                </div>

                {/* Main Editor Area - Split or Full based on Block Builder Mode */}
                {blockBuilderMode && blockBuilderDayId ? (
                    /* SPLIT LAYOUT: Block Builder Mode Active */
                    <div className="flex-1 flex overflow-hidden">
                        {/* Single Day View with Selector */}
                        <div className="w-[350px] flex-shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-cv-bg-primary z-10 shadow-xl">
                            {currentMesocycle && (
                                <SingleDayView
                                    mesocycle={currentMesocycle}
                                    dayId={blockBuilderDayId}
                                    onSelectDay={handleDaySwitch}
                                />
                            )}
                        </div>
                        {/* Block Builder Panel */}
                        <div className="flex-1 overflow-hidden animate-in slide-in-from-right-4 duration-300">
                            <BlockBuilderPanel
                                dayId={blockBuilderDayId}
                                dayName={blockBuilderDayName}
                                onClose={handleSaveAndExit}
                            />
                        </div>
                    </div>
                ) : (
                    /* NORMAL LAYOUT: Full Width Week View */
                    <div className="flex-1 overflow-auto p-4 bg-gradient-to-br from-slate-50 to-white dark:from-cv-bg-primary dark:to-cv-bg-secondary">
                        {currentMesocycle ? (
                            <WeekView mesocycle={currentMesocycle} programGlobalFocus={globalFocus} />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <p className="text-cv-text-tertiary mb-4">No hay datos para la Semana {selectedWeek}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}



                {/* Strategy Modal */}
                <MesocycleStrategyForm
                    isOpen={showStrategy}
                    onClose={() => setShowStrategy(false)}
                    weekNumber={selectedWeek}
                    initialData={currentStrategy}
                    onSave={handleSaveStrategy}
                />

                {/* Export Modal */}
                <ExportPreview
                    isOpen={showExport}
                    onClose={() => setShowExport(false)}
                    programName={programName}
                    clientInfo={{ name: assignmentData.name || 'Cliente' }}
                    coachName={programCoachName || 'Coach'}
                    monthlyStrategy={monthlyStrategy}
                    weeks={exportWeeks}
                    strategy={exportStrategy}
                />

                <ProgramAssignmentModal
                    isOpen={showAssignmentModal}
                    onClose={() => setShowAssignmentModal(false)}
                    programId={programId}
                    currentClientId={assignmentData.id}
                    onAssignSuccess={async (id, name, type) => {
                        setAssignmentData({ id, name, type });
                        if (id) {
                            try {
                                const fullClient = await getClient(id);
                                setProgramClient(fullClient);
                            } catch (err) {
                                console.error('Failed to fetch client data for benchmarks:', err);
                            }
                        } else {
                            setProgramClient(null);
                        }
                    }}
                />

                {/* Drag Overlay - Shows a preview of the block being dragged */}
                <DragOverlay dropAnimation={{
                    duration: 200,
                    easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                }}>
                    {draggedBlockData ? (
                        <div className="bg-white dark:bg-cv-bg-secondary rounded-lg shadow-xl border-2 border-cv-accent p-3 opacity-95 max-w-[200px] z-50 pointer-events-none">
                            <div className="flex items-center gap-2">
                                <GripVertical size={14} className="text-cv-accent" />
                                <span className="text-sm font-medium text-cv-text-primary truncate">
                                    {draggedBlockData.name || 'Bloque'}
                                </span>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>

                {/* Invalid Blocks Warning Modal */}
                <Modal
                    isOpen={showInvalidBlocksModal}
                    onClose={handleCancelDeleteInvalid}
                    title={
                        <div className="flex items-center gap-2 text-amber-500">
                            <AlertTriangle size={24} />
                            <span>Advertencia</span>
                        </div>
                    }
                    description="Se han detectado bloques incompletos."
                >
                    <div className="space-y-4">
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                            <h4 className="text-amber-500 font-medium mb-2">
                                Hay <span className="font-bold">{invalidBlocksCount}</span> bloque(s) incompleto(s) o inválido(s).
                            </h4>
                            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                                <li>Los ejercicios vacíos o no existentes no se pueden guardar.</li>
                                <li>Debes corregirlos o eliminarlos para poder continuar.</li>
                            </ul>
                        </div>

                        <p className="text-gray-400 text-sm">
                            ¿Deseas <span className="text-red-400 font-medium">eliminar</span> estos bloques automáticamente y continuar?
                        </p>

                        <div className="flex items-center justify-end gap-3 mt-6">
                            <button
                                onClick={handleCancelDeleteInvalid}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDeleteInvalid}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all flex items-center gap-2"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                                Eliminar y Continuar
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </DndContext>
    );
}

// Helper to format block config for preview
function convertConfigToText(type: string, config: any, blockName?: string | null, oneRmStats?: any): string[] {
    if (type === 'strength_linear') {
        // If distance is present, use it instead of reps or alongside
        const mainMetric = config.distance ? config.distance : config.reps;

        // Calculate KG if percentage and stats match
        let kgBadge = '';
        if (config.percentage && blockName && oneRmStats) {
            const kg = calculateKgFromStats(oneRmStats, blockName, config.percentage);
            if (kg) kgBadge = `(≈${kg}kg)`;
        }

        const parts = [
            config.sets && mainMetric ? `${config.sets} x ${mainMetric}` : '',
            config.percentage ? `@ ${config.percentage}% ${kgBadge}` : '', // Added % symbol and KG badge
            config.rpe ? `@ RPE ${config.rpe}` : ''
        ].filter(Boolean).join('  '); // Double space for better separation

        const lines = [parts];
        if (config.notes) lines.push(config.notes);

        return lines.filter(Boolean);
    }
    if (type === 'metcon_structured') {
        const lines = [];
        const header = [
            config.time_cap || config.minutes ? `Time Cap: ${config.time_cap || config.minutes} min` : '',
            config.rounds ? `${config.rounds} Rounds` : '',
            config.score_type ? `Score: ${config.score_type}` : ''
        ].filter(Boolean).join(' | ');

        if (header) lines.push(header);

        if (Array.isArray(config.movements)) {
            lines.push(...config.movements);
        } else if (typeof config.content === 'string') {
            lines.push(...config.content.split('\n'));
        }

        if (config.notes) lines.push(config.notes);

        return lines;
    }

    // Generic handlers for other types
    if (config.movements && Array.isArray(config.movements)) {
        const lines = [...config.movements];
        if (config.notes) lines.push(config.notes);
        return lines;
    }

    if (config.content) {
        return config.content.split('\n');
    }

    return [config.notes || ''];
}
