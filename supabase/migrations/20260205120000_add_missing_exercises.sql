-- Add missing exercises in Spanish to the library
-- Based on user request for "Correr, Nadar, Assault Bike, Trineo, SKY (SkiErg)" and expansion

INSERT INTO exercises (name, category, subcategory, modality_suitability, equipment, description) VALUES

-- ============================================
-- MONOSTRUCTURAL (Cardio/Endurance)
-- ============================================
('Correr', 'Monostructural', 'Running', ARRAY['good_for_amrap', 'good_for_chipper', 'good_for_warmup'], ARRAY[]::TEXT[], 'Carrera de media o larga distancia'),
('Nadar', 'Monostructural', 'Swimming', ARRAY['good_for_chipper', 'good_for_aerobic'], ARRAY['Pool'], 'Estilo libre u otros'),
('Remo', 'Monostructural', 'Machine', ARRAY['good_for_emom', 'good_for_amrap', 'good_for_chipper'], ARRAY['Rower'], 'Remo en ergómetro Concept2'),
('SkiErg', 'Monostructural', 'Machine', ARRAY['good_for_emom', 'good_for_amrap', 'good_for_chipper'], ARRAY['SkiErg'], 'Ergómetro de esquí'),
('Assault Bike', 'Monostructural', 'Machine', ARRAY['good_for_emom', 'good_for_amrap', 'good_for_tabata'], ARRAY['Assault Bike'], 'Bicicleta de aire de alta intensidad'),
('BikeErg', 'Monostructural', 'Machine', ARRAY['good_for_emom', 'good_for_amrap', 'good_for_endurance'], ARRAY['BikeErg'], 'Bicicleta ergométrica Concept2'),
('Dobles de Soga', 'Monostructural', 'Jump Rope', ARRAY['good_for_emom', 'good_for_amrap', 'good_for_chipper'], ARRAY['Jump Rope'], 'Saltos dobles de comba (Double Unders)'),
('Simples de Soga', 'Monostructural', 'Jump Rope', ARRAY['good_for_emom', 'good_for_amrap', 'good_for_warmup'], ARRAY['Jump Rope'], 'Saltos simples de comba (Single Unders)'),
('Caminata (Run)', 'Monostructural', 'Running', ARRAY['good_for_warmup', 'good_for_recovery'], ARRAY[]::TEXT[], 'Caminata a paso ligero'),

-- ============================================
-- WEIGHTLIFTING / STRENGTH / STRONGMAN
-- ============================================
('Trineo: Empuje', 'Functional Bodybuilding', 'Conditioning', ARRAY['good_for_chipper', 'good_for_accessory', 'good_for_amrap'], ARRAY['Sled'], 'Empuje de trineo (Sled Push)'),
('Trineo: Arrastre', 'Functional Bodybuilding', 'Conditioning', ARRAY['good_for_chipper', 'good_for_accessory'], ARRAY['Sled', 'Rope'], 'Arrastre de trineo (Sled Pull)'),
('Farmers Carry', 'Functional Bodybuilding', 'Carry', ARRAY['good_for_chipper', 'good_for_accessory'], ARRAY['Dumbbells', 'Kettlebells'], 'Caminata con carga en ambas manos'),
('Sandbag Carry', 'Functional Bodybuilding', 'Carry', ARRAY['good_for_chipper', 'good_for_amrap'], ARRAY['Sandbag'], 'Caminata cargando saco de arena'),
('Yoke Carry', 'Weightlifting', 'Strongman', ARRAY['strength_only', 'good_for_chipper'], ARRAY['Yoke'], 'Caminata con Yugo'),

-- ============================================
-- GYMNASTICS
-- ============================================
('Trepar la Soga', 'Gymnastics', 'Climbing', ARRAY['good_for_chipper', 'good_for_amrap'], ARRAY['Rope'], 'Subir la soga (Rope Climb)'),
('Caminata de Manos', 'Gymnastics', 'Balance', ARRAY['good_for_chipper', 'good_for_amrap'], ARRAY[]::TEXT[], 'Caminar sobre las manos (Handstand Walk)'),
('Wall Walk', 'Gymnastics', 'Core', ARRAY['good_for_emom', 'good_for_amrap'], ARRAY['Wall'], 'Caminata hacia la pared en posición de pino')

ON CONFLICT (name) DO NOTHING;
