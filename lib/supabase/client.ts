import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Factory function for client-side usage with cookies
export const createClient = () => {
    return createBrowserClient(
        supabaseUrl,
        supabaseKey
    );
};

// Singleton instance for legacy support
export const supabase = createClient();
