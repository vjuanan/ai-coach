'use client';

import { AppShell } from '@/components/app-shell';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getClient, getClientPrograms } from '@/lib/actions';
import {
    Building2,
    MapPin,
    User,
    Users,
    Dumbbell,
    Calendar,
    ArrowLeft,
    Loader2,
    ChevronRight,
    Edit2
} from 'lucide-react';
import Link from 'next/link';

export default function GymDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [client, setClient] = useState<any>(null);
    const [programs, setPrograms] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const clientId = params.clientId as string;

    useEffect(() => {
        async function fetchData() {
            if (!clientId) return;
            setIsLoading(true);
            try {
                const [clientData, programsData] = await Promise.all([
                    getClient(clientId),
                    getClientPrograms(clientId)
                ]);
                setClient(clientData);
                setPrograms(programsData);
            } catch (error) {
                console.error('Error fetching gym details:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [clientId]);

    if (isLoading) {
        return (
            <AppShell title="Cargando...">
                <div className="flex h-[50vh] items-center justify-center">
                    <Loader2 className="animate-spin text-cv-accent" size={32} />
                </div>
            </AppShell>
        );
    }

    if (!client) {
        return (
            <AppShell title="Error">
                <div className="text-center py-12">
                    <p className="text-cv-text-secondary">No se encontró el gimnasio.</p>
                    <button onClick={() => router.back()} className="cv-btn-secondary mt-4">Volver</button>
                </div>
            </AppShell>
        );
    }

    const { details } = client;
    // Helper for equipment display
    const equipmentList = details?.equipment ? Object.entries(details.equipment).filter(([_, v]) => v).map(([k]) => k) : [];

    // Equipment Label Map
    const eqLabels: Record<string, string> = {
        rig: 'Rack / Estructura',
        sleds: 'Trineos',
        skiErgs: 'SkiErgs',
        assaultBikes: 'Assault Bikes',
        rowers: 'Remos',
        pool: 'Piscina'
    };

    return (
        <AppShell
            title={client.name}
            actions={
                <button onClick={() => router.back()} className="cv-btn-ghost">
                    <ArrowLeft size={18} className="mr-2" /> Volver
                </button>
            }
        >
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Gym Header Card */}
                <div className="cv-card flex items-start gap-6">
                    <div className="w-20 h-20 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                        <Building2 size={40} />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-cv-text-primary">{client.name}</h1>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-cv-text-secondary">
                            {details?.location && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={16} className="text-cv-text-tertiary" />
                                    {details.location}
                                </div>
                            )}
                            {details?.ownerName && (
                                <div className="flex items-center gap-1.5">
                                    <User size={16} className="text-cv-text-tertiary" />
                                    {details.ownerName} (Owner)
                                </div>
                            )}
                            {details?.memberCount && (
                                <div className="flex items-center gap-1.5">
                                    <Users size={16} className="text-cv-text-tertiary" />
                                    ~{details.memberCount} Miembros
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Could add Edit Client button here later */}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Stats / Equipment */}
                    <div className="space-y-6">
                        <div className="cv-card">
                            <h3 className="font-semibold text-cv-text-primary mb-4 flex items-center gap-2">
                                <Dumbbell size={18} className="text-cv-text-tertiary" />
                                Equipamiento
                            </h3>
                            {equipmentList.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {equipmentList.map(eq => (
                                        <span key={eq} className="cv-badge cv-badge-neutral text-xs">
                                            {eqLabels[eq] || eq}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-cv-text-tertiary italic">No especificado</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Programs */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-cv-text-primary">Programas Asignados</h2>
                            {/* <button className="cv-btn-secondary text-xs">Asignar Nuevo</button> */}
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
        </AppShell>
    );
}
