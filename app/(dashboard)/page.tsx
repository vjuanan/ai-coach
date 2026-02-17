
import { getUserDashboardInfo } from '@/lib/actions';
import { Dumbbell, Users, Building2, Shield, ArrowRight, User, FileText, BookOpen } from 'lucide-react';
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
        <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-7xl mx-auto px-4">

            {/* Welcome Section */}
            <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-4xl md:text-6xl font-bold text-cv-text-primary tracking-tight">
                    Bienvenido, <span className="text-cv-accent">{name}</span>
                </h1>
                <p className="text-xl md:text-2xl text-cv-text-secondary font-light">
                    ¿Qué deseas hacer hoy?
                </p>
            </div>

            {/* Action Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">

                {/* ATHLETE: Ver Programa */}
                {role === 'athlete' && (
                    <Link href="/athlete/dashboard" className="group bg-white p-10 rounded-3xl border border-cv-border shadow-cv-sm hover:shadow-cv-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                            <Dumbbell size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-cv-text-primary mb-2">Ver mi Programa</h3>
                        <p className="text-cv-text-secondary mb-6">Accede a tus rutinas y registra tu progreso diaria.</p>
                        <span className="text-emerald-600 font-semibold group-hover:underline">Ir al entrenamiento &rarr;</span>
                    </Link>
                )}

                {/* GYM: Mi Gimnasio & Mis Atletas */}
                {role === 'gym' && (
                    <>
                        <Link href="/gyms" className="group bg-white p-10 rounded-3xl border border-cv-border shadow-cv-sm hover:shadow-cv-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                                <Building2 size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-cv-text-primary mb-2">Mi Gimnasio</h3>
                            <p className="text-cv-text-secondary mb-6">Gestiona tu perfil y configuración.</p>
                        </Link>
                        <Link href="/athletes" className="group bg-white p-10 rounded-3xl border border-cv-border shadow-cv-sm hover:shadow-cv-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                                <Users size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-cv-text-primary mb-2">Mis Atletas</h3>
                            <p className="text-cv-text-secondary mb-6">Ver y gestionar atletas asignados.</p>
                        </Link>
                    </>
                )}

                {/* COACH: Ver Atletas & Crear Programa */}
                {(role === 'coach' || role === 'admin') && (
                    <>
                        <Link href="/athletes" className="group bg-white p-10 rounded-3xl border border-cv-border shadow-cv-sm hover:shadow-cv-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                                <Users size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-cv-text-primary mb-2">Ver Pacientes</h3>
                            <p className="text-cv-text-secondary mb-6">Gestiona tus atletas y sus progresos</p>
                        </Link>

                        <Link href="/programs" className="group bg-white p-10 rounded-3xl border border-cv-border shadow-cv-sm hover:shadow-cv-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                                <Dumbbell size={40} style={{ transform: 'rotate(-45deg)' }} />
                            </div>
                            <h3 className="text-2xl font-bold text-cv-text-primary mb-2">Crear Programa</h3>
                            <p className="text-cv-text-secondary mb-6">Diseña un nuevo plan nutricional</p>
                        </Link>
                    </>
                )}

                {/* ADDITIONAL ADMIN: Usuarios */}
                {role === 'admin' && (
                    <Link href="/admin/users" className="group bg-white p-10 rounded-3xl border border-cv-border shadow-cv-sm hover:shadow-cv-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center col-span-1 md:col-span-2">
                        <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-600 mb-6 group-hover:scale-110 transition-transform">
                            <Shield size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-cv-text-primary mb-2">Administrar Usuarios</h3>
                        <p className="text-cv-text-secondary mb-6">Panel de control de usuarios y roles.</p>
                    </Link>
                )}

            </div>
        </div>
    );
}
