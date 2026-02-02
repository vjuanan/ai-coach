-- CV-OS Exercise Library Seed Data
-- 50+ Core CrossFit Movements

INSERT INTO exercises (name, category, subcategory, modality_suitability, equipment, description) VALUES

-- ============================================
-- MONOSTRUCTURAL (Cardio)
-- ============================================
('Row', 'Monostructural', 'Machine', ARRAY['good_for_emom', 'good_for_amrap', 'good_for_chipper'], ARRAY['Rower'], 'Rowing on the Concept2 erg'),
('Ski Erg', 'Monostructural', 'Machine', ARRAY['good_for_emom', 'good_for_amrap', 'good_for_chipper'], ARRAY['Ski Erg'], 'Ski ergometer for upper body cardio'),
('Bike (Assault)', 'Monostructural', 'Machine', ARRAY['good_for_emom', 'good_for_amrap', 'good_for_tabata'], ARRAY['Assault Bike'], 'Full body assault bike cardio'),
('Bike (Echo)', 'Monostructural', 'Machine', ARRAY['good_for_emom', 'good_for_amrap', 'good_for_tabata'], ARRAY['Echo Bike'], 'Full body echo bike cardio'),
('Run', 'Monostructural', 'Running', ARRAY['good_for_amrap', 'good_for_chipper'], ARRAY[]::TEXT[], 'Running - outdoor or treadmill'),
('Double Unders', 'Monostructural', 'Jump Rope', ARRAY['good_for_emom', 'good_for_amrap', 'good_for_chipper'], ARRAY['Jump Rope'], 'Double under jump rope'),
('Single Unders', 'Monostructural', 'Jump Rope', ARRAY['good_for_emom', 'good_for_amrap', 'good_for_warmup'], ARRAY['Jump Rope'], 'Single under jump rope'),
('Box Jump', 'Monostructural', 'Plyometric', ARRAY['good_for_emom', 'good_for_amrap', 'good_for_chipper'], ARRAY['Box'], 'Explosive jump onto box'),
('Box Jump Over', 'Monostructural', 'Plyometric', ARRAY['good_for_emom', 'good_for_amrap'], ARRAY['Box'], 'Jump over box (rebound or step down)'),
('Burpee', 'Monostructural', 'Bodyweight', ARRAY['good_for_emom', 'good_for_amrap', 'good_for_tabata', 'good_for_chipper'], ARRAY[]::TEXT[], 'Standard burpee movement'),
('Burpee Box Jump Over', 'Monostructural', 'Compound', ARRAY['good_for_amrap', 'good_for_chipper'], ARRAY['Box'], 'Burpee + box jump over combination'),

-- ============================================
-- GYMNASTICS
-- ============================================
('Pull-up (Strict)', 'Gymnastics', 'Pulling', ARRAY['strength_only', 'good_for_emom'], ARRAY['Pull-up Bar'], 'Strict dead hang pull-up'),
('Pull-up (Kipping)', 'Gymnastics', 'Pulling', ARRAY['good_for_emom', 'good_for_amrap', 'good_for_chipper'], ARRAY['Pull-up Bar'], 'Kipping pull-up for high volume'),
('Pull-up (Butterfly)', 'Gymnastics', 'Pulling', ARRAY['good_for_amrap', 'good_for_chipper'], ARRAY['Pull-up Bar'], 'Butterfly pull-up for maximum speed'),
('Chest-to-Bar Pull-up', 'Gymnastics', 'Pulling', ARRAY['good_for_emom', 'good_for_amrap'], ARRAY['Pull-up Bar'], 'Pull-up with chest touching bar'),
('Toes-to-Bar', 'Gymnastics', 'Core', ARRAY['good_for_emom', 'good_for_amrap', 'good_for_chipper'], ARRAY['Pull-up Bar'], 'Hanging toes to bar movement'),
('Knees-to-Elbow', 'Gymnastics', 'Core', ARRAY['good_for_emom', 'good_for_amrap'], ARRAY['Pull-up Bar'], 'Hanging knees to elbow'),
('Muscle-up (Bar)', 'Gymnastics', 'Compound', ARRAY['good_for_emom', 'strength_only'], ARRAY['Pull-up Bar'], 'Bar muscle-up'),
('Muscle-up (Ring)', 'Gymnastics', 'Compound', ARRAY['good_for_emom', 'strength_only'], ARRAY['Rings'], 'Ring muscle-up'),
('Ring Dip', 'Gymnastics', 'Pushing', ARRAY['good_for_emom', 'strength_only'], ARRAY['Rings'], 'Dip on gymnastics rings'),
('Ring Row', 'Gymnastics', 'Pulling', ARRAY['good_for_emom', 'good_for_warmup'], ARRAY['Rings'], 'Inverted row on rings'),
('Handstand Push-up (Strict)', 'Gymnastics', 'Pushing', ARRAY['strength_only', 'good_for_emom'], ARRAY['Wall'], 'Strict HSPU against wall'),
('Handstand Push-up (Kipping)', 'Gymnastics', 'Pushing', ARRAY['good_for_emom', 'good_for_amrap'], ARRAY['Wall'], 'Kipping HSPU for volume'),
('Handstand Walk', 'Gymnastics', 'Balance', ARRAY['good_for_chipper'], ARRAY[]::TEXT[], 'Freestanding handstand walking'),
('Rope Climb', 'Gymnastics', 'Climbing', ARRAY['good_for_chipper', 'good_for_amrap'], ARRAY['Rope'], 'Legless or with legs rope climb'),
('Pistol Squat', 'Gymnastics', 'Legs', ARRAY['good_for_emom', 'good_for_amrap'], ARRAY[]::TEXT[], 'Single leg squat'),
('Air Squat', 'Gymnastics', 'Legs', ARRAY['good_for_emom', 'good_for_amrap', 'good_for_warmup', 'good_for_tabata'], ARRAY[]::TEXT[], 'Bodyweight squat'),
('Push-up', 'Gymnastics', 'Pushing', ARRAY['good_for_emom', 'good_for_amrap', 'good_for_warmup'], ARRAY[]::TEXT[], 'Standard push-up'),
('Sit-up', 'Gymnastics', 'Core', ARRAY['good_for_amrap', 'good_for_warmup'], ARRAY['Ab Mat'], 'Ab mat sit-up'),
('GHD Sit-up', 'Gymnastics', 'Core', ARRAY['good_for_emom'], ARRAY['GHD'], 'Glute ham developer sit-up'),
('V-up', 'Gymnastics', 'Core', ARRAY['good_for_emom', 'good_for_amrap'], ARRAY[]::TEXT[], 'V-up core exercise'),
('Hollow Hold', 'Gymnastics', 'Core', ARRAY['good_for_warmup', 'isometric'], ARRAY[]::TEXT[], 'Hollow body hold position'),
('L-Sit', 'Gymnastics', 'Core', ARRAY['isometric', 'strength_only'], ARRAY['Parallettes'], 'L-sit hold'),
('Dip (Parallel Bar)', 'Gymnastics', 'Pushing', ARRAY['good_for_emom', 'strength_only'], ARRAY['Dip Station'], 'Parallel bar dip'),

-- ============================================
-- WEIGHTLIFTING
-- ============================================
('Snatch', 'Weightlifting', 'Olympic', ARRAY['strength_only', 'good_for_emom'], ARRAY['Barbell'], 'Full squat snatch'),
('Power Snatch', 'Weightlifting', 'Olympic', ARRAY['good_for_emom', 'good_for_amrap'], ARRAY['Barbell'], 'Power snatch (no squat)'),
('Hang Snatch', 'Weightlifting', 'Olympic', ARRAY['good_for_emom'], ARRAY['Barbell'], 'Snatch from hang position'),
('Clean', 'Weightlifting', 'Olympic', ARRAY['strength_only', 'good_for_emom'], ARRAY['Barbell'], 'Full squat clean'),
('Power Clean', 'Weightlifting', 'Olympic', ARRAY['good_for_emom', 'good_for_amrap'], ARRAY['Barbell'], 'Power clean (no squat)'),
('Hang Clean', 'Weightlifting', 'Olympic', ARRAY['good_for_emom'], ARRAY['Barbell'], 'Clean from hang position'),
('Clean & Jerk', 'Weightlifting', 'Olympic', ARRAY['strength_only'], ARRAY['Barbell'], 'Full clean and jerk complex'),
('Jerk', 'Weightlifting', 'Olympic', ARRAY['strength_only', 'good_for_emom'], ARRAY['Barbell'], 'Split or push jerk'),
('Push Jerk', 'Weightlifting', 'Olympic', ARRAY['good_for_emom'], ARRAY['Barbell'], 'Push jerk overhead'),
('Back Squat', 'Weightlifting', 'Squat', ARRAY['strength_only'], ARRAY['Barbell', 'Squat Rack'], 'Barbell back squat'),
('Front Squat', 'Weightlifting', 'Squat', ARRAY['strength_only', 'good_for_emom'], ARRAY['Barbell', 'Squat Rack'], 'Barbell front squat'),
('Overhead Squat', 'Weightlifting', 'Squat', ARRAY['strength_only', 'good_for_emom'], ARRAY['Barbell'], 'Overhead squat'),
('Deadlift', 'Weightlifting', 'Hinge', ARRAY['strength_only'], ARRAY['Barbell'], 'Conventional deadlift'),
('Sumo Deadlift', 'Weightlifting', 'Hinge', ARRAY['strength_only'], ARRAY['Barbell'], 'Sumo stance deadlift'),
('Romanian Deadlift', 'Weightlifting', 'Hinge', ARRAY['strength_only', 'good_for_accessory'], ARRAY['Barbell', 'Dumbbells'], 'RDL for hamstring development'),
('Thruster', 'Weightlifting', 'Compound', ARRAY['good_for_emom', 'good_for_amrap', 'good_for_chipper'], ARRAY['Barbell', 'Dumbbells'], 'Front squat to push press'),
('Cluster', 'Weightlifting', 'Compound', ARRAY['good_for_emom', 'good_for_amrap'], ARRAY['Barbell'], 'Clean + thruster complex'),
('Push Press', 'Weightlifting', 'Pressing', ARRAY['good_for_emom', 'good_for_amrap'], ARRAY['Barbell', 'Dumbbells', 'Kettlebell'], 'Push press overhead'),
('Strict Press', 'Weightlifting', 'Pressing', ARRAY['strength_only'], ARRAY['Barbell', 'Dumbbells'], 'Strict shoulder press'),
('Bench Press', 'Weightlifting', 'Pressing', ARRAY['strength_only'], ARRAY['Barbell', 'Bench'], 'Flat bench press'),
('Wall Ball', 'Weightlifting', 'Compound', ARRAY['good_for_emom', 'good_for_amrap', 'good_for_tabata', 'good_for_chipper'], ARRAY['Medicine Ball', 'Wall'], 'Wall ball shot'),
('Kettlebell Swing', 'Weightlifting', 'Hinge', ARRAY['good_for_emom', 'good_for_amrap', 'good_for_tabata'], ARRAY['Kettlebell'], 'Russian or American KB swing'),
('Dumbbell Snatch', 'Weightlifting', 'Olympic', ARRAY['good_for_emom', 'good_for_amrap'], ARRAY['Dumbbell'], 'Single arm dumbbell snatch'),
('Turkish Get-up', 'Weightlifting', 'Compound', ARRAY['strength_only', 'good_for_warmup'], ARRAY['Kettlebell', 'Dumbbell'], 'Turkish get-up movement'),

-- ============================================
-- FUNCTIONAL BODYBUILDING
-- ============================================
('Bent Over Row', 'Functional Bodybuilding', 'Pulling', ARRAY['good_for_accessory', 'strength_only'], ARRAY['Barbell', 'Dumbbells'], 'Bent over row for back development'),
('Dumbbell Row', 'Functional Bodybuilding', 'Pulling', ARRAY['good_for_accessory'], ARRAY['Dumbbell', 'Bench'], 'Single arm dumbbell row'),
('Lat Pulldown', 'Functional Bodybuilding', 'Pulling', ARRAY['good_for_accessory'], ARRAY['Cable Machine'], 'Lat pulldown machine'),
('Face Pull', 'Functional Bodybuilding', 'Pulling', ARRAY['good_for_accessory', 'good_for_warmup'], ARRAY['Cable Machine', 'Bands'], 'Face pull for rear delts'),
('Hip Thrust', 'Functional Bodybuilding', 'Glutes', ARRAY['good_for_accessory', 'strength_only'], ARRAY['Barbell', 'Bench'], 'Barbell hip thrust'),
('Good Morning', 'Functional Bodybuilding', 'Hinge', ARRAY['good_for_accessory', 'good_for_warmup'], ARRAY['Barbell'], 'Good morning for posterior chain'),
('Lunges', 'Functional Bodybuilding', 'Legs', ARRAY['good_for_accessory', 'good_for_amrap'], ARRAY['Barbell', 'Dumbbells'], 'Walking or stationary lunges'),
('Step-up', 'Functional Bodybuilding', 'Legs', ARRAY['good_for_accessory', 'good_for_amrap'], ARRAY['Box', 'Dumbbells'], 'Weighted step-ups'),
('Bulgarian Split Squat', 'Functional Bodybuilding', 'Legs', ARRAY['good_for_accessory', 'strength_only'], ARRAY['Dumbbells', 'Bench'], 'Rear foot elevated split squat'),
('Farmers Carry', 'Functional Bodybuilding', 'Carry', ARRAY['good_for_chipper', 'good_for_accessory'], ARRAY['Dumbbells', 'Kettlebells', 'Farmers Handles'], 'Loaded carry for grip and core'),
('Sled Push', 'Functional Bodybuilding', 'Conditioning', ARRAY['good_for_chipper', 'good_for_accessory'], ARRAY['Sled'], 'Sled push for leg drive'),
('Sled Pull', 'Functional Bodybuilding', 'Conditioning', ARRAY['good_for_chipper', 'good_for_accessory'], ARRAY['Sled', 'Rope'], 'Sled pull with rope or harness');
