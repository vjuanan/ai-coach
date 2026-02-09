-- Add tracking_parameters column to exercises table
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS tracking_parameters JSONB DEFAULT '{}';

-- Update existing monostructural exercises to have distance tracking
UPDATE exercises 
SET tracking_parameters = '{"distance": true}'
WHERE name IN (
    'Correr', 
    'Nadar', 
    'Remo', 
    'SkiErg', 
    'Assault Bike', 
    'BikeErg', 
    'Caminata (Run)',
    'Trineo: Empuje',
    'Trineo: Arrastre',
    'Farmers Carry',
    'Sandbag Carry',
    'Yoke Carry',
    'Caminata de Manos'
);
