'use client';

import { useState } from 'react';
import { TrainingMethodology } from '@/lib/supabase/types';
import { updateTrainingMethodology } from '@/lib/actions';
import {
    Clock, Timer, Flame, Zap, Dumbbell, Activity, TrendingUp, TrendingDown,
    Heart, Layers, RefreshCw, Skull, ListOrdered, Puzzle, Repeat,
    HelpCircle, Edit2, X, Save, Check, AlertCircle, ChevronRight
} from 'lucide-react';

// Icon mapping
const iconMap: Record<string, any> = {
    Clock, Timer, Flame, Zap, Dumbbell, Activity, TrendingUp, TrendingDown,
    Heart, Layers, RefreshCw, Skull, ListOrdered, Puzzle, Repeat,
    'Repeat2': Repeat, HelpCircle
};

interface MethodologySectionProps {
    methodologies: TrainingMethodology[];
}

const CATEGORIES = {
    metcon: { label: 'MetCon / WODs', color: 'text-orange-500', bg: 'bg-orange-50' },
    hiit: { label: 'HIIT / Intervalos', color: 'text-blue-500', bg: 'bg-blue-50' },
    strength: { label: 'Fuerza / Power', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    conditioning: { label: 'Acondicionamiento', color: 'text-green-500', bg: 'bg-green-50' }
};

export function MethodologySection({ methodologies }: MethodologySectionProps) {
    const [selectedMethodology, setSelectedMethodology] = useState<TrainingMethodology | null>(null);

    // Group by category
    const grouped = methodologies.reduce((acc, m) => {
        const cat = m.category as keyof typeof CATEGORIES;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(m);
        return acc;
    }, {} as Record<string, TrainingMethodology[]>);

    const categoryOrder = ['metcon', 'hiit', 'strength', 'conditioning'];

    return (
        <div className="space-y-8">
            {categoryOrder.map(catKey => {
                const items = grouped[catKey] || [];
                if (items.length === 0) return null;
                const catConfig = CATEGORIES[catKey as keyof typeof CATEGORIES];

                return (
                    <div key={catKey}>
                        <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg ${catConfig.bg}`}>
                            <h3 className={`font-semibold ${catConfig.color}`}>{catConfig.label}</h3>
                            <span className="text-xs font-medium px-2 py-0.5 bg-white rounded-full text-gray-500">
                                {items.length}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map(methodology => (
                                <MethodologyCard
                                    key={methodology.id}
                                    methodology={methodology}
                                    onClick={() => setSelectedMethodology(methodology)}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}

            {selectedMethodology && (
                <MethodologyModal
                    methodology={selectedMethodology}
                    onClose={() => setSelectedMethodology(null)}
                    onUpdate={(updated) => {
                        setSelectedMethodology(updated);
                        // Refresh logic is handled by server action revalidatePath, 
                        // but we update local state to reflect changes immediately in modal
                    }}
                />
            )}
        </div>
    );
}

function MethodologyCard({ methodology, onClick }: { methodology: TrainingMethodology, onClick: () => void }) {
    const Icon = iconMap[methodology.icon] || Dumbbell;

    return (
        <div
            onClick={onClick}
            className="bg-white border border-cv-border/60 rounded-xl p-4 hover:border-cv-accent/50 hover:shadow-sm transition-all cursor-pointer group"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-cv-bg-tertiary flex items-center justify-center text-cv-text-secondary group-hover:bg-cv-accent/10 group-hover:text-cv-accent transition-colors">
                    <Icon size={20} />
                </div>
                <div className="text-cv-text-tertiary">
                    <ChevronRight size={18} />
                </div>
            </div>
            <h4 className="font-medium text-cv-text-primary mb-1">{methodology.name}</h4>
            <p className="text-xs text-cv-text-secondary line-clamp-2">{methodology.description}</p>
        </div>
    );
}

interface ModalProps {
    methodology: TrainingMethodology;
    onClose: () => void;
    onUpdate: (m: TrainingMethodology) => void;
}

function MethodologyModal({ methodology, onClose, onUpdate }: ModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: methodology.name,
        description: methodology.description,
        icon: methodology.icon,
        form_config: JSON.stringify(methodology.form_config, null, 2),
        default_values: JSON.stringify(methodology.default_values, null, 2)
    });
    const [error, setError] = useState<string | null>(null);

    const Icon = iconMap[methodology.icon] || Dumbbell;

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            // Validate JSON
            const formConfigJson = JSON.parse(formData.form_config);
            const defaultValuesJson = JSON.parse(formData.default_values);

            const updates = {
                name: formData.name,
                description: formData.description,
                icon: formData.icon,
                form_config: formConfigJson,
                default_values: defaultValuesJson
            };

            const result = await updateTrainingMethodology(methodology.id, updates);

            if (result.error) {
                throw new Error(result.error);
            }

            if (result.data) {
                onUpdate(result.data as TrainingMethodology);
                setIsEditing(false);
            }
        } catch (err: any) {
            setError(err.message || 'Error saving changes');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
                {/* Header */}
                <div className="p-5 border-b border-cv-border flex items-center justify-between bg-cv-bg-secondary/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-cv-border flex items-center justify-center text-cv-accent shadow-sm">
                            <Icon size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-cv-text-primary">
                                {isEditing ? 'Editar Metodología' : methodology.name}
                            </h3>
                            <p className="text-xs text-cv-text-secondary font-mono">
                                CODE: {methodology.code}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full text-cv-text-secondary">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {isEditing ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-cv-text-secondary mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-cv-border rounded-lg focus:ring-2 focus:ring-cv-accent/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-cv-text-secondary mb-1">Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-cv-border rounded-lg focus:ring-2 focus:ring-cv-accent/20 outline-none min-h-[80px]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-cv-text-secondary mb-1">Icono (Lucide)</label>
                                <input
                                    type="text"
                                    value={formData.icon}
                                    onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                    className="w-full px-3 py-2 border border-cv-border rounded-lg focus:ring-2 focus:ring-cv-accent/20 outline-none font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-cv-text-secondary mb-1">
                                    Configuración del Formulario (JSON)
                                </label>
                                <textarea
                                    value={formData.form_config}
                                    onChange={e => setFormData({ ...formData, form_config: e.target.value })}
                                    className="w-full px-3 py-2 border border-cv-border rounded-lg focus:ring-2 focus:ring-cv-accent/20 outline-none font-mono text-xs min-h-[150px] bg-slate-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-cv-text-secondary mb-1">
                                    Valores por Defecto (JSON)
                                </label>
                                <textarea
                                    value={formData.default_values}
                                    onChange={e => setFormData({ ...formData, default_values: e.target.value })}
                                    className="w-full px-3 py-2 border border-cv-border rounded-lg focus:ring-2 focus:ring-cv-accent/20 outline-none font-mono text-xs min-h-[100px] bg-slate-50"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-medium text-cv-text-tertiary uppercase tracking-wide mb-2">Descripción</h4>
                                <p className="text-cv-text-secondary leading-relaxed">
                                    {methodology.description}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-cv-text-tertiary uppercase tracking-wide mb-2">Campos del Formulario</h4>
                                <div className="space-y-2">
                                    {methodology.form_config.fields.map((field, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-cv-bg-tertiary rounded-lg border border-cv-border/50">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-cv-border text-cv-text-tertiary">
                                                    {field.key}
                                                </span>
                                                <span className="text-sm font-medium text-cv-text-primary">
                                                    {field.label}
                                                </span>
                                            </div>
                                            <span className="text-xs text-cv-text-secondary bg-cv-bg-secondary px-2 py-0.5 rounded-full">
                                                {field.type}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-cv-border flex justify-end gap-3 bg-gray-50/50">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-sm text-cv-text-secondary hover:text-cv-text-primary transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-4 py-2 bg-cv-accent text-white rounded-lg text-sm font-medium hover:bg-cv-accent/90 transition-colors flex items-center gap-2"
                            >
                                {loading ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div> : <Save size={16} />}
                                Guardar Cambios
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-white border border-cv-border text-cv-text-secondary hover:text-cv-accent hover:border-cv-accent/30 rounded-lg text-sm font-medium transition-all flex items-center gap-2 shadow-sm"
                        >
                            <Edit2 size={16} />
                            Editar Configuración
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
