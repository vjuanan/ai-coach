// Comprehensive gym equipment catalog organized by categories
// Used by onboarding flow and settings/gym profile editor

export interface EquipmentItem {
    key: string;
    label: string;
    emoji: string;
    /** If true, show a quantity input (number of units/pairs) instead of just a checkbox */
    hasQuantity?: boolean;
    /** Unit label for quantity, e.g. "pares", "unidades" */
    quantityUnit?: string;
}

export interface EquipmentCategory {
    id: string;
    title: string;
    emoji: string;
    items: EquipmentItem[];
    /** If true, this category is expanded by default */
    defaultExpanded?: boolean;
}

export const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
    {
        id: 'estructura',
        title: 'Estructura y Barras',
        emoji: '🏗️',
        defaultExpanded: true,
        items: [
            { key: 'rig', label: 'Rig / Estructura', emoji: '🏗️' },
            { key: 'pullupBars', label: 'Barras de Dominadas', emoji: '💪' },
            { key: 'barbells20', label: 'Barras Olímpicas (20kg)', emoji: '🏋️', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'barbells15', label: 'Barras Olímpicas (15kg)', emoji: '🏋️', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'trapBar', label: 'Trap Bar / Hex Bar', emoji: '🔩', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'ezCurlBar', label: 'Barra EZ Curl', emoji: '🔩', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'squatRacks', label: 'Squat Racks / Jaulas', emoji: '🔲', hasQuantity: true, quantityUnit: 'unidades' },
        ],
    },
    {
        id: 'discos',
        title: 'Discos y Pesos',
        emoji: '⚫',
        items: [
            { key: 'bumperPlates', label: 'Discos Bumper (juego completo)', emoji: '🔴' },
            { key: 'changePlates', label: 'Discos Fraccionados (0.5-2.5kg)', emoji: '⚪' },
            { key: 'ironPlates', label: 'Discos de Hierro/Metal', emoji: '⚫' },
            { key: 'barCollars', label: 'Collares / Clamps', emoji: '🔒' },
        ],
    },
    {
        id: 'mancuernas',
        title: 'Mancuernas',
        emoji: '🏋️',
        items: [
            { key: 'db_5lb', label: 'Mancuernas 5 lb (2.5 kg)', emoji: '🏋️', hasQuantity: true, quantityUnit: 'pares' },
            { key: 'db_10lb', label: 'Mancuernas 10 lb (4.5 kg)', emoji: '🏋️', hasQuantity: true, quantityUnit: 'pares' },
            { key: 'db_15lb', label: 'Mancuernas 15 lb (7 kg)', emoji: '🏋️', hasQuantity: true, quantityUnit: 'pares' },
            { key: 'db_20lb', label: 'Mancuernas 20 lb (9 kg)', emoji: '🏋️', hasQuantity: true, quantityUnit: 'pares' },
            { key: 'db_25lb', label: 'Mancuernas 25 lb (11 kg)', emoji: '🏋️', hasQuantity: true, quantityUnit: 'pares' },
            { key: 'db_30lb', label: 'Mancuernas 30 lb (13.5 kg)', emoji: '🏋️', hasQuantity: true, quantityUnit: 'pares' },
            { key: 'db_35lb', label: 'Mancuernas 35 lb (16 kg)', emoji: '🏋️', hasQuantity: true, quantityUnit: 'pares' },
            { key: 'db_40lb', label: 'Mancuernas 40 lb (18 kg)', emoji: '🏋️', hasQuantity: true, quantityUnit: 'pares' },
            { key: 'db_45lb', label: 'Mancuernas 45 lb (20 kg)', emoji: '🏋️', hasQuantity: true, quantityUnit: 'pares' },
            { key: 'db_50lb', label: 'Mancuernas 50 lb (22.5 kg)', emoji: '🏋️', hasQuantity: true, quantityUnit: 'pares' },
            { key: 'db_55lb', label: 'Mancuernas 55 lb (25 kg)', emoji: '🏋️', hasQuantity: true, quantityUnit: 'pares' },
            { key: 'db_60lb', label: 'Mancuernas 60 lb (27 kg)', emoji: '🏋️', hasQuantity: true, quantityUnit: 'pares' },
            { key: 'db_70lb', label: 'Mancuernas 70 lb (32 kg)', emoji: '🏋️', hasQuantity: true, quantityUnit: 'pares' },
            { key: 'db_80lb', label: 'Mancuernas 80 lb (36 kg)', emoji: '🏋️', hasQuantity: true, quantityUnit: 'pares' },
            { key: 'db_90lb', label: 'Mancuernas 90 lb (41 kg)', emoji: '🏋️', hasQuantity: true, quantityUnit: 'pares' },
            { key: 'db_100lb', label: 'Mancuernas 100 lb (45 kg)', emoji: '🏋️', hasQuantity: true, quantityUnit: 'pares' },
        ],
    },
    {
        id: 'kettlebells',
        title: 'Kettlebells',
        emoji: '🔔',
        items: [
            { key: 'kb_4kg', label: 'Kettlebell 4 kg (9 lb)', emoji: '🔔', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'kb_6kg', label: 'Kettlebell 6 kg (13 lb)', emoji: '🔔', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'kb_8kg', label: 'Kettlebell 8 kg (18 lb)', emoji: '🔔', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'kb_10kg', label: 'Kettlebell 10 kg (22 lb)', emoji: '🔔', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'kb_12kg', label: 'Kettlebell 12 kg (26 lb)', emoji: '🔔', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'kb_16kg', label: 'Kettlebell 16 kg (35 lb)', emoji: '🔔', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'kb_20kg', label: 'Kettlebell 20 kg (44 lb)', emoji: '🔔', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'kb_24kg', label: 'Kettlebell 24 kg (53 lb)', emoji: '🔔', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'kb_28kg', label: 'Kettlebell 28 kg (62 lb)', emoji: '🔔', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'kb_32kg', label: 'Kettlebell 32 kg (70 lb)', emoji: '🔔', hasQuantity: true, quantityUnit: 'unidades' },
        ],
    },
    {
        id: 'cardio',
        title: 'Máquinas Cardio',
        emoji: '🚴',
        defaultExpanded: true,
        items: [
            { key: 'rowers', label: 'Remos (Concept2)', emoji: '🚣', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'skiErgs', label: 'SkiErgs', emoji: '⛷️', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'assaultBikes', label: 'Assault / Echo Bikes', emoji: '🚴', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'bikeErgs', label: 'BikeErg (Concept2)', emoji: '🚲', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'treadmill', label: 'Cinta de Correr', emoji: '🏃', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'sleds', label: 'Trineos / Prowler', emoji: '🛷', hasQuantity: true, quantityUnit: 'unidades' },
        ],
    },
    {
        id: 'gimnasia',
        title: 'Gimnasia y Calistenia',
        emoji: '🤸',
        items: [
            { key: 'rings', label: 'Anillas de Gimnasia', emoji: '⭕', hasQuantity: true, quantityUnit: 'pares' },
            { key: 'plyoBoxes', label: 'Cajones Pliométricos', emoji: '📦', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'ghd', label: 'GHD (Glute-Ham Developer)', emoji: '🦵', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'climbingRopes', label: 'Cuerdas de Trepa', emoji: '🪢', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'parallettes', label: 'Parallettes', emoji: '🤸', hasQuantity: true, quantityUnit: 'pares' },
            { key: 'abmat', label: 'AbMat', emoji: '🧱', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'dips', label: 'Estación de Dips', emoji: '💪' },
        ],
    },
    {
        id: 'funcional',
        title: 'Funcional y Balones',
        emoji: '⚡',
        items: [
            { key: 'wallBalls_6kg', label: 'Wall Ball 6 kg (14 lb)', emoji: '🏐', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'wallBalls_9kg', label: 'Wall Ball 9 kg (20 lb)', emoji: '🏐', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'wallBalls_12kg', label: 'Wall Ball 12 kg (26 lb)', emoji: '🏐', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'slamBalls', label: 'Slam Balls', emoji: '🏀', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'medicineBalls', label: 'Medicine Balls', emoji: '🏀', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'dBalls', label: 'D-Balls / Atlas Stones', emoji: '🪨', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'sandbags', label: 'Sandbags', emoji: '💰', hasQuantity: true, quantityUnit: 'unidades' },
        ],
    },
    {
        id: 'accesorios',
        title: 'Accesorios',
        emoji: '🔧',
        items: [
            { key: 'jumpRopes', label: 'Cuerdas de Saltar (Speed Rope)', emoji: '⏭️', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'resistanceBands', label: 'Bandas Elásticas', emoji: '🟡' },
            { key: 'weightedVest', label: 'Chaleco Lastrado', emoji: '🦺', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'bench', label: 'Banco Plano / Inclinado', emoji: '🪑', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'yoke', label: 'Yoke', emoji: '🔩', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'foamRollers', label: 'Foam Rollers', emoji: '🧽', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'mats', label: 'Colchonetas', emoji: '🧘', hasQuantity: true, quantityUnit: 'unidades' },
            { key: 'pool', label: 'Piscina', emoji: '🏊' },
        ],
    },
];

/**
 * Flat map of all equipment keys to labels (for display in view mode)
 */
export const EQUIPMENT_LABELS: Record<string, string> = {};
EQUIPMENT_CATEGORIES.forEach(cat => {
    cat.items.forEach(item => {
        EQUIPMENT_LABELS[item.key] = `${item.emoji} ${item.label}`;
    });
});

// Also support legacy keys that might exist in old data
const LEGACY_KEYS: Record<string, string> = {
    dumbbells: '🏋️ Mancuernas',
    barbells: '🏋️ Barras Olímpicas',
    kettlebells: '🔔 Kettlebells',
};
Object.entries(LEGACY_KEYS).forEach(([k, v]) => {
    if (!EQUIPMENT_LABELS[k]) EQUIPMENT_LABELS[k] = v;
});

/**
 * Build default equipment_available object with all keys set to false/0
 */
export function buildDefaultEquipment(): Record<string, boolean | number> {
    const result: Record<string, boolean | number> = {};
    EQUIPMENT_CATEGORIES.forEach(cat => {
        cat.items.forEach(item => {
            result[item.key] = item.hasQuantity ? 0 : false;
        });
    });
    return result;
}

/**
 * Get display text for an equipment value
 */
export function getEquipmentDisplayValue(key: string, value: boolean | number): string | null {
    const label = EQUIPMENT_LABELS[key] || key;
    if (typeof value === 'number' && value > 0) {
        // Find the item to get the quantity unit
        for (const cat of EQUIPMENT_CATEGORIES) {
            const item = cat.items.find(i => i.key === key);
            if (item?.hasQuantity) {
                return `${label} (${value} ${item.quantityUnit || 'unidades'})`;
            }
        }
        return `${label} (${value})`;
    }
    if (value === true) return label;
    return null;
}
