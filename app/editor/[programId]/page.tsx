'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { MesocycleEditor } from '@/components/editor';
import { useEditorStore } from '@/lib/store';
import { getFullProgramData, getStimulusFeatures } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

export default function EditorPage() {
    const params = useParams();
    const programId = params.programId as string;
    const { initializeEditor, loadMesocycles, resetEditor, programName, programId: storeProgramId, mesocycles } = useEditorStore();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isFullScreen, setIsFullScreen] = useState(true);

    useEffect(() => {
        // Prevent reloading if we already have the data for this program
        // This avoids resetting the store (and losing unsaved changes/UI state) 
        // when Next.js revalidates the path after an autosave.
        if (storeProgramId === programId && mesocycles.length > 0) {
            setIsLoading(false);
            return;
        }

        async function loadData() {
            setIsLoading(true);
            setError(null);
            resetEditor();

            try {
                const [programData, stimulusFeatures] = await Promise.all([
                    getFullProgramData(programId),
                    getStimulusFeatures()
                ]);

                if (!programData || !programData.program) {
                    setError('Programa no encontrado');
                    return;
                }

                const coachName = (programData.program.coach as any)?.full_name || 'Coach';

                initializeEditor(
                    programData.program.id,
                    programData.program.name,
                    coachName,
                    programData.program.client,
                    programData.program.attributes,
                    stimulusFeatures || []
                );

                // Transform the DB structure to match Zustand store expected types
                // The getFullProgramData action already does some sorting but we need to ensure types match

                // @ts-ignore
                if (programData.debugInfo) {
                    // @ts-ignore
                    console.log('SERVER DIAGNOSTIC:', JSON.stringify(programData.debugInfo, null, 2));
                }

                loadMesocycles(programData.mesocycles as any); // Cast to any to bypass strict checks just for initial load

            } catch (err) {
                console.error(err);
                setError('Error al cargar el programa');
            } finally {
                setIsLoading(false);
            }
        }

        if (programId) {
            loadData();
        }
    }, [programId, initializeEditor, loadMesocycles, resetEditor, storeProgramId, mesocycles.length]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-cv-bg-primary flex items-center justify-center">
                <Loader2 className="animate-spin text-cv-accent" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <AppShell>
                <div className="flex items-center justify-center h-[calc(100vh-100px)] text-cv-text-secondary">
                    {error}
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell fullScreen={isFullScreen}>
            <MesocycleEditor
                programId={programId}
                programName={programName}
                isFullScreen={isFullScreen}
                onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
            />
        </AppShell>
    );
}
