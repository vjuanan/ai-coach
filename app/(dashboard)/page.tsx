import { getUserDashboardInfo } from '@/lib/actions';
import { Dumbbell, Users, Building2, Plus, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const userInfo = await getUserDashboardInfo();

    if (!userInfo) {
        redirect('/login');
    }

    const { name, role } = userInfo;

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="text-center mb-12 space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-cv-text-primary tracking-tight">
                    ¡Bienvenido, <span className="text-cv-accent">{name}</span>!
                </h1>
                <p className="text-xl text-cv-text-secondary font-light">
                    ¿Qué deseas hacer hoy?
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
                {/* ATHLETE OPTIONS */}
                {role === 'athlete' && (
                    <DashboardCard
                        href="/athlete"
                        icon={<Dumbbell size={32} />}
                        title="Ver mi Programa"
                        description="Accede a tu plan de entrenamiento actual"
                        color="bg-blue-500/10 text-blue-500"
                    />
                )}

                {/* GYM OPTIONS */}
                {role === 'gym' && (
                    <>
                        <DashboardCard
                            href="/programs"
                            icon={<Dumbbell size={32} />}
                            title="Ver Programa"
                            description="Visualiza los entrenamientos"
                            color="bg-purple-500/10 text-purple-500"
                        />
                        <DashboardCard
                            href="/athletes"
                            icon={<Users size={32} />}
                            title="Ver Atletas"
                            description="Gestiona los atletas asignados"
                            color="bg-green-500/10 text-green-500"
                        />
                    </>
                )}

                {/* COACH OPTIONS */}
                {role === 'coach' && (
                    <>
                        <DashboardCard
                            href="/programs"
                            icon={<Plus size={32} />}
                            title="Crear un programa"
                            description="Diseña nuevos planes de entrenamiento"
                            color="bg-cv-accent-muted text-cv-accent"
                        />
                        <DashboardCard
                            href="/athletes"
                            icon={<Users size={32} />}
                            title="Ver mis atletas"
                            description="Gestiona el progreso de tus alumnos"
                            color="bg-blue-500/10 text-blue-500"
                        />
                        <DashboardCard
                            href="/gyms"
                            icon={<Building2 size={32} />}
                            title="Ver mis gimnasios"
                            description="Administra las sedes vinculadas"
                            color="bg-orange-500/10 text-orange-500"
                        />
                    </>
                )}

                {/* ADMIN OPTIONS */}
                {role === 'admin' && (
                    <DashboardCard
                        href="/admin/users"
                        icon={<Shield size={32} />}
                        title="Administrar Usuarios"
                        description="Gestión global de usuarios y roles"
                        color="bg-red-500/10 text-red-500"
                    />
                )}
            </div>

            {/* Fallback for roles with no options or undetermined */}
            {!['athlete', 'gym', 'coach', 'admin'].includes(role) && (
                <div className="text-center text-cv-text-tertiary mt-8">
                    <p>Próximamente tendremos novedades para tu perfil.</p>
                </div>
            )}
        </div>
    );
}

function DashboardCard({ href, icon, title, description, color }: { href: string, icon: React.ReactNode, title: string, description: string, color: string }) {
    return (
        <Link
            href={href}
            className="group flex flex-col p-6 rounded-2xl bg-cv-bg-secondary hover:bg-cv-bg-elevated border border-cv-border/50 hover:border-cv-accent/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
        >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors ${color}`}>
                {icon}
            </div>
            <h3 className="text-xl font-semibold text-cv-text-primary mb-2 group-hover:text-cv-accent transition-colors">
                {title}
            </h3>
            <p className="text-sm text-cv-text-secondary leading-relaxed">
                {description}
            </p>
            <div className="mt-auto pt-6 flex items-center text-sm font-medium text-cv-text-tertiary group-hover:text-cv-text-primary transition-colors">
                Comenzar <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
        </Link>
    );
}
