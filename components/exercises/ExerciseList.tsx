'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, Tag, Dumbbell, Trash2, X, CheckSquare, Edit2, Plus, Square } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ExerciseForm } from './ExerciseForm';
import { deleteExercises } from '@/lib/actions';
import { toast } from 'sonner';

// Mock constants if not found
const CATEGORIES = [
    { value: 'all', label: 'Todos' },
    { value: 'Weightlifting', label: 'Weightlifting' },
    { value: 'Gymnastics', label: 'Gymnastics' },
    { value: 'Monostructural', label: 'Monostructural' },
    { value: 'Metcon', label: 'Metcon' }
];

interface Exercise {
    id: string;
    name: string;
    description?: string;
    category: string;
    equipment?: string[];
    modality_suitability?: string[];
}

// ... existing interfaces & constants

interface Exercise {
    id: string;
    name: string;
    category: string;
    subcategory?: string;
    description?: string;
    equipment?: string[];
    modality_suitability?: string[];
    video_url?: string;
}

interface ExerciseListProps {
    initialExercises: Exercise[];
    totalCount: number;
    initialCategory?: string;
    initialQuery?: string;
}

export function ExerciseList({
    initialExercises,
    totalCount,
    initialCategory = 'all',
    initialQuery = ''
}: ExerciseListProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(initialQuery);
    const [category, setCategory] = useState(initialCategory);

    // Feature States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

    // Multi-select States
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Debounce search update
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query !== initialQuery) {
                handleSearch(query);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    // Update URL when filtering
    function updateUrl(newQuery: string, newCategory: string) {
        const params = new URLSearchParams(searchParams.toString());

        if (newQuery) params.set('q', newQuery);
        else params.delete('q');

        if (newCategory && newCategory !== 'all') params.set('category', newCategory);
        else params.delete('category');

        router.replace(`?${params.toString()}`, { scroll: false });
    }

    const handleSearch = (term: string) => {
        updateUrl(term, category);
    };

    const handleCategoryChange = (cat: string) => {
        setCategory(cat);
        updateUrl(query, cat);
    };

    // Toggle Selection Mode
    const toggleSelectMode = () => {
        setIsSelectMode(!isSelectMode);
        setSelectedIds(new Set()); // Clear on toggle
    };

    const toggleSelection = (id: string) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedIds(newSelection);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;

        if (!confirm(`¿Estás seguro de que deseas eliminar ${selectedIds.size} ejercicios seleccionados?`)) {
            return;
        }

        const idsToDelete = Array.from(selectedIds);
        const result = await deleteExercises(idsToDelete);

        if (result.error) {
            toast.error(`Error: ${result.error}`);
        } else {
            toast.success(`${selectedIds.size} ejercicios eliminados`);
            setIsSelectMode(false);
            setSelectedIds(new Set());
        }
    };

    return (
        <div className="space-y-6">

            {/* Header with Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold">Biblioteca</h2>
                <div className="flex gap-2 w-full md:w-auto">
                    {isSelectMode ? (
                        <>
                            <button
                                onClick={handleBulkDelete}
                                disabled={selectedIds.size === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Trash2 size={18} />
                                <span className="hidden md:inline">Eliminar ({selectedIds.size})</span>
                            </button>
                            <button
                                onClick={toggleSelectMode}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"
                            >
                                <X size={18} />
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={toggleSelectMode}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"
                            >
                                <CheckSquare size={18} />
                                <span className="hidden md:inline">Seleccionar</span>
                            </button>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-cv-accent hover:bg-cv-accent/90 text-white rounded-lg transition-colors shadow-lg shadow-cv-accent/20"
                            >
                                <Plus size={18} />
                                Crear Ejercicio
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Filters Header (Existing) */}
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-cv-border shadow-sm">
                {/* ... keep existing search and filter logic ... */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cv-text-tertiary" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar ejercicios..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            handleSearch(e.target.value);
                        }}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-cv-border focus:ring-2 focus:ring-cv-accent/20 focus:border-cv-accent outline-none transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => handleCategoryChange(cat.value)}
                            className={`
                                    whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all
                                    ${category === cat.value
                                    ? 'bg-cv-accent text-white shadow-md shadow-cv-accent/20'
                                    : 'bg-cv-bg-tertiary text-cv-text-secondary hover:bg-cv-bg-secondary hover:text-cv-text-primary'
                                }
                                `}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Grid */}
            {initialExercises.length === 0 ? (
                <div className="text-center py-20 bg-cv-bg-tertiary/30 rounded-2xl border border-dashed border-cv-border">
                    <Dumbbell className="mx-auto text-cv-text-tertiary mb-4 opacity-50" size={48} />
                    <h3 className="text-lg font-medium text-cv-text-primary">No se encontraron ejercicios</h3>
                    <p className="text-cv-text-secondary mt-1">Intenta ajustar tu búsqueda o filtros.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {initialExercises.map((exercise) => (
                        <div
                            key={exercise.id}
                            onClick={() => isSelectMode ? toggleSelection(exercise.id) : setEditingExercise(exercise)}
                            className={`
                                    group bg-white rounded-xl border transition-all duration-200 overflow-hidden flex flex-col relative
                                    ${isSelectMode
                                    ? selectedIds.has(exercise.id)
                                        ? 'border-cv-accent ring-1 ring-cv-accent shadow-md'
                                        : 'border-cv-border hover:border-gray-400 cursor-pointer'
                                    : 'border-cv-border hover:border-cv-accent/50 hover:shadow-md cursor-pointer'
                                }
                                `}
                        >
                            {/* Selection Indicator */}
                            {isSelectMode && (
                                <div className="absolute top-3 right-3 z-10">
                                    {selectedIds.has(exercise.id) ? (
                                        <div className="bg-cv-accent text-white rounded-md p-1 shadow-sm">
                                            <CheckSquare size={20} />
                                        </div>
                                    ) : (
                                        <div className="bg-white/80 text-gray-400 rounded-md p-1 shadow-sm border border-gray-200">
                                            <Square size={20} />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="p-5 flex-1">
                                <div className="flex items-start justify-between mb-3">
                                    <span className={`
                                            px-2.5 py-1 rounded-md text-xs font-semibold
                                            ${exercise.category === 'Weightlifting' ? 'bg-blue-50 text-blue-700' :
                                            exercise.category === 'Gymnastics' ? 'bg-purple-50 text-purple-700' :
                                                exercise.category === 'Monostructural' ? 'bg-green-50 text-green-700' :
                                                    'bg-orange-50 text-orange-700'}
                                        `}>
                                        {exercise.category}
                                    </span>
                                    {/* Edit Trigger (Only show if not select mode) */}
                                    {!isSelectMode && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingExercise(exercise);
                                            }}
                                            className="text-gray-300 hover:text-cv-accent transition-colors p-1"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    )}
                                </div>

                                <h3 className="text-base font-semibold text-cv-text-primary mb-2 line-clamp-2 leading-tight group-hover:text-cv-accent transition-colors">
                                    {exercise.name}
                                </h3>

                                {exercise.description && (
                                    <p className="text-sm text-cv-text-secondary line-clamp-3 mb-4">
                                        {exercise.description}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-cv-border/50">
                                    {exercise.equipment && exercise.equipment.length > 0 && (
                                        <div className="flex items-center gap-1.5 text-xs text-cv-text-tertiary">
                                            <Dumbbell size={12} />
                                            <span>{exercise.equipment[0]}</span>
                                            {exercise.equipment.length > 1 && <span>+{exercise.equipment.length - 1}</span>}
                                        </div>
                                    )}
                                    {exercise.modality_suitability && exercise.modality_suitability.length > 0 && (
                                        <div className="flex items-center gap-1.5 text-xs text-cv-text-tertiary">
                                            <Tag size={12} />
                                            <span>{exercise.modality_suitability[0]}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Simple Pagination Feedback */}
            {totalCount > 0 && (
                <div className="text-center text-xs text-cv-text-tertiary pt-4">
                    Mostrando {initialExercises.length} de {totalCount} ejercicios
                </div>
            )}

            {/* Create Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Crear Nuevo Ejercicio"
                maxWidth="max-w-2xl"
            >
                <ExerciseForm
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => setIsCreateModalOpen(false)}
                />
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingExercise}
                onClose={() => setEditingExercise(null)}
                title="Editar Ejercicio"
                maxWidth="max-w-2xl"
            >
                {editingExercise && (
                    <ExerciseForm
                        exercise={editingExercise}
                        onClose={() => setEditingExercise(null)}
                        onSuccess={() => setEditingExercise(null)}
                    />
                )}
            </Modal>
        </div>
    );
}
