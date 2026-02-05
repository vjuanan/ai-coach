// Database Types for CV-OS
// These match the Supabase schema

export type ClientType = 'athlete' | 'gym';
export type BlockType = 'strength_linear' | 'metcon_structured' | 'warmup' | 'accessory' | 'skill' | 'free_text';
export type WorkoutFormat = 'AMRAP' | 'EMOM' | 'RFT' | 'Chipper' | 'Ladder' | 'Tabata' | 'Not For Time' | 'For Time' | 'STANDARD';
export type ExerciseCategory = 'Weightlifting' | 'Gymnastics' | 'Monostructural' | 'Functional Bodybuilding';

// JSONB Config Types for Workout Blocks
export interface StrengthConfig {
    sets: number;
    reps: string;
    percentage?: string;
    tempo?: string;
    rest?: string;
    notes?: string;
    [key: string]: any;
}

export interface EMOMConfig {
    minutes: number;
    interval: number; // every X minutes
    movements: string[];
    notes?: string;
    [key: string]: any;
}

export interface AMRAPConfig {
    minutes: number;
    movements: string[];
    notes?: string;
    [key: string]: any;
}

export interface RFTConfig {
    rounds: number;
    timeCap?: number;
    movements: string[];
    notes?: string;
    [key: string]: any;
}

export interface TabataConfig {
    rounds: number;
    workSeconds: number;
    restSeconds: number;
    movement: string;
    notes?: string;
    [key: string]: any;
}

export interface LadderConfig {
    direction: 'ascending' | 'descending' | 'pyramid';
    startReps: number;
    endReps: number;
    increment: number;
    movements: string[];
    notes?: string;
    [key: string]: any;
}

export interface FreeTextConfig {
    content: string;
    [key: string]: any;
}

export type WorkoutConfig =
    | StrengthConfig
    | EMOMConfig
    | AMRAPConfig
    | RFTConfig
    | TabataConfig
    | LadderConfig
    | FreeTextConfig;

// Database Table Types
export interface Coach {
    id: string;
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    business_name: string | null;
    created_at: string;
    updated_at: string;
}

export interface Client {
    id: string;
    coach_id: string;
    type: ClientType;
    name: string;
    logo_url: string | null;
    email: string | null;
    phone: string | null;
    details: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface Program {
    id: string;
    coach_id: string;
    client_id: string | null;
    name: string;
    description: string | null;
    status: 'draft' | 'active' | 'archived';
    is_template?: boolean;
    attributes?: {
        inspired_by?: string;
        methodology?: string[];
        gradient?: string;
        focus?: string;
        duration_weeks?: number;
        days_per_week?: number;
        key_concepts?: string[];
    } | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface TrainingPrinciple {
    id: string;
    objective: string; // 'crossfit', 'strength', 'hypertrophy'
    author: string;
    category: string;
    title: string;
    content: Record<string, unknown>;
    decision_framework: string | null;
    context_factors: string[] | null;
    tags: string[] | null;
    created_at: string;
}

export interface Mesocycle {
    id: string;
    program_id: string;
    week_number: number;
    focus: string | null;
    attributes: {
        volume?: 'low' | 'moderate' | 'high';
        intensity?: 'low' | 'moderate' | 'high';
        deload?: boolean;
    } | null;
    created_at: string;
    updated_at: string;
}

export interface StimulusFeature {
    id: string;
    coach_id: string | null;
    name: string;
    color: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface Day {
    id: string;
    mesocycle_id: string;
    day_number: number; // 1-7
    name: string | null; // e.g., "Monday" or custom name
    date: string | null;
    is_rest_day: boolean;
    notes: string | null;
    stimulus_id: string | null;
    stimulus?: StimulusFeature | null; // Joined
    created_at: string;
    updated_at: string;
    // Joined fields
    blocks?: WorkoutBlock[];
}

export interface WorkoutBlock {
    id: string;
    day_id: string;
    order_index: number;
    type: BlockType;
    format: WorkoutFormat | null;
    name: string | null;
    config: WorkoutConfig;
    created_at: string;
    updated_at: string;
}

export interface Exercise {
    id: string;
    name: string;
    category: ExerciseCategory;
    subcategory: string | null;
    modality_suitability: string[];
    equipment: string[];
    description: string | null;
    video_url: string | null;
    created_at: string;
}

export interface EquipmentCatalog {
    id: string;
    name: string;
    category: string;
    created_at: string;
}

export interface TrainingMethodologyFormField {
    key: string;
    label: string;
    type: 'number' | 'text' | 'select' | 'movements_list';
    placeholder?: string;
    options?: string[];
    default?: unknown;
    required?: boolean;
    help?: string;
}

export interface TrainingMethodology {
    id: string;
    code: string;
    name: string;
    description: string;
    category: 'metcon' | 'strength' | 'hiit' | 'conditioning';
    form_config: {
        fields: TrainingMethodologyFormField[];
    };
    default_values: Record<string, unknown>;
    icon: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
}


export interface Profile {
    id: string;
    email: string | null;
    full_name: string | null;
    role: 'coach' | 'athlete' | 'admin' | null;
    birth_date?: string | null;
    height?: number | null;
    weight?: number | null;
    main_goal?: string | null;
    training_place?: string | null;
    equipment_list?: string[] | null;
    days_per_week?: number | null;
    minutes_per_session?: number | null;
    experience_level?: string | null;
    injuries?: string | null;
    training_preferences?: string | null;
    whatsapp_number?: string | null;
    avatar_url?: string | null;
    created_at: string;
    updated_at: string;
}

// Supabase Database Type (for typed client)
export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: Profile;
                Insert: Omit<Profile, 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
            };
            coaches: {
                Row: Coach;
                Insert: Omit<Coach, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Coach, 'id'>>;
            };
            clients: {
                Row: Client;
                Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Client, 'id'>>;
            };
            programs: {
                Row: Program;
                Insert: Omit<Program, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Program, 'id'>>;
            };
            mesocycles: {
                Row: Mesocycle;
                Insert: Omit<Mesocycle, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Mesocycle, 'id'>>;
            };
            days: {
                Row: Day;
                Insert: Omit<Day, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Day, 'id'>>;
            };
            workout_blocks: {
                Row: WorkoutBlock;
                Insert: Omit<WorkoutBlock, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<WorkoutBlock, 'id'>>;
            };
            exercises: {
                Row: Exercise;
                Insert: Omit<Exercise, 'id' | 'created_at'>;
                Update: Partial<Omit<Exercise, 'id'>>;
            };
            stimulus_features: {
                Row: StimulusFeature;
                Insert: Omit<StimulusFeature, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<StimulusFeature, 'id' | 'created_at' | 'updated_at'>>;
            };
        };
        Enums: {
            client_type: ClientType;
            block_type: BlockType;
            workout_format: WorkoutFormat;
            exercise_category: ExerciseCategory;
            user_role: 'coach' | 'athlete' | 'admin';
        };
    };
}

