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
    closestCenter,
    KeyboardSensor,
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
                distance: 15, // Increased to prevent accidental clicks
            },
        }),
        useSensor(KeyboardSensor)
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

        // Normalize IDs
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
        const target = findBlock(overId); // Check if we dropped ON another block


        if (source) {
            // CASE 1: Reordering within the same day (Dropped on another block)
            if (target && source.day.id === target.day.id) {
                const dayId = source.day.id;
                const currentOrderIds = [...source.day.blocks]
                    .sort((a, b) => a.order_index - b.order_index)
                    .map(b => b.id);

                const oldIndex = currentOrderIds.indexOf(activeId);
                const newIndex = currentOrderIds.indexOf(overId);


                if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                    const newOrderIds = arrayMove(currentOrderIds, oldIndex, newIndex);
                    useEditorStore.getState().reorderBlocks(dayId, newOrderIds);
                }
                setDraggedBlock(null);
                setDropTarget(null);
                return;
            }

            // CASE 2: Dropped on a Day Container (could be same day or different day)
            let targetDayId: string | null = null;
            if (over.id.toString().startsWith('day-')) {
                targetDayId = over.id.toString().replace('day-', '');
            }

            if (targetDayId) {
                if (source.day.id === targetDayId) {
                    // Dropped on the SAME day container -> Move to end? 
                    // Or better: do nothing if we want strictly sortable behavior.
                    // But if user drags to empty space in day, we should probably append to end.
                    // Let's rely on SortableContext to handle the "gap" and if dropped on container, 
                    // it implies we moved it out of the sortable list? No.
                    // If we drop on the container, it usually means we dragged "past" the last item.

                    const currentOrderIds = [...source.day.blocks]
                        .sort((a, b) => a.order_index - b.order_index)
                        .map(b => b.id);

                    const oldIndex = currentOrderIds.indexOf(activeId);
                    const newIndex = currentOrderIds.length - 1; // Move to end

                    if (oldIndex !== -1 && oldIndex !== newIndex) {
                        const newOrderIds = arrayMove(currentOrderIds, oldIndex, newIndex);
                        useEditorStore.getState().reorderBlocks(targetDayId, newOrderIds);
                    }

                } else {
                    // Moving block to a DIFFERENT day
                    moveBlockToDay(activeId, targetDayId);
                }
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
    const [showExportWarning, setShowExportWarning] = useState(false);
    const [exportIncompleteCount, setExportIncompleteCount] = useState(0);

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
            if (!match) return false;

            // Field completeness: sets, reps, at least one intensity, rest
            const cfg = block.config || {};
            const hasSets = cfg.sets && Number(cfg.sets) > 0;
            const hasReps = cfg.reps && String(cfg.reps).trim().length > 0;
            const hasIntensity = (cfg.weight && String(cfg.weight).trim().length > 0) ||
                (cfg.percentage && Number(cfg.percentage) > 0) ||
                (cfg.rpe && Number(cfg.rpe) > 0) ||
                (cfg.rir !== undefined && cfg.rir !== null && cfg.rir !== '');
            const hasRest = cfg.rest && String(cfg.rest).trim().length > 0;

            return !!(hasSets && hasReps && hasIntensity && hasRest);
        }
        if (block.type === 'warmup') {
            // Warmups: need format (from column OR config) and at least one movement (freeform text OK)
            const hasFormat = block.format || (block.config as any)?.format;
            if (!hasFormat) return false;
            const movements = (block.config as any)?.movements as any[] || [];
            return movements.length > 0;
        }
        if (block.type === 'accessory') {
            // Accessories: need format (from column OR config) and either movements OR sets/reps
            const hasFormat = block.format || (block.config as any)?.format;
            if (!hasFormat) return false;
            const cfg = block.config || {};
            const movements = cfg.movements as any[] || [];
            const hasSetsReps = (cfg.sets && Number(cfg.sets) > 0) && (cfg.reps && String(cfg.reps).trim().length > 0);
            return movements.length > 0 || !!hasSetsReps;
        }
        if (block.type === 'metcon_structured') {
            // MetCons: need format (from column OR config) and at least one movement
            const hasFormat = block.format || (block.config as any)?.format;
            if (!hasFormat) return false;
            const movements = (block.config as any)?.movements as any[] || [];
            return movements.length > 0;
        }
        if (block.type === 'skill') {
            const hasFormat = block.format || (block.config as any)?.format;
            if (!hasFormat) return false;
            const movements = (block.config as any)?.movements as any[] || [];
            return movements.length > 0;
        }
        return true; // Other types like conditioning, finisher, free_text — auto-pass
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

    // Handle Export with pre-validation across ALL mesocycles
    const handleExportClick = useCallback(() => {
        let incompleteCount = 0;
        for (const meso of mesocycles) {
            for (const day of meso.days) {
                if (day.is_rest_day) continue;
                for (const block of (day.blocks || [])) {
                    if (!validateBlockContent(block)) {
                        incompleteCount++;
                    }
                }
            }
        }
        if (incompleteCount > 0) {
            setExportIncompleteCount(incompleteCount);
            setShowExportWarning(true);
        } else {
            setShowExport(true);
        }
    }, [mesocycles, validateBlockContent]);

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
                            content: convertConfigToText(b.type, b.config, b.name, oneRmStats, true), // Keep for fallback
                            structure: configToStructure(b.type, b.config, b.name, oneRmStats, true), // NEW structural data
                            section: b.section || 'main',
                            cue: (b.config as any)?.notes || '',
                            format: (b.config as any)?.format || (b.config as any)?.methodology || null,
                            rest: (b.config as any)?.rest || null,
                        }))
                    }))
            }));
    }, [mesocycles, programClient]);

    // Build monthly strategy with progressions
    const monthlyStrategy = useMemo(() => {
        const firstMeso = mesocycles.find(m => m.week_number === 1);
        const firstAttrs = (firstMeso?.attributes || {}) as Record<string, unknown>;
        const oneRmStats = (programClient?.details as any)?.oneRmStats;

        const progressionMap = new Map<string, { values: string[], variable?: string, rest?: string }>();
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
                                const rpe = config.rpe as string || '';

                                // Calculate KG if possible
                                let kgText = '';
                                if (percentage && block.name && oneRmStats) {
                                    const pctValue = parseFloat(percentage);
                                    if (!isNaN(pctValue)) {
                                        const kg = calculateKgFromStats(oneRmStats, block.name, pctValue);
                                        if (kg) kgText = `(${kg}kg)`;
                                    }
                                } else if (weight) {
                                    kgText = `(${weight})`;
                                }

                                // Format: 3x10 (75kg) or 3x10 @ 75%
                                const volume = (sets && (reps || config.distance)) ? `${sets}x${reps || config.distance}` : '';
                                const intensity = percentage ? (String(percentage).endsWith('%') ? percentage : `${percentage}%`) : '';

                                const parts = [];
                                if (volume) parts.push(volume);
                                if (kgText) parts.push(kgText);
                                else if (intensity) parts.push(`@ ${intensity}`);
                                if (rpe) parts.push(`@ RPE ${rpe}`);

                                value = parts.join(' ') || '-';

                            } else if (block.type === 'metcon_structured') {
                                // For metcons, maybe show time cap, rounds, or just "Check"
                                value = (config.time_cap as string) || (config.rounds as string) || 'Active';
                            } else {
                                value = 'Active';
                            }

                            if (!progressionMap.has(block.name)) {
                                const restValue = (config.rest as string) || undefined;
                                progressionMap.set(block.name, { values: [], variable: progressionVar, rest: restValue });
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
            variable: data.variable,
            rest: data.rest
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
    }, [mesocycles, programName, programClient]);

    // Build week date ranges from programAttributes
    const weekDateRanges = useMemo(() => {
        const startDateStr = (programAttributes as any)?.start_date;
        if (!startDateStr) return undefined;
        try {
            const start = new Date(startDateStr + 'T00:00:00');
            if (isNaN(start.getTime())) return undefined;
            return mesocycles
                .sort((a, b) => a.week_number - b.week_number)
                .map(meso => {
                    const weekStart = new Date(start);
                    weekStart.setDate(weekStart.getDate() + (meso.week_number - 1) * 7);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    return {
                        weekNumber: meso.week_number,
                        startDate: weekStart.toISOString().split('T')[0],
                        endDate: weekEnd.toISOString().split('T')[0],
                    };
                });
        } catch {
            return undefined;
        }
    }, [mesocycles, programAttributes]);

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
                {/* Editor Header - Compact */}
                <div className="flex items-center justify-between px-4 py-1 border-b border-cv-border bg-white/80 dark:bg-cv-bg-secondary/80 backdrop-blur-sm flex-shrink-0 min-h-[48px]">
                    {/* Left Section - Breadcrumbs & Save Status */}
                    <div className="flex items-center gap-2">
                        {/* Back Button - Conditional behavior based on mode */}
                        {blockBuilderMode ? (
                            <button
                                onClick={handleSaveAndExit}
                                className="cv-btn-ghost p-1 rounded-lg flex items-center gap-1 text-cv-text-secondary hover:text-cv-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Guardar y Volver a Vista Semanal"
                            >
                                <ArrowLeft size={14} />
                            </button>
                        ) : (
                            <Link
                                href="/programs"
                                className="cv-btn-ghost p-1 rounded-lg flex items-center gap-1 text-cv-text-secondary hover:text-cv-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Volver a Programas"
                            >
                                <ArrowLeft size={14} />
                            </Link>
                        )}

                        <div className="w-px h-4 bg-cv-border" />

                        {/* Program Name (Editable feel) */}
                        <div className="flex items-center gap-2">
                            {blockBuilderMode ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded flex items-center justify-center bg-cv-accent/10">
                                        <Zap size={10} className="text-cv-accent" />
                                    </div>
                                    <span className="text-xs font-bold text-cv-text-primary">Block Builder</span>
                                </div>
                            ) : (
                                <h2 className="text-xs font-semibold text-cv-text-primary flex items-center gap-1.5 whitespace-nowrap">
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

                        {/* Assignment Badge - Inline without separator */}
                        <>
                            {assignmentData.id ? (
                                <Popover.Root>
                                    <Popover.Trigger asChild>
                                        <button className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-cv-accent/5 hover:bg-cv-accent/10 text-[10px] text-cv-accent font-medium transition-colors ml-1">
                                            {assignmentData.type === 'athlete' ? <User size={10} /> : <Building size={10} />}
                                            <span>{assignmentData.name}</span>
                                            <ChevronDown size={10} />
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
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-[10px] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors ml-1 -my-1"
                                >
                                    <Users size={10} />
                                    <span>Sin asignar</span>
                                </button>
                            )}
                        </>


                    </div>

                    {/* Center - Week Tabs */}
                    <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-cv-bg-tertiary rounded-md p-0.5">
                        {[1, 2, 3, 4].map(week => (
                            <button
                                key={week}
                                onClick={() => handleWeekChange(week)}
                                className={`
                                px-2 py-0.5 rounded text-[10px] font-medium transition-all
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
                        {/* Manual Save Button - COMPACT */}
                        {blockBuilderMode ? (
                            <button
                                onClick={handleSaveAndExit}
                                className="px-2.5 py-1 rounded-md flex items-center gap-1.5 text-xs font-medium transition-all mr-1 bg-green-500 hover:bg-green-600 text-white shadow-sm"
                                title="Guardar cambios y salir"
                            >
                                {saveStatus === 'saving' ? (
                                    <Loader2 size={12} className="animate-spin" />
                                ) : (
                                    <CheckCircle2 size={12} />
                                )}
                                OK
                            </button>
                        ) : (
                            <button
                                onClick={() => forceSave()}
                                disabled={saveStatus === 'saving'}
                                className={`
                                px-2.5 py-1 rounded-md flex items-center gap-1.5 text-xs font-medium transition-all mr-1
                                ${hasUnsavedChanges
                                        ? 'bg-cv-accent text-white hover:bg-cv-accent/90 shadow-sm'
                                        : 'bg-transparent text-cv-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800'}
                            `}
                                title={hasUnsavedChanges ? 'Guardar cambios' : 'Todo guardado'}
                            >
                                {saveStatus === 'saving' ? (
                                    <Loader2 size={12} className="animate-spin" />
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
                            className={`cv-btn-ghost p-1 rounded-lg flex items-center justify-center relative transition-colors
                            ${hasStrategy ? 'text-cv-accent bg-cv-accent/5' : 'text-cv-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            title="Estrategia del Mesociclo"
                        >
                            <Target size={14} />
                            {hasStrategy && (
                                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cv-accent" />
                            )}
                        </button>

                        <div className="w-px h-4 bg-cv-border" />

                        <button className="cv-btn-ghost p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Undo">
                            <Undo size={14} />
                        </button>
                        <button className="cv-btn-ghost p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Redo">
                            <Redo size={14} />
                        </button>

                        <div className="w-px h-4 bg-cv-border" />

                        <button
                            onClick={handleExportClick}
                            className="cv-btn-ghost p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Preview"
                        >
                            <Eye size={14} />
                        </button>
                        <button
                            onClick={handleExportClick}
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
                    mission={globalFocus || undefined}
                    weekDateRanges={weekDateRanges}
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
                }} style={{ zIndex: 1000 }}>
                    {draggedBlockData ? (
                        <div className="bg-white dark:bg-cv-bg-secondary rounded-lg shadow-xl border-2 border-cv-accent p-3 opacity-95 max-w-[200px] z-[1000] pointer-events-none">
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

                {/* Export Validation Warning Modal */}
                <Modal
                    isOpen={showExportWarning}
                    onClose={() => setShowExportWarning(false)}
                    title={
                        <div className="flex items-center gap-2 text-amber-500">
                            <AlertTriangle size={24} />
                            <span>Datos Incompletos</span>
                        </div>
                    }
                    description="Algunos bloques no tienen toda la información."
                >
                    <div className="space-y-4">
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                            <h4 className="text-amber-500 font-medium mb-2">
                                Hay <span className="font-bold">{exportIncompleteCount}</span> bloque(s) con datos incompletos.
                            </h4>
                            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                                <li>Los ejercicios de fuerza necesitan: series, reps, intensidad y descanso.</li>
                                <li>Los bloques estructurados necesitan al menos un movimiento válido.</li>
                            </ul>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowExportWarning(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Volver y Corregir
                            </button>
                            <button
                                onClick={() => {
                                    setShowExportWarning(false);
                                    setShowExport(true);
                                }}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                            >
                                <Download size={14} />
                                Exportar Igual
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </DndContext>
    );
}

// Helper to format block config for preview
function convertConfigToText(type: string, config: any, blockName?: string | null, oneRmStats?: any, excludeNotes: boolean = false): string[] {
    // 1. Handle Strength Linear (Explicit)
    if (type === 'strength_linear') {
        const mainMetric = config.distance ? config.distance : config.reps;
        let kgBadge = '';
        if (config.percentage && blockName && oneRmStats) {
            const pctValue = parseFloat(config.percentage);
            if (!isNaN(pctValue)) {
                const kg = calculateKgFromStats(oneRmStats, blockName, pctValue);
                if (kg) kgBadge = `(≈${kg}kg)`;
            }
        }

        const parts = [
            config.sets && mainMetric ? `${config.sets} x ${mainMetric}` : '',
            config.percentage ? `@ ${config.percentage}% ${kgBadge}` : '',
            config.rpe ? `@ RPE ${config.rpe}` : '',
            config.weight ? `(${config.weight})` : '' // Explicit weight if present
        ].filter(Boolean).join('  ');

        const lines = [parts];
        if (config.notes && !excludeNotes) lines.push(config.notes);
        return lines.filter(Boolean);
    }

    // 2. Handle Structured Metcons
    if (type === 'metcon_structured') {
        const lines = [];
        const header = [
            config.time_cap || config.minutes ? `${config.format === 'EMOM' ? 'EMOM' : 'Time Cap'}: ${config.time_cap || config.minutes} min` : '',
            config.rounds ? `${config.rounds} Rounds` : '',
            config.score_type ? `Score: ${config.score_type}` : ''
        ].filter(Boolean).join(' | ');

        if (header) lines.push(header);

        if (Array.isArray(config.movements)) {
            lines.push(...config.movements);
        } else if (typeof config.content === 'string') {
            lines.push(...config.content.split('\n'));
        }

        if (config.notes && !excludeNotes) lines.push(config.notes);
        return lines;
    }

    // 3. Handle Generic Sets/Reps for Accessory/Warmup/Other
    if (config.sets || config.reps || config.distance || config.weight) {
        const mainMetric = config.distance || config.reps;
        const parts = [
            config.sets && mainMetric ? `${config.sets} x ${mainMetric}` : (config.sets ? `${config.sets} sets` : ''),
            config.weight ? `(${config.weight})` : '',
            config.rpe ? `@ RPE ${config.rpe}` : ''
        ].filter(Boolean).join('  ');

        const lines = [];
        if (parts) lines.push(parts);
        if (config.notes && !excludeNotes) lines.push(config.notes);

        if (lines.length > 0) return lines;
    }

    // 4. Default Handlers (Movements array or Content string)
    if (config.movements && Array.isArray(config.movements)) {
        const lines = config.movements.map((m: any) => {
            if (typeof m === 'string') return m;
            if (typeof m === 'object' && m && 'name' in m) return m.name;
            return '';
        }).filter(Boolean);

        if (config.notes && !excludeNotes) lines.push(config.notes);
        return lines;
    }

    if (config.content) {
        return config.content.split('\n');
    }

    return !excludeNotes ? [config.notes || ''] : [];
}

// NEW HELPER: Extract structured data for Export Redesign
function configToStructure(type: string, config: any, blockName?: string | null, oneRmStats?: any, excludeNotes: boolean = false) {
    const res = {
        sets: '',
        reps: '',
        weight: '',
        rpe: '',
        rest: config.rest || '',
        text: '', // For MetCons or text-based blocks
        notes: (!excludeNotes && config.notes) ? config.notes : ''
    };

    // 1. Strength / Generic Sets & Reps
    if (type === 'strength_linear' || config.sets || config.reps || config.weight) {
        if (config.sets) res.sets = `${config.sets}`;

        // Reps can be distance too
        if (config.reps) res.reps = `${config.reps}`;
        if (config.distance) res.reps = config.reps ? `${config.reps} (${config.distance})` : `${config.distance}`;

        // Weight logic
        if (config.weight) res.weight = config.weight;
        if (config.percentage) {
            let kgBadge = '';
            if (blockName && oneRmStats) {
                const pctValue = parseFloat(config.percentage);
                if (!isNaN(pctValue)) {
                    const kg = calculateKgFromStats(oneRmStats, blockName, pctValue);
                    if (kg) kgBadge = ` (≈${kg}kg)`;
                }
            }
            // If weight already exists, append percentage. If not, set it.
            res.weight = res.weight ? `${res.weight} @ ${config.percentage}%${kgBadge}` : `${config.percentage}%${kgBadge}`;
        }

        if (config.rpe) res.rpe = `${config.rpe}`;

        return res;
    }

    // 2. MetCons
    if (type === 'metcon_structured') {
        const parts = [];

        // Explicitly handle formats based on correct inputs
        if (config.format === 'EMOM') {
            parts.push(`EMOM ${config.minutes || config.time_cap || ''}min`);
        } else if (config.format === 'AMRAP') {
            parts.push(`AMRAP ${config.minutes || config.time_cap || ''}min`);
        } else if (config.format === 'For Time') {
            parts.push(`For Time ${config.time_cap ? `(Cap: ${config.time_cap}min)` : ''}`);
        } else {
            // Fallback
            if (config.time_cap || config.minutes) parts.push(`Time Cap: ${config.time_cap || config.minutes} min`);
        }

        if (config.rounds) parts.push(`${config.rounds} Rounds`);
        if (config.score_type) parts.push(`Score: ${config.score_type}`);

        const header = parts.filter(Boolean).join(' | ');

        let content = '';
        if (header) content += header + '\n';

        if (Array.isArray(config.movements)) {
            content += config.movements.map((m: any) => typeof m === 'string' ? m : m.name).join('\n');
        } else if (typeof config.content === 'string') {
            content += config.content;
        }

        res.text = content;
        return res;
    }

    // 3. Defaults
    const existingLines = convertConfigToText(type, config, blockName, oneRmStats, excludeNotes);
    if (existingLines.length > 0) {
        res.text = existingLines.join('\n');
    }

    return res;
}
