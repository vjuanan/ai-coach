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
        if (!programClient) return null;

        // 1. Try profiles.benchmarks structure (if client has it)
        if ((programClient as any).benchmarks) {
            return (programClient as any).benchmarks;
        }

        // 2. Try details.oneRmStats (Coach-Manual structure)
        if (programClient.details && (programClient.details as any).oneRmStats) {
            return (programClient.details as any).oneRmStats;
        }

        // 3. Try details root (if flattened)
        return programClient.details || {};
    }, [programClient]);

    const getBenchmark = (exerciseName: string): number | null => {
        if (!benchmarks || !exerciseName) return null;

        const normalizedInput = exerciseName.toLowerCase().trim();

        // 1. Direct match
        if (benchmarks[normalizedInput]) return Number(benchmarks[normalizedInput]);

        // 2. KEY Mapping (e.g. "Clean" -> "clean")
        for (const [key, aliases] of Object.entries(EXERCISE_MAPPINGS)) {
            if (key.toLowerCase() === normalizedInput) {
                return Number(benchmarks[key]) || null;
            }

            if (aliases.some(alias => normalizedInput.includes(alias) || alias.includes(normalizedInput))) {
                if (benchmarks[key]) return Number(benchmarks[key]);
            }
        }

        // 3. Fuzzy search (if benchmark key is contained in input)
        for (const key of Object.keys(benchmarks)) {
            if (normalizedInput.includes(key.toLowerCase())) {
                return Number(benchmarks[key]);
            }
        }

        return null;
    };

    return {
        getBenchmark,
        hasBenchmarks: !!benchmarks && Object.keys(benchmarks).length > 0
    };
}
