-- 1. Add is_template column to programs
ALTER TABLE programs ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_programs_is_template ON programs(is_template);

-- 3. Update RLS Policies to allow reading templates

-- Programs: Allow reading if is_template is true
CREATE POLICY "Public can view templates"
    ON programs FOR SELECT
    USING (is_template = true);

-- Mesocycles: Allow viewing if program is a template
CREATE POLICY "Public can view template mesocycles"
    ON mesocycles FOR SELECT
    USING (program_id IN (SELECT id FROM programs WHERE is_template = true));

-- Days: Allow viewing if mesocycle belongs to a template
CREATE POLICY "Public can view template days"
    ON days FOR SELECT
    USING (mesocycle_id IN (
        SELECT m.id FROM mesocycles m
        JOIN programs p ON m.program_id = p.id
        WHERE p.is_template = true
    ));

-- Workout Blocks: Allow viewing if day belongs to a template
CREATE POLICY "Public can view template workout blocks"
    ON workout_blocks FOR SELECT
    USING (day_id IN (
        SELECT d.id FROM days d
        JOIN mesocycles m ON d.mesocycle_id = m.id
        JOIN programs p ON m.program_id = p.id
        WHERE p.is_template = true
    ));

-- 4. SEED DATA
-- We need a Coach to own the templates (Constraint: coach_id NOT NULL)
-- We'll try to find an existing "System" coach or create one.
-- For the seed, we'll just Insert a placeholder coach if not exists.

DO $$
DECLARE
    system_coach_uid UUID := '00000000-0000-0000-0000-000000000001'; -- Dummy ID
    system_coach_id UUID;
    prog_force_id UUID;
    prog_hyper_id UUID;
    meso_id UUID;
    day_id UUID;
BEGIN
    -- Ensure System User/Coach exists (This is tricky with Auth, we'll just insert into coaches with a random UUID if needed, 
    -- but coaches needs user_id FK to auth.users usually. 
    -- Hack: We'll pick the FIRST existing coach to own the templates for now, or create one if we can bypass FK.
    -- Better: We will assume the user applying this migration has a coach_id.
    -- OR: We'll select the first coach found.
    
    SELECT id INTO system_coach_id FROM coaches LIMIT 1;
    
    IF system_coach_id IS NULL THEN
        RAISE NOTICE 'No coach found to own templates. Skipping seed data.';
        RETURN;
    END IF;

    -- ====================================================
    -- TEMPLATE 1: BLOQUE DE FUERZA (Andy Galpin style ish)
    -- ====================================================
    INSERT INTO programs (coach_id, name, description, status, is_template)
    VALUES (
        system_coach_id,
        'Bloque de Fuerza - Andy Galpin Style',
        'Progresión lineal de 4 semanas enfocada en los 3 grandes levantamientos y adaptaciones neurales.',
        'active',
        true
    ) RETURNING id INTO prog_force_id;

    -- Mesocycle 1
    INSERT INTO mesocycles (program_id, week_number, focus, attributes)
    VALUES (prog_force_id, 1, 'Fuerza Base', '{"intensity": "75-80%", "volume": "Moderate"}')
    RETURNING id INTO meso_id;

    -- Day 1: Lower Body Strength (Squat)
    INSERT INTO days (mesocycle_id, day_number, name, is_rest_day)
    VALUES (meso_id, 1, 'Pierna - Fuerza Maxima', false)
    RETURNING id INTO day_id;

    INSERT INTO workout_blocks (day_id, order_index, type, name, config)
    VALUES 
    (day_id, 0, 'warmup', 'Calentamiento General', '{"duration": "10 min", "movements": ["Air Squats", "Lunges", "Glute Bridges"]}'),
    (day_id, 1, 'strength_linear', 'Back Squat', '{"sets": 5, "reps": 5, "intensity": "75% 1RM", "rest": "3-5 min"}'),
    (day_id, 2, 'accessory', 'Romanian Deadlift', '{"sets": 3, "reps": 8, "rpe": 8}'),
    (day_id, 3, 'accessory', 'Walking Lunges', '{"sets": 3, "reps": 12, "rpe": 8}');

    -- Day 2: Upper Body Strength (Bench)
    INSERT INTO days (mesocycle_id, day_number, name, is_rest_day)
    VALUES (meso_id, 2, 'Empuje - Fuerza', false)
    RETURNING id INTO day_id;

    INSERT INTO workout_blocks (day_id, order_index, type, name, config)
    VALUES 
    (day_id, 0, 'warmup', 'Movilidad de Hombro', '{"duration": "5 min"}'),
    (day_id, 1, 'strength_linear', 'Bench Press', '{"sets": 5, "reps": 5, "intensity": "75% 1RM", "rest": "3 min"}'),
    (day_id, 2, 'accessory', 'Overhead Press', '{"sets": 3, "reps": 6, "rpe": 8}'),
    (day_id, 3, 'accessory', 'Pull Ups', '{"sets": 4, "reps": "AMRAP", "rpe": 9}');

    -- ====================================================
    -- TEMPLATE 2: PREPARACION COMPETICION (CrossFit/Metcon)
    -- ====================================================
    INSERT INTO programs (coach_id, name, description, status, is_template)
    VALUES (
        system_coach_id,
        'Preparacion Competicion',
        'Ciclo de 8 semanas de alto rendimiento mixto (Fuerza + Metcon).',
        'active',
        true
    ) RETURNING id INTO prog_force_id; -- Reuse variable

     -- Mesocycle 1
    INSERT INTO mesocycles (program_id, week_number, focus, attributes)
    VALUES (prog_force_id, 1, 'Capacidad Aerobica + Fuerza', '{"volume": "High"}')
    RETURNING id INTO meso_id;

    -- Day 1
    INSERT INTO days (mesocycle_id, day_number, name, is_rest_day)
    VALUES (meso_id, 1, 'Metcon Mix', false)
    RETURNING id INTO day_id;

    INSERT INTO workout_blocks (day_id, order_index, type, format, name, config)
    VALUES 
    (day_id, 0, 'metcon_structured', 'AMRAP', 'Cindy', '{"time_cap": "20 min", "movements": ["5 Pull ups", "10 Push ups", "15 Air Squats"]}');

    -- ====================================================
    -- TEMPLATE 3: HIPERTROFIA - MIKE ISRAETEL
    -- ====================================================
    INSERT INTO programs (coach_id, name, description, status, is_template)
    VALUES (
        system_coach_id,
        'Hipertrofia - Mike Israetel',
        'Enfoque científico en volumen (MEV/MRV), RIR y selección de ejercicios para ganancia muscular.',
        'active',
        true
    ) RETURNING id INTO prog_hyper_id;

    -- Mesocycle 1
    INSERT INTO mesocycles (program_id, week_number, focus, attributes)
    VALUES (prog_hyper_id, 1, 'Acumulación - Sem 1', '{"rir": "3-4"}')
    RETURNING id INTO meso_id;

    -- Day 1: Push (Pecho/Hombro/Triceps)
    INSERT INTO days (mesocycle_id, day_number, name, is_rest_day)
    VALUES (meso_id, 1, 'Push A', false)
    RETURNING id INTO day_id;

    INSERT INTO workout_blocks (day_id, order_index, type, name, config)
    VALUES 
    (day_id, 0, 'accessory', 'Incline Dumbbell Press', '{"sets": 3, "reps": "10-15", "rir": 3, "notes": "Stretch at bottom"}'),
    (day_id, 1, 'accessory', 'Flat Machine Press', '{"sets": 3, "reps": "12-15", "rir": 3}'),
    (day_id, 2, 'accessory', 'Lateral Raises', '{"sets": 4, "reps": "15-20", "rir": 2}'),
    (day_id, 3, 'accessory', 'Tricep Pushdowns', '{"sets": 3, "reps": "12-20", "rir": 2}');

    -- Day 2: Pull (Espalda/Biceps)
    INSERT INTO days (mesocycle_id, day_number, name, is_rest_day)
    VALUES (meso_id, 2, 'Pull A', false)
    RETURNING id INTO day_id;

    INSERT INTO workout_blocks (day_id, order_index, type, name, config)
    VALUES 
    (day_id, 0, 'accessory', 'Pull Ups (Weighted)', '{"sets": 3, "reps": "8-12", "rir": 3}'),
    (day_id, 1, 'accessory', 'Chest Supported Row', '{"sets": 3, "reps": "12-15", "rir": 3}'),
    (day_id, 2, 'accessory', 'Face Pulls', '{"sets": 3, "reps": "15-20", "rir": 2}'),
    (day_id, 3, 'accessory', 'Bicep Curl (Cable)', '{"sets": 4, "reps": "12-20", "rir": 2}');

END $$;
