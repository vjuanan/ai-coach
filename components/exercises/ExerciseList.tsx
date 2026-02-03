'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Exercise } from '@/lib/supabase/types';
import { Search, Filter, Dumbbell, Tag, PlayCircle, Info } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

interface ExerciseListProps {
    initialExercises: Exercise[];
    totalCount: number;
    initialCategory?: string;
    initialQuery?: string;
}

const CATEGORIES = [
    { value: 'all', label: 'Todos' },
    { value: 'Weightlifting', label: 'Halterofilia' },
    { value: 'Gymnastics', label: 'Gimnasia' },
    { value: 'Monostructural', label: 'Monostructural' },
    { value: 'Functional Bodybuilding', label: 'Bodybuilding' },
];

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

    // Debounce URL updates
    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (term) {
            params.set('q', term);
        } else {
            params.delete('q');
        }
        // Reset page on search
        params.delete('page');
        router.replace(`?${params.toString()}`);
    }, 300);

    const handleCategoryChange = (cat: string) => {
        setCategory(cat);
        const params = new URLSearchParams(searchParams.toString());
        if (cat && cat !== 'all') {
            params.set('category', cat);
        } else {
            params.delete('category');
        }
        params.delete('page');
        router.replace(`?${params.toString()}`);
    };

    return (
        <div className="space-y-6">
            {/* Filters Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-cv-border shadow-sm">
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
                            className="group bg-white rounded-xl border border-cv-border hover:border-cv-accent/50 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
                        >
                            <div className="p-5 flex-1 cursor-pointer">
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
                                    {exercise.video_url && (
                                        <div className="text-cv-accent opacity-0 group-hover:opacity-100 transition-opacity" title="Ver Video">
                                            <PlayCircle size={20} />
                                        </div>
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
        </div>
    );
}
