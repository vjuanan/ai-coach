
import { getAthleteAccessContext, getUserDashboardInfo } from '@/lib/actions';
import { Dumbbell, Users, Building2, Shield, UserCog, Lock } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Topbar } from '@/components/app-shell/Topbar';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const userInfo = await getUserDashboardInfo();

    if (!userInfo) {
        redirect('/login');
    }

    const { name, role } = userInfo;
    const athleteContext = role === 'athlete' ? await getAthleteAccessContext() : null;

    return (
        <>
            <Topbar title="" />
            <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-7xl mx-auto px-4">

                {/* Welcome Section */}
                <div className="text-center mb-16 space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-5xl md:text-6xl font-bold text-slate-800 tracking-tight">
                        Bienvenido, <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Licenciado {name.split(' ')[0]}</span>
                    </h1>
                    <p className="text-xl text-slate-400 font-light">
                        ¿Qué deseas hacer hoy?
                    </p>
                </div>

                {/* Action Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">

                    {/* ATHLETE: Ver Programa */}
                    {role === 'athlete' && (
                        <>
                            <Link href="/athlete/dashboard" className="group bg-white p-12 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-105 transition-transform">
                                    <Dumbbell size={36} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Ver mi Programa</h3>
                                <p className="text-slate-400 mb-0">Accede a tus rutinas y registra tu progreso diaria.</p>
                                <span className="mt-6 text-emerald-500 font-medium group-hover:underline">Ir al entrenamiento &rarr;</span>
                            </Link>

                            {athleteContext?.visibility.showMyCoach && (
                                <Link href="/athlete/my-coach" className="group bg-white p-12 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center">
                                    <div className="w-20 h-20 bg-cyan-50 rounded-3xl flex items-center justify-center text-cyan-500 mb-6 group-hover:scale-105 transition-transform">
                                        <UserCog size={36} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Mi Coach</h3>
                                    <p className="text-slate-400 mb-0">Consulta el perfil de tu entrenador.</p>
                                </Link>
                            )}

                            {athleteContext?.visibility.showMyGym && (
                                <Link href="/athlete/my-gym" className="group bg-white p-12 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center">
                                    <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center text-purple-500 mb-6 group-hover:scale-105 transition-transform">
                                        <Building2 size={36} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Mi Gimnasio</h3>
                                    <p className="text-slate-400 mb-0">Visualiza los datos de tu box/gimnasio.</p>
                                </Link>
                            )}

                            {athleteContext?.visibility.disableMyGymCard && (
                                <div className="group bg-slate-50 p-12 rounded-[2rem] border border-slate-200 flex flex-col items-center text-center opacity-80">
                                    <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 mb-6">
                                        <Lock size={36} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-500 mb-2">Mi Gimnasio</h3>
                                    <p className="text-slate-400 mb-0">No tienes un gimnasio asignado todavía.</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* GYM: Mi Gimnasio & Mis Atletas */}
                    {role === 'gym' && (
                        <>
                            <Link href="/gyms" className="group bg-white p-12 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center text-purple-500 mb-6 group-hover:scale-105 transition-transform">
                                    <Building2 size={36} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Mi Gimnasio</h3>
                                <p className="text-slate-400 mb-0">Gestiona tu perfil y configuración.</p>
                            </Link>
                            <Link href="/athletes" className="group bg-white p-12 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-105 transition-transform">
                                    <Users size={36} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Mis Atletas</h3>
                                <p className="text-slate-400 mb-0">Ver y gestionar atletas asignados.</p>
                            </Link>
                        </>
                    )}

                    {/* COACH: Ver Atletas & Crear Programa */}
                    {(role === 'coach' || role === 'admin') && (
                        <>
                            <Link href="/athletes" className="group bg-white p-12 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-105 transition-transform">
                                    <Users size={36} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Ver Atletas</h3>
                                <p className="text-slate-400 mb-0">Gestiona tus atletas y sus progresos</p>
                            </Link>

                            <Link href="/programs" className="group bg-white p-12 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-cyan-50 rounded-3xl flex items-center justify-center text-cyan-500 mb-6 group-hover:scale-105 transition-transform">
                                    <Dumbbell size={36} style={{ transform: 'rotate(0deg)' }} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Crear Programa</h3>
                                <p className="text-slate-400 mb-0">Diseña un nuevo plan nutricional</p>
                            </Link>
                        </>
                    )}

                    {/* ADDITIONAL ADMIN: Usuarios */}
                    {role === 'admin' && (
                        <Link href="/admin/users" className="group bg-white p-10 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center col-span-1 md:col-span-2 max-w-lg mx-auto w-full">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 group-hover:scale-105 transition-transform">
                                <Shield size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-1">Administrar Usuarios</h3>
                            <p className="text-slate-400 mb-0 text-sm">Panel de control de usuarios y roles.</p>
                        </Link>
                    )}

                </div>
            </div>
        </>
    );
}
