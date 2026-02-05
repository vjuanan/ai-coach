import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function DebugPage() {
    const supabase = createServerClient();

    // 1. User Session Info
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    let profile = null;
    let coach = null;
    let userPrograms: any[] = [];
    let adminPrograms: any[] = [];
    let adminCount = 0;

    if (user) {
        // 2. Profile Info
        const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        profile = p;

        // 3. Coach Info
        const { data: c } = await supabase.from('coaches').select('*').eq('user_id', user.id).single();
        coach = c;

        // 4. User View Programs
        const { data: up } = await supabase.from('programs').select('*').order('updated_at', { ascending: false });
        userPrograms = up || [];
    }

    // 5. Admin View (Truth)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const adminClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        const { data: ap, count } = await adminClient
            .from('programs')
            .select('*', { count: 'exact' })
            .order('updated_at', { ascending: false })
            .limit(20);

        adminPrograms = ap || [];
        adminCount = count || 0;
    }

    return (
        <div className="p-8 font-mono text-sm max-w-6xl mx-auto space-y-8 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Debug Console</h1>

            {/* SESSION INFO */}
            <section className="bg-white p-6 rounded shadow">
                <h2 className="text-lg font-bold mb-4 border-b pb-2">1. Validacion de Sesion</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="font-bold block">Auth User ID:</span>
                        <code className="bg-gray-100 p-1 rounded">{user?.id || 'NO USER'}</code>
                    </div>
                    <div>
                        <span className="font-bold block">Email:</span>
                        <code className="bg-gray-100 p-1 rounded">{user?.email || 'N/A'}</code>
                    </div>
                    <div>
                        <span className="font-bold block">Role (Profile):</span>
                        <code className="bg-gray-100 p-1 rounded">
                            {profile?.role || 'No Profile'}
                        </code>
                    </div>
                    <div>
                        <span className="font-bold block">Coach ID (Relational):</span>
                        <code className="bg-blue-100 p-1 rounded">
                            {coach?.id || 'NO COACH RECORD'}
                        </code>
                    </div>
                </div>
            </section>

            {/* COMPARISON */}
            <section className="grid grid-cols-2 gap-8">
                {/* USER VIEW */}
                <div className="bg-white p-6 rounded shadow border-l-4 border-red-500">
                    <h2 className="text-lg font-bold mb-2">Lo que VE el usuario ({userPrograms.length})</h2>
                    <p className="text-xs text-gray-500 mb-4">Query normal con RLS (tus permisos actuales)</p>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {userPrograms.length === 0 ? (
                            <div className="text-red-500 font-bold">NADA VISIBLE</div>
                        ) : (
                            userPrograms.map(p => (
                                <div key={p.id} className="border p-2 rounded text-xs">
                                    <div className="font-bold">{p.name}</div>
                                    <div className="text-gray-500">{p.id}</div>
                                    <div className="flex gap-2 mt-1">
                                        <span className="bg-gray-100 px-1 rounded">status: {p.status}</span>
                                        <span className="bg-gray-100 px-1 rounded">coach: {p.coach_id?.slice(0, 8)}...</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ADMIN VIEW */}
                <div className="bg-white p-6 rounded shadow border-l-4 border-green-500">
                    <h2 className="text-lg font-bold mb-2">Lo que EXISTE en DB ({adminCount})</h2>
                    <p className="text-xs text-gray-500 mb-4">Query Admin (sin RLS, ve todo)</p>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {adminPrograms.map(p => {
                            const isMine = p.coach_id === coach?.id;
                            return (
                                <div key={p.id} className={`border p-2 rounded text-xs ${isMine ? 'bg-green-50 border-green-200' : 'opacity-50'}`}>
                                    <div className="flex justify-between">
                                        <div className="font-bold">{p.name}</div>
                                        {isMine && <span className="text-green-600 font-bold text-[10px]">ES MIO</span>}
                                    </div>
                                    <div className="text-gray-500">{p.id}</div>
                                    <div className="flex gap-2 mt-1 flex-wrap">
                                        <span className="bg-gray-100 px-1 rounded">status: {p.status}</span>
                                        <span className={`px-1 rounded ${isMine ? 'bg-blue-100 font-bold' : 'bg-gray-100'}`}>
                                            coach: {p.coach_id}
                                        </span>
                                    </div>
                                    {!isMine && (
                                        <div className="text-red-500 mt-1">
                                            ⚠️ No coincide Coach ID
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </div>
    );
}
