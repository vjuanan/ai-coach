'use client';
// Refactored to light theme

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

    const [aiLoading, setAiLoading] = useState(false);

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

    const handleGenerateAI = async () => {
        if (!name.trim()) return;
        setAiLoading(true);
        setError(null);
        try {
            // Dynamic import to avoid server-side issues if not handled correctly, though standard import should work with use server
            const { generateExerciseDetails } = await import('@/lib/ai-actions');
            const result = await generateExerciseDetails(name);

            if (result.error) {
                setError(result.error);
                return;
            }

            if (result.data) {
                const d = result.data;
                if (d.category) setCategory(d.category);
                if (d.subcategory) setSubcategory(d.subcategory);
                if (d.equipment && Array.isArray(d.equipment)) setEquipment(d.equipment);
                if (d.modality_suitability && Array.isArray(d.modality_suitability)) setModalitySuitability(d.modality_suitability);
                if (d.description) setDescription(d.description);
            }
        } catch (err) {
            console.error(err);
            setError('Error al generar con IA');
        } finally {
            setAiLoading(false);
        }
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
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                                placeholder="Ej: Push Press"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={handleGenerateAI}
                                disabled={aiLoading || !name.trim()}
                                className="px-3 py-2 bg-purple-50 text-purple-600 border border-purple-100 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                                title="Autocompletar detalles con IA"
                            >
                                {aiLoading ? <Loader2 size={18} className="animate-spin" /> : "✨ IA Magic"}
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Escribe el nombre y presiona "IA Magic" para autocompletar.</p>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoría</label>
                        <div className="relative">
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Subcategory */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Subcategoría (Opcional)</label>
                        <input
                            type="text"
                            value={subcategory}
                            onChange={(e) => setSubcategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                            placeholder="Ej: Overhead, Squat..."
                        />
                    </div>

                    {/* Equipment */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Equipamiento</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={equipmentInput}
                                onChange={(e) => setEquipmentInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddArrayItem(equipmentInput, equipment, setEquipment, setEquipmentInput))}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                                placeholder="Ej: Barbell..."
                            />
                            <button
                                type="button"
                                onClick={() => handleAddArrayItem(equipmentInput, equipment, setEquipment, setEquipmentInput)}
                                className="bg-gray-100 hover:bg-gray-200 border border-gray-200 p-2 rounded-lg text-gray-600 transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">Presiona Enter para agregar múltiples items.</p>
                        {equipment.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {equipment.map((item, idx) => (
                                    <span key={idx} className="bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                        {item}
                                        <button type="button" onClick={() => handleRemoveArrayItem(idx, equipment, setEquipment)} className="hover:text-red-500 text-gray-400 transition-colors">
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Modality Suitability */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Modalidades (Suitability)</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={modalityInput}
                                onChange={(e) => setModalityInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddArrayItem(modalityInput, modalitySuitability, setModalitySuitability, setModalityInput))}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                                placeholder="Ej: Strength, Metcon..."
                            />
                            <button
                                type="button"
                                onClick={() => handleAddArrayItem(modalityInput, modalitySuitability, setModalitySuitability, setModalityInput)}
                                className="bg-gray-100 hover:bg-gray-200 border border-gray-200 p-2 rounded-lg text-gray-600 transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">Tipos de entrenamiento para los que es ideal este ejercicio.</p>
                        {modalitySuitability.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {modalitySuitability.map((item, idx) => (
                                    <span key={idx} className="bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                        {item}
                                        <button type="button" onClick={() => handleRemoveArrayItem(idx, modalitySuitability, setModalitySuitability)} className="hover:text-red-500 text-gray-400 transition-colors">
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Video URL */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Video (Youtube/Vimeo)</label>
                        <input
                            type="url"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                            placeholder="https://..."
                        />
                    </div>

                    {/* Description */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción / Notas</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all min-h-[100px] placeholder:text-gray-400"
                            placeholder="Instrucciones técnicas..."
                        />
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
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Guardar Ejercicio
                    </button>
                </div>
            </form>
        </Modal>
    );
}
