
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    let adminResult = null;
    let error = null;

    if (hasServiceKey && supabaseUrl) {
        try {
            const adminSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);
            const { data, error: qError } = await adminSupabase
                .from('clients')
                .select('*')
                .eq('type', 'athlete');

            if (qError) error = qError;
            else adminResult = data;
        } catch (e: any) {
            error = e.message || e;
        }
    }

    return NextResponse.json({
        hasServiceKey,
        supabaseUrl: !!supabaseUrl,
        adminCount: adminResult ? adminResult.length : 'N/A',
        data_preview: adminResult ? adminResult.slice(0, 3) : null,
        error: error ? JSON.stringify(error) : null,
        timestamp: new Date().toISOString()
    });
}
