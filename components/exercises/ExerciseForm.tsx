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
            aliases: exercise?.aliases || [],
        }
    });

    const [aliasInput, setAliasInput] = useState('');
    const aliases = watch('aliases') || [];

    const addAlias = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = aliasInput.trim();
            if (val && !aliases.includes(val)) {
                setValue('aliases', [...aliases, val]);
                setAliasInput('');
            }
        }
    };

    const removeAlias = (aliasToRemove: string) => {
        setValue('aliases', aliases.filter((a: string) => a !== aliasToRemove));
    };

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
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre del Ejercicio <span className="text-red-500">*</span></label>
                    <input
                        {...register('name', { required: 'El nombre es obligatorio' })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                        placeholder="Ej: Back Squat"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoría</label>
                        <div className="relative">
                            <select
                                {...register('category')}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Subcategoría (Opcional)</label>
                        <input
                            {...register('subcategory')}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                            placeholder="Ej: Lower Body Push"
                        />
                    </div>
                </div>
            </div>

            {/* Chips Selection */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Equipamiento</label>
                    <div className="flex flex-wrap gap-2">
                        {EQUIPMENT_OPTIONS.map(item => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => toggleSelection('equipment', item)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedEquipment.includes(item)
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                                    }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Apto para</label>
                    <div className="flex flex-wrap gap-2">
                        {MODALITIES.map(item => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => toggleSelection('modality_suitability', item)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedModalities.includes(item)
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">URL de Video</label>
                    <input
                        {...register('video_url')}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                        placeholder="https://youtube.com/..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción / Notas</label>
                    <textarea
                        {...register('description')}
                        rows={3}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none placeholder:text-gray-400"
                        placeholder="Instrucciones clave, puntos de rendimiento..."
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 sticky bottom-0 bg-white pb-2 md:static md:pb-0 z-10">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {exercise ? 'Guardar Cambios' : 'Crear Ejercicio'}
                </button>
            </div>
        </form>
    );
}
