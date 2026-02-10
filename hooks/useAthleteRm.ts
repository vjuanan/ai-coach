import { useEditorStore } from '@/lib/store';

/**
 * Mapping from exercise name keywords to oneRmStats keys.
 * Each entry: [keywords to match (lowercase), RM key in oneRmStats]
 */
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

/**
 * Resolves an exercise/block name to its corresponding oneRmStats key.
 * Uses case-insensitive keyword matching.
 */
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

/**
 * Hook to access athlete RM data from the current program's client.
 * Returns helpers to resolve RM values and calculate KG from percentages.
 */
export function useAthleteRm() {
    const programClient = useEditorStore(state => state.programClient);
    const oneRmStats: Record<string, number | null> = (programClient?.details as any)?.oneRmStats || {};

    /**
     * Get the RM value (in kg) for a given exercise name.
     * Returns null if no matching RM is found.
     */
    function getRm(exerciseName: string): number | null {
        const key = resolveRmKey(exerciseName);
        if (!key) return null;
        return oneRmStats[key] ?? null;
    }

    /**
     * Calculate exact KG given an exercise name and a percentage (0-100).
     * Returns null if no matching RM is found.
     */
    function calculateKg(exerciseName: string, percentage: number): number | null {
        const rm = getRm(exerciseName);
        if (rm === null || rm === undefined || !percentage) return null;
        // Round to nearest 0.5 kg for practical gym use
        return Math.round((rm * percentage / 100) * 2) / 2;
    }

    /**
     * Get the matched RM key name for display purposes.
     */
    function getMatchedRmLabel(exerciseName: string): string | null {
        const key = resolveRmKey(exerciseName);
        if (!key || !oneRmStats[key]) return null;

        const labels: Record<string, string> = {
            backSquat: 'Back Squat',
            frontSquat: 'Front Squat',
            deadlift: 'Deadlift',
            snatch: 'Snatch',
            cnj: 'C&J',
            clean: 'Clean',
            strictPress: 'Strict Press',
            benchPress: 'Bench Press',
        };
        return labels[key] || key;
    }

    return {
        oneRmStats,
        getRm,
        calculateKg,
        getMatchedRmLabel,
        hasRmData: Object.values(oneRmStats).some(v => v !== null && v !== undefined),
    };
}

/** Pure function version for non-hook contexts (e.g., convertConfigToText) */
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
