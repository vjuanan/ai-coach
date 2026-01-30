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
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] flex flex-col bg-white border border-slate-200 rounded-xl shadow-2xl z-[70] overflow-hidden font-sans"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                                    Estrategia del Mesociclo
                                </h2>
                                <p className="text-sm text-slate-500 font-medium">
                                    Semana {weekNumber} — Definición de Contexto
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">

                            {/* Section: Focus */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <Target size={14} className="text-indigo-500" />
                                    Enfoque Principal
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={strategy.focus}
                                        onChange={(e) => handleChange('focus', e.target.value)}
                                        placeholder="Ej: Fuerza Máxima & Resistencia Muscular Local"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                    />
                                    <p className="mt-2 text-xs text-slate-400">
                                        Define el objetivo "North Star" para este bloque de entrenamiento.
                                    </p>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <div className="grid grid-cols-1 gap-8">
                                {/* Section: Considerations */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <MessageSquare size={14} className="text-emerald-500" />
                                        Consideraciones del Coach
                                    </label>
                                    <textarea
                                        value={strategy.considerations}
                                        onChange={(e) => handleChange('considerations', e.target.value)}
                                        placeholder="Notas sobre estilo de vida, sueño, nutrición o foco mental para esta semana..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none leading-relaxed"
                                    />
                                </div>

                                {/* Section: Technical */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <Wrench size={14} className="text-blue-500" />
                                        Aclaraciones Técnicas
                                    </label>
                                    <textarea
                                        value={strategy.technicalClarifications}
                                        onChange={(e) => handleChange('technicalClarifications', e.target.value)}
                                        placeholder="Explicación de tempos, RPEs, o ejecuciones específicas..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none leading-relaxed"
                                    />
                                </div>

                                {/* Section: Scaling */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <RefreshCw size={14} className="text-orange-500" />
                                        Escalado & Alternativas
                                    </label>
                                    <div className="relative">
                                        <textarea
                                            value={strategy.scalingAlternatives}
                                            onChange={(e) => handleChange('scalingAlternatives', e.target.value)}
                                            placeholder="Opciones para atletas lesionados o sin equipo específico..."
                                            rows={3}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none leading-relaxed"
                                        />
                                        <div className="absolute top-3 right-3">
                                            <span className="flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl sticky bottom-0">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
