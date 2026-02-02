import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || 'admin@epnstore.com.ar';

    const logs: string[] = [];
    logs.push(`Testing email: ${email}`);
    logs.push(`SERVICE_ROLE_KEY exists: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);

    try {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({
                error: 'SUPABASE_SERVICE_ROLE_KEY is missing!',
                logs
            }, { status: 500 });
        }

        const supabase = createAdminClient();
        logs.push('Admin client created');

        const { data, error } = await supabase.rpc('check_email_exists', {
            email_input: email.toLowerCase().trim()
        });

        logs.push(`RPC result: data=${data}, error=${error?.message}`);

        if (error) {
            return NextResponse.json({
                error: error.message,
                logs,
                exists: false
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            exists: !!data,
            logs
        });
    } catch (e: any) {
        logs.push(`Exception: ${e.message}`);
        return NextResponse.json({
            error: e.message,
            logs
        }, { status: 500 });
    }
}
