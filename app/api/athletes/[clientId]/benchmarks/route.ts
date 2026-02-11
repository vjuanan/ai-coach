import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

export async function POST(
    request: Request,
    { params }: { params: { clientId: string } }
) {
    const clientId = params.clientId;

    console.log(`[API] Benchmarks update for: ${clientId}`);

    try {
        const body = await request.json();

        // Admin Client for risky updates
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) {
            return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
        }
        const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceKey
        );

        // 1. Update Profile (if exists)
        const profileUpdates: any = {};
        const limitBenchmarks: any = {};

        if (body.oneRmStats) limitBenchmarks.oneRmStats = body.oneRmStats;
        if (body.franTime) limitBenchmarks.franTime = body.franTime;
        if (body.run1km) limitBenchmarks.run1km = body.run1km;
        if (body.run5km) limitBenchmarks.run5km = body.run5km;

        // Fetch Profile
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('id, benchmarks')
            .eq('id', clientId)
            .single();

        if (profile) {
            const currentBenchmarks = profile.benchmarks || {};
            profileUpdates.benchmarks = { ...currentBenchmarks, ...limitBenchmarks };

            const { error: profileError } = await adminSupabase
                .from('profiles')
                .update(profileUpdates)
                .eq('id', clientId);

            if (profileError) console.error('[API] Profile Update Error:', profileError);
        }

        // 2. Update Client (Coach view)
        const { data: client, error: clientFetchError } = await adminSupabase
            .from('clients')
            .select('details')
            .eq('id', clientId)
            .single();

        if (client) {
            const rawDetails = {
                ...client.details,
                ...limitBenchmarks
            };
            const newDetails = JSON.parse(JSON.stringify(rawDetails));

            const { error: clientUpdateError } = await adminSupabase
                .from('clients')
                .update({ details: newDetails })
                .eq('id', clientId);

            if (clientUpdateError) {
                console.error('[API] Client Update Error:', clientUpdateError);
                return NextResponse.json({ error: clientUpdateError.message }, { status: 500 });
            }
        } else if (!profile) {
            return NextResponse.json({ error: 'Client/Profile not found' }, { status: 404 });
        }

        revalidatePath(`/athletes/${clientId}`);
        try {
            revalidatePath(`/athlete/dashboard`);
        } catch (e) {
            // Ignored
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('[API] Fatal Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
