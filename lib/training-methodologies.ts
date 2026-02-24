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
        movements: 'Define los ejercicios que se van rotando por intervalo.',
    },
    EMOM_ALT: {
        minutes: 'Duracion total en minutos.',
        interval: 'Frecuencia del bloque (1 = alterna cada minuto).',
        movements: 'Carga los ejercicios en el orden de alternancia.',
    },
    E2MOM: {
        minutes: 'Duracion total del bloque en minutos.',
        interval: 'Mantener en 2 para E2MOM (cada 2 minutos).',
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
        startingReps: 'Reps iniciales del minuto 1.',
        increment: 'Reps que se suman en cada nueva ronda.',
        maxMinutes: 'Límite opcional de minutos para cortar el bloque.',
        movements: 'Ejercicio principal del Death By.',
    },
    TABATA: {
        rounds: 'Cantidad de rondas Tabata.',
        workSeconds: 'Segundos de trabajo por ronda.',
        restSeconds: 'Segundos de descanso por ronda.',
        movements: 'Ejercicio(s) del protocolo Tabata.',
    },
    LADDER: {
        direction: 'Ascendente, descendente o piramidal.',
        startReps: 'Reps con las que inicia la escalera.',
        endReps: 'Reps objetivo del tramo final.',
        increment: 'Cuantas reps se agregan o quitan por escalon.',
        intensityTarget: 'Referencia de intensidad: 1-10 para RPE o >10 para %1RM.',
        movements: 'Ejercicio(s) que siguen la escalera.',
    },
    INTERVALS: {
        rounds: 'Cantidad de intervalos totales.',
        workSeconds: 'Segundos de trabajo por intervalo.',
        restSeconds: 'Segundos de descanso entre intervalos.',
        movements: 'Ejercicios del tramo de trabajo.',
    },
    STANDARD: {
        sets: 'Series totales a completar.',
        reps: 'Repeticiones por serie.',
        percentage: 'Porcentaje del 1RM si trabajas por intensidad relativa.',
        restSeconds: 'Descanso entre series en segundos.',
        movements: 'Ejercicio(s) del bloque.',
    },
    CLUSTER: {
        sets: 'Cantidad de clusters.',
        miniSets: 'Cantidad de mini-bloques dentro de cada cluster.',
        repsPerMiniSet: 'Repeticiones por cada mini-bloque.',
        intraRestSeconds: 'Pausa corta dentro del cluster (segundos).',
        interRestSeconds: 'Descanso al terminar cada cluster (segundos).',
        percentage: 'Intensidad sugerida en % del 1RM.',
        movements: 'Ejercicio(s) a trabajar en cluster.',
    },
    DROP_SET: {
        drops: 'Cantidad de reducciones de carga.',
        repsPerDrop: 'Reps por cada drop.',
        weightReductionPct: 'Porcentaje de reducción de carga por drop.',
        startingLoadPct: 'Carga inicial recomendada en % del 1RM.',
        movements: 'Ejercicio(s) sobre los que aplica el dropset.',
    },
    GIANT_SET: {
        rounds: 'Cantidad de rondas del giant set.',
        repsPerMovement: 'Repeticiones objetivo por ejercicio en cada ronda.',
        intensityTarget: 'Referencia de intensidad: 1-10 para RPE o >10 para %1RM.',
        restBetweenMovementsSeconds: 'Descanso opcional entre ejercicios del circuito.',
        restBetweenRoundsSeconds: 'Descanso entre rondas completas (segundos).',
        movements: 'Ejercicios del giant set en secuencia.',
    },
    SUPER_SET: {
        sets: 'Series del super set.',
        repsPerMovement: 'Repeticiones objetivo por ejercicio en cada serie.',
        intensityTarget: 'Referencia de intensidad: 1-10 para RPE o >10 para %1RM.',
        restBetweenMovementsSeconds: 'Descanso opcional entre ejercicios del par.',
        movements: 'Ejercicios A y B (o mas) que se alternan sin descanso.',
        restBetweenSetsSeconds: 'Descanso entre series del super set (segundos).',
    },
    NOT_FOR_TIME: {
        rounds: 'Rondas opcionales para ordenar el volumen total.',
        repsPerMovement: 'Repeticiones objetivo por ejercicio en cada ronda.',
        movements: 'Ejercicios tecnicos del bloque sin reloj.',
    },
    TEMPO: {
        sets: 'Series a completar.',
        reps: 'Repeticiones por serie.',
        tempoEccentric: 'Segundos de fase eccéntrica.',
        tempoBottom: 'Segundos de pausa abajo.',
        tempoConcentric: 'Segundos de fase concéntrica.',
        tempoTop: 'Segundos de pausa arriba.',
        restSeconds: 'Descanso entre series en segundos.',
        movements: 'Ejercicio(s) del bloque tempo.',
    },
    DROPSET_FINISHER: {
        drops: 'Cantidad de drops en el finisher.',
        repsPerDrop: 'Repeticiones por cada drop.',
        weightReductionPct: 'Reduccion de carga por drop en porcentaje.',
        startingLoadPct: 'Carga inicial recomendada en % del 1RM.',
        movements: 'Ejercicio principal del finisher.',
    },
    REST_PAUSE: {
        totalReps: 'Objetivo total de repeticiones acumuladas.',
        restSeconds: 'Micro-descanso en segundos entre mini-series.',
        clusters: 'Cantidad de mini-bloques objetivo.',
        intensityTarget: 'Referencia de intensidad: 1-10 para RPE o >10 para %1RM.',
        movements: 'Ejercicio principal del rest-pause.',
    },
    LADDER_FINISHER: {
        direction: 'Elige si la escalera sube, baja o sube/baja.',
        repsStart: 'Repeticiones del primer escalon.',
        repsPeak: 'Repeticiones maximas o ultimo escalon.',
        increment: 'Reps que cambian por escalon.',
        intensityTarget: 'Referencia de intensidad: 1-10 para RPE o >10 para %1RM.',
        movements: 'Ejercicio(s) que siguen la escalera.',
    },
    '21S': {
        sets: 'Cantidad de series 21s.',
        intensityTarget: 'Referencia de intensidad: 1-10 para RPE o >10 para %1RM.',
        movements: 'Ejercicio recomendado de aislamiento.',
    },
    ISO_HOLD: {
        sets: 'Series del finisher.',
        holdSeconds: 'Segundos de pausa isometrica por repeticion o al final.',
        reps: 'Cantidad de reps objetivo.',
        intensityTarget: 'Referencia de intensidad: 1-10 para RPE o >10 para %1RM.',
        movements: 'Ejercicio sobre el que se aplica la pausa.',
    },
    '1_5_REPS': {
        sets: 'Series del finisher 1.5.',
        reps: 'Repeticiones objetivo (cada una incluye media repeticion extra).',
        intensityTarget: 'Referencia de intensidad: 1-10 para RPE o >10 para %1RM.',
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
    EMOM: [
        { key: 'minutes', label: 'Duración Total (min)', type: 'number', placeholder: '10', required: true, default: 10 },
        { key: 'interval', label: 'Cada (min)', type: 'number', placeholder: '1', required: true, default: 1 },
        { key: 'movements', label: 'Movimientos', type: 'movements_list', required: true },
    ],
    EMOM_ALT: [
        { key: 'minutes', label: 'Duración Total (min)', type: 'number', placeholder: '12', required: true, default: 12 },
        { key: 'interval', label: 'Cada (min)', type: 'number', placeholder: '1', required: true, default: 1 },
        { key: 'movements', label: 'Movimientos', type: 'movements_list', required: true },
    ],
    E2MOM: [
        { key: 'minutes', label: 'Duración Total (min)', type: 'number', placeholder: '12', required: true, default: 12 },
        { key: 'interval', label: 'Cada (min)', type: 'number', placeholder: '2', required: true, default: 2 },
        { key: 'movements', label: 'Movimientos', type: 'movements_list', required: true },
    ],
    AMRAP: [
        { key: 'minutes', label: 'Duración Total (min)', type: 'number', placeholder: '12', required: true, default: 12 },
        { key: 'movements', label: 'Movimientos', type: 'movements_list', required: true },
    ],
    RFT: [
        { key: 'rounds', label: 'Rondas', type: 'number', placeholder: '5', required: true, default: 5 },
        { key: 'timeCap', label: 'Time Cap (min)', type: 'number', placeholder: '20' },
        { key: 'movements', label: 'Movimientos', type: 'movements_list', required: true },
    ],
    FOR_TIME: [
        { key: 'timeCap', label: 'Time Cap (min)', type: 'number', placeholder: '15' },
        { key: 'movements', label: 'Movimientos', type: 'movements_list', required: true },
    ],
    CHIPPER: [
        { key: 'timeCap', label: 'Time Cap (min)', type: 'number', placeholder: '25' },
        { key: 'movements', label: 'Movimientos', type: 'movements_list', required: true },
    ],
    DEATH_BY: [
        { key: 'startingReps', label: 'Reps Inicio', type: 'number', placeholder: '1', required: true, default: 1 },
        { key: 'increment', label: 'Incremento / Minuto', type: 'number', placeholder: '1', required: true, default: 1 },
        { key: 'maxMinutes', label: 'Límite (min, opcional)', type: 'number', placeholder: '20' },
        { key: 'movements', label: 'Movimiento', type: 'movements_list', required: true },
    ],
    TABATA: [
        { key: 'rounds', label: 'Rondas', type: 'number', placeholder: '8', required: true, default: 8 },
        { key: 'workSeconds', label: 'Trabajo (seg)', type: 'number', placeholder: '20', required: true, default: 20 },
        { key: 'restSeconds', label: 'Descanso (seg)', type: 'number', placeholder: '10', required: true, default: 10 },
        { key: 'movements', label: 'Movimientos', type: 'movements_list', required: true },
    ],
    LADDER: [
        { key: 'direction', label: 'Dirección', type: 'select', options: ['ascending', 'descending', 'pyramid'], default: 'ascending', required: true },
        { key: 'startReps', label: 'Reps Inicio', type: 'number', placeholder: '1', required: true, default: 1 },
        { key: 'endReps', label: 'Reps Pico/Final', type: 'number', placeholder: '10', required: true, default: 10 },
        { key: 'increment', label: 'Incremento por Escalón', type: 'number', placeholder: '1', required: true, default: 1 },
        { key: 'intensityTarget', label: 'Intensidad Objetivo (RPE/%/kg)', type: 'number', placeholder: '8', required: true, default: 8 },
        { key: 'movements', label: 'Movimientos', type: 'movements_list', required: true },
    ],
    INTERVALS: [
        { key: 'rounds', label: 'Intervalos', type: 'number', placeholder: '5', required: true, default: 5 },
        { key: 'workSeconds', label: 'Trabajo (seg)', type: 'number', placeholder: '40', required: true, default: 40 },
        { key: 'restSeconds', label: 'Descanso (seg)', type: 'number', placeholder: '20', required: true, default: 20 },
        { key: 'movements', label: 'Movimientos', type: 'movements_list', required: true },
    ],
    STANDARD: [
        { key: 'sets', label: 'Series', type: 'number', placeholder: '3', required: true, default: 3 },
        { key: 'reps', label: 'Repeticiones', type: 'number', placeholder: '10', required: true, default: 10 },
        { key: 'percentage', label: '% del 1RM', type: 'number', placeholder: '75' },
        { key: 'restSeconds', label: 'Descanso (seg)', type: 'number', placeholder: '90' },
        { key: 'movements', label: 'Movimientos', type: 'movements_list', required: true },
    ],
    CLUSTER: [
        { key: 'sets', label: 'Clusters', type: 'number', placeholder: '4', required: true, default: 4 },
        { key: 'miniSets', label: 'Mini-Sets', type: 'number', placeholder: '3', required: true, default: 3 },
        { key: 'repsPerMiniSet', label: 'Reps por Mini-Set', type: 'number', placeholder: '2', required: true, default: 2 },
        { key: 'intraRestSeconds', label: 'Descanso Intra-Set (seg)', type: 'number', placeholder: '15', required: true, default: 15 },
        { key: 'interRestSeconds', label: 'Descanso Entre Sets (seg)', type: 'number', placeholder: '60', default: 60 },
        { key: 'percentage', label: '% del 1RM', type: 'number', placeholder: '80' },
        { key: 'movements', label: 'Movimientos', type: 'movements_list', required: true },
    ],
    DROP_SET: [
        { key: 'drops', label: 'Número de Drops', type: 'number', placeholder: '3', required: true, default: 3 },
        { key: 'repsPerDrop', label: 'Reps por Drop', type: 'number', placeholder: '8', required: true, default: 8 },
        { key: 'weightReductionPct', label: 'Reducción de Peso (%)', type: 'number', placeholder: '20', required: true, default: 20 },
        { key: 'startingLoadPct', label: 'Carga Inicial (%1RM)', type: 'number', placeholder: '75', required: true, default: 75 },
        { key: 'movements', label: 'Movimientos', type: 'movements_list', required: true },
    ],
    GIANT_SET: [
        { key: 'rounds', label: 'Rondas', type: 'number', placeholder: '3', required: true, default: 3 },
        { key: 'repsPerMovement', label: 'Reps por Ejercicio', type: 'number', placeholder: '10', required: true, default: 10 },
        { key: 'intensityTarget', label: 'Intensidad Objetivo (RPE/%/kg)', type: 'number', placeholder: '8', required: true, default: 8 },
        { key: 'restBetweenMovementsSeconds', label: 'Descanso entre Ejercicios (seg)', type: 'number', placeholder: '0', default: 0 },
        { key: 'restBetweenRoundsSeconds', label: 'Descanso entre Rondas (seg)', type: 'number', placeholder: '120', default: 120 },
        { key: 'movements', label: 'Movimientos', type: 'movements_list', required: true },
    ],
    SUPER_SET: [
        { key: 'sets', label: 'Series', type: 'number', placeholder: '4', required: true, default: 4 },
        { key: 'repsPerMovement', label: 'Reps por Ejercicio', type: 'number', placeholder: '10', required: true, default: 10 },
        { key: 'intensityTarget', label: 'Intensidad Objetivo (RPE/%/kg)', type: 'number', placeholder: '8', required: true, default: 8 },
        { key: 'restBetweenMovementsSeconds', label: 'Descanso entre Ejercicios (seg)', type: 'number', placeholder: '0', default: 0 },
        { key: 'restBetweenSetsSeconds', label: 'Descanso entre Sets (seg)', type: 'number', placeholder: '90', default: 90 },
        { key: 'movements', label: 'Movimientos', type: 'movements_list', required: true },
    ],
    NOT_FOR_TIME: [
        { key: 'rounds', label: 'Rondas (opcional)', type: 'number', placeholder: '3' },
        { key: 'repsPerMovement', label: 'Reps por Ejercicio', type: 'number', placeholder: '10', required: true, default: 10 },
        { key: 'movements', label: 'Movimientos', type: 'movements_list', required: true },
    ],
    TEMPO: [
        { key: 'sets', label: 'Series', type: 'number', placeholder: '3', required: true, default: 3 },
        { key: 'reps', label: 'Repeticiones', type: 'number', placeholder: '10', required: true, default: 10 },
        { key: 'tempoEccentric', label: 'Tempo Excéntrico (seg)', type: 'number', placeholder: '3', required: true, default: 3 },
        { key: 'tempoBottom', label: 'Pausa Abajo (seg)', type: 'number', placeholder: '1', required: true, default: 1 },
        { key: 'tempoConcentric', label: 'Tempo Concéntrico (seg)', type: 'number', placeholder: '1', required: true, default: 1 },
        { key: 'tempoTop', label: 'Pausa Arriba (seg)', type: 'number', placeholder: '1', required: true, default: 1 },
        { key: 'restSeconds', label: 'Descanso (seg)', type: 'number', placeholder: '90', default: 90 },
        { key: 'movements', label: 'Movimientos', type: 'movements_list', required: true },
    ],
    DROPSET_FINISHER: [
        { key: 'drops', label: 'Número de Drops', type: 'number', placeholder: '2', required: true, default: 2 },
        { key: 'repsPerDrop', label: 'Reps por Drop', type: 'number', placeholder: '10', required: true, default: 10 },
        { key: 'weightReductionPct', label: 'Reducción de Peso (%)', type: 'number', placeholder: '20', required: true, default: 20 },
        { key: 'startingLoadPct', label: 'Carga Inicial (%1RM)', type: 'number', placeholder: '75', required: true, default: 75 },
        { key: 'movements', label: 'Ejercicio', type: 'movements_list', required: true },
    ],
    REST_PAUSE: [
        { key: 'totalReps', label: 'Reps Totales', type: 'number', placeholder: '20', required: true, default: 20 },
        { key: 'restSeconds', label: 'Micro-Descanso (seg)', type: 'number', placeholder: '15', required: true, default: 15 },
        { key: 'clusters', label: 'Mini-Bloques', type: 'number', placeholder: '3', default: 3 },
        { key: 'intensityTarget', label: 'Intensidad Objetivo (RPE/%/kg)', type: 'number', placeholder: '8', required: true, default: 8 },
        { key: 'movements', label: 'Ejercicio', type: 'movements_list', required: true },
    ],
    LADDER_FINISHER: [
        { key: 'direction', label: 'Direccion', type: 'select', options: ['ascending', 'descending', 'pyramid'], default: 'ascending', required: true },
        { key: 'repsStart', label: 'Reps inicio', type: 'number', placeholder: '1', default: 1, required: true },
        { key: 'repsPeak', label: 'Reps pico/final', type: 'number', placeholder: '10', default: 10, required: true },
        { key: 'increment', label: 'Incremento por escalon', type: 'number', placeholder: '1', default: 1, required: true },
        { key: 'intensityTarget', label: 'Intensidad Objetivo (RPE/%/kg)', type: 'number', placeholder: '8', required: true, default: 8 },
        { key: 'movements', label: 'Movimientos', type: 'movements_list', required: true },
    ],
    '21S': [
        { key: 'sets', label: 'Series', type: 'number', placeholder: '2', required: true, default: 2 },
        { key: 'intensityTarget', label: 'Intensidad Objetivo (RPE/%/kg)', type: 'number', placeholder: '8', required: true, default: 8 },
        { key: 'movements', label: 'Ejercicio', type: 'movements_list', required: true },
    ],
    ISO_HOLD: [
        { key: 'sets', label: 'Series', type: 'number', placeholder: '2', required: true, default: 2 },
        { key: 'holdSeconds', label: 'Pausa Isométrica (seg)', type: 'number', placeholder: '3', required: true, default: 3 },
        { key: 'reps', label: 'Repeticiones', type: 'number', placeholder: '10', required: true, default: 10 },
        { key: 'intensityTarget', label: 'Intensidad Objetivo (RPE/%/kg)', type: 'number', placeholder: '8', required: true, default: 8 },
        { key: 'movements', label: 'Ejercicio', type: 'movements_list', required: true },
    ],
    '1_5_REPS': [
        { key: 'sets', label: 'Series', type: 'number', placeholder: '3', required: true, default: 3 },
        { key: 'reps', label: 'Repeticiones', type: 'number', placeholder: '8', required: true, default: 8 },
        { key: 'intensityTarget', label: 'Intensidad Objetivo (RPE/%/kg)', type: 'number', placeholder: '8', required: true, default: 8 },
        { key: 'movements', label: 'Ejercicio', type: 'movements_list', required: true },
    ],
};

const DEFAULT_VALUE_OVERRIDES: Record<string, Record<string, unknown>> = {
    EMOM: { minutes: 10, interval: 1, movements: [] },
    EMOM_ALT: { minutes: 12, interval: 1, movements: [] },
    E2MOM: { minutes: 12, interval: 2, movements: [] },
    AMRAP: { minutes: 12, movements: [] },
    RFT: { rounds: 5, timeCap: 20, movements: [] },
    FOR_TIME: { timeCap: 15, movements: [] },
    CHIPPER: { timeCap: 20, movements: [] },
    DEATH_BY: { startingReps: 1, increment: 1, maxMinutes: 20, movements: [] },
    TABATA: { rounds: 8, workSeconds: 20, restSeconds: 10, movements: [] },
    LADDER: { direction: 'ascending', startReps: 1, endReps: 10, increment: 1, intensityTarget: 8, movements: [] },
    INTERVALS: { rounds: 5, workSeconds: 40, restSeconds: 20, movements: [] },
    STANDARD: { sets: 3, reps: 10, percentage: 75, restSeconds: 90, movements: [] },
    CLUSTER: { sets: 4, miniSets: 3, repsPerMiniSet: 2, intraRestSeconds: 15, interRestSeconds: 60, percentage: 80, movements: [] },
    DROP_SET: { drops: 3, repsPerDrop: 8, weightReductionPct: 20, startingLoadPct: 75, movements: [] },
    GIANT_SET: { rounds: 3, repsPerMovement: 10, intensityTarget: 8, restBetweenMovementsSeconds: 0, restBetweenRoundsSeconds: 120, movements: [] },
    SUPER_SET: { sets: 4, repsPerMovement: 10, intensityTarget: 8, restBetweenMovementsSeconds: 0, restBetweenSetsSeconds: 90, movements: [] },
    NOT_FOR_TIME: { rounds: 3, repsPerMovement: 10, movements: [] },
    TEMPO: { sets: 3, reps: 10, tempoEccentric: 3, tempoBottom: 1, tempoConcentric: 1, tempoTop: 1, restSeconds: 90, movements: [] },
    DROPSET_FINISHER: { drops: 2, repsPerDrop: 10, weightReductionPct: 20, startingLoadPct: 75, movements: [] },
    REST_PAUSE: { totalReps: 20, restSeconds: 15, clusters: 3, intensityTarget: 8, movements: [] },
    LADDER_FINISHER: { direction: 'ascending', repsStart: 1, repsPeak: 10, increment: 1, intensityTarget: 8, movements: [] },
    '21S': { sets: 2, intensityTarget: 8, movements: [] },
    ISO_HOLD: { sets: 2, holdSeconds: 3, reps: 10, intensityTarget: 8, movements: [] },
    '1_5_REPS': { sets: 3, reps: 8, intensityTarget: 8, movements: [] },
};

const SELECT_OPTION_LABELS_ES: Record<string, string> = {
    ascending: 'Ascendente',
    descending: 'Descendente',
    pyramid: 'Piramide',
    reps: 'Reps',
    seconds: 'Segundos',
    meters: 'Metros',
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

export function getTrainingMethodologyDefaultValues(
    code: string | null | undefined
): Record<string, unknown> {
    const normalizedCode = normalizeMethodologyCode(code);
    return { ...(DEFAULT_VALUE_OVERRIDES[normalizedCode] || {}) };
}

export function methodologyCodeMatches(code: string | null | undefined, candidates: string[]): boolean {
    const normalizedCode = normalizeMethodologyCode(code);
    return candidates.some((candidate) => normalizeMethodologyCode(candidate) === normalizedCode);
}
