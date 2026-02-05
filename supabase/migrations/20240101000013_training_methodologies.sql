-- Training Methodologies Table
-- Dynamic training methodology configuration for the Speed Editor

-- ============================================
-- TABLE: training_methodologies
-- ============================================

CREATE TABLE IF NOT EXISTS training_methodologies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('metcon', 'strength', 'hiit', 'conditioning')),
    form_config JSONB NOT NULL DEFAULT '{}',
    default_values JSONB NOT NULL DEFAULT '{}',
    icon TEXT NOT NULL DEFAULT 'Dumbbell',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_methodologies_category ON training_methodologies(category);
CREATE INDEX IF NOT EXISTS idx_training_methodologies_sort ON training_methodologies(sort_order);

-- Enable RLS
ALTER TABLE training_methodologies ENABLE ROW LEVEL SECURITY;

-- Public read access for authenticated users
CREATE POLICY "Anyone can view training methodologies"
    ON training_methodologies FOR SELECT
    TO authenticated
    USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_training_methodologies_updated_at
    BEFORE UPDATE ON training_methodologies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: Common Training Methodologies
-- ============================================

INSERT INTO training_methodologies (code, name, description, category, icon, sort_order, form_config, default_values) VALUES

-- METCON Methodologies
('EMOM', 'EMOM', 'Every Minute On the Minute - Perform work at the start of each minute', 'metcon', 'Clock', 1, 
'{
  "fields": [
    {"key": "minutes", "label": "Duración Total (minutos)", "type": "number", "placeholder": "10", "required": true},
    {"key": "interval", "label": "Cada X Minutos", "type": "number", "placeholder": "1", "default": 1},
    {"key": "movements", "label": "Movimientos (uno por minuto)", "type": "movements_list", "required": true}
  ]
}'::jsonb,
'{"minutes": 10, "interval": 1, "movements": []}'::jsonb),

('EMOM_ALT', 'EMOM Alternating', 'Alternating movements each minute for variety', 'metcon', 'RefreshCw', 2,
'{
  "fields": [
    {"key": "minutes", "label": "Duración Total (minutos)", "type": "number", "placeholder": "12", "required": true},
    {"key": "movements", "label": "Movimientos Alternados", "type": "movements_list", "required": true, "help": "Los movimientos alternarán cada minuto"}
  ]
}'::jsonb,
'{"minutes": 12, "movements": []}'::jsonb),

('E2MOM', 'E2MOM', 'Every 2 Minutes On the Minute - More complex movements with rest', 'metcon', 'Timer', 3,
'{
  "fields": [
    {"key": "sets", "label": "Número de Sets", "type": "number", "placeholder": "5", "required": true},
    {"key": "movements", "label": "Movimientos por Set", "type": "movements_list", "required": true}
  ]
}'::jsonb,
'{"sets": 5, "movements": []}'::jsonb),

('AMRAP', 'AMRAP', 'As Many Rounds/Reps As Possible in the given time', 'metcon', 'Flame', 4,
'{
  "fields": [
    {"key": "minutes", "label": "Time Cap (minutos)", "type": "number", "placeholder": "12", "required": true},
    {"key": "movements", "label": "Movimientos por Ronda", "type": "movements_list", "required": true}
  ]
}'::jsonb,
'{"minutes": 12, "movements": []}'::jsonb),

('RFT', 'Rounds For Time', 'Complete specified rounds as fast as possible', 'metcon', 'Repeat', 5,
'{
  "fields": [
    {"key": "rounds", "label": "Número de Rondas", "type": "number", "placeholder": "5", "required": true},
    {"key": "timeCap", "label": "Time Cap (opcional)", "type": "number", "placeholder": "20"},
    {"key": "movements", "label": "Movimientos por Ronda", "type": "movements_list", "required": true}
  ]
}'::jsonb,
'{"rounds": 5, "movements": []}'::jsonb),

('FOR_TIME', 'For Time', 'Complete the workout as fast as possible', 'metcon', 'Zap', 6,
'{
  "fields": [
    {"key": "timeCap", "label": "Time Cap (opcional)", "type": "number", "placeholder": "15"},
    {"key": "movements", "label": "Movimientos", "type": "movements_list", "required": true}
  ]
}'::jsonb,
'{"movements": []}'::jsonb),

('CHIPPER', 'Chipper', 'Large volume of reps, chip away one movement at a time', 'metcon', 'ListOrdered', 7,
'{
  "fields": [
    {"key": "timeCap", "label": "Time Cap (opcional)", "type": "number", "placeholder": "25"},
    {"key": "movements", "label": "Movimientos (en orden)", "type": "movements_list", "required": true, "help": "Ejemplo: 50 Wall Balls, 40 Pull-ups, 30 KB Swings..."}
  ]
}'::jsonb,
'{"movements": []}'::jsonb),

('DEATH_BY', 'Death By', 'Add 1 rep each minute until you cannot complete within the minute', 'metcon', 'Skull', 8,
'{
  "fields": [
    {"key": "movement", "label": "Movimiento", "type": "text", "placeholder": "Burpees", "required": true},
    {"key": "startingReps", "label": "Reps Iniciales", "type": "number", "placeholder": "1", "default": 1},
    {"key": "increment", "label": "Incremento por Minuto", "type": "number", "placeholder": "1", "default": 1}
  ]
}'::jsonb,
'{"startingReps": 1, "increment": 1}'::jsonb),

-- HIIT Methodologies
('TABATA', 'Tabata', '20 seconds work, 10 seconds rest - 8 rounds (4 minutes)', 'hiit', 'Activity', 9,
'{
  "fields": [
    {"key": "rounds", "label": "Número de Rondas", "type": "number", "placeholder": "8", "default": 8},
    {"key": "workSeconds", "label": "Trabajo (segundos)", "type": "number", "placeholder": "20", "default": 20},
    {"key": "restSeconds", "label": "Descanso (segundos)", "type": "number", "placeholder": "10", "default": 10},
    {"key": "movement", "label": "Movimiento", "type": "text", "placeholder": "Air Squats", "required": true}
  ]
}'::jsonb,
'{"rounds": 8, "workSeconds": 20, "restSeconds": 10}'::jsonb),

('LADDER', 'Ladder', 'Ascending or descending rep scheme', 'hiit', 'TrendingUp', 10,
'{
  "fields": [
    {"key": "direction", "label": "Dirección", "type": "select", "options": ["ascending", "descending", "pyramid"], "default": "ascending"},
    {"key": "startReps", "label": "Reps Iniciales", "type": "number", "placeholder": "1", "required": true},
    {"key": "endReps", "label": "Reps Finales", "type": "number", "placeholder": "10", "required": true},
    {"key": "increment", "label": "Incremento", "type": "number", "placeholder": "1", "default": 1},
    {"key": "movements", "label": "Movimientos", "type": "movements_list", "required": true}
  ]
}'::jsonb,
'{"direction": "ascending", "startReps": 1, "endReps": 10, "increment": 1, "movements": []}'::jsonb),

('INTERVALS', 'Intervalos', 'Work and rest intervals with custom timing', 'hiit', 'Clock', 11,
'{
  "fields": [
    {"key": "rounds", "label": "Número de Intervalos", "type": "number", "placeholder": "5", "required": true},
    {"key": "workTime", "label": "Tiempo de Trabajo", "type": "text", "placeholder": "2:00", "required": true},
    {"key": "restTime", "label": "Tiempo de Descanso", "type": "text", "placeholder": "1:00", "required": true},
    {"key": "movements", "label": "Movimientos", "type": "movements_list", "required": true}
  ]
}'::jsonb,
'{"rounds": 5, "movements": []}'::jsonb),

-- STRENGTH Methodologies
('STANDARD', 'Series x Reps', 'Traditional strength training: Sets × Reps', 'strength', 'Dumbbell', 12,
'{
  "fields": [
    {"key": "sets", "label": "Series", "type": "number", "placeholder": "5", "required": true},
    {"key": "reps", "label": "Repeticiones", "type": "text", "placeholder": "5", "required": true},
    {"key": "percentage", "label": "% del 1RM", "type": "text", "placeholder": "75%"},
    {"key": "rest", "label": "Descanso", "type": "text", "placeholder": "2:00"},
    {"key": "tempo", "label": "Tempo", "type": "text", "placeholder": "31X1"}
  ]
}'::jsonb,
'{"sets": 3, "reps": "10"}'::jsonb),

('CLUSTER', 'Cluster Sets', 'Short intra-set rest periods for more total volume', 'strength', 'Puzzle', 13,
'{
  "fields": [
    {"key": "sets", "label": "Clusters", "type": "number", "placeholder": "4", "required": true},
    {"key": "repsPerCluster", "label": "Reps por Mini-Set", "type": "text", "placeholder": "2+2+2", "required": true},
    {"key": "intraRest", "label": "Descanso Intra-Set", "type": "text", "placeholder": "15-20s", "required": true},
    {"key": "interRest", "label": "Descanso Entre Sets", "type": "text", "placeholder": "2-3min"},
    {"key": "percentage", "label": "% del 1RM", "type": "text", "placeholder": "85-90%"}
  ]
}'::jsonb,
'{"sets": 4, "repsPerCluster": "2+2+2", "intraRest": "15s"}'::jsonb),

('DROP_SET', 'Drop Sets', 'Reduce weight after each set without rest', 'strength', 'TrendingDown', 14,
'{
  "fields": [
    {"key": "drops", "label": "Número de Drops", "type": "number", "placeholder": "3", "required": true},
    {"key": "repsPerDrop", "label": "Reps por Drop", "type": "text", "placeholder": "8-10", "required": true},
    {"key": "weightReduction", "label": "Reducción de Peso", "type": "text", "placeholder": "10-20%", "required": true}
  ]
}'::jsonb,
'{"drops": 3, "repsPerDrop": "8-10", "weightReduction": "15%"}'::jsonb),

('GIANT_SET', 'Giant Set', '3+ exercises performed back-to-back without rest', 'strength', 'Layers', 15,
'{
  "fields": [
    {"key": "rounds", "label": "Rondas del Giant Set", "type": "number", "placeholder": "3", "required": true},
    {"key": "restBetweenRounds", "label": "Descanso Entre Rondas", "type": "text", "placeholder": "2:00"},
    {"key": "movements", "label": "Ejercicios (3+ sin descanso)", "type": "movements_list", "required": true}
  ]
}'::jsonb,
'{"rounds": 3, "restBetweenRounds": "2:00", "movements": []}'::jsonb),

('SUPER_SET', 'Super Set', 'Two exercises performed back-to-back', 'strength', 'Repeat2', 16,
'{
  "fields": [
    {"key": "sets", "label": "Series", "type": "number", "placeholder": "4", "required": true},
    {"key": "restBetweenSets", "label": "Descanso Entre Sets", "type": "text", "placeholder": "90s"},
    {"key": "movement1", "label": "Ejercicio A", "type": "text", "placeholder": "3x10 Bench Press", "required": true},
    {"key": "movement2", "label": "Ejercicio B", "type": "text", "placeholder": "3x10 Bent Over Rows", "required": true}
  ]
}'::jsonb,
'{"sets": 4, "restBetweenSets": "90s"}'::jsonb),

-- CONDITIONING
('NOT_FOR_TIME', 'Not For Time', 'Quality-focused work without time pressure', 'conditioning', 'Heart', 17,
'{
  "fields": [
    {"key": "movements", "label": "Movimientos", "type": "movements_list", "required": true},
    {"key": "notes", "label": "Instrucciones de Calidad", "type": "text", "placeholder": "Focus on form, controlled tempo"}
  ]
}'::jsonb,
'{"movements": []}'::jsonb),

('TEMPO', 'Tempo Work', 'Controlled tempo training for time under tension', 'conditioning', 'Timer', 18,
'{
  "fields": [
    {"key": "sets", "label": "Series", "type": "number", "placeholder": "3", "required": true},
    {"key": "reps", "label": "Repeticiones", "type": "text", "placeholder": "8-10", "required": true},
    {"key": "tempo", "label": "Tempo (EXCE)", "type": "text", "placeholder": "3111", "required": true, "help": "E=Eccentric, X=Bottom, C=Concentric, E=Top"},
    {"key": "rest", "label": "Descanso", "type": "text", "placeholder": "60-90s"}
  ]
}'::jsonb,
'{"sets": 3, "reps": "10", "tempo": "3111"}'::jsonb)

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    form_config = EXCLUDED.form_config,
    default_values = EXCLUDED.default_values,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();
