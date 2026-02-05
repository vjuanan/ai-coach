'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Plus, Dumbbell, Tag, Save, Loader2 } from 'lucide-react';
import { createExercise, updateExercise } from '@/lib/actions';
import { toast } from 'sonner';

interface ExerciseFormProps {
    exercise?: any; // Using any for simplicity with the db type; ideally simpler shape
    onClose: () => void;
    onSuccess: () => void;
}

const CATEGORIES = [
    { value: 'Weightlifting', label: 'Halterofilia' },
    { value: 'Gymnastics', label: 'Gimnasia' },
    { value: 'Monostructural', label: 'Monostructural' },
    { value: 'Functional Bodybuilding', label: 'Bodybuilding' },
];

const MODALITIES = [
    'CrossFit', 'Strength', 'Hypertrophy', 'Endurance', 'Recovery'
];

// Common equipment options (could be fetched from catalog, but hardcoding frequent ones for now)
const EQUIPMENT_OPTIONS = [
    'Barbell', 'Dumbbells', 'Kettlebell', 'Pull-up Bar', 'Rings',
    'Box', 'Jump Rope', 'Rowing Machine', 'Air Bike', 'SkiErg',
    'Medicine Ball', 'Sandbag', 'Sled', 'None'
];

export function ExerciseForm({ exercise, onClose, onSuccess }: ExerciseFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            name: exercise?.name || '',
            category: exercise?.category || 'Weightlifting',
            subcategory: exercise?.subcategory || '',
            description: exercise?.description || '',
            video_url: exercise?.video_url || '',
            equipment: exercise?.equipment || [],
            modality_suitability: exercise?.modality_suitability || [],
        }
    });

    const selectedEquipment = watch('equipment');
    const selectedModalities = watch('modality_suitability');

    const toggleSelection = (field: 'equipment' | 'modality_suitability', value: string) => {
        const current = field === 'equipment' ? selectedEquipment : selectedModalities;
        const newSelection = current.includes(value)
            ? current.filter((item: string) => item !== value)
            : [...current, value];
        setValue(field, newSelection);
    };

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            let result;
            if (exercise) {
                result = await updateExercise(exercise.id, data);
            } else {
                result = await createExercise(data);
            }

            if (result.error) {
                toast.error(`Error: ${result.error}`);
            } else {
                toast.success(exercise ? 'Ejercicio actualizado' : 'Ejercicio creado');
                onSuccess();
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Basic Info */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nombre del Ejercicio <span className="text-red-500">*</span></label>
                    <input
                        {...register('name', { required: 'El nombre es obligatorio' })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Ej: Back Squat"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
                        <select
                            {...register('category')}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Subcategoría (Opcional)</label>
                        <input
                            {...register('subcategory')}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            placeholder="Ej: Lower Body Push"
                        />
                    </div>
                </div>
            </div>

            {/* Chips Selection */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Equipamiento</label>
                    <div className="flex flex-wrap gap-2">
                        {EQUIPMENT_OPTIONS.map(item => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => toggleSelection('equipment', item)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedEquipment.includes(item)
                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Apto para</label>
                    <div className="flex flex-wrap gap-2">
                        {MODALITIES.map(item => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => toggleSelection('modality_suitability', item)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedModalities.includes(item)
                                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Media & Desc */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">URL de Video</label>
                    <input
                        {...register('video_url')}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="https://youtube.com/..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Descripción / Notas</label>
                    <textarea
                        {...register('description')}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                        placeholder="Instrucciones clave, puntos de rendimiento..."
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/20 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {exercise ? 'Guardar Cambios' : 'Crear Ejercicio'}
                </button>
            </div>
        </form>
    );
}
