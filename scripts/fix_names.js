import fs from 'fs';
import path from 'path';

let content = fs.readFileSync('scripts/generate_antopanti_program_clean.ts', 'utf8');

// Replace Program Name
content = content.replace(/Rutina Antopanti 2026 FINAL/g, 'Rutina Antopanti SUPREMA');

// Replace Exercise Names exactly inside quotes to match DB names
const dictionary = {
    'Plancha Frontal': 'Plank',
    'Plancha': 'Plank',
    'Puente de Glúteo': 'Glute Bridge',
    'Bird-Dog': 'Bird Dog',
    'Sentadilla Aire': 'Air Squat',
    'Hip Thrust con Barra': 'Hip Thrust',
    'Peso Muerto Convencional': 'Deadlift',
    'Sentadilla Búlgara': 'Bulgarian Split Squat',
    'Curl Femoral Mancuerna': 'Leg Curl',
    'Abducciones en Máquina': 'Abduction Machine',
    'Flexiones Escapulares': 'Scapular Push-Up',
    'Gato-Vaca': 'Cat-Cow',
    'Colgarse de Barra': 'Dead Hang',
    'Negative Pull-Ups': 'Negative Pull-Up',
    'Pull-Up intento': 'Pull-Up',
    'Buenos Días': 'Good Morning',
    'Press de Banca Plano': 'Bench Press',
    'Remo Unilateral con Mancuerna': 'Dumbbell Row',
    'Tríceps Trasnuca con Mancuerna': 'Tricep Overhead Extension',
    'Vuelos Laterales': 'Lateral Raises',
    'Zancada con Rotación': 'Lunge with Rotation',
    'Y-T-W': 'Prone Y-T-W',
    'Sentadilla Trasera con Barra': 'Back Squat',
    'Push-Ups': 'Push-Up',
    'Vuelos Posteriores': 'Rear Delt Fly',
    'Step-Up Lateral': 'Box Step-Up',
    'Patada de Glúteo en Polea': 'Cable Glute Kickback',
    'Sprawls': 'Sprawl',
    'Sentadilla con Salto': 'Jump Squat',
    'Jumping Jacks': 'Jumping Jack',
    'Farmers Carry': 'Farmer Carry',
    'Knees to Chest': 'Knees to Chest', // Check DB for this one: 'Knees to Chest' exists
};

// Also we need to make sure weights are strings or numbers. 
// "weight: htWeight" where htWeight is number. Actually the frontend allows strings or numbers for weight. 
// But the UI says "Intensidad incompleta" for strength_linear blocks?
// The problem might be that the exercise name itself wasn't matching, so it considered the whole block "Datos incompletos". Let's fix names first.

Object.keys(dictionary).forEach(key => {
    const val = dictionary[key];
    content = content.replace(new RegExp(`name:\\s*['"\`]${key}['"\`]`, 'g'), `name: '${val}'`);
    content = content.replace(new RegExp(`'${key}':`, 'g'), `'${val}':`);
});

// Write it back
fs.writeFileSync('scripts/generate_antopanti_program_clean.ts', content);
console.log('Script updated with exact names.');
