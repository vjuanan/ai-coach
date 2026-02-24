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

const REQUIRED_FIELD_ALIASES: Record<string, string[]> = {
    startReps: ['repsStart'],
    endReps: ['repsPeak'],
    repsPerMovement: ['reps'],
    repsPerDrop: ['reps'],
    repsPerMiniSet: ['repsPerCluster', 'reps'],
    startingLoadPct: ['percentage', 'loadKg'],
    intensityTarget: ['percentage', 'rpe'],
    restBetweenRoundsSeconds: ['restBetweenRounds'],
    restBetweenSetsSeconds: ['restBetweenSets'],
    restBetweenMovementsSeconds: ['restSeconds', 'rest'],
    interRestSeconds: ['interRest'],
    intraRestSeconds: ['intraRest'],
    workSeconds: ['workTime'],
    restSeconds: ['restTime', 'rest'],
    holdSeconds: ['holdTime'],
};

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

function hasPositiveTarget(entry: unknown): boolean {
    if (!entry || typeof entry !== 'object') return false;
    const source = entry as Record<string, unknown>;
    if (isPositiveNumber(source.targetValue)) return true;
    if (isPositiveNumber(source.reps)) return true;
    return false;
}

function getFieldCandidateValues(config: Record<string, unknown>, key: string, defaultValue?: unknown): unknown[] {
    const aliases = REQUIRED_FIELD_ALIASES[key] || [];
    return [config[key], ...aliases.map((alias) => config[alias]), defaultValue];
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
                const methodCode = normalizeMethodologyCode(methodology.code);

                for (const field of methodology.form_config?.fields || []) {
                    if (!field.required) continue;

                    if (field.type === 'movements_list') {
                        let names = extractMovementNames(config[field.key]);
                        if (field.key === 'movements' && names.length === 0) {
                            names = [
                                ...extractMovementNames(config.items),
                                ...extractMovementNames(config.slots),
                            ];
                            if (names.length === 0 && typeof config.movement === 'string' && config.movement.trim().length > 0) {
                                names = [config.movement.trim()];
                            }
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

                    const fieldValues = getFieldCandidateValues(config, field.key, field.default);
                    if (field.type === 'number') {
                        if (!fieldValues.some((value) => isPositiveNumber(value))) {
                            missingFields.push(field.label);
                        }
                    } else if (!fieldValues.some((value) => isFilledText(value))) {
                        missingFields.push(field.label);
                    }
                }

                // Additional structured checks for methodologies that require numeric payload per item/interval.
                if (['EMOM', 'EMOM_ALT', 'E2MOM'].includes(methodCode)) {
                    const slots = Array.isArray(config.slots) ? config.slots : [];
                    if (slots.length === 0) {
                        missingFields.push('Intervalos');
                    } else {
                        const hasSlotExercise = slots.every((slot) => {
                            const names = extractMovementNames([slot]);
                            return names.length > 0;
                        });
                        const hasSlotTarget = slots.every((slot) => hasPositiveTarget(slot));

                        if (!hasSlotExercise) {
                            missingFields.push('Ejercicio en cada intervalo');
                        }
                        if (!hasSlotTarget) {
                            missingFields.push('Valor numérico por intervalo');
                        }
                    }
                }

                if (['AMRAP', 'RFT', 'FOR_TIME', 'CHIPPER'].includes(methodCode)) {
                    const fallbackMovements = Array.isArray(config.movements) ? config.movements : [];
                    const items = Array.isArray(config.items) && config.items.length > 0
                        ? config.items
                        : fallbackMovements;
                    if (items.length === 0) {
                        missingFields.push('Items del circuito');
                    } else {
                        const hasItemExercise = items.every((item) => {
                            const names = extractMovementNames([item]);
                            return names.length > 0;
                        });
                        const hasItemTarget = items.every((item) => hasPositiveTarget(item));

                        if (!hasItemExercise) {
                            missingFields.push('Ejercicio en cada item');
                        }
                        if (!hasItemTarget) {
                            missingFields.push('Valor numérico por item');
                        }
                    }
                }
            } else {
                const fallbackMovements = extractMovementNames(config.movements);
                if (fallbackMovements.length === 0) {
                    missingFields.push('Al menos 1 movimiento');
                }
            }
        }

        const dedupedMissingFields = Array.from(new Set(missingFields));
        return {
            isValid: dedupedMissingFields.length === 0,
            missingFields: dedupedMissingFields,
        };
    };

    return { validateBlock };
};
