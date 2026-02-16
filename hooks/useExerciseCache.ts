import { useState, useEffect } from 'react';
import { getAllExercisesLight } from '@/lib/actions';

// Singleton cache to share data across all inputs in the app
let globalExerciseCache: any[] | null = null;
let globalFetchPromise: Promise<any[]> | null = null;

export function useExerciseCache() {
    const [exercises, setExercises] = useState<any[]>(globalExerciseCache || []);
    const [isLoading, setIsLoading] = useState(!globalExerciseCache);

    useEffect(() => {
        // If we already have data, just set it (should be set by state init, but strictly ensuring)
        if (globalExerciseCache) {
            if (exercises.length === 0) setExercises(globalExerciseCache);
            setIsLoading(false);
            return;
        }

        // If a fetch is already in progress, wait for it
        if (globalFetchPromise) {
            globalFetchPromise.then(data => {
                setExercises(data);
                setIsLoading(false);
            });
            return;
        }

        // Otherwise, start the fetch
        globalFetchPromise = getAllExercisesLight().then(data => {
            globalExerciseCache = data || [];
            return globalExerciseCache;
        }).catch(err => {
            console.error('Failed to pre-fetch exercises', err);
            return [];
        });

        if (globalFetchPromise) {
            globalFetchPromise.then(data => {
                setExercises(data);
                setIsLoading(false);
            });
        }

    }, []);

    const searchLocal = (query: string) => {
        // if (!query) return []; // Allow empty query for "browse" behavior
        const lowerQuery = query ? query.toLowerCase().trim() : '';
        // if (lowerQuery.length < 2) return []; // Disable min length for local search


        return (exercises || []).filter(ex => {
            const matchesName = ex.name.toLowerCase().includes(lowerQuery);
            const matchesAlias = ex.aliases?.some((alias: string) => alias.toLowerCase().includes(lowerQuery));
            return matchesName || matchesAlias;
        }).slice(0, 50); // Limit results for performance
    };

    return {
        exercises,
        searchLocal,
        isLoading
    };
}
