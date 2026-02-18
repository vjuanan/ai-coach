import { Topbar } from '@/components/app-shell/Topbar';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { getClient, getClientPrograms, getClients } from '@/lib/actions';
import { getCoachesNew } from '@/lib/actions-coach';
import { CoachAssigner } from '@/components/athletes/CoachAssigner';
import { GymAssigner } from '@/components/athletes/GymAssigner';
import { ProfileDetailsEditor } from '@/components/athletes/ProfileDetailsEditor';
import { BenchmarksEditor } from '@/components/athletes/BenchmarksEditor';
import {
    Mail,
    Calendar,
    Ruler,
    Weight,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { BackButton } from './back-button';

export default async function AthleteDetailsPage({ params }: { params: { clientId: string } }) {
    const clientId = params.clientId;

    const [athlete, programs, coaches] = await Promise.all([
        getClient(clientId),
        getClientPrograms(clientId),
        getCoachesNew()
    ]);

    if (!athlete) {
        return (
            <>
                <Topbar />
                <div className="max-w-5xl mx-auto space-y-6 p-6">
                    <PageHeader title="Error" actions={<BackButton />} />
                    <div className="text-center py-12">
                        <p className="text-cv-text-secondary">No se encontró el atleta.</p>
                    </div>
                </div>
            </>
        );
    }

    const { details } = athlete;
    const benchmarks = details?.oneRmStats || {};

    return (
        <>
            <Topbar />
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="mb-2">
                    <BackButton />
                </div>

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

                {/* Coach Assignment (Top) */}
                <CoachAssigner
                    athleteId={athlete.id}
                    currentCoachId={athlete.coach_id}
                    coaches={coaches}
                />

                {/* Benchmarks Section (Full Width) */}
                <BenchmarksEditor
                    athleteId={athlete.id}
                    initialStats={benchmarks}
                    franTime={details?.franTime}
                    run1km={details?.run1km}
                    run5km={details?.run5km}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Benchmarks & Goals */}
                    <div className="space-y-6">



                        {/* Gym Assignment */}
                        <GymAssigner
                            athleteId={athlete.id}
                            currentGymId={(athlete as any).gym?.id || (athlete as any).gym_id}
                            gymName={(athlete as any).gym?.name}
                            gyms={await getClients('gym').then(data => data.filter((c: any) => c.id !== athlete.id))}
                        />

                        {/* Profile Editor */}
                        <ProfileDetailsEditor
                            athleteId={athlete.id}
                            initialData={{
                                dob: details?.dob || (details as any).birth_date,
                                height: details?.height,
                                weight: details?.weight,
                                goal: details?.goal || (details as any).main_goal,
                                training_place: details?.training_place || (details as any).training_place,
                                equipment: details?.equipment || (details as any).equipment_list,
                                days_per_week: details?.days_per_week || (details as any).days_per_week,
                                minutes_per_session: details?.minutes_per_session || (details as any).minutes_per_session,
                                level: details?.level || (details as any).experience_level,
                                injuries: details?.injuries,
                                preferences: details?.preferences || (details as any).training_preferences,
                                whatsapp: (athlete as any).phone || (details as any).whatsapp || (details as any).whatsapp_number,
                                email: athlete.email
                            }}
                        />


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
