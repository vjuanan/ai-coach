
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

export function convertConfigToText(type: string, config: any, blockName?: string | null, oneRmStats?: any, excludeNotes: boolean = false): string[] {
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
            if (typeof m === 'string') return m;
            if (typeof m === 'object' && m && 'name' in m) return m.name;
            return '';
        }).filter(Boolean);

        if (config.notes && !excludeNotes) lines.push(config.notes);
        return lines;
    }

    if (config.content) {
        return config.content.split('\n');
    }

    return !excludeNotes ? [config.notes || ''] : [];
}

export function configToStructure(type: string, config: any, blockName?: string | null, oneRmStats?: any, excludeNotes: boolean = false) {
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
    const existingLines = convertConfigToText(type, config, blockName, oneRmStats, excludeNotes);
    if (existingLines.length > 0) {
        res.text = existingLines.join('\n');
    }

    return res;
}

// ==========================================
// MAIN TRANSFORMATION FUNCTION
// ==========================================

export function prepareProgramForExport(program: any) {
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
                blocks: (d.blocks || []).map((b: any) => ({
                    type: b.type,
                    name: b.name || b.type,
                    content: convertConfigToText(b.type, b.config, b.name, oneRmStats, true),
                    structure: configToStructure(b.type, b.config, b.name, oneRmStats, true),
                    section: b.section || 'main',
                    cue: (b.config as any)?.notes || '',
                    format: (b.config as any)?.format || (b.config as any)?.methodology || null,
                    rest: (b.config as any)?.rest || null,
                }))
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

    // 3. Monthly Strategy (Simplified for export)
    // We try to extract progressions from the first mesocycle or aggregated
    const monthlyStrategy = {
        focus: programAttributes.global_focus || sortedMesos[0]?.focus || program.name,
        progressions: [], // TODO: If advanced progression extraction is needed, copy logic from MesocycleEditor
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
