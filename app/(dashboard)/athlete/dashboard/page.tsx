import Link from 'next/link';
import { Topbar } from '@/components/app-shell/Topbar';
import { getAthleteAccessContext, getAthleteVisiblePrograms } from '@/lib/actions';
import { Dumbbell, Calendar, ChevronRight, Building2, UserCog, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AthleteDashboard() {
    const [context, programs] = await Promise.all([
        getAthleteAccessContext(),
        getAthleteVisiblePrograms(),
    ]);

    return (
        <>
            <Topbar />
            <div className="p-8 max-w-7xl mx-auto pt-2">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Link
                        href="/settings"
                        className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-blue-100"
                    >
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                            <Dumbbell className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold text-gray-900 text-sm">Mi Perfil</h3>
                            <p className="text-xs text-gray-500">Editar datos corporales</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 ml-auto" />
                    </Link>

                    {context.visibility.showMyCoach && (
                        <Link
                            href="/athlete/my-coach"
                            className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-cyan-100"
                        >
                            <div className="p-2 bg-cyan-50 rounded-lg text-cyan-600">
                                <UserCog className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-gray-900 text-sm">Mi Coach</h3>
                                <p className="text-xs text-gray-500">Ver perfil del entrenador</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-400 ml-auto" />
                        </Link>
                    )}

                    {context.visibility.showMyGym && (
                        <Link
                            href="/athlete/my-gym"
                            className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-purple-100"
                        >
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-gray-900 text-sm">Mi Gimnasio</h3>
                                <p className="text-xs text-gray-500">Ver detalles del box</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-400 ml-auto" />
                        </Link>
                    )}

                    {context.visibility.disableMyGymCard && (
                        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-slate-600 text-sm">Mi Gimnasio</h3>
                                <p className="text-xs text-slate-500">Sin gimnasio asignado por ahora</p>
                            </div>
                        </div>
                    )}
                </div>

                <section>
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Dumbbell className="text-blue-500" />
                        Tus Programas Activos
                    </h2>

                    {programs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {programs.map((program) => (
                                <Link
                                    key={program.id}
                                    href={`/athlete/program/${program.id}`}
                                    className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-blue-100"
                                >
                                    <div className="flex justify-between items-start mb-4 gap-3">
                                        <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                            <Calendar className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                                                Activo
                                            </span>
                                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${program.source === 'athlete_direct' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                                {program.sourceLabel}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">{program.name}</h3>
                                    {program.coachName && (
                                        <p className="text-sm text-gray-500 mb-1">Coach: {program.coachName}</p>
                                    )}
                                    {program.clientName && (
                                        <p className="text-xs text-gray-500 mb-3">Asignado a: {program.clientName}</p>
                                    )}
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                        {program.description || 'Sin descripción'}
                                    </p>
                                    <div className="flex items-center text-blue-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                                        Ver Rutina <ChevronRight size={16} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-2xl p-12 text-center border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <Dumbbell className="text-gray-300 w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No tienes programas asignados</h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                                Tu cuenta madre (coach o gimnasio) aun no te asigno un programa.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}
