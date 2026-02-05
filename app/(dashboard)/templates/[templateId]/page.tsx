'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MesocycleEditor } from '@/components/editor';
import { useEditorStore } from '@/lib/store';
import { getFullProgramData, getStimulusFeatures } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { Topbar } from '@/components/app-shell/Topbar';

export default function TemplateDetailPage() {
    const params = useParams();
    const templateId = params.templateId as string;
    const { initializeEditor, loadMesocycles, resetEditor, programName } = useEditorStore();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            setError(null);
            resetEditor();

            try {
                // Fetch template data (same structural as program)
                const [programData, stimulusFeatures] = await Promise.all([
                    getFullProgramData(templateId),
                    getStimulusFeatures()
                ]);

                if (!programData || !programData.program) {
                    setError('Plantilla no encontrada');
                    return;
                }

                initializeEditor(
                    programData.program.id,
                    programData.program.name,
                    programData.program.coach?.full_name || 'Coach', // Added missing coachName
                    programData.program.client,
                    programData.program.attributes,
                    stimulusFeatures || []
                );

                loadMesocycles(programData.mesocycles as any);

            } catch (err) {
                console.error(err);
                setError('Error al cargar la plantilla');
            } finally {
                setIsLoading(false);
            }
        }

        if (templateId) {
            loadData();
        }
    }, [templateId, initializeEditor, loadMesocycles, resetEditor]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="animate-spin text-cv-accent" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] text-cv-text-secondary">
                {error}
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-64px)] overflow-hidden flex flex-col">
            {/* 
              We use Topbar here if needed, but the MesocycleEditor might provide its own header.
              Actually MesocycleEditor usually has a header. 
              Let's wrap it in a container.
           */}
            <MesocycleEditor
                programId={templateId}
                programName={programName}
                isFullScreen={false}
                onToggleFullScreen={() => { }}
            />
        </div>
    );
}
