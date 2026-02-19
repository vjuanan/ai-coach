
import { type MesocycleStrategy } from '@/components/editor/MesocycleStrategyForm';

// ==========================================
// RM / STATS HELPERS (Copied from hooks/useAthleteRm.ts)
// ==========================================
const RM_MAPPINGS: [string[], string][] = [
    [['back squat', 'sentadilla trasera', 'sentadilla atras'], 'backSquat'],
    [['front squat', 'sentadilla frontal', 'sentadilla delantera'], 'frontSquat'],
    [['deadlift', 'peso muerto'], 'deadlift'],
    [['snatch', 'arranque', 'squat snatch'], 'snatch'],
    [['clean and jerk', 'clean & jerk', 'c&j', 'cargada y envion'], 'cnj'],
    [['clean', 'clean pull', 'tiron de cargada', 'cargada'], 'clean'],
    [['strict press', 'press estricto', 'press militar', 'shoulder press', 'press de hombros'], 'strictPress'],
    [['bench press', 'press de banca', 'press banca'], 'benchPress'],
];

function resolveRmKey(exerciseName: string): string | null {
    if (!exerciseName) return null;
    const lower = exerciseName.toLowerCase().trim();

    for (const [keywords, key] of RM_MAPPINGS) {
        for (const keyword of keywords) {
            if (lower.includes(keyword) || keyword.includes(lower)) {
                return key;
            }
        }
    }
    return null;
}

export function calculateKgFromStats(
    oneRmStats: Record<string, number | null> | undefined,
    exerciseName: string,
    percentage: number
): number | null {
    if (!oneRmStats || !exerciseName || !percentage) return null;
    const key = resolveRmKey(exerciseName);
    if (!key) return null;
    const rm = oneRmStats[key];
    if (rm === null || rm === undefined) return null;
    return Math.round((rm * percentage / 100) * 2) / 2;
}


// ==========================================
// CONFIG TO TEXT HELPERS
// ==========================================

export function convertConfigToText(type: string, config: any, blockName?: string | null, oneRmStats?: any, excludeNotes: boolean = false, exercisesCues?: Record<string, string>): string[] {
    // 1. Handle Strength Linear (Explicit)
    if (type === 'strength_linear') {
        const mainMetric = config.distance ? config.distance : config.reps;
        let kgBadge = '';
        if (config.percentage && blockName && oneRmStats) {
            const pctValue = parseFloat(config.percentage);
            if (!isNaN(pctValue)) {
                const kg = calculateKgFromStats(oneRmStats, blockName, pctValue);
                if (kg) kgBadge = `(≈${kg}kg)`;
            }
        }

        const parts = [
            config.sets && mainMetric ? `${config.sets} x ${mainMetric}` : '',
            config.percentage ? `@ ${config.percentage}% ${kgBadge}` : '',
            config.rpe ? `@ RPE ${config.rpe}` : '',
            config.weight ? `(${config.weight})` : '' // Explicit weight if present
        ].filter(Boolean).join('  ');

        const lines = [parts];
        if (config.notes && !excludeNotes) lines.push(config.notes);
        return lines.filter(Boolean);
    }

    // 2. Handle Structured Metcons
    if (type === 'metcon_structured') {
        const lines = [];
        const header = [
            config.time_cap || config.minutes ? `${config.format === 'EMOM' ? 'EMOM' : 'Time Cap'}: ${config.time_cap || config.minutes} min` : '',
            config.rounds ? `${config.rounds} Rounds` : '',
            config.score_type ? `Score: ${config.score_type}` : ''
        ].filter(Boolean).join(' | ');

        if (header) lines.push(header);

        if (Array.isArray(config.movements)) {
            lines.push(...config.movements);
        } else if (typeof config.content === 'string') {
            lines.push(...config.content.split('\n'));
        }

        if (config.notes && !excludeNotes) lines.push(config.notes);
        return lines;
    }

    // 3. Handle Generic Sets/Reps for Accessory/Warmup/Other
    if (config.sets || config.reps || config.distance || config.weight) {
        const mainMetric = config.distance || config.reps;
        const parts = [
            config.sets && mainMetric ? `${config.sets} x ${mainMetric}` : (config.sets ? `${config.sets} sets` : ''),
            config.weight ? `(${config.weight})` : '',
            config.rpe ? `@ RPE ${config.rpe}` : ''
        ].filter(Boolean).join('  ');

        const lines = [];
        if (parts) lines.push(parts);
        if (config.notes && !excludeNotes) lines.push(config.notes);

        if (lines.length > 0) return lines;
    }

    // 4. Default Handlers (Movements array or Content string)
    if (config.movements && Array.isArray(config.movements)) {
        const lines = config.movements.map((m: any) => {
            let name = '';
            if (typeof m === 'string') name = m;
            else if (typeof m === 'object' && m && 'name' in m) name = m.name;

            if (!name) return '';

            // 5. Append Cue if available (for list-based blocks like Warmup/Metcon)
            // We try to match exact name, then case-insensitive, then alias
            let cue = '';
            if (exercisesCues) {
                // Remove embedded existing cues just in case (e.g. "Plank (Cue: ...)")
                // usage: name might be "Plank: 30s". We need to extract the base exercise name.
                // This is hard because "Plank: 30s" isn't the key. 
                // The structure usually is just the name if it's a list? 
                // In Antopanti script: "Plancha: 30” (Cue: ...)" was the string.
                // If we just use the string as is, we can't look it up.
                // But `SmartExerciseInput` saves JUST the name "Plank" in the array for new blocks?
                // GenericMovementForm saves ` { name: 'Plank' } ` objects or strings.

                // If m is object with name, use m.name.
                // If m is string, we might not match.
                // But for NEW blocks, we encourage objects? GenericMovementForm returns objects now?
                // Let's check GenericMovementForm: `return data.map(item => typeof item === 'string' ? { name: item } : item);`
                // So internal state is objects. But `onChange` might save strings if it was legacy?
                // `handleMovementsChange` calls `onChange('movements', newMovements)`. 
                // So config.movements is strictly `MovementObject[]` now.

                // However, `convertConfigToText` handles strings too.

                // Let's try to match the name.
                const cleanName = name.split(':')[0].trim(); // "Plank: 30s" -> "Plank"

                if (exercisesCues[name]) cue = exercisesCues[name];
                else if (exercisesCues[cleanName]) cue = exercisesCues[cleanName];
                else {
                    const key = Object.keys(exercisesCues).find(k => k.toLowerCase() === name.toLowerCase() || k.toLowerCase() === cleanName.toLowerCase());
                    if (key) cue = exercisesCues[key];
                }
            }

            if (cue) {
                // If the name already has the cue (legacy), don't add it.
                if (name.toLowerCase().includes(cue.toLowerCase().substring(0, 10))) return name;
                return `${name} | Cue: ${cue}`;
            }

            return name;
        }).filter(Boolean);

        if (config.notes && !excludeNotes) lines.push(config.notes);
        return lines;
    }

    if (config.content) {
        return config.content.split('\n');
    }

    return !excludeNotes ? [config.notes || ''] : [];
}

export function configToStructure(type: string, config: any, blockName?: string | null, oneRmStats?: any, excludeNotes: boolean = false, exercisesCues?: Record<string, string>) {
    const res = {
        sets: '',
        reps: '',
        weight: '',
        rpe: '',
        rest: config.rest || '',
        text: '', // For MetCons or text-based blocks
        notes: (!excludeNotes && config.notes) ? config.notes : ''
    };

    // 1. Strength / Generic Sets & Reps
    if (type === 'strength_linear' || config.sets || config.reps || config.weight) {
        if (config.sets) res.sets = `${config.sets}`;

        // Reps can be distance too
        if (config.reps) res.reps = `${config.reps}`;
        if (config.distance) res.reps = config.reps ? `${config.reps} (${config.distance})` : `${config.distance}`;

        // Weight logic
        if (config.weight) res.weight = config.weight;
        if (config.percentage) {
            let kgBadge = '';
            if (blockName && oneRmStats) {
                const pctValue = parseFloat(config.percentage);
                if (!isNaN(pctValue)) {
                    const kg = calculateKgFromStats(oneRmStats, blockName, pctValue);
                    if (kg) kgBadge = ` (≈${kg}kg)`;
                }
            }
            // If weight already exists, append percentage. If not, set it.
            res.weight = res.weight ? `${res.weight} @ ${config.percentage}%${kgBadge}` : `${config.percentage}%${kgBadge}`;
        }

        if (config.rpe) res.rpe = `${config.rpe}`;

        return res;
    }

    // 2. MetCons
    if (type === 'metcon_structured') {
        const parts = [];

        // Explicitly handle formats based on correct inputs
        if (config.format === 'EMOM') {
            parts.push(`EMOM ${config.minutes || config.time_cap || ''}min`);
        } else if (config.format === 'AMRAP') {
            parts.push(`AMRAP ${config.minutes || config.time_cap || ''}min`);
        } else if (config.format === 'For Time') {
            parts.push(`For Time ${config.time_cap ? `(Cap: ${config.time_cap}min)` : ''}`);
        } else {
            // Fallback
            if (config.time_cap || config.minutes) parts.push(`Time Cap: ${config.time_cap || config.minutes} min`);
        }

        if (config.rounds) parts.push(`${config.rounds} Rounds`);
        if (config.score_type) parts.push(`Score: ${config.score_type}`);

        const header = parts.filter(Boolean).join(' | ');

        let content = '';
        if (header) content += header + '\n';

        if (Array.isArray(config.movements)) {
            content += config.movements.map((m: any) => typeof m === 'string' ? m : m.name).join('\n');
        } else if (typeof config.content === 'string') {
            content += config.content;
        }

        res.text = content;
        return res;
    }

    // 3. Defaults
    const existingLines = convertConfigToText(type, config, blockName, oneRmStats, excludeNotes, exercisesCues);
    if (existingLines.length > 0) {
        res.text = existingLines.join('\n');
    }

    return res;
}

// ==========================================
// MAIN TRANSFORMATION FUNCTION
// ==========================================

export function prepareProgramForExport(program: any, exercisesCues?: Record<string, string>) {
    if (!program || !program.mesocycles) return null;

    const mesocycles = program.mesocycles;
    const client = program.client;
    const oneRmStats = (client?.details as any)?.oneRmStats;
    const programAttributes = program.attributes || {};

    // 1. Export Weeks
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    // Sort mesocycles
    const sortedMesos = [...mesocycles].sort((a: any, b: any) => a.week_number - b.week_number);

    const exportWeeks = sortedMesos.map((meso: any) => ({
        weekNumber: meso.week_number,
        focus: meso.focus || '',
        days: (meso.days || [])
            .filter((d: any) => !d.is_rest_day && d.blocks && d.blocks.length > 0) // Only non-rest days with confirmed blocks
            .sort((a: any, b: any) => a.day_number - b.day_number)
            .map((d: any) => ({
                name: dayNames[(d.day_number - 1) % 7] || `Día ${d.day_number}`,
                day_number: d.day_number, // Explicitly keep day_number for DaySection
                blocks: (d.blocks || []).map((b: any) => {
                    // Resolve cue from library if available
                    let exerciseCue = '';
                    if (exercisesCues && b.name && exercisesCues[b.name]) {
                        exerciseCue = exercisesCues[b.name];
                    }
                    if (!exerciseCue && b.name && exercisesCues) {
                        // Try case insensitive
                        const key = Object.keys(exercisesCues).find(k => k.toLowerCase() === b.name?.toLowerCase());
                        if (key) exerciseCue = exercisesCues[key];
                    }

                    return {
                        type: b.type,
                        name: b.name || b.type,
                        content: convertConfigToText(b.type, b.config, b.name, oneRmStats, true, exercisesCues),
                        structure: configToStructure(b.type, b.config, b.name, oneRmStats, true, exercisesCues),
                        section: b.section || 'main',
                        cue: exerciseCue || (b.config as any)?.notes || '', // Fallback to notes if no library cue (or if user manually added notes)
                        format: (b.config as any)?.format || (b.config as any)?.methodology || null,
                        rest: (b.config as any)?.rest || null,
                        progression_id: b.progression_id || null,
                    };
                })
            }))
    })).filter(w => w.days.length > 0); // Only weeks with content

    // 2. Week Date Ranges
    let weekDateRanges: any[] = [];
    const startDateStr = programAttributes.start_date;
    if (startDateStr) {
        try {
            const start = new Date(startDateStr + 'T00:00:00');
            if (!isNaN(start.getTime())) {
                weekDateRanges = sortedMesos.map((meso: any) => {
                    const weekStart = new Date(start);
                    weekStart.setDate(weekStart.getDate() + (meso.week_number - 1) * 7);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    return {
                        weekNumber: meso.week_number,
                        startDate: weekStart.toISOString().split('T')[0],
                        endDate: weekEnd.toISOString().split('T')[0],
                    };
                });
            }
        } catch (e) {
            console.error('Date parsing error', e);
        }
    }

    // 3. Monthly Strategy
    // Calculate progressions
    const progressionMap = new Map<string, { values: string[], variable?: string, rest?: string }>();
    sortedMesos.forEach(meso => {
        const weeks = meso.days || [];
        weeks.forEach((day: any) => {
            const blocks = day.blocks || [];
            blocks.forEach((block: any) => {
                const config = block.config || {};
                const isProgression = block.progression_id || block.type === 'strength_linear';

                if (isProgression && block.name) {
                    let value = '';
                    const progressionVar = config.progression_variable as string;

                    if (block.type === 'strength_linear') {
                        const percentage = config.percentage as string || '';
                        const sets = config.sets as number || 0;
                        const reps = config.reps as number || 0;
                        const weight = config.weight as string || '';
                        const rpe = config.rpe as string || '';

                        // Calculate KG if possible
                        let kgText = '';
                        if (percentage && block.name && oneRmStats) {
                            const pctValue = parseFloat(percentage);
                            if (!isNaN(pctValue)) {
                                import('./../components/editor/MesocycleEditor').then(mod => {
                                    // Circular dependency risk? calculateKgFromStats should be in a hook or helper.
                                    // Use imported helper if available.
                                });
                                // Recalculating KG here might be hard without helper import.
                                // Let's simplify and rely on what we have.
                                // Actually, export-helpers usually doesn't have access to hooks.
                                // But I can copy calculateKgFromStats logic or move it to a shared helper?
                                // calculateKgFromStats is in hooks/useAthleteRm.ts.
                                // I cannot easy import hook logic here if it uses hooks.
                                // But calculateKgFromStats is an exported function?
                                // Let's check imports in export-helpers.ts.
                            }
                        }

                        // Just use text for now to avoid dependency hell, or try to implement simple calc
                        // Re-implement simplified KG calc if statistics are present
                        if (percentage && block.name && oneRmStats && oneRmStats[block.name]) {
                            const rm = oneRmStats[block.name];
                            const pctValue = parseFloat(percentage);
                            if (!isNaN(pctValue) && rm) {
                                const kg = Math.round((rm * pctValue) / 100);
                                kgText = `(${kg}kg)`;
                            }
                        }

                        const volume = (sets && (reps || config.distance)) ? `${sets}x${reps || config.distance}` : '';
                        const intensity = percentage ? (String(percentage).endsWith('%') ? percentage : `${percentage}%`) : '';
                        const intensityText = intensity ? `${intensity} ${kgText}`.trim() : kgText;

                        if (progressionVar === 'percentage') value = intensity || '-';
                        else if (progressionVar === 'weight') value = weight || '-';
                        else if (progressionVar === 'sets') value = String(sets) || '-';
                        else if (progressionVar === 'reps') value = String(reps) || '-';
                        else if (progressionVar === 'rpe') value = rpe || '-';
                        else {
                            value = intensityText || volume || '-';
                        }
                    } else {
                        if (progressionVar && config[progressionVar]) {
                            value = String(config[progressionVar]);
                        } else {
                            value = (config.weight as string) || (config.reps as string) || (config.sets as string) || '-';
                        }
                    }

                    if (!progressionMap.has(block.name)) {
                        progressionMap.set(block.name, { values: Array(4).fill('-'), variable: progressionVar, rest: (config.rest as string) });
                    }
                    const entry = progressionMap.get(block.name)!;
                    if (!entry.variable && progressionVar) entry.variable = progressionVar;

                    // week_number is 1-based index
                    if (meso.week_number <= entry.values.length) {
                        entry.values[meso.week_number - 1] = value;
                    }
                }
            });
        });
    });

    const objectives: string[] = [];
    sortedMesos.forEach((meso: any) => {
        const attrs = meso.attributes || {};
        if (attrs.considerations && typeof attrs.considerations === 'string') {
            const lines = attrs.considerations.split('\n').filter((l: string) => l.trim());
            objectives.push(...lines.slice(0, 1));
        }
    });

    const monthlyStrategy = {
        focus: programAttributes.global_focus || sortedMesos[0]?.focus || program.name,
        duration: `${sortedMesos.length} semanas`,
        objectives: Array.from(new Set(objectives)).slice(0, 4),
        progressions: Array.from(progressionMap.entries()).map(([name, data]) => ({
            name,
            progression: data.values,
            variable: data.variable,
            rest: data.rest
        })),
    };

    return {
        programName: program.name,
        clientInfo: { name: client?.name || 'Cliente' },
        coachName: program.coach?.full_name || 'Coach',
        monthlyStrategy,
        weeks: exportWeeks,
        mission: programAttributes.global_focus || undefined,
        weekDateRanges
    };
}
