import Link from 'next/link';
import { Topbar } from '@/components/app-shell/Topbar';
import { getAthleteAccessContext } from '@/lib/actions';
import { Mail, Building2, UserCog } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AthleteMyCoachPage() {
    const context = await getAthleteAccessContext();
    const coach = context.coach;

    return (
        <>
            <Topbar title="" />
            <div className="max-w-4xl mx-auto pt-2 space-y-6">
                <div className="cv-card">
                    <h1 className="text-2xl font-bold text-cv-text-primary flex items-center gap-2 mb-2">
                        <UserCog size={24} className="text-cv-accent" />
                        Mi Coach
                    </h1>
                    <p className="text-cv-text-secondary text-sm">
                        Vista solo lectura del perfil de tu entrenador.
                    </p>
                </div>

                {!coach ? (
                    <div className="cv-card border-dashed text-center py-10">
                        <p className="text-cv-text-secondary">No tienes un coach asignado actualmente.</p>
                        <p className="text-xs text-cv-text-tertiary mt-2">Pide a un administrador que te asigne uno.</p>
                    </div>
                ) : (
                    <div className="cv-card space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold text-xl">
                                {(coach.fullName || coach.email || 'C').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-cv-text-primary">{coach.fullName || 'Coach'}</h2>
                                {coach.businessName && (
                                    <p className="text-sm text-cv-text-secondary flex items-center gap-1">
                                        <Building2 size={14} />
                                        {coach.businessName}
                                    </p>
                                )}
                            </div>
                        </div>

                        {coach.email && (
                            <div className="p-3 rounded-lg bg-cv-bg-tertiary border border-cv-border flex items-center gap-2 text-cv-text-secondary text-sm">
                                <Mail size={16} />
                                {coach.email}
                            </div>
                        )}
                    </div>
                )}

                <div className="text-xs text-cv-text-tertiary">
                    <Link href="/athlete/dashboard" className="text-cv-accent hover:underline">Volver al panel de atleta</Link>
                </div>
            </div>
        </>
    );
}
