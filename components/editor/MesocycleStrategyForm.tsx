'use client';

import { useState, useEffect } from 'react';
import { X, Target, MessageSquare, Wrench, RefreshCw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MesocycleStrategy {
    focus: string;
    considerations: string;
    technicalClarifications: string;
    scalingAlternatives: string;
}

interface MesocycleStrategyFormProps {
    isOpen: boolean;
    onClose: () => void;
    weekNumber: number;
    initialData?: MesocycleStrategy;
    onSave: (strategy: MesocycleStrategy) => void;
    isSaving?: boolean;
}

const defaultStrategy: MesocycleStrategy = {
    focus: '',
    considerations: '',
    technicalClarifications: '',
    scalingAlternatives: '',
};

export function MesocycleStrategyForm({
    isOpen,
    onClose,
    weekNumber,
    initialData,
    onSave,
    isSaving = false,
}: MesocycleStrategyFormProps) {
    const [strategy, setStrategy] = useState<MesocycleStrategy>(defaultStrategy);

    useEffect(() => {
        if (initialData) {
            setStrategy(initialData);
        } else {
            setStrategy(defaultStrategy);
        }
    }, [initialData, isOpen]);

    const handleChange = (field: keyof MesocycleStrategy, value: string) => {
        setStrategy(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(strategy);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-auto bg-cv-bg-secondary border border-cv-border rounded-xl shadow-cv-lg z-50"
                    >
                        {/* Header */}
                        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-cv-border bg-cv-bg-secondary/95 backdrop-blur-sm">
                            <div>
                                <h2 className="font-semibold text-cv-text-primary">
                                    Estrategia del Programa
                                </h2>
                                <p className="text-sm text-cv-text-tertiary">
                                    Semana {weekNumber} - Configuración y contexto
                                </p>
                            </div>
                            <button onClick={onClose} className="cv-btn-ghost p-2">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-6 space-y-6">
                            {/* Mesocycle Focus */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-cv-text-primary">
                                    <Target size={16} className="text-cv-accent" />
                                    Enfoque del Mesociclo
                                </label>
                                <input
                                    type="text"
                                    value={strategy.focus}
                                    onChange={(e) => handleChange('focus', e.target.value)}
                                    placeholder="Ej: Fuerza de Cadena Posterior & Capacidad Aeróbica"
                                    className="cv-input w-full"
                                />
                                <p className="text-xs text-cv-text-tertiary">
                                    Define el objetivo principal de esta semana/mesociclo
                                </p>
                            </div>

                            {/* Coach's Considerations */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-cv-text-primary">
                                    <MessageSquare size={16} className="text-emerald-500" />
                                    Consideraciones del Coach
                                </label>
                                <textarea
                                    value={strategy.considerations}
                                    onChange={(e) => handleChange('considerations', e.target.value)}
                                    placeholder="Ej: Dormir 8h es obligatorio esta semana. Enfocarse en tempo excéntrico. Priorizar recuperación..."
                                    rows={4}
                                    className="cv-input w-full resize-none"
                                />
                                <p className="text-xs text-cv-text-tertiary">
                                    Instrucciones importantes, notas sobre estilo de vida, prioridades
                                </p>
                            </div>

                            {/* Technical Clarifications */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-cv-text-primary">
                                    <Wrench size={16} className="text-blue-500" />
                                    Aclaraciones Técnicas
                                </label>
                                <textarea
                                    value={strategy.technicalClarifications}
                                    onChange={(e) => handleChange('technicalClarifications', e.target.value)}
                                    placeholder="Ej: Tempo 30X1 significa 3s bajada, 0s pausa abajo, explosivo arriba, 1s pausa arriba..."
                                    rows={3}
                                    className="cv-input w-full resize-none"
                                />
                                <p className="text-xs text-cv-text-tertiary">
                                    Explicaciones de notación, terminología, o conceptos técnicos
                                </p>
                            </div>

                            {/* Scaling & Alternatives */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-cv-text-primary">
                                    <RefreshCw size={16} className="text-orange-500" />
                                    Escalado & Alternativas
                                </label>
                                <textarea
                                    value={strategy.scalingAlternatives}
                                    onChange={(e) => handleChange('scalingAlternatives', e.target.value)}
                                    placeholder="Ej: Si duele el hombro en SNATCH, sustituir por CLEAN PULLS. Si no hay barbell, usar KB..."
                                    rows={4}
                                    className="cv-input w-full resize-none"
                                />
                                <p className="text-xs text-cv-text-tertiary">
                                    <span className="text-orange-500 font-medium">CRÍTICO</span> para coaching remoto: alternativas por lesiones, falta de equipo, etc.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t border-cv-border bg-cv-bg-secondary/95 backdrop-blur-sm">
                            <button onClick={onClose} className="cv-btn-ghost">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="cv-btn-primary min-w-[120px]"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    'Guardar Estrategia'
                                )}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
