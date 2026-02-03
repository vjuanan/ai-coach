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
        return today.toISOString().split('T')[0];
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

            {/* Modal */}
            <div className="relative w-full max-w-2xl mx-4 bg-cv-bg-primary border border-cv-border rounded-2xl shadow-cv-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="relative px-6 py-5 border-b border-cv-border bg-gradient-to-r from-cv-accent/10 via-purple-500/5 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cv-accent/20 flex items-center justify-center">
                            <Sparkles size={20} className="text-cv-accent" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-cv-text-primary">
                                Configurar Mesociclo
                            </h2>
                            <p className="text-sm text-cv-text-tertiary">
                                Define la estrategia macro antes de programar
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-lg text-cv-text-tertiary hover:text-cv-text-primary hover:bg-cv-bg-tertiary transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
                    {/* Program Name */}
                    <div>
                        <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                            Nombre del Programa *
                        </label>
                        <input
                            type="text"
                            value={programName}
                            onChange={(e) => setProgramName(e.target.value)}
                            placeholder="Ej: Hypertrophy Block Q1"
                            className="w-full px-4 py-3 rounded-xl bg-cv-bg-secondary border border-cv-border text-cv-text-primary placeholder:text-cv-text-tertiary focus:outline-none focus:ring-2 focus:ring-cv-accent/50 focus:border-cv-accent transition-all"
                        />
                    </div>

                    {/* Global Objective */}
                    <div>
                        <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                            <span className="flex items-center gap-2">
                                <Target size={14} className="text-cv-accent" />
                                Objetivo Global (North Star)
                            </span>
                        </label>
                        <input
                            type="text"
                            value={globalObjective}
                            onChange={(e) => setGlobalObjective(e.target.value)}
                            placeholder="Ej: Acumulación de volumen para hipertrofia"
                            className="w-full px-4 py-3 rounded-xl bg-cv-bg-secondary border border-cv-border text-cv-text-primary placeholder:text-cv-text-tertiary focus:outline-none focus:ring-2 focus:ring-cv-accent/50 focus:border-cv-accent transition-all"
                        />
                        <p className="text-xs text-cv-text-tertiary mt-1.5">
                            Este objetivo se mostrará en el editor como referencia constante
                        </p>
                    </div>

                    {/* Duration & Dates Row */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* Duration */}
                        <div>
                            <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                                <span className="flex items-center gap-2">
                                    <Timer size={14} className="text-purple-400" />
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
                                    className="w-20 px-3 py-2.5 rounded-xl bg-cv-bg-secondary border border-cv-border text-cv-text-primary text-center focus:outline-none focus:ring-2 focus:ring-cv-accent/50 focus:border-cv-accent transition-all"
                                />
                                <span className="text-sm text-cv-text-tertiary">semanas</span>
                            </div>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                                <span className="flex items-center gap-2">
                                    <CalendarDays size={14} className="text-green-400" />
                                    Inicio
                                </span>
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl bg-cv-bg-secondary border border-cv-border text-cv-text-primary focus:outline-none focus:ring-2 focus:ring-cv-accent/50 focus:border-cv-accent transition-all"
                            />
                        </div>

                        {/* End Date (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                                <span className="flex items-center gap-2">
                                    <CalendarDays size={14} className="text-red-400" />
                                    Fin
                                </span>
                            </label>
                            <div className="px-3 py-2.5 rounded-xl bg-cv-bg-tertiary border border-cv-border text-cv-text-secondary text-sm">
                                {formatDate(endDate)}
                            </div>
                        </div>
                    </div>

                    {/* Timeline Visual */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-cv-bg-secondary to-cv-bg-tertiary border border-cv-border">
                        <div className="flex items-center justify-between text-xs text-cv-text-tertiary mb-2">
                            <span>{formatDate(startDate)}</span>
                            <span className="text-cv-accent font-medium">{duration} semanas</span>
                            <span>{formatDate(endDate)}</span>
                        </div>
                        <div className="h-2 bg-cv-bg-primary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-cv-accent to-purple-500 rounded-full transition-all duration-300"
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    {/* Weekly Focus Labels (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-cv-text-secondary mb-2">
                            Enfoque Semanal (Opcional)
                        </label>

                        <div className="grid grid-cols-2 gap-4 max-h-48 overflow-y-auto pr-1">
                            {Array.from({ length: duration }).map((_, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-xs text-cv-text-tertiary w-12 shrink-0">
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
                                        placeholder="Ej: Acumulación"
                                        className="flex-1 px-3 py-2 text-sm rounded-lg bg-cv-bg-secondary border border-cv-border text-cv-text-primary placeholder:text-cv-text-tertiary/50 focus:outline-none focus:ring-1 focus:ring-cv-accent/50 transition-all"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-cv-border bg-cv-bg-secondary/50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isCreating}
                        className="px-4 py-2.5 rounded-xl text-cv-text-secondary hover:text-cv-text-primary transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isCreating || !programName.trim()}
                        className="cv-btn-primary flex items-center gap-2 px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Créando...
                            </>
                        ) : (
                            <>
                                Crear Estrategia
                                <ChevronRight size={16} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
