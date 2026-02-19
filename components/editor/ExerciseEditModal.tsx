'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { updateExercise } from '@/lib/actions';
import { Loader2, Plus, X, Save } from 'lucide-react';
import { ExerciseCategory } from '@/lib/supabase/types';
import { useExerciseCache } from '@/hooks/useExerciseCache';

interface ExerciseEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    exercise: any; // Using any for simplicity, but should be Exercise type
    onSuccess: (updatedExercise: any) => void;
}

const CATEGORIES: ExerciseCategory[] = ['Weightlifting', 'Gymnastics', 'Monostructural', 'Functional Bodybuilding'];

export function ExerciseEditModal({ isOpen, onClose, exercise, onSuccess }: ExerciseEditModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { refresh } = useExerciseCache();

    // Form State
    const [name, setName] = useState('');
    const [category, setCategory] = useState<ExerciseCategory>('Weightlifting');
    const [subcategory, setSubcategory] = useState('');
    const [equipment, setEquipment] = useState<string[]>([]);
    const [modalitySuitability, setModalitySuitability] = useState<string[]>([]);
    const [videoUrl, setVideoUrl] = useState('');
    const [description, setDescription] = useState('');

    // Tracking Parameters
    const [trackDistance, setTrackDistance] = useState(false);
    const [trackTime, setTrackTime] = useState(false);
    const [trackWeight, setTrackWeight] = useState(false);
    const [trackReps, setTrackReps] = useState(false);

    // Helpers for array fields
    const [equipmentInput, setEquipmentInput] = useState('');
    const [modalityInput, setModalityInput] = useState('');

    // Load initial data when exercise changes
    useEffect(() => {
        if (exercise && isOpen) {
            setName(exercise.name || '');
            setCategory(exercise.category || 'Weightlifting');
            setSubcategory(exercise.subcategory || '');
            setEquipment(exercise.equipment || []);
            setModalitySuitability(exercise.modality_suitability || []);
            setVideoUrl(exercise.video_url || '');
            setDescription(exercise.description || '');

            const tp = exercise.tracking_parameters || {};
            setTrackDistance(!!tp.distance);
            setTrackTime(!!tp.time);
            setTrackWeight(!!tp.weight);
            setTrackReps(!!tp.reps);
        }
    }, [exercise, isOpen]);

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
            const result = await updateExercise(exercise.id, {
                name,
                category,
                subcategory: subcategory || undefined,
                equipment,
                modality_suitability: modalitySuitability,
                video_url: videoUrl || undefined,
                description: description || undefined,
                tracking_parameters: {
                    distance: trackDistance,
                    time: trackTime,
                    weight: trackWeight,
                    reps: trackReps
                }
            });

            if (result.error) {
                setError(result.error);
            } else if (result.data) {
                // Force a cache refresh to ensure the editor sees the new properties immediately
                refresh();
                onSuccess(result.data);
                onClose();
            }
        } catch (err) {
            setError('Error al actualizar el ejercicio');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Editar: ${exercise?.name || 'Ejercicio'}`}
            description="Modifica los detalles y parámetros de seguimiento."
            maxWidth="max-w-2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Identification Section */}
                    <div className="md:col-span-2 space-y-4 pb-4 border-b border-gray-100">
                        <h4 className="text-sm font-semibold text-cv-text-primary uppercase tracking-wider">Identificación</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cv-accent focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoría</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cv-accent focus:border-transparent outline-none transition-all bg-white"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subcategoría (Opcional)</label>
                                <input
                                    type="text"
                                    value={subcategory}
                                    onChange={(e) => setSubcategory(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cv-accent focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tracking Parameters Section - KEY FEATURE */}
                    <div className="md:col-span-2 space-y-4 pb-4 border-b border-gray-100">
                        <h4 className="text-sm font-semibold text-cv-text-primary uppercase tracking-wider flex items-center gap-2">
                            Parámetros de Seguimiento <span className="text-xs font-normal text-cv-text-tertiary normal-case">(Define qué inputs aparecen en el editor)</span>
                        </h4>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${trackWeight ? 'bg-cv-accent/5 border-cv-accent/30 ring-1 ring-cv-accent/20' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                <input
                                    type="checkbox"
                                    checked={trackWeight}
                                    onChange={(e) => setTrackWeight(e.target.checked)}
                                    className="w-4 h-4 text-cv-accent rounded focus:ring-cv-accent"
                                />
                                <span className="text-sm font-medium text-gray-700">Peso / Carga</span>
                            </label>

                            <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${trackReps ? 'bg-cv-accent/5 border-cv-accent/30 ring-1 ring-cv-accent/20' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                <input
                                    type="checkbox"
                                    checked={trackReps}
                                    onChange={(e) => setTrackReps(e.target.checked)}
                                    className="w-4 h-4 text-cv-accent rounded focus:ring-cv-accent"
                                />
                                <span className="text-sm font-medium text-gray-700">Repeticiones</span>
                            </label>

                            <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${trackDistance ? 'bg-cv-accent/5 border-cv-accent/30 ring-1 ring-cv-accent/20' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                <input
                                    type="checkbox"
                                    checked={trackDistance}
                                    onChange={(e) => setTrackDistance(e.target.checked)}
                                    className="w-4 h-4 text-cv-accent rounded focus:ring-cv-accent"
                                />
                                <span className="text-sm font-medium text-gray-700">Distancia</span>
                            </label>

                            <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${trackTime ? 'bg-cv-accent/5 border-cv-accent/30 ring-1 ring-cv-accent/20' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                <input
                                    type="checkbox"
                                    checked={trackTime}
                                    onChange={(e) => setTrackTime(e.target.checked)}
                                    className="w-4 h-4 text-cv-accent rounded focus:ring-cv-accent"
                                />
                                <span className="text-sm font-medium text-gray-700">Tiempo</span>
                            </label>
                        </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="md:col-span-2 space-y-4">
                        <h4 className="text-sm font-semibold text-cv-text-primary uppercase tracking-wider">Metadatos</h4>

                        {/* Equipment */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Equipamiento</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={equipmentInput}
                                    onChange={(e) => setEquipmentInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddArrayItem(equipmentInput, equipment, setEquipment, setEquipmentInput))}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cv-accent focus:border-transparent outline-none"
                                    placeholder="Añadir..."
                                />
                                <button
                                    type="button"
                                    onClick={() => handleAddArrayItem(equipmentInput, equipment, setEquipment, setEquipmentInput)}
                                    className="bg-gray-100 hover:bg-gray-200 border border-gray-200 p-2 rounded-lg text-gray-600"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {equipment.map((item, idx) => (
                                    <span key={idx} className="bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                        {item}
                                        <button type="button" onClick={() => handleRemoveArrayItem(idx, equipment, setEquipment)} className="hover:text-red-500 text-gray-400">
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Modality Suitability */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Modalidades</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={modalityInput}
                                    onChange={(e) => setModalityInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddArrayItem(modalityInput, modalitySuitability, setModalitySuitability, setModalityInput))}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cv-accent focus:border-transparent outline-none"
                                    placeholder="Strength, Metcon..."
                                />
                                <button
                                    type="button"
                                    onClick={() => handleAddArrayItem(modalityInput, modalitySuitability, setModalitySuitability, setModalityInput)}
                                    className="bg-gray-100 hover:bg-gray-200 border border-gray-200 p-2 rounded-lg text-gray-600"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {modalitySuitability.map((item, idx) => (
                                    <span key={idx} className="bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                        {item}
                                        <button type="button" onClick={() => handleRemoveArrayItem(idx, modalitySuitability, setModalitySuitability)} className="hover:text-red-500 text-gray-400">
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 sticky bottom-0 bg-white pb-2 sm:static sm:pb-0 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors hover:bg-gray-50 rounded-lg"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-cv-accent text-white rounded-lg text-sm font-medium hover:brightness-110 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-cv-accent/20"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </Modal>
    );
}
