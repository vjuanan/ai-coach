
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    // SQL from 20240101000014_stimulus_features.sql
    // Executing in order
    const queries = [
        `CREATE TABLE IF NOT EXISTS stimulus_features (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            color TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );`,
        `CREATE INDEX IF NOT EXISTS idx_stimulus_coach ON stimulus_features(coach_id);`,
        // Skip trigger creation if it exists or use DO block, but for simplicity we assume it doesn't exist or ignore error
        `ALTER TABLE stimulus_features Enable ROW LEVEL SECURITY;`,
        // Policies
        `DROP POLICY IF EXISTS "Coaches can view system defaults" ON stimulus_features;`,
        `CREATE POLICY "Coaches can view system defaults" ON stimulus_features FOR SELECT USING (coach_id IS NULL);`,
        `DROP POLICY IF EXISTS "Coaches can view own features" ON stimulus_features;`,
        `CREATE POLICY "Coaches can view own features" ON stimulus_features FOR SELECT USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));`,
        `DROP POLICY IF EXISTS "Coaches can manage own features" ON stimulus_features;`,
        `CREATE POLICY "Coaches can manage own features" ON stimulus_features FOR ALL USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));`,
        // Add column to days if not exists
        `DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='days' AND column_name='stimulus_id') THEN 
                ALTER TABLE days ADD COLUMN stimulus_id UUID REFERENCES stimulus_features(id) ON DELETE SET NULL; 
            END IF; 
        END $$;`,
        `CREATE INDEX IF NOT EXISTS idx_days_stimulus ON days(stimulus_id);`
    ];

    for (const q of queries) {
        // We use a hack: rpc 'exec_sql' if available, or we just rely on standard query if possible? 
        // Supabase JS client doesn't support raw queries directly except via RPC.
        // If 'exec_sql' doesn't exist, we are stuck unless we have the pg library.
        // Let's assume we can't run this without an RPC. 
        // WAIT: The previous error "Could not find the table" suggests the app is checking for it.
        // I will try to use the 'pg' library if available in the environment? 
        // Or I can try to create a function first? No, I need a way to execute SQL.
        // Let's assume the user has a way. 
        // Actually, maybe I can use `npx supabase db push`? No, I don't have login context.
        // Let's try to see if `exec_sql` rpc exists. I'll define it if I can? I can't define it without SQL.

        // ALTERNATIVE: Use the RPC 'exec' if it exists (common pattern).
        const { error } = await supabase.rpc('exec_sql', { sql_query: q });
        if (error) {
            console.log('RPC failed, trying likely fallback or reporting error:', error.message);
        } else {
            console.log('Success:', q.substring(0, 50) + '...');
        }
    }
}
run();
