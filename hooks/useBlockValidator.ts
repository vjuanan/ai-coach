import { useExerciseCache } from '@/hooks/useExerciseCache';
import { useEditorStore } from '@/lib/store';
import {
    normalizeMethodologyCode,
    normalizeTrainingMethodologies,
} from '@/lib/training-methodologies';

interface BlockValidationResult {
    isValid: boolean;
    missingFields: string[];
}

function isFilledText(value: unknown): boolean {
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return true;
    return value !== null && value !== undefined;
}

function isPositiveNumber(value: unknown): boolean {
    if (typeof value === 'number') return Number.isFinite(value) && value > 0;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0;
    }
    return false;
}

function extractMovementNames(value: unknown): string[] {
    if (!Array.isArray(value)) return [];

    return value
        .map((entry) => {
            if (typeof entry === 'string') return entry.trim();
            if (typeof entry === 'object' && entry !== null) {
                if ('name' in entry && typeof (entry as any).name === 'string') return (entry as any).name.trim();
                if ('movement' in entry && typeof (entry as any).movement === 'string') return (entry as any).movement.trim();
                if ('exercise' in entry && typeof (entry as any).exercise === 'string') return (entry as any).exercise.trim();
            }
            return '';
        })
        .filter(Boolean);
}

export const useBlockValidator = () => {
    const { searchLocal } = useExerciseCache();
    const { trainingMethodologies } = useEditorStore();
    const methodologies = normalizeTrainingMethodologies(trainingMethodologies);

    const validateBlock = (block: {
        type: string;
        format: string | null;
        name: string | null;
        config: Record<string, unknown>;
    } | null): BlockValidationResult => {
        if (!block) return { isValid: false, missingFields: ['Bloque no encontrado'] };

        const config = block.config || {};
        const missingFields: string[] = [];

        if (block.type === 'strength_linear') {
            if (!block.name || block.name.trim().length === 0) {
                missingFields.push('Nombre del Ejercicio');
            } else {
                const match = searchLocal(block.name).find(e => e.name.toLowerCase() === block.name?.toLowerCase());
                if (!match) {
                    missingFields.push('Ejercicio valido (seleccionar de lista)');
                }
            }

            if (!isPositiveNumber(config.sets)) {
                missingFields.push('Series');
            }

            const hasReps = isFilledText(config.reps);
            const hasDistance = isFilledText(config.distance);
            if (!hasReps && !hasDistance) {
                missingFields.push('Repeticiones o Distancia');
            }

            const hasIntensity =
                isFilledText(config.weight) ||
                isPositiveNumber(config.percentage) ||
                isPositiveNumber(config.rpe) ||
                isFilledText(config.rir);

            if (!hasIntensity) {
                missingFields.push('Intensidad (Peso, %, RPE o RIR)');
            }

            if (!isFilledText(config.rest)) {
                missingFields.push('Descanso');
            }
        } else if (block.type === 'free_text') {
            const content = config.content as string;
            if (!content || content.trim().length === 0) {
                missingFields.push('Contenido');
            }
        } else if (['metcon_structured', 'warmup', 'accessory', 'skill', 'finisher'].includes(block.type)) {
            if (!block.format) {
                missingFields.push('Metodologia (Formato)');
            }

            const methodology = methodologies.find(
                (method) => normalizeMethodologyCode(method.code) === normalizeMethodologyCode(block.format || '')
            );

            if (methodology) {
                for (const field of methodology.form_config?.fields || []) {
                    if (!field.required) continue;

                    if (field.type === 'movements_list') {
                        let names = extractMovementNames(config[field.key]);
                        if (field.key === 'movements' && names.length === 0) {
                            names = [
                                ...extractMovementNames(config.items),
                                ...extractMovementNames(config.slots),
                            ];
                        }

                        if (names.length === 0) {
                            missingFields.push(field.label);
                        } else if (block.type === 'warmup' || block.type === 'accessory') {
                            const allInLibrary = names.every((movementName) => {
                                const match = searchLocal(movementName).find(
                                    (exercise) => exercise.name.toLowerCase() === movementName.toLowerCase()
                                );
                                return !!match;
                            });

                            if (!allInLibrary) {
                                missingFields.push('Todos los ejercicios deben ser de la biblioteca');
                            }
                        }

                        continue;
                    }

                    const fieldValue = config[field.key];
                    if (field.type === 'number') {
                        if (!isPositiveNumber(fieldValue)) {
                            missingFields.push(field.label);
                        }
                    } else if (!isFilledText(fieldValue)) {
                        missingFields.push(field.label);
                    }
                }
            } else {
                const fallbackMovements = extractMovementNames(config.movements);
                if (fallbackMovements.length === 0) {
                    missingFields.push('Al menos 1 movimiento');
                }
            }
        }

        return {
            isValid: missingFields.length === 0,
            missingFields,
        };
    };

    return { validateBlock };
};
