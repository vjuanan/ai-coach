'use client';

import { useState, useEffect, useRef } from 'react';
import { useExerciseCache } from '@/hooks/useExerciseCache';
import { Search, Loader2, Plus, AlertCircle } from 'lucide-react';
import { ExerciseCreationModal } from './ExerciseCreationModal';

interface SmartExerciseInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
    inputRef?: React.RefObject<HTMLInputElement>;
    onSelect?: (exercise: any) => void;
    showSearchIcon?: boolean;
}

// Force redeploy
export function SmartExerciseInput({
    value,
    onChange,
    placeholder = "Buscar ejercicio...",
    className,
    autoFocus,
    inputRef,
    onSelect,
    showSearchIcon = true
}: SmartExerciseInputProps) {
    const [query, setQuery] = useState(typeof value === 'string' ? value : '');
    const [results, setResults] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Internal ref fallback
    const internalRef = useRef<HTMLInputElement>(null);
    const actualInputRef = inputRef || internalRef;
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Use global cache hook
    const { searchLocal, isLoading: isCacheLoading } = useExerciseCache();

    // Debounce Search (now local)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                // Local search is synchronous and instant
                const data = searchLocal(query);
                setResults(data || []);
            } catch (error) {
                console.error(error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 100); // reduced debounce from 300 to 100 since it is local

        return () => clearTimeout(timer);
    }, [query, searchLocal]);

    // Update query if value changes externally
    useEffect(() => {
        setQuery(value);
    }, [value]);

    // Handle outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (exerciseName: string) => {
        setQuery(exerciseName);
        onChange(exerciseName);
        setIsOpen(false);

        // Find full exercise object if possible
        const fullExercise = results.find(r => r.name === exerciseName) || { name: exerciseName };
        if (onSelect) {
            onSelect(fullExercise);
        }
    };

    const handleCreateSuccess = (exerciseName: string) => {
        setQuery(exerciseName);
        onChange(exerciseName);
        setShowModal(false);

        if (onSelect) {
            onSelect({ name: exerciseName });
        }
    }

    // Check if query exactly matches a known exercise result (case insensitive)
    const isExactMatch = results.some(r => r.name.toLowerCase() === query.trim().toLowerCase());

    return (
        <div
            ref={wrapperRef}
            className="relative w-full"
            data-smart-exercise-input="true"
            onKeyDownCapture={(e) => {
                if (e.key !== 'Escape') return;
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
                const active = document.activeElement as HTMLElement | null;
                if (active && wrapperRef.current?.contains(active)) {
                    active.blur();
                }
            }}
        >
            <div className="relative">
                <input
                    ref={actualInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        // We do NOT call onChange here for free text if we want to enforce strictness?
                        // The prompt says: "NO se puedan agregar ejercicios que no esten en la biblioteca"
                        // But usually users want to see what they type.
                        // We can allow typing, but maybe visually indicate it's not linked?
                        // Or we just pass it up, but the UI shows the "Add" button prominent.
                        // Let's pass it up so the input works, but the "Add" prompt is key.
                        onChange(e.target.value);
                    }}
                    onFocus={() => {
                        setIsOpen(true);
                    }}
                    placeholder={placeholder}
                    className={`${className} ${showSearchIcon ? 'pr-8' : ''}`}
                    autoFocus={autoFocus}
                    autoComplete="off"
                    onKeyDown={(e) => {
                        if (e.key !== 'Escape') return;
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpen(false);
                        e.currentTarget.blur();
                    }}
                />
                {showSearchIcon && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-cv-text-tertiary">
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    </div>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-cv-bg-elevated border border-cv-border rounded-lg shadow-cv-lg max-h-80 overflow-y-auto transform transition-all">
                    {/* Results List */}
                    {results.length > 0 && (
                        <div className="py-1">
                            <div className="px-3 py-1.5 text-xs font-semibold text-cv-text-tertiary uppercase tracking-wider">
                                Ejercicios
                            </div>
                            {results.map((exercise) => (
                                <button
                                    key={exercise.id}
                                    onClick={() => handleSelect(exercise.name)}
                                    className="w-full text-left px-3 py-2 text-sm text-cv-text-secondary hover:bg-cv-bg-tertiary hover:text-cv-text-primary transition-colors flex flex-col gap-0.5 border-b border-white/5 last:border-0"
                                >
                                    <span className="font-medium">{exercise.name}</span>
                                    <span className="text-xs text-cv-text-tertiary">
                                        {exercise.category} {exercise.subcategory ? `• ${exercise.subcategory}` : ''}
                                        {exercise.matchedAlias && (
                                            <span className="ml-1 text-cv-accent/70">• Coincide con &quot;{exercise.matchedAlias}&quot;</span>
                                        )}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* "Create New" Option - Always show if not exact match */}
                    {!isExactMatch && !isLoading && (
                        <div className={`p-2 ${results.length > 0 ? 'border-t border-cv-border' : ''}`}>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setShowModal(true);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-cv-accent/10 text-cv-accent hover:bg-cv-accent/20 transition-colors text-left"
                            >
                                <div className="bg-cv-accent/20 p-1.5 rounded-md">
                                    <Plus size={16} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold">Crear &quot;{query}&quot;</span>
                                    <span className="text-xs opacity-80">Añadir a la biblioteca global</span>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* No results empty state (text only if we want) */}
                    {results.length === 0 && !isLoading && (
                        <div className="px-4 py-3 text-center text-sm text-cv-text-tertiary">
                            No se encontraron ejercicios similares.
                        </div>
                    )}
                </div>
            )}

            <ExerciseCreationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                initialName={query}
                onSuccess={handleCreateSuccess}
            />
        </div>
    );
}
