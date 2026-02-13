-- Migration: Add Finishers Methodologies
-- Adds 'finisher' category and inserts new methodology records

-- 1. Update Check Constraint for category
ALTER TABLE training_methodologies DROP CONSTRAINT IF EXISTS training_methodologies_category_check;
ALTER TABLE training_methodologies ADD CONSTRAINT training_methodologies_category_check 
    CHECK (category IN ('metcon', 'strength', 'hiit', 'conditioning', 'finisher'));

-- 2. Insert Finisher Methodologies
INSERT INTO training_methodologies (code, name, description, category, icon, sort_order, form_config, default_values) VALUES

-- DROPSET
('DROPSET_FINISHER', 'Dropset', 'Reduce weight immediately after failure and continue repetitions.', 'finisher', 'TrendingDown', 20, 
'{
  "fields": [
    {"key": "drops", "label": "Número de Drops", "type": "number", "placeholder": "2-3", "required": true, "default": 2},
    {"key": "percentage", "label": "% Reducción Peso", "type": "text", "placeholder": "10-20%", "required": true, "default": "20%"},
    {"key": "movements", "label": "Ejercicio", "type": "movements_list", "required": true}
  ]
}'::jsonb,
'{"drops": 2, "percentage": "20%", "movements": []}'::jsonb),

-- REST-PAUSE
('REST_PAUSE', 'Rest-Pause', 'Reach failure, short rest, continue to failure again.', 'finisher', 'Timer', 21,
'{
  "fields": [
    {"key": "totalReps", "label": "Reps Totales (Objetivo)", "type": "number", "placeholder": "15-20", "required": true},
    {"key": "rest", "label": "Micro-Descanso (seg)", "type": "number", "placeholder": "15", "default": 15},
    {"key": "movements", "label": "Ejercicio", "type": "movements_list", "required": true}
  ]
}'::jsonb,
'{"totalReps": 20, "rest": 15, "movements": []}'::jsonb),

-- LADDER (Specific for Finishers if slightly different from HIIT, otherwise reuse or alias)
-- We'll create a specific one for Finishers to have its own description/context
('LADDER_FINISHER', 'Escalera (Ladder)', 'Ascending or descending repetitions with minimal rest.', 'finisher', 'TrendingUp', 22,
'{
  "fields": [
    {"key": "repsStart", "label": "Reps Inicio", "type": "number", "placeholder": "1", "required": true, "default": 1},
    {"key": "repsPeak", "label": "Reps Pico/Final", "type": "number", "placeholder": "10", "required": true, "default": 10},
    {"key": "movements", "label": "Movimientos", "type": "movements_list", "required": true}
  ]
}'::jsonb,
'{"repsStart": 1, "repsPeak": 10, "movements": []}'::jsonb),

-- 21s
('21S', '21s', '7 partial bottom, 7 partial top, 7 full range reps. Non-stop.', 'finisher', 'Layers', 23,
'{
  "fields": [
    {"key": "sets", "label": "Series", "type": "number", "placeholder": "2-3", "default": 2},
    {"key": "movements", "label": "Ejercicio (Aislamiento)", "type": "movements_list", "required": true, "help": "Ideal para Curls, Elevaciones Laterales, Extensiones"}
  ]
}'::jsonb,
'{"sets": 2, "movements": []}'::jsonb),

-- ISO-HOLD
('ISO_HOLD', 'Iso-Hold', 'Pause isometrically at peak tension every rep or at end.', 'finisher', 'Activity', 24,
'{
  "fields": [
    {"key": "holdTime", "label": "Tiempo Pausa (seg)", "type": "number", "placeholder": "3-5", "required": true, "default": 3},
    {"key": "reps", "label": "Repeticiones", "type": "text", "placeholder": "8-10", "required": true},
    {"key": "movements", "label": "Ejercicio", "type": "movements_list", "required": true}
  ]
}'::jsonb,
'{"holdTime": 3, "reps": "10", "movements": []}'::jsonb),

-- 1.5 REPS
('1_5_REPS', '1.5 Reps', 'One full rep + one half rep = 1 repetition.', 'finisher', 'Repeat', 25,
'{
  "fields": [
    {"key": "sets", "label": "Series", "type": "number", "placeholder": "3", "default": 3},
    {"key": "reps", "label": "Repeticiones (1.5)", "type": "text", "placeholder": "8-10", "required": true},
    {"key": "movements", "label": "Ejercicio", "type": "movements_list", "required": true}
  ]
}'::jsonb,
'{"sets": 3, "reps": "8-10", "movements": []}'::jsonb)

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    form_config = EXCLUDED.form_config,
    default_values = EXCLUDED.default_values,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();
