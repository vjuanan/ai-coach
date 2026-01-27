'use client';

import { useCallback, useState } from 'react';
import { useEditorStore } from '@/lib/store';
import { WeekView } from './WeekView';
import { BlockEditor } from './BlockEditor';
import { Save, Undo, Redo, Download, Eye, Settings2, Loader2, CheckCircle2 } from 'lucide-react';
import { saveMesocycleChanges } from '@/lib/actions';
import { ExportPreview } from '@/components/export';

interface MesocycleEditorProps {
    programId: string;
    programName: string;
}

export function MesocycleEditor({ programId, programName }: MesocycleEditorProps) {
    const {
        mesocycles,
        selectedWeek,
        selectedBlockId,
        hasUnsavedChanges,
        selectWeek,
        markAsClean
    } = useEditorStore();

    const [isSaving, setIsSaving] = useState(false);
    const [showExport, setShowExport] = useState(false);

    // Get current state for export
    const currentMesocycle = mesocycles.find(m => m.week_number === selectedWeek);

    // Format for export
    const exportContent = currentMesocycle ? {
        dayName: `Semana ${selectedWeek}`,
        blocks: currentMesocycle.days
            .filter(d => !d.is_rest_day)
            .flatMap(d => d.blocks.map(b => ({
                type: b.type,
                name: b.name || b.type,
                content: convertConfigToText(b.type, b.config)
            })))
    } : { dayName: '', blocks: [] };

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            const result = await saveMesocycleChanges(programId, mesocycles);
            if (result.success) {
                markAsClean();
            } else {
                alert('Error al guardar cambios');
            }
        } catch (error) {
            console.error(error);
            alert('Error saving changes');
        } finally {
            setIsSaving(false);
        }
    }, [programId, mesocycles, markAsClean]);

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cv-border bg-cv-bg-secondary/50">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-cv-text-primary">
                        {programName}
                    </h2>
                    {hasUnsavedChanges ? (
                        <span className="cv-badge-warning">Cambios sin guardar</span>
                    ) : (
                        <span className="cv-badge-success flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            Guardado
                        </span>
                    )}
                </div>

                {/* Week Tabs */}
                <div className="flex items-center gap-1 bg-cv-bg-tertiary rounded-lg p-1">
                    {[1, 2, 3, 4].map(week => (
                        <button
                            key={week}
                            onClick={() => selectWeek(week)}
                            className={`
                px-4 py-1.5 rounded-md text-sm font-medium transition-all
                ${selectedWeek === week
                                    ? 'bg-cv-accent text-white shadow-cv-sm'
                                    : 'text-cv-text-secondary hover:text-cv-text-primary hover:bg-cv-bg-elevated'}
              `}
                        >
                            Semana {week}
                        </button>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button className="cv-btn-ghost p-2" title="Undo">
                        <Undo size={18} />
                    </button>
                    <button className="cv-btn-ghost p-2" title="Redo">
                        <Redo size={18} />
                    </button>
                    <div className="w-px h-6 bg-cv-border mx-1" />
                    <button className="cv-btn-ghost p-2" title="Preview">
                        <Eye size={18} />
                    </button>
                    <button
                        onClick={() => setShowExport(true)}
                        className="cv-btn-ghost p-2"
                        title="Export"
                    >
                        <Download size={18} />
                    </button>
                    <button className="cv-btn-ghost p-2" title="Settings">
                        <Settings2 size={18} />
                    </button>
                    <div className="w-px h-6 bg-cv-border mx-1" />
                    <button
                        onClick={handleSave}
                        disabled={!hasUnsavedChanges || isSaving}
                        className="cv-btn-primary min-w-[100px]"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSaving ? 'Guardando' : 'Guardar'}
                    </button>
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Canvas */}
                <div className="flex-1 overflow-auto p-6 bg-grid">
                    {currentMesocycle ? (
                        <WeekView mesocycle={currentMesocycle} />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <p className="text-cv-text-tertiary mb-4">No hay datos para la Semana {selectedWeek}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Block Editor Panel */}
                {selectedBlockId && (
                    <div className="w-96 border-l border-cv-border bg-cv-bg-secondary overflow-y-auto">
                        <BlockEditor blockId={selectedBlockId} />
                    </div>
                )}
            </div>

            {/* Export Modal */}
            <ExportPreview
                isOpen={showExport}
                onClose={() => setShowExport(false)}
                workoutContent={exportContent}
                clientInfo={{ name: 'Cliente' }}
                coachName="Coach"
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
