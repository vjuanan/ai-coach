
import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Construct connection string from env vars or use hardcoded fallback based on env file inspection
// postgres://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
const connectionString = 'postgres://postgres:38797509Ok!@db.dfbxffnuwkcbnxfwyvcc.supabase.co:5432/postgres';

const sql = postgres(connectionString);

async function run() {
    console.log('Applying stimulus_features migration...');

    try {
        await sql`
            CREATE TABLE IF NOT EXISTS stimulus_features (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                color TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `;
        console.log('Created table stimulus_features');

        await sql`CREATE INDEX IF NOT EXISTS idx_stimulus_coach ON stimulus_features(coach_id);`;

        await sql`ALTER TABLE stimulus_features Enable ROW LEVEL SECURITY;`;

        // Policies
        await sql`DROP POLICY IF EXISTS "Coaches can view system defaults" ON stimulus_features;`;
        await sql`CREATE POLICY "Coaches can view system defaults" ON stimulus_features FOR SELECT USING (coach_id IS NULL);`;

        await sql`DROP POLICY IF EXISTS "Coaches can view own features" ON stimulus_features;`;
        await sql`CREATE POLICY "Coaches can view own features" ON stimulus_features FOR SELECT USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));`;

        await sql`DROP POLICY IF EXISTS "Coaches can manage own features" ON stimulus_features;`;
        await sql`CREATE POLICY "Coaches can manage own features" ON stimulus_features FOR ALL USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));`;

        // Add column to days if not exists
        await sql`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='days' AND column_name='stimulus_id') THEN 
                    ALTER TABLE days ADD COLUMN stimulus_id UUID REFERENCES stimulus_features(id) ON DELETE SET NULL; 
                END IF; 
            END $$;
        `;

        await sql`CREATE INDEX IF NOT EXISTS idx_days_stimulus ON days(stimulus_id);`;

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sql.end();
    }
}
run();
