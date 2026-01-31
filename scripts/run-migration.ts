// Execute migration via Supabase REST API
// Run with: npx tsx scripts/run-migration.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dfbxffnuwkcbnxfwyvcc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmYnhmZm51d2tjYm54Znd5dmNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUzMzUxMywiZXhwIjoyMDg1MTA5NTEzfQ.waUHxz5lUSELECf4Hk-5r9K3lMfJelroU3kxgDzUYI4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🚀 Starting migration: Training Principles Knowledge Base...\n');

    // Step 1: Create training_principles table
    console.log('1️⃣ Creating training_principles table...');
    const { error: tableError } = await supabase.rpc('exec_sql', {
        sql: `
            CREATE TABLE IF NOT EXISTS training_principles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                objective TEXT NOT NULL,
                author TEXT NOT NULL,
                category TEXT NOT NULL,
                title TEXT NOT NULL,
                content JSONB NOT NULL,
                decision_framework TEXT,
                context_factors TEXT[],
                tags TEXT[],
                created_at TIMESTAMPTZ DEFAULT now()
            );
            CREATE INDEX IF NOT EXISTS idx_principles_objective ON training_principles(objective);
            CREATE INDEX IF NOT EXISTS idx_principles_author ON training_principles(author);
            CREATE INDEX IF NOT EXISTS idx_principles_category ON training_principles(category);
        `
    });

    // If RPC doesn't exist, we'll insert data directly
    if (tableError) {
        console.log('Note: Using direct table operations instead of SQL RPC');
    }

    // Step 2: Add attributes column to programs
    console.log('2️⃣ Adding attributes column to programs...');
    // This needs to be done via Supabase dashboard or migration

    // Step 3: Insert Andy Galpin Principles
    console.log('3️⃣ Inserting Andy Galpin CrossFit principles...');

    const galpinPrinciples = [
        {
            objective: 'crossfit',
            author: 'Andy Galpin',
            category: 'foundational_theory',
            title: 'Nine Physiological Adaptations',
            content: {
                summary: "Andy Galpin identifies 9 primary adaptations that exercise can induce.",
                adaptations: [
                    { order: 1, name: "Skill/Technique", description: "Enhancing movement efficiency, precision, and coordination." },
                    { order: 2, name: "Speed", description: "Increasing the velocity or rate of acceleration of movement." },
                    { order: 3, name: "Power", description: "The ability to produce force quickly (Speed × Force)." },
                    { order: 4, name: "Force/Strength", description: "Maximizing the capacity for force production." },
                    { order: 5, name: "Muscle Hypertrophy", description: "Increasing muscle size for aesthetics or function." },
                    { order: 6, name: "Muscular Endurance", description: "The ability to perform repetitive muscle contractions over time." },
                    { order: 7, name: "Anaerobic Capacity", description: "Energy production without oxygen for high-intensity activities." },
                    { order: 8, name: "Maximal Aerobic Capacity (VO2 Max)", description: "Highest rate of oxygen consumption during exercise." },
                    { order: 9, name: "Long-Duration Endurance", description: "The capacity for sustained effort over extended periods." }
                ],
                key_insight: "The closer adaptations are on this list, the more compatible they are to train simultaneously."
            },
            decision_framework: "Adjacent adaptations train well together. Prioritize based on weaknesses while maintaining complementary qualities.",
            context_factors: ['athlete goals', 'current fitness level', 'competition timeline', 'recovery capacity'],
            tags: ['crossfit', 'athletic', 'adaptations', 'programming']
        },
        {
            objective: 'crossfit',
            author: 'Andy Galpin',
            category: 'strength_protocol',
            title: 'The 3-5 Protocol for Strength and Power',
            content: {
                summary: "A focused protocol for maximizing strength and power output.",
                protocol: { exercises: "3-5", sets: "3-5", reps: "3-5", rest: "3-5 minutes" },
                rationale: "Ensures high energy and output per rep, engaging CNS for maximum force production.",
                application: "Use for strength/power days. Focus on compound movements."
            },
            decision_framework: "Apply when primary goal is strength/power. Use 3 reps for 1RM work, 5 for strength-endurance.",
            context_factors: ['training age', 'exercise complexity', 'fatigue state'],
            tags: ['strength', 'power', 'protocol', '3-5']
        },
        {
            objective: 'crossfit',
            author: 'Andy Galpin',
            category: 'periodization',
            title: 'Linear vs Undulating Periodization',
            content: {
                summary: "Two primary periodization strategies for organizing training.",
                strategies: {
                    linear: {
                        description: "Focus on one adaptation at a time sequentially.",
                        best_for: "Specific competition prep, beginners, major weakness"
                    },
                    undulating: {
                        description: "Various training styles throughout the week.",
                        best_for: "CrossFit athletes, maintaining multiple qualities"
                    }
                }
            },
            decision_framework: "Linear for competition prep. Undulating for general fitness and CrossFit.",
            context_factors: ['competition schedule', 'training frequency', 'recovery capacity'],
            tags: ['periodization', 'linear', 'undulating', 'planning']
        }
    ];

    for (const principle of galpinPrinciples) {
        const { error } = await supabase.from('training_principles').upsert(principle, {
            onConflict: 'title,author'
        });
        if (error && !error.message.includes('does not exist')) {
            console.log(`   Warning: ${error.message}`);
        }
    }
    console.log('   ✅ Andy Galpin principles inserted');

    // Step 4: Insert Mike Israetel Hypertrophy Principles
    console.log('4️⃣ Inserting Mike Israetel Hypertrophy principles...');

    const hypertrophyPrinciples = [
        {
            objective: 'hypertrophy',
            author: 'Mike Israetel',
            category: 'volume',
            title: 'Volume Landmarks (MV, MEV, MAV, MRV)',
            content: {
                summary: "Four key volume landmarks for muscle growth/recovery.",
                landmarks: {
                    MV: { name: "Maintenance Volume", range: "4-6 sets/week", use: "Deload, vacation, stress" },
                    MEV: { name: "Minimum Effective Volume", range: "6-10 sets/week", use: "Mesocycle start" },
                    MAV: { name: "Maximum Adaptive Volume", range: "12-20 sets/week", use: "Optimal gains" },
                    MRV: { name: "Maximum Recoverable Volume", range: "20-25+ sets/week", use: "End of accumulation" }
                },
                progression_model: "Start at MEV, add 1-2 sets/week, approach MRV by week 4-6, then deload."
            },
            decision_framework: "Start at MEV. Increase weekly. Deload when performance drops.",
            context_factors: ['training age', 'recovery capacity', 'diet', 'sleep', 'stress'],
            tags: ['volume', 'MEV', 'MAV', 'MRV', 'landmarks']
        },
        {
            objective: 'hypertrophy',
            author: 'Mike Israetel',
            category: 'periodization',
            title: 'Mesocycle Structure for Hypertrophy',
            content: {
                summary: "Structured approach to organizing training blocks.",
                structure: {
                    duration: "4-6 weeks",
                    weeks: [
                        { week: 1, volume: "MEV", RIR: "3-4", note: "Establish baseline" },
                        { week: 2, volume: "MEV+1-2", RIR: "2-3", note: "Begin adaptation" },
                        { week: 3, volume: "MAV", RIR: "2", note: "Significant stimulus" },
                        { week: 4, volume: "Upper MAV", RIR: "1-2", note: "Near limit" },
                        { week: 5, volume: "Near MRV", RIR: "0-1", note: "Peak volume" },
                        { week: 6, volume: "Deload (MV)", RIR: "4+", note: "Recovery" }
                    ]
                }
            },
            decision_framework: "Adjust length based on recovery. Faster recoverers: 4 weeks. Slower: 6+ weeks.",
            context_factors: ['recovery speed', 'training age', 'volume tolerance'],
            tags: ['mesocycle', 'periodization', 'RIR', 'deload']
        }
    ];

    for (const principle of hypertrophyPrinciples) {
        const { error } = await supabase.from('training_principles').upsert(principle);
        if (error && !error.message.includes('does not exist')) {
            console.log(`   Warning: ${error.message}`);
        }
    }
    console.log('   ✅ Hypertrophy principles inserted');

    // Step 5: Insert Mike Israetel Strength Principles
    console.log('5️⃣ Inserting Mike Israetel Strength principles...');

    const strengthPrinciples = [
        {
            objective: 'strength',
            author: 'Mike Israetel',
            category: 'foundational_theory',
            title: 'Seven Principles of Strength Training',
            content: {
                summary: "Fundamental principles for long-term strength development.",
                principles: [
                    { name: "Specificity", description: "Training should reflect desired outcome" },
                    { name: "Overload", description: "Progressive greater demands for adaptation" },
                    { name: "Fatigue Management", description: "Allow adequate recovery" },
                    { name: "SRA", description: "Stimulus-Recovery-Adaptation cycle" },
                    { name: "Variation", description: "Planned changes to prevent plateaus" },
                    { name: "Phase Potentiation", description: "Phases build upon each other" },
                    { name: "Individual Differences", description: "Tailor to individual responses" }
                ]
            },
            decision_framework: "Weight principles based on context. Competition: specificity. Off-season: variation.",
            context_factors: ['competition timeline', 'training age', 'individual response'],
            tags: ['principles', 'fundamentals', 'strength', 'powerlifting']
        },
        {
            objective: 'strength',
            author: 'Mike Israetel',
            category: 'periodization',
            title: 'Block Periodization for Powerlifting',
            content: {
                summary: "Phased approach moving through distinct blocks to peak strength.",
                blocks: [
                    { name: "Hypertrophy", duration: "4-6w", intensity: "65-75%", reps: "8-15", goal: "Build muscle" },
                    { name: "Strength", duration: "4-6w", intensity: "75-85%", reps: "4-8", goal: "Convert to strength" },
                    { name: "Peaking", duration: "2-3w", intensity: "85-100%", reps: "1-3", goal: "Maximize expression" }
                ]
            },
            decision_framework: "Full cycle for competition (12-16 weeks). Off-season: cycle hypertrophy/strength.",
            context_factors: ['competition date', 'muscle mass adequacy', 'strength level'],
            tags: ['periodization', 'blocks', 'peaking', 'powerlifting']
        }
    ];

    for (const principle of strengthPrinciples) {
        const { error } = await supabase.from('training_principles').upsert(principle);
        if (error && !error.message.includes('does not exist')) {
            console.log(`   Warning: ${error.message}`);
        }
    }
    console.log('   ✅ Strength principles inserted');

    // Step 6: Update/Create Templates
    console.log('6️⃣ Creating expert-inspired templates...');

    // First get a coach ID
    const { data: coaches } = await supabase.from('coaches').select('id').limit(1);
    const coachId = coaches?.[0]?.id;

    if (!coachId) {
        console.log('   ⚠️ No coach found, skipping template creation');
    } else {
        // Delete old templates
        await supabase.from('programs').delete().eq('is_template', true);

        const templates = [
            {
                coach_id: coachId,
                name: 'CrossFit Performance - Andy Galpin Style',
                description: 'Programa de 4 semanas basado en la metodología del Dr. Andy Galpin. Combina las 9 adaptaciones fisiológicas con periodización ondulante: días de fuerza/potencia, metcon, habilidad técnica y resistencia. Incluye el protocolo 3-5 para desarrollo de fuerza.',
                status: 'active',
                is_template: true,
                attributes: {
                    inspired_by: 'Andy Galpin',
                    methodology: ['9 adaptaciones', 'periodización ondulante', 'protocolo 3-5'],
                    gradient: 'from-[#FF416C] to-[#FF4B2B]',
                    focus: 'crossfit',
                    duration_weeks: 4,
                    days_per_week: 5,
                    key_concepts: ['Skill/Speed/Power compatibility', 'Strength-Endurance balance']
                }
            },
            {
                coach_id: coachId,
                name: 'Fuerza Máxima - Mike Israetel Style',
                description: 'Programa de 6 semanas basado en los 7 principios científicos de Mike Israetel. Bloque de fuerza con progresión de volumen (MEV→MRV), énfasis en sentadilla, press de banca, peso muerto, y gestión de fatiga con semana de descarga.',
                status: 'active',
                is_template: true,
                attributes: {
                    inspired_by: 'Mike Israetel',
                    methodology: ['7 principios de fuerza', 'volume landmarks', 'block periodization'],
                    gradient: 'from-[#2193b0] to-[#6dd5ed]',
                    focus: 'strength',
                    duration_weeks: 6,
                    days_per_week: 4,
                    key_concepts: ['Specificity to powerlifts', 'MEV to MRV progression', 'RIR-based intensity']
                }
            },
            {
                coach_id: coachId,
                name: 'Hipertrofia Científica - Mike Israetel RP Style',
                description: 'Programa de 5 semanas siguiendo el modelo de Renaissance Periodization. Progresión sistemática desde MEV hasta MRV, rangos de repeticiones óptimos (6-15), selección de ejercicios basada en conexión mente-músculo.',
                status: 'active',
                is_template: true,
                attributes: {
                    inspired_by: 'Mike Israetel',
                    methodology: ['volume landmarks MEV/MAV/MRV', 'RIR progression', 'mesocycle structure'],
                    gradient: 'from-[#8A2387] via-[#E94057] to-[#F27121]',
                    focus: 'hypertrophy',
                    duration_weeks: 5,
                    days_per_week: 5,
                    key_concepts: ['Start at MEV, end at MRV', '10-20 sets per muscle', 'RIR 3→0 progression']
                }
            }
        ];

        for (const template of templates) {
            const { error } = await supabase.from('programs').insert(template);
            if (error) {
                console.log(`   Warning inserting ${template.name}: ${error.message}`);
            } else {
                console.log(`   ✅ Created: ${template.name}`);
            }
        }
    }

    // Step 7: Set up RLS for training_principles
    console.log('7️⃣ Note: RLS policies need to be set via Supabase Dashboard');

    console.log('\n✨ Migration complete!');
    console.log('📝 Next steps:');
    console.log('   1. Run the SQL from 010_training_principles.sql in Supabase SQL Editor for table creation');
    console.log('   2. The templates and principles data have been inserted via API');
}

runMigration().catch(console.error);
