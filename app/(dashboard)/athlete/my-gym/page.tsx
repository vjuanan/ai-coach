import Link from 'next/link';
import { Topbar } from '@/components/app-shell/Topbar';
import { getAthleteAccessContext } from '@/lib/actions';
import { Building2 } from 'lucide-react';
import { GymDetailsEditor } from '@/components/gyms/GymDetailsEditor';

export const dynamic = 'force-dynamic';

export default async function AthleteMyGymPage() {
    const context = await getAthleteAccessContext();
    const gym = context.effectiveGym;

    return (
        <>
            <Topbar title="" />
            <div className="max-w-5xl mx-auto pt-2 space-y-6">
                <div className="cv-card">
                    <h1 className="text-2xl font-bold text-cv-text-primary flex items-center gap-2 mb-2">
                        <Building2 size={24} className="text-cv-accent" />
                        Mi Gimnasio
                    </h1>
                    <p className="text-cv-text-secondary text-sm">
                        Vista solo lectura de la informacion de tu box/gimnasio.
                    </p>
                </div>

                {!gym ? (
                    <div className="cv-card border-dashed text-center py-10">
                        <p className="text-cv-text-secondary">No tienes gimnasio asignado actualmente.</p>
                        <p className="text-xs text-cv-text-tertiary mt-2">Cuando tu coach o administrador te vincule a un box, lo veras aqui.</p>
                    </div>
                ) : (
                    <GymDetailsEditor
                        gymId={gym.clientId}
                        isEditable={false}
                        initialData={{
                            gym_type: (gym.details as any)?.gym_type,
                            location: (gym.details as any)?.location || (gym.details as any)?.gym_location,
                            member_count: (gym.details as any)?.member_count || (gym.details as any)?.memberCount,
                            equipment: (gym.details as any)?.equipment || (gym.details as any)?.equipment_available,
                            operating_hours: (gym.details as any)?.operating_hours,
                            website: (gym.details as any)?.website || (gym.details as any)?.website_url,
                            phone: gym.phone || (gym.details as any)?.phone || undefined,
                            email: gym.email || undefined,
                        }}
                    />
                )}

                <div className="text-xs text-cv-text-tertiary">
                    <Link href="/athlete/dashboard" className="text-cv-accent hover:underline">Volver al panel de atleta</Link>
                </div>
            </div>
        </>
    );
}
