'use client';

import { AppShell } from '@/components/app-shell';
import { GlobalCreateButton } from '@/components/app-shell/GlobalCreateButton';
import { useAppStore } from '@/lib/store';
import { getPrograms, createProgram, getDashboardStats } from '@/lib/actions';
import {
    TrendingUp,
    Users,
    Building2,
    Dumbbell,
    Calendar,
    ArrowRight,
    Clock,
    Plus,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const { currentView } = useAppStore();
    const [programs, setPrograms] = useState<any[]>([]);
    const [stats, setStats] = useState({ athletes: 0, gyms: 0, activePrograms: 0, totalBlocks: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            try {
                const [programsData, statsData] = await Promise.all([
                    getPrograms(),
                    getDashboardStats()
                ]);
                setPrograms(programsData || []);
                setStats(statsData);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // Logic removed - moved to GlobalCreateButton

    return (
        <AppShell title="Dashboard">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Welcome Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-cv-text-primary">
                            Bienvenido, Coach
                        </h1>
                        <p className="text-cv-text-secondary mt-1">
                            Resumen de actividad de tus {currentView === 'athletes' ? 'atletas' : 'gimnasios'} hoy.
                        </p>
                    </div>
                    <GlobalCreateButton />
                </div>

                {/* Stats Grid - REAL DATA */}
                <div className="grid grid-cols-4 gap-4">
                    <StatCard
                        icon={<Users size={20} />}
                        label="Atletas"
                        value={stats.athletes}
                        trend="Total registrados"
                        color="text-blue-400"
                    />
                    <StatCard
                        icon={<Building2 size={20} />}
                        label="Gimnasios"
                        value={stats.gyms}
                        trend="Total registrados"
                        color="text-purple-400"
                    />
                    <StatCard
                        icon={<Dumbbell size={20} />}
                        label="Programas Activos"
                        value={stats.activePrograms}
                        trend="En curso"
                        color="text-cv-accent"
                    />
                    <StatCard
                        icon={<Calendar size={20} />}
                        label="Bloques Totales"
                        value={stats.totalBlocks}
                        trend="Sesiones diseñadas"
                        color="text-green-400"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Quick Access */}
                    <div className="col-span-2 space-y-6">
                        {/* Recent Programs */}
                        <div className="cv-card">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-cv-text-primary">Tus Programas</h2>
                                <Link href="/programs" className="text-sm text-cv-accent hover:underline flex items-center gap-1">
                                    Ver todos <ArrowRight size={14} />
                                </Link>
                            </div>

                            {isLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-16 bg-cv-bg-tertiary rounded-lg animate-pulse" />
                                    ))}
                                </div>
                            ) : programs.length === 0 ? (
                                <div className="text-center py-8 text-cv-text-tertiary">
                                    Aún no hay programas. ¡Crea el primero!
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {programs.map((program) => (
                                        <Link
                                            key={program.id}
                                            href={`/editor/${program.id}`}
                                            className="flex items-center justify-between p-3 rounded-lg bg-cv-bg-tertiary hover:bg-cv-bg-elevated transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-cv-accent-muted flex items-center justify-center">
                                                    <Dumbbell size={18} className="text-cv-accent" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-cv-text-primary">{program.name}</p>
                                                    <p className="text-sm text-cv-text-tertiary">
                                                        {program.client ? program.client.name : 'Sin asignar'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-cv-text-secondary">
                                                    Act. {new Date(program.updated_at).toLocaleDateString('es-ES')}
                                                </span>
                                                <span className={`cv-badge ${program.status === 'active' ? 'cv-badge-success' : 'cv-badge-warning'}`}>
                                                    {program.status}
                                                </span>
                                                <ArrowRight size={16} className="text-cv-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="cv-card">
                            <h2 className="font-semibold text-cv-text-primary mb-4">Acciones Rápidas</h2>
                            <div className="space-y-2">
                                {/* "Crear Programa" removed - use Global + button */}
                                <Link href="/athletes/new" className="cv-btn-secondary w-full justify-start">
                                    <Users size={16} />
                                    Añadir Atleta
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    trend: string;
    color: string;
}

function StatCard({ icon, label, value, trend, color }: StatCardProps) {
    return (
        <div className="cv-card">
            <div className="flex items-center justify-between mb-3">
                <span className={color}>{icon}</span>
                <TrendingUp size={14} className="text-green-400" />
            </div>
            <p className="text-2xl font-bold text-cv-text-primary font-mono">{value}</p>
            <p className="text-sm text-cv-text-secondary">{label}</p>
            <p className="text-xs text-cv-text-tertiary mt-1">{trend}</p>
        </div>
    );
}
