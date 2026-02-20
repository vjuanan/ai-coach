import fs from 'fs';
import path from 'path';

const content = fs.readFileSync('scripts/generate_antopanti_program.ts', 'utf8');

// Regex to remove anything resembling "Cue: ..." or "(Cue: ...)" or " - Cue: ..."
let cleaned = content;

// Remove "(Cue: ...)" inside strings
cleaned = cleaned.replace(/\s*\(Cue:[^)]+\)/g, '');

// Remove "Cue: ..." inside strings when it's just part of notes
cleaned = cleaned.replace(/,\s*notes:\s*["'`](?:Superserie [A-Z]\.\s*)?Cue:[^"'`]*["'`]/g, '');

// Handle cases where notes had both instructions and Cue (e.g. "Superserie A. Cue: ...")
cleaned = cleaned.replace(/notes:\s*["'`]([^"'`]+)Cue:[^"'`]*["'`]/g, "notes: \"$1\".trim()");

// Let's rewrite `notes: "Superserie A. Cue: ..."` to just `notes: "Superserie A."`
cleaned = cleaned.replace(/notes:\s*["']Superserie A\. Cue:[^"']*["']/g, "notes: \"Superserie A.\"");
cleaned = cleaned.replace(/notes:\s*["']Superserie B\. Cue:[^"']*["']/g, "notes: \"Superserie B.\"");

// Also remove standalone `Cue: ...` in strings
cleaned = cleaned.replace(/Cue:\s*[^"'`]*/g, '');

// Let's just be aggressive on notes: "Cue: ..."
cleaned = cleaned.replace(/notes:\s*["'`].*?Cue:.*?["'`]/g, function (match) {
    if (match.includes("Superserie A")) return 'notes: "Superserie A."';
    if (match.includes("Superserie B")) return 'notes: "Superserie B."';
    if (match.includes("Intento")) return 'notes: "Intento de pull up estricta."';
    return ''; // Remove notes entirely
});

// Remove trailing commas left by removing notes:
cleaned = cleaned.replace(/,\s*\n\s*}/g, '\n}');

// For the `ACTIVATION_*` arrays:
// "Plancha: 30” (Cue: abdomen duro...)" -> "Plancha: 30”"
cleaned = cleaned.replace(/([”"a-zA-Z0-9]+)\s*\(Cue:[^)]+\)/g, '$1');

// Write the file
fs.writeFileSync('scripts/generate_antopanti_program_clean.ts', cleaned);
console.log('Cleaned file created.');
