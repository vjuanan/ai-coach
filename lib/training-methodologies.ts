import type { TrainingMethodology, TrainingMethodologyFormField } from '@/lib/supabase/types';

type TrainingMethodologyOverride = {
    description?: string;
    formFields?: TrainingMethodologyFormField[];
    defaultValues?: Record<string, unknown>;
};

const METHOD_DESCRIPTIONS_ES: Record<string, string> = {
    EMOM: 'Cada minuto inicia una tarea. Define duracion total y el intervalo de repeticion.',
    EMOM_ALT: 'EMOM con alternancia de ejercicios. Se rota el movimiento en cada minuto.',
    E2MOM: 'Trabajo cada 2 minutos para usar cargas mayores o mas recuperacion.',
    AMRAP: 'Completa la mayor cantidad de rondas o repeticiones dentro del tiempo limite.',
    RFT: 'Completa una cantidad fija de rondas lo mas rapido posible.',
    FOR_TIME: 'Completa el trabajo total lo mas rapido posible, con Time Cap opcional.',
    CHIPPER: 'Gran volumen en orden fijo. Se avanza ejercicio por ejercicio hasta terminar.',
    DEATH_BY: 'Empieza con pocas reps y aumenta por ronda hasta fallar el tiempo objetivo.',
    TABATA: 'Intervalos clasicos de trabajo/descanso repetidos por rondas.',
    LADDER: 'Esquema ascendente, descendente o piramidal de repeticiones.',
    INTERVALS: 'Intervalos definidos por rondas con tiempo de trabajo y descanso.',
    STANDARD: 'Formato tradicional de series por repeticiones.',
    CLUSTER: 'Mini-bloques con pausas cortas dentro de cada serie.',
    DROP_SET: 'Reducir carga en cada drop para extender el esfuerzo.',
    GIANT_SET: 'Tres o mas ejercicios seguidos sin descanso interno.',
    SUPER_SET: 'Dos ejercicios consecutivos por serie con descanso al final.',
    NOT_FOR_TIME: 'Trabajo tecnico sin reloj: prioriza calidad de ejecucion.',
    TEMPO: 'Control del tempo para aumentar tension y calidad tecnica.',
    DROPSET_FINISHER: 'Finisher con reduccion de carga inmediata para agotar el musculo.',
    REST_PAUSE: 'Finisher al fallo con micro-descansos cortos entre mini-bloques.',
    LADDER_FINISHER: 'Finisher en escalera con progresion o regresion de repeticiones.',
    '21S': 'Finisher clasico 7-7-7 para acumular fatiga en rangos parciales y completos.',
    ISO_HOLD: 'Finisher con pausas isometricas para elevar tension y control.',
    '1_5_REPS': 'Finisher donde 1 repeticion = 1 completa + 1 media repeticion.',
};

const FIELD_HELP_ES: Record<string, Record<string, string>> = {
    EMOM: {
        minutes: 'Minutos totales del bloque EMOM.',
        interval: 'Cada cuantos minutos se repite la tarea (1 = cada minuto).',
        movements: 'Define los ejercicios que se van rotando por minuto.',
    },
    EMOM_ALT: {
        minutes: 'Duracion total en minutos.',
        movements: 'Carga los ejercicios en el orden de alternancia.',
    },
    E2MOM: {
        sets: 'Cantidad de intervalos E2MOM a completar.',
        movements: 'Ejercicios a ejecutar en cada intervalo de 2 minutos.',
    },
    AMRAP: {
        minutes: 'Tiempo maximo para acumular rondas/reps.',
        movements: 'Secuencia de ejercicios que compone una ronda.',
    },
    RFT: {
        rounds: 'Numero de rondas objetivo.',
        timeCap: 'Limite de tiempo opcional para cortar el bloque.',
        movements: 'Ejercicios que se repiten en cada ronda.',
    },
    FOR_TIME: {
        timeCap: 'Limite de tiempo opcional para este For Time.',
        movements: 'Lista total de ejercicios/reps a completar.',
    },
    CHIPPER: {
        timeCap: 'Limite de tiempo opcional para terminar el chipper.',
        movements: 'Orden exacto del chipper, del primero al ultimo.',
    },
    DEATH_BY: {
        movement: 'Ejercicio principal del Death By.',
        startingReps: 'Reps iniciales del minuto 1.',
        increment: 'Reps que se suman en cada nueva ronda.',
    },
    TABATA: {
        rounds: 'Cantidad de rondas Tabata.',
        workSeconds: 'Segundos de trabajo por ronda.',
        restSeconds: 'Segundos de descanso por ronda.',
        movement: 'Ejercicio base del protocolo.',
    },
    LADDER: {
        direction: 'Ascendente, descendente o piramidal.',
        startReps: 'Reps con las que inicia la escalera.',
        endReps: 'Reps objetivo del tramo final.',
        increment: 'Cuantas reps se agregan o quitan por escalon.',
        movements: 'Ejercicio(s) que siguen la escalera.',
    },
    INTERVALS: {
        rounds: 'Cantidad de intervalos totales.',
        workTime: 'Duracion del tramo de trabajo (ej: 1:00).',
        restTime: 'Duracion del descanso entre intervalos (ej: 0:30).',
        movements: 'Ejercicios del tramo de trabajo.',
    },
    STANDARD: {
        sets: 'Series totales a completar.',
        reps: 'Repeticiones por serie (numero o rango).',
        percentage: 'Porcentaje del 1RM si trabajas por intensidad relativa.',
        rest: 'Descanso entre series.',
        tempo: 'Tempo recomendado (ej: 31X1).',
    },
    CLUSTER: {
        sets: 'Cantidad de clusters.',
        repsPerCluster: 'Distribucion de reps por mini-bloque (ej: 2+2+2).',
        intraRest: 'Pausa corta dentro del cluster.',
        interRest: 'Descanso al terminar cada cluster.',
        percentage: 'Intensidad sugerida en % del 1RM.',
    },
    DROP_SET: {
        drops: 'Cantidad de reducciones de carga.',
        repsPerDrop: 'Reps por cada drop.',
        weightReduction: 'Porcentaje o kilos a reducir en cada drop.',
    },
    GIANT_SET: {
        rounds: 'Cantidad de rondas del giant set.',
        restBetweenRounds: 'Descanso entre rondas completas.',
        movements: 'Ejercicios del giant set en secuencia.',
    },
    SUPER_SET: {
        sets: 'Series del super set.',
        movements: 'Ejercicios A y B que se alternan sin descanso.',
        restBetweenSets: 'Descanso entre series del super set.',
    },
    NOT_FOR_TIME: {
        movements: 'Ejercicios tecnicos del bloque sin reloj.',
        notes: 'Indicaciones de calidad, foco tecnico o respiracion.',
    },
    TEMPO: {
        sets: 'Series a completar.',
        reps: 'Repeticiones por serie.',
        tempo: 'Tempo por fase (ej: 3111).',
        rest: 'Descanso entre series.',
    },
    DROPSET_FINISHER: {
        drops: 'Cantidad de drops en el finisher.',
        percentage: 'Reduccion de carga por drop.',
        movements: 'Ejercicio principal del finisher.',
    },
    REST_PAUSE: {
        totalReps: 'Objetivo total de repeticiones acumuladas.',
        rest: 'Micro-descanso en segundos entre mini-series.',
        movements: 'Ejercicio principal del rest-pause.',
    },
    LADDER_FINISHER: {
        direction: 'Elige si la escalera sube, baja o sube/baja.',
        repsStart: 'Repeticiones del primer escalon.',
        repsPeak: 'Repeticiones maximas o ultimo escalon.',
        increment: 'Reps que cambian por escalon.',
        movements: 'Ejercicio(s) que siguen la escalera.',
    },
    '21S': {
        sets: 'Cantidad de series 21s.',
        movements: 'Ejercicio recomendado de aislamiento.',
    },
    ISO_HOLD: {
        holdTime: 'Segundos de pausa isometrica por repeticion o al final.',
        reps: 'Cantidad de reps objetivo.',
        movements: 'Ejercicio sobre el que se aplica la pausa.',
    },
    '1_5_REPS': {
        sets: 'Series del finisher 1.5.',
        reps: 'Repeticiones objetivo (cada una incluye media repeticion extra).',
        movements: 'Ejercicio donde aplicar el patron 1.5.',
    },
};

const LABEL_OVERRIDES_ES: Record<string, Record<string, string>> = {
    LADDER: {
        direction: 'Direccion',
    },
    LADDER_FINISHER: {
        direction: 'Direccion',
        repsStart: 'Reps inicio',
        repsPeak: 'Reps pico/final',
        increment: 'Incremento por escalon',
    },
};

const FORM_FIELD_OVERRIDES: Record<string, TrainingMethodologyFormField[]> = {
    LADDER_FINISHER: [
        {
            key: 'direction',
            label: 'Direccion',
            type: 'select',
            options: ['ascending', 'descending', 'pyramid'],
            default: 'ascending',
            required: true,
        },
        {
            key: 'repsStart',
            label: 'Reps inicio',
            type: 'number',
            placeholder: '1',
            default: 1,
            required: true,
        },
        {
            key: 'repsPeak',
            label: 'Reps pico/final',
            type: 'number',
            placeholder: '10',
            default: 10,
            required: true,
        },
        {
            key: 'increment',
            label: 'Incremento por escalon',
            type: 'number',
            placeholder: '1',
            default: 1,
            required: true,
        },
        {
            key: 'movements',
            label: 'Movimientos',
            type: 'movements_list',
            required: true,
        },
    ],
};

const DEFAULT_VALUE_OVERRIDES: Record<string, Record<string, unknown>> = {
    LADDER_FINISHER: {
        direction: 'ascending',
        repsStart: 1,
        repsPeak: 10,
        increment: 1,
        movements: [],
    },
};

const SELECT_OPTION_LABELS_ES: Record<string, string> = {
    ascending: 'Ascendente',
    descending: 'Descendente',
    pyramid: 'Piramide',
};

const LEGACY_CODE_ALIASES: Record<string, string> = {
    'FOR TIME': 'FOR_TIME',
    FOR_TIME: 'FOR_TIME',
    'NOT FOR TIME': 'NOT_FOR_TIME',
    NOT_FOR_TIME: 'NOT_FOR_TIME',
    CHIPPER: 'CHIPPER',
    TABATA: 'TABATA',
    LADDER: 'LADDER',
};

export function normalizeMethodologyCode(code?: string | null): string {
    if (!code) return '';

    const trimmed = code.trim();
    const upperSpaced = trimmed.toUpperCase();
    const underscored = upperSpaced.replace(/[\s-]+/g, '_');

    return LEGACY_CODE_ALIASES[upperSpaced] || LEGACY_CODE_ALIASES[underscored] || underscored;
}

export function formatMethodologyOptionLabel(option: string): string {
    return SELECT_OPTION_LABELS_ES[option] || option;
}

function applyFieldMetadataOverrides(
    code: string,
    fields: TrainingMethodologyFormField[]
): TrainingMethodologyFormField[] {
    const methodHelp = FIELD_HELP_ES[code] || {};
    const labelOverrides = LABEL_OVERRIDES_ES[code] || {};

    return fields.map((field) => ({
        ...field,
        label: labelOverrides[field.key] || field.label,
        help: methodHelp[field.key] || field.help,
    }));
}

function applyTrainingMethodologyOverride(method: TrainingMethodology): TrainingMethodology {
    const normalizedCode = normalizeMethodologyCode(method.code);
    const override: TrainingMethodologyOverride = {
        description: METHOD_DESCRIPTIONS_ES[normalizedCode],
        formFields: FORM_FIELD_OVERRIDES[normalizedCode],
        defaultValues: DEFAULT_VALUE_OVERRIDES[normalizedCode],
    };

    const baseFields = override.formFields || method.form_config?.fields || [];
    const fields = applyFieldMetadataOverrides(normalizedCode, baseFields);

    return {
        ...method,
        code: normalizedCode,
        description: override.description || method.description,
        form_config: {
            ...(method.form_config || {}),
            fields,
        },
        default_values: {
            ...(method.default_values || {}),
            ...(override.defaultValues || {}),
        },
    };
}

export function normalizeTrainingMethodologies(
    methodologies: TrainingMethodology[]
): TrainingMethodology[] {
    const deduped = new Map<string, TrainingMethodology>();

    for (const rawMethod of methodologies || []) {
        const method = applyTrainingMethodologyOverride(rawMethod);
        const normalizedCode = normalizeMethodologyCode(method.code);
        const existing = deduped.get(normalizedCode);

        if (!existing || method.sort_order < existing.sort_order) {
            deduped.set(normalizedCode, method);
        }
    }

    return Array.from(deduped.values()).sort((a, b) => {
        if (a.sort_order === b.sort_order) {
            return a.name.localeCompare(b.name);
        }
        return a.sort_order - b.sort_order;
    });
}

export function methodologyCodeMatches(code: string | null | undefined, candidates: string[]): boolean {
    const normalizedCode = normalizeMethodologyCode(code);
    return candidates.some((candidate) => normalizeMethodologyCode(candidate) === normalizedCode);
}
