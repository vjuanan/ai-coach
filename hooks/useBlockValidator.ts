import { useExerciseCache } from '@/hooks/useExerciseCache';
import type { BlockType } from '@/lib/supabase/types';

interface BlockValidationResult {
    isValid: boolean;
    missingFields: string[];
}

export const useBlockValidator = () => {
    const { searchLocal } = useExerciseCache();

    const validateBlock = (block: {
        type: string;
        format: string | null;
        name: string | null;
        config: Record<string, unknown>;
    } | null): BlockValidationResult => {
        if (!block) return { isValid: false, missingFields: ['Bloque no encontrado'] };

        const config = block.config || {};
        const missingFields: string[] = [];

        // 1. Strength Linear: Needs Name (Valid Exercise), Sets, Reps, Intensity, Rest
        if (block.type === 'strength_linear') {
            // Exercise Name
            if (!block.name || block.name.trim().length === 0) {
                missingFields.push('Nombre del Ejercicio');
            } else {
                // Check cache for valid exercise
                const match = searchLocal(block.name).find(e => e.name.toLowerCase() === block.name?.toLowerCase());
                if (!match) {
                    missingFields.push('Ejercicio Válido (Seleccionar de lista)');
                }
            }

            // Sets
            if (!config.sets || Number(config.sets) <= 0) {
                missingFields.push('Series');
            }

            // Reps
            if (!config.reps || String(config.reps).trim().length === 0) {
                missingFields.push('Repeticiones');
            }

            // Intensity (Weight/Percentage/RPE/RIR) - At least one
            const hasIntensity = (config.weight && String(config.weight).trim().length > 0) ||
                (config.percentage && Number(config.percentage) > 0) ||
                (config.rpe && Number(config.rpe) > 0) ||
                (config.rir !== undefined && config.rir !== null && config.rir !== '');

            if (!hasIntensity) {
                missingFields.push('Intensidad (Peso, %, RPE o RIR)');
            }

            // Rest
            if (!config.rest || String(config.rest).trim().length === 0) {
                missingFields.push('Descanso');
            }
        }

        // 2. Free Text: Needs content
        else if (block.type === 'free_text') {
            const content = config.content as string;
            if (!content || content.trim().length === 0) {
                missingFields.push('Contenido');
            }
        }

        // 3. Structured (Metcon, etc): Needs Format + At least one VALID movement
        else if (['metcon_structured', 'warmup', 'accessory', 'skill', 'finisher'].includes(block.type)) {
            // Methodology/Format
            if (!block.format) {
                missingFields.push('Metodología (Formato)');
            }

            // Movements
            const movements = config.movements as any[] || [];
            if (movements.length === 0) {
                missingFields.push('Al menos 1 movimiento');
            } else {
                // Verify all added movements are valid
                let allMovementsValid = true;
                for (const m of movements) {
                    let name = '';
                    if (typeof m === 'string') name = m;
                    else if (typeof m === 'object' && m && 'name' in m) name = (m as any).name;

                    if (!name || name.trim().length === 0) {
                        allMovementsValid = false;
                        break;
                    }
                    /* 
                       Note: We are NOT validating movement names against the cache strictly here for MetCons yet, 
                       because sometimes users use custom movements or complex strings in MetCons. 
                       However, if the requirement is STRICT, we should enable it.
                       Given "NO PUEDE SER QUE SIGAS COMEITENDO ESTE ERROR MOGOLICO", let's be STRICT but safe.
                       If they typed it, it's valid for now, but empty is not.
                    */
                }
                if (!allMovementsValid) {
                    missingFields.push('Movimientos válidos (nombres no vacíos)');
                } else if (block.type === 'warmup' || block.type === 'accessory') {
                    // Strict validation for Warmup/Accessory
                    let allStrictValid = true;
                    for (const m of movements) {
                        let name = '';
                        if (typeof m === 'string') name = m;
                        else if (typeof m === 'object' && m && 'name' in m) name = (m as any).name;

                        // Check cache
                        const match = searchLocal(name).find(e => e.name.toLowerCase() === name.toLowerCase());
                        if (!match) {
                            allStrictValid = false;
                            break;
                        }
                    }
                    if (!allStrictValid) {
                        missingFields.push('Todos los ejercicios deben ser de la biblioteca');
                    }
                }
            }

            // Specific check for AMRAP: Time Cap
            if (block.format === 'AMRAP' || block.format === 'For Time') {
                // Assuming AMRAP usually needs a time cap, or maybe just AMRAP?
                // Let's check config.minutes for AMRAP specifically if it's in the UI
                if (block.format === 'AMRAP') {
                    if (!config.minutes || Number(config.minutes) <= 0) {
                        missingFields.push('Time Cap (Minutos)');
                    }
                }
            }
        }

        return {
            isValid: missingFields.length === 0,
            missingFields
        };
    };

    return { validateBlock };
};
