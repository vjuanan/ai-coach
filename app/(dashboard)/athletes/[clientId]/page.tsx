import { Topbar } from '@/components/app-shell/Topbar';
import { getClient, getClientPrograms } from '@/lib/actions';
import { getCoaches } from '@/lib/actions-coach';
import { CoachAssigner } from '@/components/athletes/CoachAssigner';
import {
    Mail,
    Calendar,
    Ruler,
    Weight,
    Target,
    Activity,
    Trophy,
    Timer,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { BackButton } from './back-button';

export default async function AthleteDetailsPage({ params }: { params: { clientId: string } }) {
    const clientId = params.clientId;

    const [athlete, programs, coaches] = await Promise.all([
        getClient(clientId),
        getClientPrograms(clientId),
        getCoaches()
    ]);

    if (!athlete) {
        return (
            <>
                <Topbar title="Error" actions={<BackButton />} />
                <div className="text-center py-12">
                    <p className="text-cv-text-secondary">No se encontró el atleta.</p>
                    <BackButton />
                </div>
            </>
        );
    }

    const { details } = athlete;
    const benchmarks = details?.oneRmStats || {};

    return (
        <>
            <Topbar
                title={athlete.name}
                actions={<BackButton />}
            />
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Athlete Header Card */}
                <div className="cv-card flex items-start gap-6">
                    <div className="w-20 h-20 rounded-full bg-cv-accent-muted flex items-center justify-center text-cv-accent text-3xl font-bold shrink-0">
                        {athlete.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-cv-text-primary">{athlete.name}</h1>
                            <span className="cv-badge-accent text-xs">Atleta {details?.level || 'RX'}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-cv-text-secondary">
                            {athlete.email && (
                                <div className="flex items-center gap-1.5">
                                    <Mail size={16} className="text-cv-text-tertiary" />
                                    {athlete.email}
                                </div>
                            )}
                            {details?.dob && (
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={16} className="text-cv-text-tertiary" />
                                    {new Date(details.dob).toLocaleDateString()}
                                </div>
                            )}
                            {details?.height && (
                                <div className="flex items-center gap-1.5">
                                    <Ruler size={16} className="text-cv-text-tertiary" />
                                    {details.height} cm
                                </div>
                            )}
                            {details?.weight && (
                                <div className="flex items-center gap-1.5">
                                    <Weight size={16} className="text-cv-text-tertiary" />
                                    {details.weight} kg
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Benchmarks & Goals */}
                    <div className="space-y-6">

                        {/* Coach Assignment */}
                        <CoachAssigner
                            athleteId={athlete.id}
                            currentCoachId={athlete.coach_id}
                            coaches={coaches}
                        />

                        {/* Benchmarks */}
                        <div className="cv-card">
                            <h3 className="font-semibold text-cv-text-primary mb-4 flex items-center gap-2">
                                <Trophy size={18} className="text-cv-text-tertiary" />
                                Marcajes (1RM)
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-2 rounded-lg bg-cv-bg-tertiary border border-cv-border">
                                    <p className="text-2xs text-cv-text-tertiary uppercase font-bold">Snatch</p>
                                    <p className="text-lg font-bold text-cv-text-primary">{benchmarks.snatch || '-'} <span className="text-xs font-normal">kg</span></p>
                                </div>
                                <div className="p-2 rounded-lg bg-cv-bg-tertiary border border-cv-border">
                                    <p className="text-2xs text-cv-text-tertiary uppercase font-bold">C&J</p>
                                    <p className="text-lg font-bold text-cv-text-primary">{benchmarks.cnj || '-'} <span className="text-xs font-normal">kg</span></p>
                                </div>
                                <div className="p-2 rounded-lg bg-cv-bg-tertiary border border-cv-border">
                                    <p className="text-2xs text-cv-text-tertiary uppercase font-bold">Back SQ</p>
                                    <p className="text-lg font-bold text-cv-text-primary">{benchmarks.backSquat || '-'} <span className="text-xs font-normal">kg</span></p>
                                </div>
                                <div className="p-2 rounded-lg bg-cv-bg-tertiary border border-cv-border">
                                    <p className="text-2xs text-cv-text-tertiary uppercase font-bold">Deadlift</p>
                                    <p className="text-lg font-bold text-cv-text-primary">{benchmarks.deadlift || '-'} <span className="text-xs font-normal">kg</span></p>
                                </div>
                            </div>
                            {details?.franTime && (
                                <div className="mt-4 p-2 rounded-lg bg-cv-accent-muted border border-cv-accent/20 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Timer size={16} className="text-cv-accent" />
                                        <span className="text-xs font-bold text-cv-accent uppercase">Fran Time</span>
                                    </div>
                                    <p className="font-bold text-cv-accent">{Math.floor(details.franTime / 60)}:{(details.franTime % 60).toString().padStart(2, '0')}</p>
                                </div>
                            )}
                        </div>

                        {/* Goal & Notes */}
                        <div className="cv-card">
                            <h3 className="font-semibold text-cv-text-primary mb-3 flex items-center gap-2">
                                <Target size={18} className="text-cv-text-tertiary" />
                                Objetivos y Notas
                            </h3>
                            <div className="space-y-4">
                                {details?.goal && (
                                    <div>
                                        <p className="text-xs font-bold text-cv-text-tertiary uppercase mb-1">Meta Principal</p>
                                        <p className="text-sm text-cv-text-secondary">{details.goal}</p>
                                    </div>
                                )}
                                {details?.injuries && (
                                    <div>
                                        <p className="text-xs font-bold text-red-400 uppercase mb-1 flex items-center gap-1">
                                            <Activity size={12} />
                                            Lesiones / Notas
                                        </p>
                                        <p className="text-sm text-cv-text-secondary">{details.injuries}</p>
                                    </div>
                                )}
                                {!details?.goal && !details?.injuries && (
                                    <p className="text-sm text-cv-text-tertiary italic">Sin información</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Programs */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-cv-text-primary">Programas Asignados</h2>
                        </div>

                        {programs.length === 0 ? (
                            <div className="cv-card text-center py-8 border-dashed">
                                <p className="text-cv-text-secondary mb-2">No hay programas activos para este atleta.</p>
                                <Link href="/programs" className="text-cv-accent hover:underline text-sm">
                                    Ir a Programas
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {programs.map((program) => (
                                    <Link
                                        key={program.id}
                                        href={`/editor/${program.id}`}
                                        className="cv-card p-4 flex items-center justify-between hover:border-cv-accent/50 transition-colors group"
                                    >
                                        <div>
                                            <h3 className="font-semibold text-cv-text-primary group-hover:text-cv-accent transition-colors">
                                                {program.name}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-cv-text-tertiary">
                                                <span className={`cv-badge ${program.status === 'active' ? 'cv-badge-success' : 'cv-badge-warning'} text-xs py-0.5`}>
                                                    {program.status}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {new Date(program.updated_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-cv-text-tertiary group-hover:text-cv-accent" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
