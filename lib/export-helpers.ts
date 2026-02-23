
import { type MesocycleStrategy } from '@/components/editor/MesocycleStrategyForm';
import { normalizeMethodologyCode } from '@/lib/training-methodologies';

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

type ExportMetric = { label: string; value: string };

function parseClockValue(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed.includes(':')) return null;
    const [minRaw, secRaw] = trimmed.split(':');
    const minutes = Number.parseInt(minRaw || '', 10);
    const seconds = Number.parseInt(secRaw || '', 10);
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
    return (minutes * 60) + seconds;
}

function toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'string') return null;
    const fromClock = parseClockValue(value);
    if (fromClock !== null) return fromClock;
    const normalized = value.replace(/[^0-9.-]/g, '');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}

function pushMetric(metrics: ExportMetric[], label: string, raw: unknown, unit?: string, decimals = 0) {
    const numeric = toNumber(raw);
    if (numeric === null) return;
    const value = decimals > 0 ? numeric.toFixed(decimals) : `${Math.round(numeric * (decimals ? 10 ** decimals : 1)) / (decimals ? 10 ** decimals : 1)}`;
    metrics.push({ label, value: unit ? `${value} ${unit}` : value });
}

function inferFormatCode(type: string, config: any): string {
    if (type === 'strength_linear') return 'STANDARD';
    return normalizeMethodologyCode((config?.format as string) || (config?.methodology as string) || '');
}

function collectMetrics(type: string, config: any): ExportMetric[] {
    const metrics: ExportMetric[] = [];
    const formatCode = inferFormatCode(type, config);

    switch (formatCode) {
        case 'EMOM':
        case 'EMOM_ALT':
        case 'E2MOM':
            pushMetric(metrics, 'Duración Total', config.minutes, 'min');
            pushMetric(metrics, 'Cada', config.interval, 'min');
            break;
        case 'AMRAP':
            pushMetric(metrics, 'Duración Total', config.minutes || config.timeCap || config.time_cap, 'min');
            break;
        case 'RFT':
            pushMetric(metrics, 'Rondas', config.rounds);
            pushMetric(metrics, 'Time Cap', config.timeCap || config.time_cap, 'min');
            break;
        case 'FOR_TIME':
            pushMetric(metrics, 'Time Cap', config.timeCap || config.time_cap, 'min');
            break;
        case 'CHIPPER':
            pushMetric(metrics, 'Rondas', config.rounds);
            pushMetric(metrics, 'Time Cap', config.timeCap || config.time_cap, 'min');
            break;
        case 'DEATH_BY':
            pushMetric(metrics, 'Reps Inicio', config.startingReps);
            pushMetric(metrics, 'Incremento', config.increment);
            pushMetric(metrics, 'Límite', config.maxMinutes, 'min');
            break;
        case 'TABATA':
            pushMetric(metrics, 'Rondas', config.rounds);
            pushMetric(metrics, 'Trabajo', config.workSeconds, 'seg');
            pushMetric(metrics, 'Descanso', config.restSeconds, 'seg');
            break;
        case 'LADDER':
        case 'LADDER_FINISHER':
            if (config.direction) metrics.push({ label: 'Dirección', value: String(config.direction) });
            pushMetric(metrics, 'Reps Inicio', config.startReps ?? config.repsStart);
            pushMetric(metrics, 'Reps Pico/Final', config.endReps ?? config.repsPeak);
            pushMetric(metrics, 'Incremento', config.increment);
            break;
        case 'INTERVALS':
            pushMetric(metrics, 'Intervalos', config.rounds);
            pushMetric(metrics, 'Trabajo', config.workSeconds || config.workTime, 'seg');
            pushMetric(metrics, 'Descanso', config.restSeconds || config.restTime, 'seg');
            break;
        case 'STANDARD':
            pushMetric(metrics, 'Series', config.sets);
            pushMetric(metrics, 'Reps', config.reps);
            pushMetric(metrics, '% 1RM', config.percentage, '%');
            pushMetric(metrics, 'Descanso', config.restSeconds || config.rest, 'seg');
            break;
        case 'CLUSTER':
            pushMetric(metrics, 'Clusters', config.sets);
            pushMetric(metrics, 'Mini-Sets', config.miniSets);
            pushMetric(metrics, 'Reps/Mini-Set', config.repsPerMiniSet || config.repsPerCluster);
            pushMetric(metrics, 'Descanso Intra', config.intraRestSeconds || config.intraRest, 'seg');
            pushMetric(metrics, 'Descanso Entre', config.interRestSeconds || config.interRest, 'seg');
            pushMetric(metrics, '% 1RM', config.percentage, '%');
            break;
        case 'DROP_SET':
            pushMetric(metrics, 'Drops', config.drops);
            pushMetric(metrics, 'Reps/Drop', config.repsPerDrop);
            pushMetric(metrics, 'Reducción', config.weightReductionPct || config.weightReduction, '%');
            break;
        case 'GIANT_SET':
            pushMetric(metrics, 'Rondas', config.rounds);
            pushMetric(metrics, 'Descanso Entre Rondas', config.restBetweenRoundsSeconds || config.restBetweenRounds, 'seg');
            break;
        case 'SUPER_SET':
            pushMetric(metrics, 'Series', config.sets);
            pushMetric(metrics, 'Descanso Entre Sets', config.restBetweenSetsSeconds || config.restBetweenSets, 'seg');
            break;
        case 'NOT_FOR_TIME':
            pushMetric(metrics, 'Rondas', config.rounds);
            break;
        case 'TEMPO': {
            pushMetric(metrics, 'Series', config.sets);
            pushMetric(metrics, 'Reps', config.reps);
            if (config.tempo) metrics.push({ label: 'Tempo', value: String(config.tempo) });
            const e = toNumber(config.tempoEccentric);
            const b = toNumber(config.tempoBottom);
            const c = toNumber(config.tempoConcentric);
            const t = toNumber(config.tempoTop);
            if (e !== null && b !== null && c !== null && t !== null) {
                metrics.push({ label: 'Tempo', value: `${e}-${b}-${c}-${t}` });
            }
            pushMetric(metrics, 'Descanso', config.restSeconds || config.rest, 'seg');
            break;
        }
        case 'DROPSET_FINISHER':
            pushMetric(metrics, 'Drops', config.drops);
            pushMetric(metrics, 'Reps/Drop', config.repsPerDrop);
            pushMetric(metrics, 'Reducción', config.weightReductionPct || config.percentage, '%');
            break;
        case 'REST_PAUSE':
            pushMetric(metrics, 'Reps Totales', config.totalReps);
            pushMetric(metrics, 'Micro-Descanso', config.restSeconds || config.rest, 'seg');
            pushMetric(metrics, 'Mini-Bloques', config.clusters);
            break;
        case '21S':
            pushMetric(metrics, 'Series', config.sets);
            break;
        case 'ISO_HOLD':
            pushMetric(metrics, 'Series', config.sets);
            pushMetric(metrics, 'Pausa Isométrica', config.holdSeconds || config.holdTime, 'seg');
            pushMetric(metrics, 'Reps', config.reps);
            break;
        case '1_5_REPS':
            pushMetric(metrics, 'Series', config.sets);
            pushMetric(metrics, 'Reps', config.reps);
            break;
        default:
            pushMetric(metrics, 'Series', config.sets);
            pushMetric(metrics, 'Reps', config.reps);
            pushMetric(metrics, 'Rondas', config.rounds);
            break;
    }

    return metrics;
}

function buildMovementLine(entry: any): string {
    if (!entry) return '';
    const name = (entry.name || entry.exercise || entry.movement || '').toString().trim();
    if (!name) return '';

    const parts: string[] = [];
    const targetValue = toNumber(entry.targetValue ?? entry.reps ?? entry.quantity);
    if (targetValue !== null) {
        const unitMap: Record<string, string> = {
            reps: 'Reps',
            seconds: 'Seg',
            meters: 'm',
            calories: 'Cal',
        };
        const unit = unitMap[String(entry.targetUnit || 'reps')] || 'Reps';
        parts.push(`${unit} ${targetValue}`);
    }
    const distance = toNumber(entry.distance);
    if (distance !== null) parts.push(`Metros ${distance}`);
    const sets = toNumber(entry.sets);
    if (sets !== null) parts.push(`Series ${sets}`);
    const rpe = toNumber(entry.rpe);
    if (rpe !== null) parts.push(`RPE ${rpe}`);
    const weight = toNumber(entry.weight);
    if (weight !== null) parts.push(`Carga ${weight} kg`);
    const rest = toNumber(entry.restSeconds ?? entry.rest);
    if (rest !== null) parts.push(`Descanso ${rest} seg`);

    return parts.length > 0 ? `${name} · ${parts.join(' · ')}` : name;
}

function collectMovementLines(config: any): string[] {
    if (!config) return [];

    const slotLines = Array.isArray(config.slots)
        ? config.slots
            .map((slot: any, idx: number) => {
                const movement = buildMovementLine(slot);
                if (!movement) return '';
                return `Intervalo ${idx + 1}: ${movement}`;
            })
            .filter(Boolean)
        : [];
    if (slotLines.length > 0) return slotLines;

    const itemLines = Array.isArray(config.items)
        ? config.items.map((item: any) => buildMovementLine(item)).filter(Boolean)
        : [];
    if (itemLines.length > 0) return itemLines;

    const movementLines = Array.isArray(config.movements)
        ? config.movements.map((movement: any) => {
            if (typeof movement === 'string') return movement.trim();
            return buildMovementLine(movement);
        }).filter(Boolean)
        : [];
    if (movementLines.length > 0) return movementLines;

    if (typeof config.movement === 'string' && config.movement.trim().length > 0) {
        return [config.movement.trim()];
    }

    if (Array.isArray(config.exercises)) {
        return config.exercises.map((exercise: any) => String(exercise || '').trim()).filter(Boolean);
    }

    if (typeof config.content === 'string' && config.content.trim().length > 0) {
        return config.content.split('\n').map((line: string) => line.trim()).filter(Boolean);
    }

    return [];
}

export function convertConfigToText(type: string, config: any, blockName?: string | null, oneRmStats?: any, excludeNotes: boolean = false, exercisesCues?: Record<string, string>): string[] {
    const metrics = collectMetrics(type, config);
    const metricLine = metrics.length > 0
        ? metrics.map((metric) => `${metric.label}: ${metric.value}`).join(' · ')
        : '';
    const movementLines = collectMovementLines(config);

    // 1. Handle Strength Linear
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
            config.sets && mainMetric ? `Series: ${config.sets} · Reps: ${mainMetric}` : '',
            config.percentage ? `%1RM: ${config.percentage}% ${kgBadge}` : '',
            config.rpe ? `RPE: ${config.rpe}` : '',
            config.weight ? `Carga: ${config.weight} kg` : ''
        ].filter(Boolean).join(' · ');

        const lines = [parts];
        return lines.filter(Boolean);
    }

    // 2. Structured modalities export as variable:value + movement rows.
    if (['metcon_structured', 'warmup', 'accessory', 'skill', 'finisher'].includes(type)) {
        const lines: string[] = [];
        if (metricLine) lines.push(metricLine);
        if (movementLines.length > 0) lines.push(...movementLines);
        return lines.filter(Boolean);
    }

    // 3. Generic fallback
    if (metricLine || movementLines.length > 0) {
        return [metricLine, ...movementLines].filter(Boolean);
    }

    return [];
}

export function configToStructure(type: string, config: any, blockName?: string | null, oneRmStats?: any, excludeNotes: boolean = false, exercisesCues?: Record<string, string>) {
    const res = {
        sets: '',
        reps: '',
        weight: '',
        rpe: '',
        rest: config.rest || '',
        text: '',
        notes: '',
        metrics: [] as ExportMetric[],
    };
    const metrics = collectMetrics(type, config);
    const movementLines = collectMovementLines(config);
    res.metrics = metrics;

    // 1. Strength
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
        const restSeconds = toNumber(config.restSeconds || config.rest);
        if (restSeconds !== null) res.rest = `${restSeconds} seg`;
        if (movementLines.length > 0) res.text = movementLines.join('\n');

        return res;
    }

    // 2. Structured modalities
    if (['metcon_structured', 'warmup', 'accessory', 'skill', 'finisher'].includes(type)) {
        res.text = movementLines.join('\n');
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
                    const configForExport = {
                        ...(b.config || {}),
                        format: b.format || (b.config as any)?.format || null,
                    };
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
                        config: configForExport,
                        content: convertConfigToText(b.type, configForExport, b.name, oneRmStats, true, exercisesCues),
                        structure: configToStructure(b.type, configForExport, b.name, oneRmStats, true, exercisesCues),
                        section: b.section || 'main',
                        cue: exerciseCue || '',
                        format: b.format || (b.config as any)?.format || (b.config as any)?.methodology || null,
                        rest: (b.config as any)?.rest || (b.config as any)?.restSeconds || null,
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
