import { useEditorStore } from '@/lib/store';
import { useMemo } from 'react';

// Common exercise name mappings to normalize inputs
const EXERCISE_MAPPINGS: Record<string, string[]> = {
    'backSquat': ['back squat', 'sentadilla trasera', 'sentadilla back', 'back sq'],
    'frontSquat': ['front squat', 'sentadilla frontal', 'front sq'],
    'clean': ['clean', 'power clean', 'squat clean', 'clean & jerk', 'c&j', 'clean y jerk'],
    'snatch': ['snatch', 'arranque', 'power snatch', 'squat snatch'],
    'deadlift': ['deadlift', 'peso muerto', 'dl'],
    'benchPress': ['bench press', 'press de banca', 'press banca', 'bench'],
    'strictPress': ['strict press', 'press estricto', 'shoulder press', 'press militar', 'military press'],
    // Add more as needed
};

export function useAthleteBenchmarks() {
    const { programClient } = useEditorStore();

    const benchmarks = useMemo(() => {
        if (!programClient) {
            console.log('[BENCH-DEBUG] No programClient');
            return null;
        }
        // Check for 'benchmarks' (profile) or 'details.oneRmStats' (client) or 'details' (client root for manual benchmarks?)
        // The actions.ts logic saves to `profiles.benchmarks` OR `clients.details`.
        // We need to support both structures.

        console.log('[BENCH-DEBUG] programClient:', JSON.stringify({
            id: programClient.id,
            name: programClient.name,
            hasBenchmarks: !!(programClient as any).benchmarks,
            hasDetails: !!programClient.details,
            hasDetailsOneRmStats: !!(programClient.details && (programClient.details as any).oneRmStats),
            details: programClient.details,
            benchmarks: (programClient as any).benchmarks,
        }, null, 2));

        // 1. Try profiles.benchmarks structure (if client has it)
        if ((programClient as any).benchmarks) {
            console.log('[BENCH-DEBUG] Using profiles.benchmarks:', (programClient as any).benchmarks);
            return (programClient as any).benchmarks;
        }

        // 2. Try details.oneRmStats (Legacy/Coach-Manual structure)
        if (programClient.details && (programClient.details as any).oneRmStats) {
            console.log('[BENCH-DEBUG] Using details.oneRmStats:', (programClient.details as any).oneRmStats);
            return (programClient.details as any).oneRmStats;
        }

        // 3. Try details root (if flattened) - less likely but possible
        console.log('[BENCH-DEBUG] Falling back to details root:', programClient.details);
        return programClient.details || {};
    }, [programClient]);

    const getBenchmark = (exerciseName: string): number | null => {
        if (!benchmarks || !exerciseName) {
            console.log('[BENCH-DEBUG] getBenchmark early exit:', { hasBenchmarks: !!benchmarks, exerciseName });
            return null;
        }

        const normalizedInput = exerciseName.toLowerCase().trim();
        console.log('[BENCH-DEBUG] getBenchmark called:', { exerciseName, normalizedInput, benchmarkKeys: Object.keys(benchmarks), benchmarks });

        // 1. Direct match
        if (benchmarks[normalizedInput]) {
            console.log('[BENCH-DEBUG] Direct match found:', normalizedInput, benchmarks[normalizedInput]);
            return Number(benchmarks[normalizedInput]);
        }

        // 2. KEY Mapping (e.g. "Clean" -> "clean")
        // Check if input matches any know aliases
        for (const [key, aliases] of Object.entries(EXERCISE_MAPPINGS)) {
            // Check if key itself matches
            if (key.toLowerCase() === normalizedInput) {
                console.log('[BENCH-DEBUG] Key match found:', key, benchmarks[key]);
                return Number(benchmarks[key]) || null;
            }

            // Check aliases
            if (aliases.some(alias => normalizedInput.includes(alias) || alias.includes(normalizedInput))) {
                if (benchmarks[key]) {
                    console.log('[BENCH-DEBUG] Alias match found:', key, benchmarks[key]);
                    return Number(benchmarks[key]);
                }
            }
        }

        // 3. Fuzzy search? (Simple version: if benchmark key is contained in input)
        // e.g. input "Heavy Clean" -> matches key "clean"
        for (const key of Object.keys(benchmarks)) {
            if (normalizedInput.includes(key.toLowerCase())) {
                console.log('[BENCH-DEBUG] Fuzzy match found:', key, benchmarks[key]);
                return Number(benchmarks[key]);
            }
        }

        console.log('[BENCH-DEBUG] No match found for:', exerciseName);
        return null;
    };

    return {
        getBenchmark,
        hasBenchmarks: !!benchmarks && Object.keys(benchmarks).length > 0
    };
}
