'use client';

import { useCallback, useState, useMemo, useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import { WeekView } from './WeekView';
// import { SmartInspector } from './SmartInspector';
import { SingleDayView } from './SingleDayView';
import { BlockBuilderPanel } from './BlockBuilderPanel';
import { MesocycleStrategyForm, type MesocycleStrategy } from './MesocycleStrategyForm';
import { useAutoSave, type SaveStatus } from './useAutoSave';
import {
    Undo,
    Redo,
    Download,
    Eye,
    Target,
    Loader2,
    CheckCircle2,
    Cloud,
    CloudOff,
    Edit3,
    ArrowLeft,
    Save
} from 'lucide-react';
import Link from 'next/link';
import { ExportPreview } from '@/components/export';

interface MesocycleEditorProps {
    programId: string;
    programName: string;
    isFullScreen?: boolean;
    onToggleFullScreen?: () => void;
}

// Save status indicator component
function SaveStatusIndicator({ status }: { status: SaveStatus }) {
    const configs = {
        idle: { icon: Cloud, text: '', className: 'text-cv-text-tertiary' },
        typing: { icon: Edit3, text: 'Editando...', className: 'text-amber-500' },
        saving: { icon: Loader2, text: 'Guardando...', className: 'text-cv-accent animate-pulse' },
        saved: { icon: CheckCircle2, text: 'Guardado', className: 'text-emerald-500' },
        error: { icon: CloudOff, text: 'Error', className: 'text-red-500' },
    };

    const config = configs[status];
    const Icon = config.icon;

    if (status === 'idle') return null;

    return (
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 ${config.className} transition-all`}>
            <Icon size={14} className={status === 'saving' ? 'animate-spin' : ''} />
            <span className="text-xs font-medium">{config.text}</span>
        </div>
    );
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
        blockBuilderMode,
        blockBuilderDayId,
        exitBlockBuilder,
        enterBlockBuilder
    } = useEditorStore();

    // Auto-save hook
    const { status: saveStatus, forceSave } = useAutoSave({ programId, debounceMs: 500 });

    const [showExport, setShowExport] = useState(false);
    const [showStrategy, setShowStrategy] = useState(false);

    // Get current state for export
    const currentMesocycle = mesocycles.find(m => m.week_number === selectedWeek);
    const globalFocus = (programAttributes?.global_focus as string) || null;



    // Handle ESC to exit Block Builder Mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && blockBuilderMode) {
                exitBlockBuilder();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [blockBuilderMode, exitBlockBuilder]);

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
                            content: convertConfigToText(b.type, b.config)
                        }))
                    }))
            }));
    }, [mesocycles]);

    // Build monthly strategy with progressions
    const monthlyStrategy = useMemo(() => {
        const firstMeso = mesocycles.find(m => m.week_number === 1);
        const firstAttrs = (firstMeso?.attributes || {}) as Record<string, unknown>;

        const progressionMap = new Map<string, string[]>();
        mesocycles
            .sort((a, b) => a.week_number - b.week_number)
            .forEach(meso => {
                meso.days.forEach(day => {
                    day.blocks.forEach(block => {
                        if (block.type === 'strength_linear' && block.name) {
                            const config = block.config as Record<string, unknown>;
                            const percentage = config.percentage as string || '';
                            const sets = config.sets as number || 0;
                            const reps = config.reps as number || 0;
                            const value = percentage || `${sets}x${reps}`;

                            if (!progressionMap.has(block.name)) {
                                progressionMap.set(block.name, []);
                            }
                            const arr = progressionMap.get(block.name)!;
                            while (arr.length < meso.week_number - 1) {
                                arr.push('-');
                            }
                            arr.push(value);
                        }
                    });
                });
            });

        const progressions = Array.from(progressionMap.entries()).map(([name, progression]) => ({
            name,
            progression,
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
        <div className="flex flex-col h-screen">
            {/* Editor Header - Refined with more height */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-cv-border bg-white/80 dark:bg-cv-bg-secondary/80 backdrop-blur-sm flex-shrink-0">
                {/* Left Section - Breadcrumbs & Save Status */}
                <div className="flex items-center gap-2">
                    {/* Back Button - Conditional behavior based on mode */}
                    {blockBuilderMode ? (
                        <button
                            onClick={exitBlockBuilder}
                            className="cv-btn-ghost p-1.5 rounded-lg flex items-center gap-1 text-cv-text-secondary hover:text-cv-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Volver a Vista Semanal"
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
                        <h2 className="text-sm font-semibold text-cv-text-primary flex items-center gap-1.5">
                            {programName}
                            {currentMesocycle?.focus && (
                                <>
                                    <span className="text-cv-text-tertiary">/</span>
                                    <span className="text-cv-accent font-medium">{currentMesocycle.focus}</span>
                                </>
                            )}
                        </h2>
                    </div>

                    {/* Save Status Indicator */}
                    <SaveStatusIndicator status={saveStatus} />
                </div>

                {/* Center - Week Tabs */}
                <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-cv-bg-tertiary rounded-lg p-0.5">
                    {[1, 2, 3, 4].map(week => (
                        <button
                            key={week}
                            onClick={() => selectWeek(week)}
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

                    <div className="w-px h-4 bg-cv-border mx-1" />

                    {/* Strategy Button */}
                    <button
                        onClick={() => setShowStrategy(true)}
                        className={`cv-btn-ghost px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-medium transition-colors
                            ${hasStrategy ? 'text-cv-accent bg-cv-accent/5' : 'text-cv-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title="Estrategia del Mesociclo"
                    >
                        <Target size={14} />
                        Estrategia
                        {hasStrategy && (
                            <span className="w-2 h-2 rounded-full bg-cv-accent" />
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

                    <button className="cv-btn-ghost p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Preview">
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
                                onSelectDay={(dayId: string) => enterBlockBuilder(dayId)}
                            />
                        )}
                    </div>
                    {/* Block Builder Panel */}
                    <div className="flex-1 overflow-hidden animate-in slide-in-from-right-4 duration-300">
                        <BlockBuilderPanel
                            dayId={blockBuilderDayId}
                            dayName={blockBuilderDayName}
                            onClose={exitBlockBuilder}
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
                clientInfo={{ name: 'Cliente' }}
                coachName="Coach"
                monthlyStrategy={monthlyStrategy}
                weeks={exportWeeks}
                strategy={exportStrategy}
            />
        </div>
    );
}

// Helper to format block config for preview
function convertConfigToText(type: string, config: any): string[] {
    if (type === 'strength_linear') {
        return [
            `${config.sets}x${config.reps} @ ${config.percentage || 'RPE'}`,
            config.notes
        ].filter(Boolean);
    }
    if (type === 'metcon_structured') {
        const lines = [];
        if (config.minutes) lines.push(`Time Cap: ${config.minutes} min`);
        if (config.rounds) lines.push(`${config.rounds} Rounds`);
        if (Array.isArray(config.movements)) lines.push(...config.movements);
        return lines;
    }
    return [config.notes || ''];
}
