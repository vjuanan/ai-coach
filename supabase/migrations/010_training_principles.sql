-- Migration: Training Principles Knowledge Base & Template Enhancements
-- This creates a knowledge base for training principles and updates templates

-- =============================================================================
-- 1. Training Principles Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS training_principles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objective TEXT NOT NULL, -- 'crossfit', 'strength', 'hypertrophy'
    author TEXT NOT NULL, -- 'Andy Galpin', 'Mike Israetel'
    category TEXT NOT NULL, -- 'periodization', 'volume', 'intensity', 'exercise_selection', etc.
    title TEXT NOT NULL,
    content JSONB NOT NULL, -- Structured content for AI access
    decision_framework TEXT, -- How to choose between alternatives
    context_factors TEXT[], -- Individual factors to consider
    tags TEXT[], -- For quick filtering
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast querying by objective
CREATE INDEX IF NOT EXISTS idx_principles_objective ON training_principles(objective);
CREATE INDEX IF NOT EXISTS idx_principles_author ON training_principles(author);
CREATE INDEX IF NOT EXISTS idx_principles_category ON training_principles(category);

-- =============================================================================
-- 2. Add attributes column to programs (for template metadata)
-- =============================================================================
ALTER TABLE programs ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}';

-- =============================================================================
-- 3. Insert Andy Galpin CrossFit/Athletic Performance Principles
-- =============================================================================

-- 3.1 Nine Adaptations Framework
INSERT INTO training_principles (objective, author, category, title, content, decision_framework, context_factors, tags)
VALUES (
    'crossfit',
    'Andy Galpin',
    'foundational_theory',
    'Nine Physiological Adaptations',
    '{
        "summary": "Andy Galpin identifies 9 primary adaptations that exercise can induce, crucial for a well-rounded fitness profile.",
        "adaptations": [
            {"order": 1, "name": "Skill/Technique", "description": "Enhancing movement efficiency, precision, and coordination. Improving positions and timing sequences for more effective movement patterns."},
            {"order": 2, "name": "Speed", "description": "Increasing the velocity or rate of acceleration of movement."},
            {"order": 3, "name": "Power", "description": "The ability to produce force quickly (Speed × Force). Involves both strength and speed components."},
            {"order": 4, "name": "Force/Strength", "description": "Maximizing the capacity for force production."},
            {"order": 5, "name": "Muscle Hypertrophy", "description": "Increasing muscle size for aesthetics or function."},
            {"order": 6, "name": "Muscular Endurance", "description": "The ability to perform repetitive muscle contractions over time or sustain a contraction."},
            {"order": 7, "name": "Anaerobic Capacity", "description": "The body''s ability to produce energy without oxygen for high-intensity, short-duration activities."},
            {"order": 8, "name": "Maximal Aerobic Capacity (VO2 Max)", "description": "The highest rate at which the body can consume oxygen during exercise."},
            {"order": 9, "name": "Long-Duration Endurance", "description": "The capacity for sustained effort over extended periods."}
        ],
        "key_insight": "The closer adaptations are on this list, the more compatible they are to train simultaneously without significant interference."
    }',
    'Adjacent adaptations on the list train well together (e.g., Speed-Power-Strength). When programming for CrossFit athletes, prioritize based on current weaknesses while maintaining complementary qualities.',
    ARRAY['athlete goals', 'current fitness level', 'competition timeline', 'recovery capacity', 'training history'],
    ARRAY['crossfit', 'athletic', 'adaptations', 'programming']
);

-- 3.2 The 3-5 Protocol
INSERT INTO training_principles (objective, author, category, title, content, decision_framework, context_factors, tags)
VALUES (
    'crossfit',
    'Andy Galpin',
    'strength_protocol',
    'The 3-5 Protocol for Strength and Power',
    '{
        "summary": "A focused protocol for maximizing strength and power output through neural engagement.",
        "protocol": {
            "exercises": "3-5 per session",
            "sets": "3-5 per exercise",
            "reps": "3-5 per set",
            "rest": "3-5 minutes between sets"
        },
        "rationale": "This approach ensures high energy and output per rep, engaging the central nervous system for maximum force production. Distinct from hypertrophy training which uses more reps with less weight.",
        "application": "Use for strength and power days in CrossFit programming. Focus on compound movements like squats, deadlifts, cleans, snatches."
    }',
    'Apply this protocol when the primary goal is strength or power development. Use lighter rep ranges (3) for true 1RM work, higher ranges (5) for strength-endurance.',
    ARRAY['training age', 'exercise complexity', 'fatigue state', 'competition proximity'],
    ARRAY['strength', 'power', 'protocol', '3-5']
);

-- 3.3 Periodization Strategies
INSERT INTO training_principles (objective, author, category, title, content, decision_framework, context_factors, tags)
VALUES (
    'crossfit',
    'Andy Galpin',
    'periodization',
    'Linear vs Undulating Periodization',
    '{
        "summary": "Two primary periodization strategies for organizing training across time.",
        "strategies": {
            "linear": {
                "description": "Focus on developing one adaptation at a time, aiming to maximize specific outcomes sequentially.",
                "pros": ["Deep adaptation in specific quality", "Simpler to program", "Clear progression"],
                "cons": ["Other qualities may detrain", "Less variety", "Can plateau"],
                "best_for": "Athletes with specific competition dates, beginners, or when one quality is significantly lacking"
            },
            "undulating": {
                "description": "Incorporate various training styles throughout the week, allowing simultaneous development of multiple fitness adaptations.",
                "pros": ["Maintains diverse fitness qualities", "More variety", "Better for general fitness"],
                "cons": ["May not maximize single quality", "More complex programming", "Higher recovery demands"],
                "best_for": "CrossFit athletes who need to maintain multiple qualities, recreational athletes, off-season training"
            }
        },
        "galpin_insight": "Both can yield similar results. Choice depends on individual goals and need to maintain diverse fitness qualities. Even short, focused sessions targeting different adaptations can be combined within a single day."
    }',
    'Choose Linear when: preparing for specific competition, addressing major weakness, limited training time. Choose Undulating when: maintaining general fitness, CrossFit competition, year-round training without peaking.',
    ARRAY['competition schedule', 'training frequency', 'athlete preferences', 'recovery capacity', 'training age'],
    ARRAY['periodization', 'linear', 'undulating', 'planning']
);

-- 3.4 Progressive Overload & Variation
INSERT INTO training_principles (objective, author, category, title, content, decision_framework, context_factors, tags)
VALUES (
    'crossfit',
    'Andy Galpin',
    'progression',
    'Progressive Overload and Exercise Variation',
    '{
        "summary": "Key principles for continuous adaptation and avoiding plateaus.",
        "progressive_overload": {
            "description": "Gradually increase intensity (weights or reps) as strength improves to continue driving adaptation.",
            "methods": ["Add weight", "Add reps", "Add sets", "Reduce rest", "Increase tempo difficulty", "Add complexity"]
        },
        "exercise_variation": {
            "description": "Rotate exercises every few weeks to prevent plateaus and maintain novelty.",
            "timing": "Every 3-6 weeks for main movements, more frequent for accessories",
            "approach": "Change angle, grip, implement, or tempo while maintaining movement pattern"
        },
        "injury_prevention": {
            "description": "Incorporate multiplanar movements to strengthen connective tissues and prevent injuries.",
            "focus": ["Proper movement patterns", "Gradual tissue tolerance increase", "Multiplanar training"]
        }
    }',
    'Prioritize progressive overload for strength goals, emphasize variation for general fitness and reducing injury risk. Balance both in CrossFit programming.',
    ARRAY['training age', 'injury history', 'movement quality', 'goal specificity'],
    ARRAY['overload', 'variation', 'progression', 'injury-prevention']
);

-- =============================================================================
-- 4. Insert Mike Israetel Hypertrophy Principles
-- =============================================================================

-- 4.1 Volume Landmarks
INSERT INTO training_principles (objective, author, category, title, content, decision_framework, context_factors, tags)
VALUES (
    'hypertrophy',
    'Mike Israetel',
    'volume',
    'Volume Landmarks (MV, MEV, MAV, MRV)',
    '{
        "summary": "Four key volume landmarks that define the relationship between training volume and muscle growth/recovery.",
        "landmarks": {
            "MV": {
                "name": "Maintenance Volume",
                "definition": "The minimum amount of training required to maintain current muscle size.",
                "typical_range": "4-6 sets per muscle per week",
                "use_case": "Deload weeks, vacation, injury recovery, life stress periods"
            },
            "MEV": {
                "name": "Minimum Effective Volume",
                "definition": "The lowest amount of training volume that stimulates noticeable muscle growth.",
                "typical_range": "6-10 sets per muscle per week",
                "use_case": "Starting point for mesocycle, beginners, high frequency training"
            },
            "MAV": {
                "name": "Maximum Adaptive Volume",
                "definition": "The range of training volume where the most optimal muscle gains occur.",
                "typical_range": "12-20 sets per muscle per week",
                "use_case": "Main training phase, where most gains happen"
            },
            "MRV": {
                "name": "Maximum Recoverable Volume",
                "definition": "The absolute maximum volume an individual can recover from. Exceeding leads to overtraining.",
                "typical_range": "20-25+ sets per muscle per week (highly individual)",
                "use_case": "End of accumulation phase, signaling need for deload"
            }
        },
        "key_insight": "These landmarks are individualized and change based on recovery, stress, diet, sleep. They are starting points that require personal calibration.",
        "progression_model": "Start mesocycle at MEV, add 1-2 sets per muscle per week, approach MRV by week 4-6, then deload."
    }',
    'Start at MEV for new programs. Increase volume weekly. When performance drops, sleep suffers, or motivation tanks, you are approaching MRV. Deload when volume reaches MRV or performance declines.',
    ARRAY['training age', 'recovery capacity', 'diet quality', 'sleep quality', 'life stress', 'age', 'PED use'],
    ARRAY['volume', 'MEV', 'MAV', 'MRV', 'landmarks']
);

-- 4.2 Mesocycle Structure
INSERT INTO training_principles (objective, author, category, title, content, decision_framework, context_factors, tags)
VALUES (
    'hypertrophy',
    'Mike Israetel',
    'periodization',
    'Mesocycle Structure for Hypertrophy',
    '{
        "summary": "A structured approach to organizing training blocks for optimal muscle growth.",
        "structure": {
            "duration": "4-6 weeks typically",
            "phases": [
                {"week": 1, "volume": "MEV", "RIR": "3-4", "description": "Easy week, establish baseline, practice movements"},
                {"week": 2, "volume": "MEV+1-2 sets", "RIR": "2-3", "description": "Moderate challenge, begin adaptation"},
                {"week": 3, "volume": "Approaching MAV", "RIR": "2", "description": "Hard week, significant stimulus"},
                {"week": 4, "volume": "Upper MAV", "RIR": "1-2", "description": "Very hard, near limit"},
                {"week": 5, "volume": "Near MRV", "RIR": "0-1", "description": "Peak volume, maximal stimulus"},
                {"week": 6, "volume": "Deload (MV)", "RIR": "4+", "description": "Recovery week, allow supercompensation"}
            ]
        },
        "RIR_explanation": {
            "RIR": "Reps In Reserve - how many more reps you could do",
            "scale": "RIR 0 = failure, RIR 3 = could do 3 more reps"
        },
        "progression": "Add sets each week, increase weight when rep targets are hit easily"
    }',
    'Adjust mesocycle length based on individual recovery. Faster recoverers may need only 4 weeks. Slower recoverers may extend to 6+ weeks. Always deload when performance drops.',
    ARRAY['recovery speed', 'training age', 'volume tolerance', 'fatigue accumulation rate'],
    ARRAY['mesocycle', 'periodization', 'RIR', 'deload']
);

-- 4.3 Exercise Selection
INSERT INTO training_principles (objective, author, category, title, content, decision_framework, context_factors, tags)
VALUES (
    'hypertrophy',
    'Mike Israetel',
    'exercise_selection',
    'Exercise Selection for Hypertrophy',
    '{
        "summary": "Principles for selecting exercises that maximize muscle growth stimulus.",
        "guidelines": {
            "exercises_per_session": "1-3 exercises per muscle group per session",
            "exercise_types": {
                "compound": {"description": "Multi-joint movements", "example": "Bench press, Rows, Squats", "use": "Foundation of program, most sets"},
                "isolation": {"description": "Single-joint movements", "example": "Curls, Lateral raises, Leg extensions", "use": "Target specific muscles, add volume without systemic fatigue"}
            },
            "selection_criteria": [
                "Good mind-muscle connection",
                "Progressive overload potential",
                "Low injury risk for individual",
                "Appropriate for target muscle lengthened position",
                "Practical with available equipment"
            ]
        },
        "variation_guidelines": {
            "frequency": "Change exercises every 1-2 mesocycles",
            "maintain": "Keep at least one stable exercise per muscle for progress tracking"
        },
        "rep_ranges": {
            "hypertrophy_optimal": "6-15 reps most sets",
            "extended_range": "5-30 reps all effective if taken close to failure"
        }
    }',
    'Prioritize exercises where you feel the target muscle, can progressively overload safely, and have no pain. Compounds first, isolation to add volume without excessive fatigue.',
    ARRAY['equipment availability', 'injury history', 'mind-muscle connection', 'joint health'],
    ARRAY['exercise', 'selection', 'compound', 'isolation']
);

-- =============================================================================
-- 5. Insert Mike Israetel Strength Principles
-- =============================================================================

-- 5.1 Seven Principles of Strength Training
INSERT INTO training_principles (objective, author, category, title, content, decision_framework, context_factors, tags)
VALUES (
    'strength',
    'Mike Israetel',
    'foundational_theory',
    'Seven Principles of Strength Training',
    '{
        "summary": "Fundamental principles for long-term strength development.",
        "principles": [
            {
                "name": "Specificity",
                "description": "Training should directly reflect the desired outcome. Powerlifting training focuses on powerlifting movements and muscles.",
                "application": "Practice the exact competition lifts regularly with competition technique."
            },
            {
                "name": "Overload",
                "description": "The body must be subjected to progressively greater demands to continue adapting.",
                "application": "Increase weight, reps, or sets over time. Never stay at same level indefinitely."
            },
            {
                "name": "Fatigue Management",
                "description": "Training must allow adequate recovery to prevent performance decline and injury.",
                "application": "Include deload weeks, manage volume, track fatigue markers."
            },
            {
                "name": "Stimulus-Recovery-Adaptation (SRA)",
                "description": "Training provides stimulus, followed by recovery, leading to increased capacity.",
                "application": "Time sessions to allow recovery before next stimulus to same muscle/movement."
            },
            {
                "name": "Variation",
                "description": "Planned changes in training variables to prevent plateaus.",
                "application": "Vary rep ranges, exercises, intensities across mesocycles."
            },
            {
                "name": "Phase Potentiation",
                "description": "Training phases should build upon each other (hypertrophy → strength → peaking).",
                "application": "Use periodized blocks that set up subsequent phases."
            },
            {
                "name": "Individual Differences",
                "description": "Programs must be tailored to individual responses, recovery, and goals.",
                "application": "Track progress, adjust volume/intensity based on personal response."
            }
        ]
    }',
    'Apply all principles but weight them based on context. Competition lifters emphasize specificity near meets. Off-season emphasizes variation and volume. Always respect fatigue management.',
    ARRAY['competition timeline', 'training age', 'individual response patterns', 'recovery capacity'],
    ARRAY['principles', 'fundamentals', 'strength', 'powerlifting']
);

-- 5.2 Block Periodization for Strength
INSERT INTO training_principles (objective, author, category, title, content, decision_framework, context_factors, tags)
VALUES (
    'strength',
    'Mike Israetel',
    'periodization',
    'Block Periodization for Powerlifting',
    '{
        "summary": "A phased approach moving through distinct training blocks to peak strength.",
        "blocks": [
            {
                "name": "Hypertrophy Block",
                "duration": "4-6 weeks",
                "goals": ["Build muscle mass as foundation for strength", "Increase work capacity"],
                "characteristics": {
                    "volume": "High (MAV range)",
                    "intensity": "Moderate (65-75% 1RM)",
                    "reps": "8-15 per set",
                    "RIR": "2-4"
                },
                "exercises": "More variation, include accessories"
            },
            {
                "name": "Strength Block",
                "duration": "4-6 weeks",
                "goals": ["Convert muscle to strength", "Practice heavier loads"],
                "characteristics": {
                    "volume": "Moderate (decreasing from hypertrophy)",
                    "intensity": "High (75-85% 1RM)",
                    "reps": "4-8 per set",
                    "RIR": "1-3"
                },
                "exercises": "More specific, focus on main lifts"
            },
            {
                "name": "Peaking Block",
                "duration": "2-3 weeks",
                "goals": ["Maximize expression of strength", "Reduce fatigue for competition"],
                "characteristics": {
                    "volume": "Low",
                    "intensity": "Very High (85-100% 1RM)",
                    "reps": "1-3 per set",
                    "RIR": "1-2 (never grinding)"
                },
                "exercises": "Competition lifts only, minimal accessories"
            }
        ],
        "key_insight": "Each block sets up the next. Hypertrophy builds muscle, strength block teaches it to produce force, peaking dissipates fatigue while maintaining neural drive."
    }',
    'Run full periodization cycle for competition prep (12-16 weeks out). For off-season, can cycle between hypertrophy and strength blocks without peaking.',
    ARRAY['competition date', 'training age', 'muscle mass adequacy', 'strength level'],
    ARRAY['periodization', 'blocks', 'peaking', 'powerlifting']
);

-- 5.3 Intensity and RIR for Strength
INSERT INTO training_principles (objective, author, category, title, content, decision_framework, context_factors, tags)
VALUES (
    'strength',
    'Mike Israetel',
    'intensity',
    'Intensity Management and RIR for Strength',
    '{
        "summary": "Managing training intensity using percentage-based and RIR/RPE systems.",
        "systems": {
            "percentage_based": {
                "description": "Prescribe loads as percentage of 1RM",
                "pros": ["Objective", "Easy tracking"],
                "cons": ["Doesnt account for daily readiness", "1RM estimates can be off"]
            },
            "RIR_RPE": {
                "description": "Prescribe effort level (Reps In Reserve or Rate of Perceived Exertion)",
                "pros": ["Accounts for daily readiness", "Auto-regulates"],
                "cons": ["Requires experience to calibrate", "Subjective"]
            }
        },
        "technique_work": {
            "intensity": "~70% 1RM",
            "RPE": "4-6 (very submaximal)",
            "reps": "3-6",
            "purpose": "Focus on motor learning and technique refinement without excessive fatigue"
        },
        "strength_work": {
            "intensity": "75-90% 1RM",
            "RIR": "1-3",
            "reps": "1-6",
            "purpose": "Build maximal strength through heavy loading"
        },
        "key_insight": "Combine both systems: use percentages as starting point, adjust final weight based on daily RIR/RPE."
    }',
    'Use percentage-based for less experienced lifters who cannot yet accurately gauge RIR. Transition to RIR/RPE as athlete develops better self-awareness. Always use submaximal technique work for complex lifts.',
    ARRAY['training experience', 'self-awareness ability', 'competition proximity', 'lift complexity'],
    ARRAY['intensity', 'RIR', 'RPE', 'percentage', 'technique']
);

-- =============================================================================
-- 6. Update existing templates with proper attributes and content
-- =============================================================================

-- Delete old placeholder templates
DELETE FROM mesocycles WHERE program_id IN (SELECT id FROM programs WHERE is_template = true);
DELETE FROM programs WHERE is_template = true;

-- Insert CrossFit Template (Andy Galpin inspired)
INSERT INTO programs (id, coach_id, name, description, status, is_template, attributes)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM coaches LIMIT 1),
    'CrossFit Performance - Andy Galpin Style',
    'Programa de 4 semanas basado en la metodología del Dr. Andy Galpin. Combina las 9 adaptaciones fisiológicas con periodización ondulante: días de fuerza/potencia, metcon, habilidad técnica y resistencia. Incluye el protocolo 3-5 para desarrollo de fuerza y variación progresiva.',
    'active',
    true,
    '{
        "inspired_by": "Andy Galpin",
        "methodology": ["9 adaptaciones", "periodización ondulante", "protocolo 3-5"],
        "gradient": "from-[#FF416C] to-[#FF4B2B]",
        "focus": "crossfit",
        "duration_weeks": 4,
        "days_per_week": 5,
        "key_concepts": ["Skill/Speed/Power compatibility", "Strength-Endurance balance", "Progressive overload with variation"]
    }'
);

-- Insert Strength Template (Mike Israetel inspired)
INSERT INTO programs (id, coach_id, name, description, status, is_template, attributes)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM coaches LIMIT 1),
    'Fuerza Máxima - Mike Israetel Style',
    'Programa de 6 semanas basado en los 7 principios científicos de Mike Israetel. Bloque de fuerza con progresión de volumen (MEV→MRV), énfasis en los tres grandes levantamientos (sentadilla, press de banca, peso muerto), y gestión de fatiga con semana de descarga.',
    'active',
    true,
    '{
        "inspired_by": "Mike Israetel",
        "methodology": ["7 principios de fuerza", "volume landmarks", "block periodization"],
        "gradient": "from-[#2193b0] to-[#6dd5ed]",
        "focus": "strength",
        "duration_weeks": 6,
        "days_per_week": 4,
        "key_concepts": ["Specificity to powerlifts", "MEV to MRV progression", "RIR-based intensity", "Deload week"]
    }'
);

-- Insert Hypertrophy Template (Mike Israetel inspired)
INSERT INTO programs (id, coach_id, name, description, status, is_template, attributes)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM coaches LIMIT 1),
    'Hipertrofia Científica - Mike Israetel RP Style',
    'Programa de 5 semanas siguiendo el modelo de Renaissance Periodization. Progresión sistemática desde MEV hasta MRV, rangos de repeticiones óptimos (6-15), selección de ejercicios basada en conexión mente-músculo, y periodización de RIR para maximizar el estímulo de crecimiento muscular.',
    'active',
    true,
    '{
        "inspired_by": "Mike Israetel",
        "methodology": ["volume landmarks MEV/MAV/MRV", "RIR progression", "mesocycle structure"],
        "gradient": "from-[#8A2387] via-[#E94057] to-[#F27121]",
        "focus": "hypertrophy",
        "duration_weeks": 5,
        "days_per_week": 5,
        "key_concepts": ["Start at MEV, end at MRV", "10-20 sets per muscle per week", "RIR 3→0 progression", "Deload for supercompensation"]
    }'
);

-- =============================================================================
-- 7. Grant permissions (RLS handled by existing policies)
-- =============================================================================
-- No additional RLS needed as training_principles is public read
ALTER TABLE training_principles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read training principles"
ON training_principles FOR SELECT
USING (true);

CREATE POLICY "Only admins can modify training principles"
ON training_principles FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);
