'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { createExercise } from '@/lib/actions';
import { Loader2, Plus, X } from 'lucide-react';
import { ExerciseCategory } from '@/lib/supabase/types';

interface ExerciseCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialName?: string;
    onSuccess: (exerciseName: string) => void;
}

const CATEGORIES: ExerciseCategory[] = ['Weightlifting', 'Gymnastics', 'Monostructural', 'Functional Bodybuilding'];

export function ExerciseCreationModal({ isOpen, onClose, initialName = '', onSuccess }: ExerciseCreationModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState(initialName);
    const [category, setCategory] = useState<ExerciseCategory>('Weightlifting');
    const [subcategory, setSubcategory] = useState('');
    const [equipment, setEquipment] = useState<string[]>([]);
    const [modalitySuitability, setModalitySuitability] = useState<string[]>([]);
    const [videoUrl, setVideoUrl] = useState('');
    const [description, setDescription] = useState('');

    // Helpers for array fields
    const [equipmentInput, setEquipmentInput] = useState('');
    const [modalityInput, setModalityInput] = useState('');

    const handleAddArrayItem = (
        value: string,
        list: string[],
        setList: (l: string[]) => void,
        setInput: (s: string) => void
    ) => {
        if (value.trim() && !list.includes(value.trim())) {
            setList([...list, value.trim()]);
            setInput('');
        }
    };

    const handleRemoveArrayItem = (index: number, list: string[], setList: (l: string[]) => void) => {
        setList(list.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError('El nombre es obligatorio');
            return;
        }

        setLoading(true);

        try {
            const result = await createExercise({
                name,
                category,
                subcategory: subcategory || undefined,
                equipment,
                modality_suitability: modalitySuitability,
                video_url: videoUrl || undefined,
                description: description || undefined
            });

            if (result.error) {
                setError(result.error);
            } else if (result.data) {
                onSuccess(result.data.name);
                onClose();
            }
        } catch (err) {
            setError('Error al crear el ejercicio');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Crear Nuevo Ejercicio"
            description="Añade un ejercicio a la biblioteca global."
            maxWidth="max-w-2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4 text-cv-text-primary">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-cv-text-secondary mb-1">Nombre</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="cv-input w-full"
                            placeholder="Ej: Push Press"
                            autoFocus
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-cv-text-secondary mb-1">Categoría</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
                            className="cv-input w-full"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Subcategory */}
                    <div>
                        <label className="block text-sm font-medium text-cv-text-secondary mb-1">Subcategoría (Opcional)</label>
                        <input
                            type="text"
                            value={subcategory}
                            onChange={(e) => setSubcategory(e.target.value)}
                            className="cv-input w-full"
                            placeholder="Ej: Overhead, Squat..."
                        />
                    </div>

                    {/* Equipment */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-cv-text-secondary mb-1">Equipamiento</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={equipmentInput}
                                onChange={(e) => setEquipmentInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddArrayItem(equipmentInput, equipment, setEquipment, setEquipmentInput))}
                                className="cv-input flex-1"
                                placeholder="Ej: Barbell, Dumbbell (Enter para añadir)"
                            />
                            <button
                                type="button"
                                onClick={() => handleAddArrayItem(equipmentInput, equipment, setEquipment, setEquipmentInput)}
                                className="bg-cv-bg-elevated border border-cv-border p-2 rounded-lg hover:bg-cv-bg-tertiary"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {equipment.map((item, idx) => (
                                <span key={idx} className="bg-cv-bg-tertiary px-2 py-1 rounded-md text-xs flex items-center gap-1">
                                    {item}
                                    <button type="button" onClick={() => handleRemoveArrayItem(idx, equipment, setEquipment)} className="hover:text-red-400">
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Modality Suitability */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-cv-text-secondary mb-1">Modalidades (Suitability)</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={modalityInput}
                                onChange={(e) => setModalityInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddArrayItem(modalityInput, modalitySuitability, setModalitySuitability, setModalityInput))}
                                className="cv-input flex-1"
                                placeholder="Ej: Strength, Metcon, hypertrophy (Enter para añadir)"
                            />
                            <button
                                type="button"
                                onClick={() => handleAddArrayItem(modalityInput, modalitySuitability, setModalitySuitability, setModalityInput)}
                                className="bg-cv-bg-elevated border border-cv-border p-2 rounded-lg hover:bg-cv-bg-tertiary"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {modalitySuitability.map((item, idx) => (
                                <span key={idx} className="bg-cv-bg-tertiary px-2 py-1 rounded-md text-xs flex items-center gap-1">
                                    {item}
                                    <button type="button" onClick={() => handleRemoveArrayItem(idx, modalitySuitability, setModalitySuitability)} className="hover:text-red-400">
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Video URL */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-cv-text-secondary mb-1">URL Video (Youtube/Vimeo)</label>
                        <input
                            type="url"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            className="cv-input w-full"
                            placeholder="https://..."
                        />
                    </div>

                    {/* Description */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-cv-text-secondary mb-1">Descripción / Notas</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="cv-input w-full min-h-[80px]"
                            placeholder="Instrucciones técnicas..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-cv-text-secondary hover:text-cv-text-primary transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-cv-accent text-white rounded-lg text-sm font-medium hover:bg-cv-accent/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Guardar Ejercicio
                    </button>
                </div>
            </form>
        </Modal>
    );
}
