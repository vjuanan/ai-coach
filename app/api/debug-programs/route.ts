import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: 'No service key' }, { status: 500 });
        }

        const supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Direct query to check what programs look like with client join
        const { data: programs, error } = await supabase
            .from('programs')
            .select('id, name, client_id, client:clients(id, name, type)')
            .or('is_template.eq.false,is_template.is.null')
            .order('updated_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
        }

        return NextResponse.json({
            count: programs?.length,
            programs: programs?.map(p => ({
                id: p.id,
                name: p.name,
                client_id: p.client_id,
                client: p.client
            }))
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
