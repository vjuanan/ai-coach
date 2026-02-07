'use client';

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, CalendarDays, Target, Timer, Loader2, ChevronRight, Sparkles } from 'lucide-react';
import { createProgram } from '@/lib/actions';
import { useEscapeKey } from '@/hooks/use-escape-key';
import { StrategyInput } from './StrategyInput';

interface ProgramSetupWizardProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProgramSetupWizard({ isOpen, onClose }: ProgramSetupWizardProps) {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEscapeKey(onClose, isOpen);

    // Helper to generate default labels
    const generateDefaultLabels = (count: number, existing: string[] = []) => {
        const labels = [...existing];
        // Fill up to count
        while (labels.length < count) {
            labels.push('Acumulación');
        }
        // Trim if too many
        if (labels.length > count) {
            labels.splice(count);
        }
        // Set last one to Descarga if it's a new slot or was already Descarga equivalent
        if (count > 0) {
            // If the last one is empty or was auto-filled (we can't easily track auto-filled, 
            // so we just enforce Descarga on the last week if it's the default 4 week setup or similar)
            // Simpler logic: Just ensure the new slots default to Acumulación, 
            // and if we are extending, maybe hint the last one. 
            // But user requirement says: "ya aparezca escrita por defecto la sugerencia"

            // Let's just ensure the very last one is 'Descarga' if it was empty or previously 'Descarga'
            // actually, let's just pre-fill "Descarga" for the last week ONLY on initialization.
            // During resizing, it might be annoying to overwrite.
            // Let's stick to the initialization logic mostly, but for resizing:
        }
        return labels;
    };

    // Form State
    const [programName, setProgramName] = useState('');
    const [globalObjective, setGlobalObjective] = useState('');
    const [duration, setDuration] = useState(4);
    const [startDate, setStartDate] = useState(() => {
        const today = new Date();
        const day = today.getDay();
        // Calculate days until next Monday (0-6)
        // If today is Monday (1), result is 0 (today)
        // If today is Sunday (0), result is 1 (tomorrow)
        const daysUntilMonday = (1 + 7 - day) % 7;

        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + daysUntilMonday);

        return nextMonday.toISOString().split('T')[0];
    });

    // Initialize with defaults: All Acumulación, last Descarga
    const [weeklyLabels, setWeeklyLabels] = useState<string[]>(() => {
        const defaults = Array(4).fill('Acumulación');
        defaults[3] = 'Descarga';
        return defaults;
    });

    // Auto-calculate End Date
    const endDate = useMemo(() => {
        if (!startDate) return '';
        const start = new Date(startDate);
        const end = new Date(start.getTime() + duration * 7 * 24 * 60 * 60 * 1000);
        return end.toISOString().split('T')[0];
    }, [startDate, duration]);

    // Format date for display
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-AR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Update weekly labels array when duration changes
    const handleDurationChange = (newDuration: number) => {
        const clamped = Math.max(1, Math.min(12, newDuration));
        setDuration(clamped);

        setWeeklyLabels(prev => {
            const updated = [...prev];
            // If increasing
            if (clamped > updated.length) {
                while (updated.length < clamped) {
                    // Start with Accumulation for new weeks
                    updated.push('Acumulación');
                }
                // Optionally set the NEW last week to Descarga? 
                // Maybe better to just leave as Acumulación so user decides, 
                // or replicate the "Last week is usually deload" pattern.
                // Let's set the very last one to Descarga to be helpful.
                updated[clamped - 1] = 'Descarga';
            }
            // If decreasing, just slice
            else {
                return updated.slice(0, clamped);
            }
            return updated;
        });
    };

    const handleSubmit = async () => {
        if (!programName.trim()) {
            setError('El nombre del programa es requerido');
            return;
        }
        if (!startDate) {
            setError('La fecha de inicio es requerida');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const result = await createProgram(programName, null, {
                globalFocus: globalObjective || undefined,
                startDate: startDate,
                endDate: endDate,
                duration: duration,
                weeklyFocusLabels: weeklyLabels.filter(l => l.trim()) // Only non-empty labels
            });

            if (result?.error) {
                setError(result.error);
                return;
            }

            if (result?.data?.id) {
                onClose();
                router.push(`/editor/${result.data.id}`);
            }
        } catch (err: any) {
            console.error('Wizard creation error:', err);
            setError(err.message || 'Error al crear el programa');
        } finally {
            setIsCreating(false);
        }
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal - Compact Design */}
            <div className="relative w-full max-w-3xl mx-4 bg-cv-bg-primary border border-cv-border rounded-2xl shadow-cv-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header - Compact */}
                <div className="relative px-5 py-3 border-b border-cv-border bg-gradient-to-r from-cv-accent/10 via-purple-500/5 to-transparent shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cv-accent/20 flex items-center justify-center">
                            <Sparkles size={16} className="text-cv-accent" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-cv-text-primary leading-tight">
                                Configurar Mesociclo
                            </h2>
                            <p className="text-xs text-cv-text-tertiary">
                                Define la estrategia macro antes de programar
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 rounded-lg text-cv-text-tertiary hover:text-cv-text-primary hover:bg-cv-bg-tertiary transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content - Scrollable if needed but optimized to fit */}
                <div className="px-6 py-4 space-y-4 overflow-y-auto">
                    {/* Program Name - Compact */}
                    <div>
                        <label className="block text-xs font-medium text-cv-text-secondary mb-1.5">
                            Nombre del Programa *
                        </label>
                        <input
                            type="text"
                            value={programName}
                            onChange={(e) => setProgramName(e.target.value)}
                            placeholder="Ej: Hypertrophy Block Q1"
                            className="w-full px-3 py-2 text-sm rounded-lg bg-cv-bg-secondary border border-cv-border text-cv-text-primary placeholder:text-cv-text-tertiary focus:outline-none focus:ring-2 focus:ring-cv-accent/50 focus:border-cv-accent transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Global Objective - Compact */}
                    <div>
                        <label className="block text-xs font-medium text-cv-text-secondary mb-1.5">
                            <span className="flex items-center gap-1.5">
                                <Target size={12} className="text-cv-accent" />
                                Objetivo Global (North Star)
                            </span>
                        </label>
                        <textarea
                            value={globalObjective}
                            onChange={(e) => setGlobalObjective(e.target.value)}
                            placeholder="Ej: Acumulación de volumen para hipertrofia"
                            rows={2}
                            className="w-full px-3 py-2 text-sm rounded-lg bg-cv-bg-secondary border border-cv-border text-cv-text-primary placeholder:text-cv-text-tertiary focus:outline-none focus:ring-2 focus:ring-cv-accent/50 focus:border-cv-accent transition-all resize-none"
                        />
                    </div>

                    {/* Duration & Dates Row - Compact */}
                    <div className="grid grid-cols-12 gap-4">
                        {/* Duration */}
                        <div className="col-span-3">
                            <label className="block text-xs font-medium text-cv-text-secondary mb-1.5">
                                <span className="flex items-center gap-1.5">
                                    <Timer size={12} className="text-purple-400" />
                                    Duración
                                </span>
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => handleDurationChange(parseInt(e.target.value) || 4)}
                                    min={1}
                                    max={12}
                                    className="w-full px-3 py-2 text-sm rounded-lg bg-cv-bg-secondary border border-cv-border text-cv-text-primary text-center focus:outline-none focus:ring-2 focus:ring-cv-accent/50 focus:border-cv-accent transition-all"
                                />
                                <span className="text-xs text-cv-text-tertiary">sem</span>
                            </div>
                        </div>

                        {/* Start Date */}
                        <div className="col-span-5">
                            <label className="block text-xs font-medium text-cv-text-secondary mb-1.5">
                                <span className="flex items-center gap-1.5">
                                    <CalendarDays size={12} className="text-green-400" />
                                    Inicio
                                </span>
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg bg-cv-bg-secondary border border-cv-border text-cv-text-primary focus:outline-none focus:ring-2 focus:ring-cv-accent/50 focus:border-cv-accent transition-all"
                            />
                        </div>

                        {/* End Date (Read-only) */}
                        <div className="col-span-4">
                            <label className="block text-xs font-medium text-cv-text-secondary mb-1.5">
                                <span className="flex items-center gap-1.5">
                                    <CalendarDays size={12} className="text-red-400" />
                                    Fin
                                </span>
                            </label>
                            <div className="w-full px-3 py-2 text-sm rounded-lg bg-cv-bg-tertiary border border-cv-border text-cv-text-secondary truncate">
                                {formatDate(endDate)}
                            </div>
                        </div>
                    </div>

                    {/* Timeline Visual - Compact */}
                    <div className="px-3 py-2 rounded-lg bg-gradient-to-r from-cv-bg-secondary to-cv-bg-tertiary border border-cv-border">
                        <div className="flex items-center justify-between text-[10px] text-cv-text-tertiary mb-1.5">
                            <span>{formatDate(startDate)}</span>
                            <span className="text-cv-accent font-medium">{duration} semanas</span>
                            <span>{formatDate(endDate)}</span>
                        </div>
                        <div className="h-1.5 bg-cv-bg-primary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-cv-accent to-purple-500 rounded-full transition-all duration-300"
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    {/* Weekly Focus Labels (Optional) - Compact Grid */}
                    <div>
                        <label className="block text-xs font-medium text-cv-text-secondary mb-2">
                            Enfoque Semanal (Opcional)
                        </label>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-32 overflow-y-auto pr-1">
                            {Array.from({ length: duration }).map((_, i) => (
                                <div key={i} className="flex flex-col gap-1">
                                    <span className="text-[10px] text-cv-text-tertiary">
                                        Sem {i + 1}
                                    </span>
                                    <StrategyInput
                                        value={weeklyLabels[i] || ''}
                                        onChange={(val) => {
                                            const updated = [...weeklyLabels];
                                            updated[i] = val;
                                            setWeeklyLabels(updated);
                                        }}
                                        suggestions={[
                                            'Acumulación',
                                            'Intensificación',
                                            'Realización',
                                            'Descarga',
                                            'Intro'
                                        ]}
                                        placeholder="Focus"
                                        className="w-full px-2 py-1.5 text-xs rounded-md bg-cv-bg-secondary border border-cv-border text-cv-text-primary placeholder:text-cv-text-tertiary/50 focus:outline-none focus:ring-1 focus:ring-cv-accent/50 transition-all"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer - Compact */}
                <div className="px-5 py-3 border-t border-cv-border bg-cv-bg-secondary/50 flex items-center justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        disabled={isCreating}
                        className="px-3 py-2 rounded-lg text-sm text-cv-text-secondary hover:text-cv-text-primary transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isCreating || !programName.trim()}
                        className="cv-btn-primary flex items-center gap-2 px-4 py-2 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Creando...
                            </>
                        ) : (
                            <>
                                Crear Estrategia
                                <ChevronRight size={14} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
