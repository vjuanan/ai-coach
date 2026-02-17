
import { getUserDashboardInfo } from '@/lib/actions';
import { Dumbbell, Users, Building2, Shield, ArrowRight, User } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
    const userInfo = await getUserDashboardInfo();

    if (!userInfo) {
        redirect('/login');
    }

    const { name, role } = userInfo;

    return (
        <div className="min-h-screen bg-cv-bg-primary flex flex-col">
            {/* Simple Header */}
            <header className="w-full p-6 flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10">
                        <Image
                            src="/icon.png"
                            alt="Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <span className="font-bold text-xl tracking-tight hidden md:block text-cv-text-primary">AI <span className="text-cv-accent">Nutrition</span></span>
                </div>

                <Link
                    href="/settings"
                    className="flex items-center gap-2 text-sm font-medium text-cv-text-secondary hover:text-cv-text-primary transition-colors bg-white hover:bg-gray-50 px-4 py-2 rounded-full border border-cv-border shadow-sm hover:shadow transition-all"
                >
                    <User size={18} />
                    <span className="hidden md:inline">Mi Perfil</span>
                </Link>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 -mt-20">
                <div className="text-center mb-16 space-y-6 max-w-3xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold tracking-wide uppercase mb-2 border border-blue-100 shadow-sm">
                        {role === 'admin' ? 'Administrador' : role === 'coach' ? 'Entrenador' : role === 'gym' ? 'Gimnasio' : 'Atleta'}
                    </span>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-cv-text-primary tracking-tight">
                        ¡Bienvenido, <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">{name.split(' ')[0]}</span>!
                    </h1>
                    <p className="text-xl md:text-2xl text-cv-text-secondary font-light max-w-2xl mx-auto">
                        ¿Qué deseas hacer hoy?
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">

                    {/* ATHLETE OPTIONS */}
                    {role === 'athlete' && (
                        <Link href="/athlete/dashboard" className="group relative overflow-hidden bg-white p-8 rounded-[2rem] border border-cv-border shadow-cv-sm hover:shadow-cv-xl transition-all duration-300 hover:-translate-y-2 col-span-1 md:col-span-2 lg:col-span-3 max-w-2xl mx-auto w-full">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
                                <Dumbbell size={200} />
                            </div>
                            <div className="relative z-10 flex flex-col items-center text-center h-full">
                                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                                    <Dumbbell size={40} />
                                </div>
                                <h3 className="text-3xl font-bold text-cv-text-primary mb-3">Ver mi Programa</h3>
                                <p className="text-cv-text-secondary text-lg mb-10 max-w-md">Accede a tus rutinas diarias, registra tus resultados y mira tu progreso.</p>
                                <div className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-2xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 group-hover:gap-3 transition-all">
                                    Ir al entrenamiento <ArrowRight size={20} className="ml-2" />
                                </div>
                            </div>
                        </Link>
                    )}

                    {/* GYM OPTIONS */}
                    {role === 'gym' && (
                        <>
                            <Link href="/gyms" className="group relative overflow-hidden bg-white p-8 rounded-[2rem] border border-cv-border shadow-cv-sm hover:shadow-cv-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
                                    <Building2 size={120} />
                                </div>
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform shadow-sm">
                                        <Building2 size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-cv-text-primary mb-2">Mi Gimnasio</h3>
                                    <p className="text-cv-text-secondary mb-8 flex-1">Gestiona tu perfil de gimnasio y configuración.</p>
                                    <div className="flex items-center font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
                                        Ver perfil <ArrowRight size={20} className="ml-2" />
                                    </div>
                                </div>
                            </Link>
                            <Link href="/athletes" className="group relative overflow-hidden bg-white p-8 rounded-[2rem] border border-cv-border shadow-cv-sm hover:shadow-cv-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
                                    <Users size={120} />
                                </div>
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform shadow-sm">
                                        <Users size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-cv-text-primary mb-2">Mis Atletas</h3>
                                    <p className="text-cv-text-secondary mb-8 flex-1">Ver y gestionar los atletas asignados a tu gimnasio.</p>
                                    <div className="flex items-center font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                                        Ver lista <ArrowRight size={20} className="ml-2" />
                                    </div>
                                </div>
                            </Link>
                        </>
                    )}

                    {/* COACH OPTIONS */}
                    {role === 'coach' && (
                        <>
                            <Link href="/programs" className="group relative overflow-hidden bg-white p-8 rounded-[2rem] border border-cv-border shadow-cv-sm hover:shadow-cv-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
                                    <Dumbbell size={120} />
                                </div>
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform shadow-sm">
                                        <Dumbbell size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-cv-text-primary mb-2">Crear Programa</h3>
                                    <p className="text-cv-text-secondary mb-8 flex-1">Diseña nuevos programas de entrenamiento.</p>
                                    <div className="flex items-center font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                                        Ir a programas <ArrowRight size={20} className="ml-2" />
                                    </div>
                                </div>
                            </Link>

                            <Link href="/athletes" className="group relative overflow-hidden bg-white p-8 rounded-[2rem] border border-cv-border shadow-cv-sm hover:shadow-cv-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
                                    <Users size={120} />
                                </div>
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform shadow-sm">
                                        <Users size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-cv-text-primary mb-2">Mis Atletas</h3>
                                    <p className="text-cv-text-secondary mb-8 flex-1">Gestiona tus atletas y monitoriza su progreso.</p>
                                    <div className="flex items-center font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                                        Ver atletas <ArrowRight size={20} className="ml-2" />
                                    </div>
                                </div>
                            </Link>

                            <Link href="/gyms" className="group relative overflow-hidden bg-white p-8 rounded-[2rem] border border-cv-border shadow-cv-sm hover:shadow-cv-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
                                    <Building2 size={120} />
                                </div>
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform shadow-sm">
                                        <Building2 size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-cv-text-primary mb-2">Mis Gimnasios</h3>
                                    <p className="text-cv-text-secondary mb-8 flex-1">Administra los gimnasios asociados.</p>
                                    <div className="flex items-center font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
                                        Ver gimnasios <ArrowRight size={20} className="ml-2" />
                                    </div>
                                </div>
                            </Link>
                        </>
                    )}

                    {/* ADMIN OPTIONS */}
                    {role === 'admin' && (
                        <Link href="/admin/users" className="group relative overflow-hidden bg-white p-8 rounded-[2rem] border border-cv-border shadow-cv-sm hover:shadow-cv-xl transition-all duration-300 hover:-translate-y-2 col-span-1 md:col-span-2 lg:col-span-3 max-w-xl mx-auto w-full">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
                                <Shield size={160} />
                            </div>
                            <div className="relative z-10 flex flex-col items-center text-center h-full">
                                <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform shadow-lg shadow-gray-200">
                                    <Shield size={40} />
                                </div>
                                <h3 className="text-3xl font-bold text-cv-text-primary mb-3">Administrar Usuarios</h3>
                                <p className="text-cv-text-secondary text-lg mb-8 max-w-xs mx-auto">Gestiona todos los usuarios, roles y permisos de la plataforma.</p>
                                <div className="inline-flex items-center justify-center px-8 py-4 bg-gray-900 text-white rounded-2xl font-semibold shadow-lg hover:bg-black group-hover:gap-3 transition-all">
                                    Ir al Panel <ArrowRight size={20} className="ml-2" />
                                </div>
                            </div>
                        </Link>
                    )}
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="p-6 text-center text-cv-text-tertiary text-sm">
                &copy; {new Date().getFullYear()} AI Nutrition. Todos los derechos reservados.
            </footer>
        </div>
    );
}
