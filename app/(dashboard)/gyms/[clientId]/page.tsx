import { Topbar } from '@/components/app-shell/Topbar';
import { getClient, getClientPrograms } from '@/lib/actions';
import {
    Building2,
    MapPin,
    User,
    Users,
    Dumbbell,
    Calendar,
    ArrowLeft,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { BackButton } from './back-button';
import { GymDetailsEditor } from '@/components/gyms/GymDetailsEditor';

export default async function GymDetailsPage({ params }: { params: { clientId: string } }) {
    const clientId = params.clientId;

    const [client, programs] = await Promise.all([
        getClient(clientId),
        getClientPrograms(clientId)
    ]);

    if (!client) {
        return (
            <>
                <Topbar title="" actions={<BackButton />} />
                <div className="max-w-5xl mx-auto space-y-6 pt-2 px-6">
                    <div className="text-center py-12">
                        <p className="text-cv-text-secondary">No se encontró el gimnasio.</p>
                    </div>
                </div>
            </>
        );
    }

    const { details } = client;
    return (
        <>
            <Topbar title="" actions={<BackButton />} />
            <div className="max-w-5xl mx-auto space-y-6 pt-2 px-6">
                {/* Gym Details & Editor */}
                <GymDetailsEditor
                    gymId={client.id}
                    initialData={{
                        gym_type: details?.gym_type || (details as any).gym_type,
                        location: details?.location || (details as any).gym_location,
                        member_count: details?.member_count || (details as any).memberCount,
                        equipment: (() => {
                            const val = details?.equipment || (details as any).equipment_available;
                            if (!val) return '';
                            if (typeof val === 'string') return val;
                            if (typeof val === 'object') {
                                return Object.entries(val)
                                    .filter(([_, v]) => v)
                                    .map(([k]) => k)
                                    .join(', ');
                            }
                            return String(val);
                        })(),
                        operating_hours: details?.operating_hours,
                        website: details?.website || (details as any).website_url,
                        phone: (client as any).phone || (details as any).contact_phone,
                        email: client.email
                    }}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Equipment - REMOVED (Included in Editor) */}

                    {/* Right Column: Programs */}
                    <div className="md:col-span-3 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-cv-text-primary">Programas Asignados</h2>
                        </div>

                        {programs.length === 0 ? (
                            <div className="cv-card text-center py-8 border-dashed">
                                <p className="text-cv-text-secondary mb-2">No hay programas activos para este gimnasio.</p>
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
