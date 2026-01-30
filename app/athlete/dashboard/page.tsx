
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Dumbbell, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Types
interface AssignedProgram {
    id: string;
    name: string;
    description: string;
    coach: {
        full_name: string;
    } | null;
}

export default function AthleteDashboard() {
    const supabase = createClient();
    const [programs, setPrograms] = useState<AssignedProgram[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Get Profile Name
            const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
            if (profile) setUserName(profile.full_name || 'Atleta');

            // 2. Get Assigned Programs (Where client_id is linked to my user_id)
            // Note: We need to join with 'clients' table first to find my client ID.

            // Step 2a: Find my Client ID
            const { data: myHealthProfile } = await supabase
                .from('clients')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (myHealthProfile) {
                // Step 2b: Find programs assigned to this client ID
                const { data: myPrograms, error } = await supabase
                    .from('programs')
                    .select(`
                        id, 
                        name, 
                        description,
                        coach:coach_id ( full_name ) 
                    `) // Foreign key to coaches might need update in schema to be direct or via relation
                    .eq('client_id', myHealthProfile.id)
                    .eq('status', 'active'); // Only active programs?

                if (myPrograms) {
                    // Transform data
                    setPrograms(myPrograms.map(p => ({
                        id: p.id,
                        name: p.name,
                        description: p.description,
                        coach: Array.isArray(p.coach) ? p.coach[0] : p.coach // Handle array response if join returns array
                    })) as any);
                }
            }
            setIsLoading(false);
        };

        fetchData();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Hola, {userName} 👋</h1>
                <p className="text-gray-500 mt-2">Bienvenido a tu panel de entrenamiento.</p>
            </header>

            <section>
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Dumbbell className="text-blue-500" />
                    Tus Programas Activos
                </h2>

                {isLoading ? (
                    <div className="flex gap-4">
                        {[1, 2].map(i => (
                            <div key={i} className="h-32 w-full bg-gray-100 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : programs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {programs.map((program) => (
                            <Link
                                key={program.id}
                                href={`/athlete/program/${program.id}`}
                                className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-blue-100"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                        <Calendar className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                                        Activo
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{program.name}</h3>
                                {program.coach && (
                                    <p className="text-sm text-gray-500 mb-3">Coach: {program.coach.full_name}</p>
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
                            Tu entrenador aún no te ha asignado un programa. Contacta con él para comenzar.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}
