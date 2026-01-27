'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { MesocycleEditor } from '@/components/editor';
import { useEditorStore } from '@/lib/store';
import { getFullProgramData } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

export default function EditorPage() {
    const params = useParams();
    const programId = params.programId as string;
    const { initializeEditor, loadMesocycles, resetEditor } = useEditorStore();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            setError(null);
            resetEditor();

            try {
                const data = await getFullProgramData(programId);

                if (!data || !data.program) {
                    setError('Programa no encontrado');
                    return;
                }

                initializeEditor(
                    data.program.id,
                    data.program.name,
                    data.program.client
                );

                // Transform the DB structure to match Zustand store expected types
                // The getFullProgramData action already does some sorting but we need to ensure types match
                loadMesocycles(data.mesocycles as any); // Cast to any to bypass strict checks just for initial load

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
    }, [programId, initializeEditor, loadMesocycles, resetEditor]);

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
        <AppShell>
            <MesocycleEditor
                programId={programId}
                programName={useEditorStore.getState().programName} // Use store name in case it changes
            />
        </AppShell>
    );
}
