import Link from 'next/link';
import { Topbar } from '@/components/app-shell/Topbar';
import { getAthleteProgramForView } from '@/lib/actions';
import { Calendar, ChevronRight, Dumbbell } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ProgramPageProps {
    params: { programId: string };
}

export default async function AthleteProgramPage({ params }: ProgramPageProps) {
    const data = await getAthleteProgramForView(params.programId);

    if (!data) {
        return (
            <>
                <Topbar title="" />
                <div className="max-w-4xl mx-auto pt-2 space-y-4">
                    <div className="cv-card text-center py-10">
                        <h1 className="text-lg font-bold text-cv-text-primary">Programa no disponible</h1>
                        <p className="text-cv-text-secondary text-sm mt-2">
                            No tienes permisos para ver este programa o no existe.
                        </p>
                        <Link href="/athlete/dashboard" className="text-cv-accent hover:underline text-sm mt-4 inline-block">
                            Volver al dashboard
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    const { program, mesocycles } = data;

    return (
        <>
            <Topbar title="" />
            <div className="max-w-5xl mx-auto pt-2 space-y-6">
                <div className="cv-card space-y-2">
                    <h1 className="text-2xl font-bold text-cv-text-primary">{program.name}</h1>
                    <p className="text-sm text-cv-text-secondary">{program.description || 'Sin descripcion'}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-cv-text-tertiary">
                        <span className="inline-flex items-center gap-1 bg-cv-bg-tertiary px-2 py-1 rounded">
                            <Calendar size={12} />
                            {program.updated_at ? new Date(program.updated_at).toLocaleDateString() : 'Sin fecha'}
                        </span>
                        {program.client?.name && (
                            <span className="inline-flex items-center gap-1 bg-cv-bg-tertiary px-2 py-1 rounded">
                                <Dumbbell size={12} />
                                {program.client.name}
                            </span>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    {mesocycles.length === 0 ? (
                        <div className="cv-card border-dashed text-center py-10 text-cv-text-secondary">
                            Este programa todavia no tiene contenido cargado.
                        </div>
                    ) : (
                        mesocycles.map((meso: any) => (
                            <div key={meso.id} className="cv-card space-y-3">
                                <h2 className="font-bold text-cv-text-primary">Semana {meso.week_number} {meso.focus ? `- ${meso.focus}` : ''}</h2>
                                <div className="space-y-2">
                                    {(meso.days || []).map((day: any) => (
                                        <div key={day.id} className="p-3 rounded-lg border border-cv-border bg-cv-bg-tertiary/30">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-cv-text-primary">Dia {day.day_number} {day.name ? `- ${day.name}` : ''}</p>
                                                {day.is_rest_day && <span className="text-xs text-cv-text-tertiary">Descanso</span>}
                                            </div>
                                            {(day.blocks || []).length > 0 && (
                                                <p className="text-xs text-cv-text-secondary mt-1">
                                                    {(day.blocks || []).length} bloques de entrenamiento
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <Link href="/athlete/dashboard" className="inline-flex items-center gap-1 text-cv-accent hover:underline text-sm">
                    <ChevronRight size={14} className="rotate-180" />
                    Volver al dashboard
                </Link>
            </div>
        </>
    );
}
