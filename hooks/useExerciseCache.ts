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


        const results = (exercises || []).map(ex => {
            let score = 0;
            let matchedAlias = null;

            const name = ex.name.toLowerCase();

            // Name Matching Logic
            if (name === lowerQuery) {
                score = 100; // Exact match
            } else if (name.startsWith(lowerQuery)) {
                score = 80; // Starts with
            } else if (name.includes(lowerQuery)) {
                score = 60; // Contains
            }

            // Alias Matching Logic
            if (ex.aliases) {
                const aliasMatch = ex.aliases.find((alias: string) => alias.toLowerCase().includes(lowerQuery));
                if (aliasMatch) {
                    const aliasLower = aliasMatch.toLowerCase();
                    let aliasScore = 0;

                    if (aliasLower === lowerQuery) {
                        aliasScore = 50; // Exact alias match
                    } else if (aliasLower.startsWith(lowerQuery)) {
                        aliasScore = 40; // Starts with alias
                    } else {
                        aliasScore = 20; // Contains alias
                    }

                    // Only use alias score if it's better than name score (unlikely given weights, but good for safety)
                    // Actually we want to track WHAT matched.
                    if (aliasScore > 0 && score === 0) {
                        score = aliasScore;
                        matchedAlias = aliasMatch;
                    }
                }
            }

            return { exercise: ex, score, matchedAlias };
        })
            .filter(item => item.score > 0)
            .sort((a, b) => {
                if (a.score !== b.score) return b.score - a.score; // Higher score first
                return a.exercise.name.localeCompare(b.exercise.name); // Alphabetical tie-break
            })
            .slice(0, 50)
            .map(item => ({
                ...item.exercise,
                matchedAlias: item.matchedAlias // Pass this through to the UI
            }));

        return results;
    };

    const refresh = () => {
        setIsLoading(true);
        getAllExercisesLight().then(data => {
            globalExerciseCache = data || [];
            if (globalFetchPromise) globalFetchPromise = Promise.resolve(globalExerciseCache);
            setExercises(globalExerciseCache);
            setIsLoading(false);
        });
    };

    return {
        exercises,
        searchLocal,
        isLoading,
        refresh
    };
}
