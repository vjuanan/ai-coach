-- Migration: Populate Template Workout Structures
-- Creates complete mesocycle/day/workout_block structures for the 3 templates

-- =============================================================================
-- Helper: Get template IDs
-- =============================================================================
DO $$
DECLARE
    v_crossfit_template_id UUID;
    v_strength_template_id UUID;
    v_hypertrophy_template_id UUID;
    v_meso_id UUID;
    v_day_id UUID;
    v_week INT;
    v_day INT;
BEGIN
    -- Get existing template IDs
    SELECT id INTO v_crossfit_template_id FROM programs WHERE is_template = true AND name LIKE '%CrossFit Performance%' LIMIT 1;
    SELECT id INTO v_strength_template_id FROM programs WHERE is_template = true AND name LIKE '%Fuerza Máxima%' LIMIT 1;
    SELECT id INTO v_hypertrophy_template_id FROM programs WHERE is_template = true AND name LIKE '%Hipertrofia Científica%' LIMIT 1;

    -- Verify templates exist
    IF v_crossfit_template_id IS NULL OR v_strength_template_id IS NULL OR v_hypertrophy_template_id IS NULL THEN
        RAISE NOTICE 'One or more templates not found. Run migration 010 first.';
        RETURN;
    END IF;

    -- Clean existing structure (if any)
    DELETE FROM workout_blocks WHERE day_id IN (
        SELECT d.id FROM days d
        JOIN mesocycles m ON d.mesocycle_id = m.id
        WHERE m.program_id IN (v_crossfit_template_id, v_strength_template_id, v_hypertrophy_template_id)
    );
    DELETE FROM days WHERE mesocycle_id IN (
        SELECT id FROM mesocycles WHERE program_id IN (v_crossfit_template_id, v_strength_template_id, v_hypertrophy_template_id)
    );
    DELETE FROM mesocycles WHERE program_id IN (v_crossfit_template_id, v_strength_template_id, v_hypertrophy_template_id);

    -- =============================================================================
    -- TEMPLATE 1: CrossFit Performance - Andy Galpin Style (4 weeks × 5 days)
    -- Based on: 9 Adaptations, 3-5 Protocol, Undulating Periodization
    -- =============================================================================
    
    FOR v_week IN 1..4 LOOP
        -- Create mesocycle
        INSERT INTO mesocycles (program_id, week_number, focus, attributes)
        VALUES (
            v_crossfit_template_id,
            v_week,
            CASE 
                WHEN v_week = 4 THEN 'Deload'
                WHEN v_week = 1 THEN 'Accumulation'
                WHEN v_week = 2 THEN 'Intensification'
                ELSE 'Realization'
            END,
            jsonb_build_object(
                'methodology', 'Andy Galpin',
                'volume_factor', CASE WHEN v_week = 4 THEN 0.5 ELSE 0.75 + (v_week * 0.08) END
            )
        )
        RETURNING id INTO v_meso_id;

        -- Day 1: Strength (3-5 Protocol)
        INSERT INTO days (mesocycle_id, day_number, name, is_rest_day, notes)
        VALUES (v_meso_id, 1, 'Strength - Lower', false, 'Protocolo 3-5: Enfoque en fuerza máxima')
        RETURNING id INTO v_day_id;
        
        INSERT INTO workout_blocks (day_id, order_index, type, format, name, config) VALUES
        (v_day_id, 1, 'warmup', 'time', 'Warm-up', '{"duration_minutes": 10, "description": "Movilidad de caderas, activación glúteos, remo ligero"}'::jsonb),
        (v_day_id, 2, 'strength', 'sets_reps', 'Back Squat (3-5 Protocol)', '{"sets": 5, "reps": "3-5", "rest_seconds": 180, "intensity": "85-90%", "notes": "Técnica perfecta, sin fallar"}'::jsonb),
        (v_day_id, 3, 'strength', 'sets_reps', 'Romanian Deadlift', '{"sets": 4, "reps": "6-8", "rest_seconds": 120, "notes": "Control excéntrico"}'::jsonb),
        (v_day_id, 4, 'conditioning', 'amrap', 'Short Metcon', '{"duration_minutes": 8, "movements": ["KB Swings x15", "Box Jumps x10", "Push-ups x15"], "notes": "Intensidad alta"}'::jsonb);

        -- Day 2: Power + Skill
        INSERT INTO days (mesocycle_id, day_number, name, is_rest_day, notes)
        VALUES (v_meso_id, 2, 'Power + Skill', false, 'Trabajo técnico olímpico y potencia')
        RETURNING id INTO v_day_id;
        
        INSERT INTO workout_blocks (day_id, order_index, type, format, name, config) VALUES
        (v_day_id, 1, 'warmup', 'time', 'Barbell Warm-up', '{"duration_minutes": 12, "description": "Progresión con barra vacía: Snatch grip deadlift, Muscle snatch, OHS"}'::jsonb),
        (v_day_id, 2, 'skill', 'emom', 'Snatch Skill', '{"duration_minutes": 12, "description": "EMOM: 2 Power Snatch @ 70%", "notes": "Velocidad y timing"}'::jsonb),
        (v_day_id, 3, 'strength', 'complex', 'Power Complex', '{"sets": 4, "description": "1 Power Clean + 1 Front Squat + 1 Push Jerk", "rest_seconds": 150}'::jsonb),
        (v_day_id, 4, 'skill', 'practice', 'Gymnastics Skill', '{"duration_minutes": 10, "description": "Kipping pull-ups / Muscle-up progressions / HSPU practice"}'::jsonb);

        -- Day 3: Rest
        INSERT INTO days (mesocycle_id, day_number, name, is_rest_day, notes)
        VALUES (v_meso_id, 3, 'Descanso Activo', true, 'Movilidad ligera, caminar o yoga');

        -- Day 4: Conditioning (Metcon focus)
        INSERT INTO days (mesocycle_id, day_number, name, is_rest_day, notes)
        VALUES (v_meso_id, 4, 'Conditioning', false, 'Día de metcon largo - resistencia')
        RETURNING id INTO v_day_id;
        
        INSERT INTO workout_blocks (day_id, order_index, type, format, name, config) VALUES
        (v_day_id, 1, 'warmup', 'time', 'Cardio Warm-up', '{"duration_minutes": 8, "description": "Remo 500m + 2 rounds: 10 Air squats, 10 Lunges, 10 PVC pass-throughs"}'::jsonb),
        (v_day_id, 2, 'conditioning', 'amrap', 'Main Metcon (Long)', '{"duration_minutes": 20, "movements": ["Run 200m", "15 Wall Balls", "10 Toes to Bar", "5 Burpees"], "notes": "Pace sostenible, no sprints"}'::jsonb),
        (v_day_id, 3, 'accessory', 'sets_reps', 'Core Finisher', '{"sets": 3, "description": "20 GHD Sit-ups + 30s Hollow Hold", "rest_seconds": 60}'::jsonb);

        -- Day 5: Strength Upper (3-5 Protocol)
        INSERT INTO days (mesocycle_id, day_number, name, is_rest_day, notes)
        VALUES (v_meso_id, 5, 'Strength - Upper', false, 'Protocolo 3-5: Empuje y tracción')
        RETURNING id INTO v_day_id;
        
        INSERT INTO workout_blocks (day_id, order_index, type, format, name, config) VALUES
        (v_day_id, 1, 'warmup', 'time', 'Upper Warm-up', '{"duration_minutes": 8, "description": "Band pull-aparts, Push-up complex, Shoulder circles"}'::jsonb),
        (v_day_id, 2, 'strength', 'sets_reps', 'Strict Press (3-5 Protocol)', '{"sets": 5, "reps": "3-5", "rest_seconds": 180, "intensity": "80-85%"}'::jsonb),
        (v_day_id, 3, 'strength', 'sets_reps', 'Weighted Pull-ups', '{"sets": 4, "reps": "4-6", "rest_seconds": 150}'::jsonb),
        (v_day_id, 4, 'conditioning', 'for_time', 'Short Burner', '{"movements": ["21-15-9 Thrusters (43/30kg) + Pull-ups"], "time_cap_minutes": 10}'::jsonb);

        -- Day 6: Hybrid
        INSERT INTO days (mesocycle_id, day_number, name, is_rest_day, notes)
        VALUES (v_meso_id, 6, 'Hybrid Training', false, 'Combinación potencia + resistencia')
        RETURNING id INTO v_day_id;
        
        INSERT INTO workout_blocks (day_id, order_index, type, format, name, config) VALUES
        (v_day_id, 1, 'warmup', 'time', 'Dynamic Warm-up', '{"duration_minutes": 10, "description": "Jumping jacks, High knees, Butt kicks, Leg swings"}'::jsonb),
        (v_day_id, 2, 'strength', 'complex', 'Barbell Complex', '{"sets": 4, "description": "5 Deadlifts + 5 Hang Cleans + 5 Front Squats + 5 Push Press", "rest_seconds": 180}'::jsonb),
        (v_day_id, 3, 'conditioning', 'intervals', 'Mixed Modal', '{"rounds": 5, "work_seconds": 90, "rest_seconds": 90, "movements": ["Row Cals", "DB Snatch", "Burpee Box Jump Overs"]}'::jsonb);

        -- Day 7: Rest
        INSERT INTO days (mesocycle_id, day_number, name, is_rest_day, notes)
        VALUES (v_meso_id, 7, 'Descanso', true, 'Recuperación completa');
    END LOOP;

    -- =============================================================================
    -- TEMPLATE 2: Fuerza Máxima - Mike Israetel Style (6 weeks × 4 days)
    -- Based on: Volume Landmarks, 7 Principles, Block Periodization
    -- =============================================================================
    
    FOR v_week IN 1..6 LOOP
        -- Create mesocycle with volume progression
        INSERT INTO mesocycles (program_id, week_number, focus, attributes)
        VALUES (
            v_strength_template_id,
            v_week,
            CASE 
                WHEN v_week = 6 THEN 'Deload'
                WHEN v_week <= 2 THEN 'Accumulation (MEV)'
                WHEN v_week <= 4 THEN 'Intensification (MAV)'
                ELSE 'Realization (MRV)'
            END,
            jsonb_build_object(
                'methodology', 'Mike Israetel',
                'RIR', CASE v_week WHEN 1 THEN 3 WHEN 2 THEN 3 WHEN 3 THEN 2 WHEN 4 THEN 2 WHEN 5 THEN 1 ELSE 4 END,
                'sets_per_muscle', CASE v_week WHEN 1 THEN 10 WHEN 2 THEN 12 WHEN 3 THEN 14 WHEN 4 THEN 16 WHEN 5 THEN 18 ELSE 6 END
            )
        )
        RETURNING id INTO v_meso_id;

        -- Day 1: Lower Strength (Squat focus)
        INSERT INTO days (mesocycle_id, day_number, name, is_rest_day, notes)
        VALUES (v_meso_id, 1, 'Lower - Squat Focus', false, 'Fuerza máxima tren inferior')
        RETURNING id INTO v_day_id;
        
        INSERT INTO workout_blocks (day_id, order_index, type, format, name, config) VALUES
        (v_day_id, 1, 'warmup', 'time', 'Lower Warm-up', '{"duration_minutes": 10, "description": "Bici 5min + Goblet squats + Hip circles + Leg swings"}'::jsonb),
        (v_day_id, 2, 'strength', 'sets_reps', 'Back Squat', '{"sets": 4, "reps": "4-6", "rest_seconds": 180, "intensity": "80-85%", "notes": "RIR según semana"}'::jsonb),
        (v_day_id, 3, 'strength', 'sets_reps', 'Romanian Deadlift', '{"sets": 3, "reps": "8-10", "rest_seconds": 120}'::jsonb),
        (v_day_id, 4, 'strength', 'sets_reps', 'Leg Press', '{"sets": 3, "reps": "10-12", "rest_seconds": 90}'::jsonb),
        (v_day_id, 5, 'accessory', 'sets_reps', 'Leg Curl', '{"sets": 3, "reps": "12-15", "rest_seconds": 60}'::jsonb);

        -- Day 2: Upper Strength (Bench focus)
        INSERT INTO days (mesocycle_id, day_number, name, is_rest_day, notes)
        VALUES (v_meso_id, 2, 'Upper - Push Focus', false, 'Fuerza máxima empuje')
        RETURNING id INTO v_day_id;
        
        INSERT INTO workout_blocks (day_id, order_index, type, format, name, config) VALUES
        (v_day_id, 1, 'warmup', 'time', 'Upper Warm-up', '{"duration_minutes": 8, "description": "Band pull-aparts, Face pulls, Push-up progresión"}'::jsonb),
        (v_day_id, 2, 'strength', 'sets_reps', 'Bench Press', '{"sets": 4, "reps": "4-6", "rest_seconds": 180, "intensity": "80-85%"}'::jsonb),
        (v_day_id, 3, 'strength', 'sets_reps', 'Barbell Row', '{"sets": 4, "reps": "6-8", "rest_seconds": 150}'::jsonb),
        (v_day_id, 4, 'strength', 'sets_reps', 'Overhead Press', '{"sets": 3, "reps": "6-8", "rest_seconds": 120}'::jsonb),
        (v_day_id, 5, 'accessory', 'sets_reps', 'Tricep Dips', '{"sets": 3, "reps": "8-12", "rest_seconds": 90}'::jsonb);

        -- Day 3: Rest
        INSERT INTO days (mesocycle_id, day_number, name, is_rest_day, notes)
        VALUES (v_meso_id, 3, 'Descanso', true, 'Recuperación - estiramientos opcionales');

        -- Day 4: Lower Power (Deadlift focus)
        INSERT INTO days (mesocycle_id, day_number, name, is_rest_day, notes)
        VALUES (v_meso_id, 4, 'Lower - Deadlift Focus', false, 'Potencia y volumen tren inferior')
        RETURNING id INTO v_day_id;
        
        INSERT INTO workout_blocks (day_id, order_index, type, format, name, config) VALUES
        (v_day_id, 1, 'warmup', 'time', 'Deadlift Warm-up', '{"duration_minutes": 10, "description": "Cat-cow, Bird dogs, Hip hinges, Light RDLs"}'::jsonb),
        (v_day_id, 2, 'strength', 'sets_reps', 'Conventional Deadlift', '{"sets": 4, "reps": "3-5", "rest_seconds": 240, "intensity": "82-88%"}'::jsonb),
        (v_day_id, 3, 'strength', 'sets_reps', 'Front Squat', '{"sets": 3, "reps": "6-8", "rest_seconds": 150}'::jsonb),
        (v_day_id, 4, 'strength', 'sets_reps', 'Walking Lunges', '{"sets": 3, "reps": "10 each leg", "rest_seconds": 90}'::jsonb),
        (v_day_id, 5, 'accessory', 'sets_reps', 'Calf Raises', '{"sets": 4, "reps": "15-20", "rest_seconds": 60}'::jsonb);

        -- Day 5: Upper Volume (Pull focus)
        INSERT INTO days (mesocycle_id, day_number, name, is_rest_day, notes)
        VALUES (v_meso_id, 5, 'Upper - Pull Focus', false, 'Volumen espalda y accesorios')
        RETURNING id INTO v_day_id;
        
        INSERT INTO workout_blocks (day_id, order_index, type, format, name, config) VALUES
        (v_day_id, 1, 'warmup', 'time', 'Pull Warm-up', '{"duration_minutes": 8, "description": "Lat stretch, Band rows, Scap push-ups"}'::jsonb),
        (v_day_id, 2, 'strength', 'sets_reps', 'Weighted Pull-ups', '{"sets": 4, "reps": "6-8", "rest_seconds": 150}'::jsonb),
        (v_day_id, 3, 'strength', 'sets_reps', 'Incline Dumbbell Press', '{"sets": 3, "reps": "8-10", "rest_seconds": 120}'::jsonb),
        (v_day_id, 4, 'strength', 'sets_reps', 'Cable Row', '{"sets": 3, "reps": "10-12", "rest_seconds": 90}'::jsonb),
        (v_day_id, 5, 'accessory', 'sets_reps', 'Bicep Curls + Face Pulls', '{"sets": 3, "reps": "12-15 each", "rest_seconds": 60}'::jsonb);

        -- Days 6-7: Rest
        INSERT INTO days (mesocycle_id, day_number, name, is_rest_day, notes)
        VALUES (v_meso_id, 6, 'Descanso', true, 'Recuperación');
        INSERT INTO days (mesocycle_id, day_number, name, is_rest_day, notes)
        VALUES (v_meso_id, 7, 'Descanso', true, 'Preparación para siguiente semana');
    END LOOP;

    -- =============================================================================
    -- TEMPLATE 3: Hipertrofia Científica - Mike Israetel RP Style (5 weeks × 5 days)
    -- Based on: Volume Landmarks, RIR Progression, PPL Split
    -- =============================================================================
    
    FOR v_week IN 1..5 LOOP
        -- Create mesocycle
        INSERT INTO mesocycles (program_id, week_number, focus, attributes)
        VALUES (
            v_hypertrophy_template_id,
            v_week,
            CASE 
                WHEN v_week = 5 THEN 'Deload'
                WHEN v_week = 1 THEN 'MEV (Baseline)'
                WHEN v_week = 2 THEN 'MEV+2'
                WHEN v_week = 3 THEN 'MAV'
                ELSE 'Near MRV'
            END,
            jsonb_build_object(
                'methodology', 'Mike Israetel RP',
                'RIR', CASE v_week WHEN 1 THEN 4 WHEN 2 THEN 3 WHEN 3 THEN 2 WHEN 4 THEN 1 ELSE 4 END,
                'sets_per_muscle', CASE v_week WHEN 1 THEN 10 WHEN 2 THEN 12 WHEN 3 THEN 15 WHEN 4 THEN 18 ELSE 6 END
            )
        )
        RETURNING id INTO v_meso_id;

        -- Day 1: Push (Chest, Shoulders, Triceps)
        INSERT INTO days (mesocycle_id, day_number, name, is_rest_day, notes)
        VALUES (v_meso_id, 1, 'Push Day', false, 'Pecho, hombros, tríceps - hipertrofia')
        RETURNING id INTO v_day_id;
        
        INSERT INTO workout_blocks (day_id, order_index, type, format, name, config) VALUES
        (v_day_id, 1, 'warmup', 'time', 'Push Warm-up', '{"duration_minutes": 8, "description": "Band pull-aparts, Arm circles, Light DB press"}'::jsonb),
        (v_day_id, 2, 'strength', 'sets_reps', 'Flat Dumbbell Press', '{"sets": 4, "reps": "8-12", "rest_seconds": 120, "notes": "Conexión mente-músculo, pausa abajo"}'::jsonb),
        (v_day_id, 3, 'strength', 'sets_reps', 'Incline Machine Press', '{"sets": 3, "reps": "10-12", "rest_seconds": 90}'::jsonb),
        (v_day_id, 4, 'strength', 'sets_reps', 'Lateral Raises', '{"sets": 4, "reps": "12-15", "rest_seconds": 60, "notes": "Técnica estricta"}'::jsonb),
        (v_day_id, 5, 'accessory', 'sets_reps', 'Cable Flyes', '{"sets": 3, "reps": "12-15", "rest_seconds": 60}'::jsonb),
        (v_day_id, 6, 'accessory', 'sets_reps', 'Tricep Pushdowns', '{"sets": 3, "reps": "12-15", "rest_seconds": 60}'::jsonb);

        -- Day 2: Pull (Back, Biceps, Rear Delts)
        INSERT INTO days (mesocycle_id, day_number, name, is_rest_day, notes)
        VALUES (v_meso_id, 2, 'Pull Day', false, 'Espalda, bíceps, deltoides posterior')
        RETURNING id INTO v_day_id;
        
        INSERT INTO workout_blocks (day_id, order_index, type, format, name, config) VALUES
        (v_day_id, 1, 'warmup', 'time', 'Pull Warm-up', '{"duration_minutes": 8, "description": "Band rows, Face pulls, Lat stretch"}'::jsonb),
        (v_day_id, 2, 'strength', 'sets_reps', 'Lat Pulldown', '{"sets": 4, "reps": "8-12", "rest_seconds": 120, "notes": "Estiramiento completo arriba"}'::jsonb),
        (v_day_id, 3, 'strength', 'sets_reps', 'Cable Row', '{"sets": 4, "reps": "10-12", "rest_seconds": 90}'::jsonb),
        (v_day_id, 4, 'strength', 'sets_reps', 'Chest-Supported Row', '{"sets": 3, "reps": "10-12", "rest_seconds": 90}'::jsonb),
        (v_day_id, 5, 'accessory', 'sets_reps', 'Rear Delt Flyes', '{"sets": 3, "reps": "15-20", "rest_seconds": 60}'::jsonb),
        (v_day_id, 6, 'accessory', 'sets_reps', 'Hammer Curls', '{"sets": 3, "reps": "10-12", "rest_seconds": 60}'::jsonb);

        -- Day 3: Legs (Quads, Hams, Glutes)
        INSERT INTO days (mesocycle_id, day_number, name, is_rest_day, notes)
        VALUES (v_meso_id, 3, 'Leg Day', false, 'Cuádriceps, isquios, glúteos')
        RETURNING id INTO v_day_id;
        
        INSERT INTO workout_blocks (day_id, order_index, type, format, name, config) VALUES
        (v_day_id, 1, 'warmup', 'time', 'Leg Warm-up', '{"duration_minutes": 10, "description": "Bici 5min, Goblet squats, Leg swings"}'::jsonb),
        (v_day_id, 2, 'strength', 'sets_reps', 'Hack Squat', '{"sets": 4, "reps": "8-12", "rest_seconds": 150, "notes": "Profundidad completa"}'::jsonb),
        (v_day_id, 3, 'strength', 'sets_reps', 'Romanian Deadlift', '{"sets": 4, "reps": "10-12", "rest_seconds": 120}'::jsonb),
        (v_day_id, 4, 'strength', 'sets_reps', 'Leg Extension', '{"sets": 3, "reps": "12-15", "rest_seconds": 60}'::jsonb),
        (v_day_id, 5, 'strength', 'sets_reps', 'Lying Leg Curl', '{"sets": 3, "reps": "12-15", "rest_seconds": 60}'::jsonb),
        (v_day_id, 6, 'accessory', 'sets_reps', 'Standing Calf Raises', '{"sets": 4, "reps": "15-20", "rest_seconds": 45}'::jsonb);

        -- Day 4: Upper (Chest, Back, Arms - Accessories)
        INSERT INTO days (mesocycle_id, day_number, name, is_rest_day, notes)
        VALUES (v_meso_id, 4, 'Upper Accessories', false, 'Volumen adicional upper body')
        RETURNING id INTO v_day_id;
        
        INSERT INTO workout_blocks (day_id, order_index, type, format, name, config) VALUES
        (v_day_id, 1, 'warmup', 'time', 'Upper Warm-up', '{"duration_minutes": 6, "description": "Arm circles, Light band work"}'::jsonb),
        (v_day_id, 2, 'strength', 'sets_reps', 'Dips (or Machine Dip)', '{"sets": 3, "reps": "8-12", "rest_seconds": 90}'::jsonb),
        (v_day_id, 3, 'strength', 'sets_reps', 'Pull-ups (or Assisted)', '{"sets": 3, "reps": "8-12", "rest_seconds": 90}'::jsonb),
        (v_day_id, 4, 'strength', 'sets_reps', 'Dumbbell Shoulder Press', '{"sets": 3, "reps": "10-12", "rest_seconds": 90}'::jsonb),
        (v_day_id, 5, 'accessory', 'sets_reps', 'Incline Curls + Overhead Tricep Extension', '{"sets": 3, "reps": "12-15 each", "rest_seconds": 60}'::jsonb);

        -- Day 5: Lower Volume
        INSERT INTO days (mesocycle_id, day_number, name, is_rest_day, notes)
        VALUES (v_meso_id, 5, 'Lower Volume', false, 'Volumen adicional piernas')
        RETURNING id INTO v_day_id;
        
        INSERT INTO workout_blocks (day_id, order_index, type, format, name, config) VALUES
        (v_day_id, 1, 'warmup', 'time', 'Lower Warm-up', '{"duration_minutes": 8, "description": "Bici, Hip circles, Bodyweight squats"}'::jsonb),
        (v_day_id, 2, 'strength', 'sets_reps', 'Leg Press', '{"sets": 4, "reps": "10-15", "rest_seconds": 120}'::jsonb),
        (v_day_id, 3, 'strength', 'sets_reps', 'Walking Lunges', '{"sets": 3, "reps": "12 each leg", "rest_seconds": 90}'::jsonb),
        (v_day_id, 4, 'strength', 'sets_reps', 'Seated Leg Curl', '{"sets": 3, "reps": "12-15", "rest_seconds": 60}'::jsonb),
        (v_day_id, 5, 'strength', 'sets_reps', 'Hip Thrust', '{"sets": 3, "reps": "12-15", "rest_seconds": 90}'::jsonb),
        (v_day_id, 6, 'accessory', 'sets_reps', 'Seated Calf Raises', '{"sets": 4, "reps": "15-20", "rest_seconds": 45}'::jsonb);

        -- Days 6-7: Rest
        INSERT INTO days (mesocycle_id, day_number, name, is_rest_day, notes)
        VALUES (v_meso_id, 6, 'Descanso', true, 'Recuperación activa opcional');
        INSERT INTO days (mesocycle_id, day_number, name, is_rest_day, notes)
        VALUES (v_meso_id, 7, 'Descanso', true, 'Recuperación completa');
    END LOOP;

    RAISE NOTICE 'Template structures created successfully!';
    RAISE NOTICE 'CrossFit: % (4 weeks)', v_crossfit_template_id;
    RAISE NOTICE 'Strength: % (6 weeks)', v_strength_template_id;
    RAISE NOTICE 'Hypertrophy: % (5 weeks)', v_hypertrophy_template_id;

END $$;
