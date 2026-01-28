'use client';

import { useState } from 'react';
import { useEditorStore } from '@/lib/store';
import { ExerciseAutocomplete } from './ExerciseAutocomplete';
import {
    X,
    Clock,
    Repeat,
    Timer,
    ChevronDown,
    Plus,
    Trash2
} from 'lucide-react';
import type { BlockType, WorkoutFormat, WorkoutConfig } from '@/lib/supabase/types';

interface BlockEditorProps {
    blockId: string;
}

const formatOptions: { value: WorkoutFormat; label: string; description: string }[] = [
    { value: 'EMOM', label: 'EMOM', description: 'Every Minute On the Minute' },
    { value: 'AMRAP', label: 'AMRAP', description: 'As Many Rounds As Possible' },
    { value: 'RFT', label: 'RFT', description: 'Rounds For Time' },
    { value: 'For Time', label: 'For Time', description: 'Complete as fast as possible' },
    { value: 'Tabata', label: 'Tabata', description: '20s work / 10s rest' },
    { value: 'Ladder', label: 'Ladder', description: 'Ascending/Descending reps' },
    { value: 'Chipper', label: 'Chipper', description: 'Complete all reps' },
    { value: 'Not For Time', label: 'Not For Time', description: 'No time component' },
];

export function BlockEditor({ blockId }: BlockEditorProps) {
    const { mesocycles, updateBlock, selectBlock, deleteBlock } = useEditorStore();

    // Find the block
    let block: {
        id: string;
        type: string;
        format: string | null;
        name: string | null;
        config: WorkoutConfig;
    } | null = null;

    for (const meso of mesocycles) {
        for (const day of meso.days) {
            const found = day.blocks.find(b => b.id === blockId);
            if (found) {
                block = found;
                break;
            }
        }
    }

    if (!block) {
        return (
            <div className="p-4 text-center text-cv-text-tertiary">
                Bloque no encontrado
            </div>
        );
    }

    const config = block.config || {};

    const handleConfigChange = (key: string, value: unknown) => {
        updateBlock(blockId, {
            config: { ...config, [key]: value } as WorkoutConfig,
        });
    };

    const handleFormatChange = (format: WorkoutFormat) => {
        updateBlock(blockId, { format });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-cv-border">
                <h3 className="font-semibold text-cv-text-primary">Ajustes del Bloque</h3>
                <button
                    onClick={() => selectBlock(null)}
                    className="cv-btn-ghost p-1"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Block Name */}
                <div>
                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                        Nombre del Bloque / Ejercicio Principal
                    </label>
                    {block.type === 'strength_linear' ? (
                        <ExerciseAutocomplete
                            value={block.name || ''}
                            onChange={(val) => updateBlock(blockId, { name: val || null })}
                            placeholder="Buscar ejercicio..."
                            className="cv-input"
                        />
                    ) : (
                        <input
                            type="text"
                            value={block.name || ''}
                            onChange={(e) => updateBlock(blockId, { name: e.target.value || null })}
                            placeholder="e.g., Metcon A, Warm-up"
                            className="cv-input"
                        />
                    )}
                </div>

                {/* Type-Specific Fields */}
                {block.type === 'strength_linear' && (
                    <StrengthForm config={config} onChange={handleConfigChange} />
                )}

                {block.type === 'metcon_structured' && (
                    <MetconForm
                        config={config}
                        format={block.format as WorkoutFormat | null}
                        onChange={handleConfigChange}
                        onFormatChange={handleFormatChange}
                    />
                )}

                {block.type === 'free_text' && (
                    <FreeTextForm config={config} onChange={handleConfigChange} />
                )}

                {(block.type === 'warmup' || block.type === 'accessory' || block.type === 'skill') && (
                    <GenericMovementForm config={config} onChange={handleConfigChange} />
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-cv-border">
                <button
                    onClick={() => { deleteBlock(blockId); selectBlock(null); }}
                    className="w-full cv-btn text-red-400 hover:bg-red-500/10 justify-center"
                >
                    <Trash2 size={16} />
                    Eliminar Bloque
                </button>
            </div>
        </div>
    );
}

// ============================================
// STRENGTH FORM
// ============================================
interface FormProps {
    config: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
}

function StrengthForm({ config, onChange }: FormProps) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                        Series
                    </label>
                    <input
                        type="number"
                        min={1}
                        value={(config.sets as number) || ''}
                        onChange={(e) => onChange('sets', parseInt(e.target.value) || null)}
                        placeholder="5"
                        className="cv-input-mono"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                        Repeticiones
                    </label>
                    <input
                        type="text"
                        value={(config.reps as string) || ''}
                        onChange={(e) => onChange('reps', e.target.value)}
                        placeholder="5 or 3-3-3"
                        className="cv-input-mono"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                    Carga / Porcentaje
                </label>
                <input
                    type="text"
                    value={(config.percentage as string) || ''}
                    onChange={(e) => onChange('percentage', e.target.value)}
                    placeholder="75% or 225lbs"
                    className="cv-input-mono"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                    Tempo (opcional)
                </label>
                <input
                    type="text"
                    value={(config.tempo as string) || ''}
                    onChange={(e) => onChange('tempo', e.target.value)}
                    placeholder="31X1"
                    className="cv-input-mono"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                    Descanso
                </label>
                <input
                    type="text"
                    value={(config.rest as string) || ''}
                    onChange={(e) => onChange('rest', e.target.value)}
                    placeholder="2:00 or As needed"
                    className="cv-input"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                    Notas
                </label>
                <textarea
                    value={(config.notes as string) || ''}
                    onChange={(e) => onChange('notes', e.target.value)}
                    placeholder="Build to heavy single, focus on depth..."
                    className="cv-input min-h-[80px] resize-none"
                />
            </div>
        </div>
    );
}

// ============================================
// METCON FORM
// ============================================
interface MetconFormProps extends FormProps {
    format: WorkoutFormat | null;
    onFormatChange: (format: WorkoutFormat) => void;
}

function MetconForm({ config, format, onChange, onFormatChange }: MetconFormProps) {
    const movements = (config.movements as string[]) || [];

    const addMovement = () => {
        onChange('movements', [...movements, '']);
    };

    const updateMovement = (index: number, value: string) => {
        const updated = [...movements];
        updated[index] = value;
        onChange('movements', updated);
    };

    const removeMovement = (index: number) => {
        onChange('movements', movements.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            {/* Format Selector */}
            <div>
                <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                    Formato del Entrenamiento
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {formatOptions.slice(0, 4).map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => onFormatChange(opt.value)}
                            className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all text-left
                ${format === opt.value
                                    ? 'bg-cv-accent text-white'
                                    : 'bg-cv-bg-tertiary text-cv-text-secondary hover:text-cv-text-primary'}
              `}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    {formatOptions.slice(4).map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => onFormatChange(opt.value)}
                            className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all text-left
                ${format === opt.value
                                    ? 'bg-cv-accent text-white'
                                    : 'bg-cv-bg-tertiary text-cv-text-secondary hover:text-cv-text-primary'}
              `}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Format-Specific Fields */}
            {format === 'EMOM' && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                            <Timer size={14} className="inline mr-1" />
                            Cada X Min
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={(config.interval as number) || ''}
                            onChange={(e) => onChange('interval', parseInt(e.target.value) || 1)}
                            placeholder="1"
                            className="cv-input-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                            <Clock size={14} className="inline mr-1" />
                            Por Y Min
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={(config.minutes as number) || ''}
                            onChange={(e) => onChange('minutes', parseInt(e.target.value) || null)}
                            placeholder="10"
                            className="cv-input-mono"
                        />
                    </div>
                </div>
            )}

            {format === 'AMRAP' && (
                <div>
                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                        <Clock size={14} className="inline mr-1" />
                        Time Cap (minutos)
                    </label>
                    <input
                        type="number"
                        min={1}
                        value={(config.minutes as number) || ''}
                        onChange={(e) => onChange('minutes', parseInt(e.target.value) || null)}
                        placeholder="12"
                        className="cv-input-mono"
                    />
                </div>
            )}

            {format === 'RFT' && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                            <Repeat size={14} className="inline mr-1" />
                            Rondas
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={(config.rounds as number) || ''}
                            onChange={(e) => onChange('rounds', parseInt(e.target.value) || null)}
                            placeholder="5"
                            className="cv-input-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                            Time Cap
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={(config.timeCap as number) || ''}
                            onChange={(e) => onChange('timeCap', parseInt(e.target.value) || null)}
                            placeholder="Optional"
                            className="cv-input-mono"
                        />
                    </div>
                </div>
            )}

            {format === 'Tabata' && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                            Trabajo (seg)
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={(config.workSeconds as number) || 20}
                            onChange={(e) => onChange('workSeconds', parseInt(e.target.value) || 20)}
                            className="cv-input-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                            Descanso (seg)
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={(config.restSeconds as number) || 10}
                            onChange={(e) => onChange('restSeconds', parseInt(e.target.value) || 10)}
                            className="cv-input-mono"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                            Rondas
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={(config.rounds as number) || 8}
                            onChange={(e) => onChange('rounds', parseInt(e.target.value) || 8)}
                            className="cv-input-mono"
                        />
                    </div>
                </div>
            )}

            {/* Movements List */}
            <div>
                <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                    Movimientos
                </label>
                <div className="space-y-2">
                    {movements.map((movement, index) => (
                        <div key={index} className="flex gap-2">
                            <div className="flex-1">
                                <ExerciseAutocomplete
                                    value={movement}
                                    onChange={(val) => updateMovement(index, val)}
                                    placeholder="e.g. 15 Wall Balls (20/14)"
                                    className="cv-input"
                                />
                            </div>
                            <button
                                onClick={() => removeMovement(index)}
                                className="cv-btn-ghost p-2 text-red-400 self-start mt-0.5"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={addMovement}
                        className="w-full py-2 border border-dashed border-cv-border rounded-lg text-cv-text-tertiary hover:text-cv-text-primary hover:border-cv-text-tertiary transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={14} />
                        Add Movement
                    </button>
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                    Notes
                </label>
                <textarea
                    value={(config.notes as string) || ''}
                    onChange={(e) => onChange('notes', e.target.value)}
                    placeholder="Scale options, strategy notes..."
                    className="cv-input min-h-[80px] resize-none"
                />
            </div>
        </div>
    );
}

// ============================================
// FREE TEXT FORM
// ============================================
function FreeTextForm({ config, onChange }: FormProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                Contenido
            </label>
            <textarea
                value={(config.content as string) || ''}
                onChange={(e) => onChange('content', e.target.value)}
                placeholder="Enter any freeform workout or notes..."
                className="cv-input min-h-[200px] resize-none font-mono text-sm"
            />
        </div>
    );
}

// ============================================
// GENERIC MOVEMENT FORM (Warmup, Accessory, Skill)
// ============================================
function GenericMovementForm({ config, onChange }: FormProps) {
    const movements = (config.movements as string[]) || [];

    const addMovement = () => {
        onChange('movements', [...movements, '']);
    };

    const updateMovement = (index: number, value: string) => {
        const updated = [...movements];
        updated[index] = value;
        onChange('movements', updated);
    };

    const removeMovement = (index: number) => {
        onChange('movements', movements.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                    Movimientos / Ejercicios
                </label>
                <div className="space-y-2">
                    {movements.map((movement, index) => (
                        <div key={index} className="flex gap-2">
                            <div className="flex-1">
                                <ExerciseAutocomplete
                                    value={movement}
                                    onChange={(val) => updateMovement(index, val)}
                                    placeholder="e.g. 3x10 Banded Good Mornings"
                                    className="cv-input"
                                />
                            </div>
                            <button
                                onClick={() => removeMovement(index)}
                                className="cv-btn-ghost p-2 text-red-400 self-start mt-0.5"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={addMovement}
                        className="w-full py-2 border border-dashed border-cv-border rounded-lg text-cv-text-tertiary hover:text-cv-text-primary hover:border-cv-text-tertiary transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={14} />
                        Add Movement
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                    Notas
                </label>
                <textarea
                    value={(config.notes as string) || ''}
                    onChange={(e) => onChange('notes', e.target.value)}
                    placeholder="Focus on quality, tempo, etc."
                    className="cv-input min-h-[80px] resize-none"
                />
            </div>
        </div>
    );
}
