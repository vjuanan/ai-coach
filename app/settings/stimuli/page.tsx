'use client';

import { useState, useEffect } from 'react';
import { getStimulusFeatures, createStimulusFeature, deleteStimulusFeature, updateStimulusFeature } from '@/lib/actions';
import { StimulusFeature } from '@/lib/supabase/types';
import { Plus, Trash2, Loader2, Zap, Palette, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StimuliSettingsPage() {
    const [stimuli, setStimuli] = useState<StimulusFeature[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const [newStimulus, setNewStimulus] = useState({
        name: '',
        color: '#3B82F6', // Default blue
        description: ''
    });

    useEffect(() => {
        loadStimuli();
    }, []);

    const loadStimuli = async () => {
        setIsLoading(true);
        const data = await getStimulusFeatures();
        setStimuli(data || []);
        setIsLoading(false);
    };

    const handleCreate = async () => {
        if (!newStimulus.name.trim()) return;
        setIsSaving(true);
        const { data, error } = await createStimulusFeature(newStimulus);
        if (data) {
            setStimuli([...stimuli, data]);
            setNewStimulus({ name: '', color: '#3B82F6', description: '' });
        } else {
            console.error('Failed to create stimulus:', error);
            // Could add toast here
        }
        setIsSaving(false);
        router.refresh(); // Refresh server components if any rely on this
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este estímulo? Los días asignados perderán esta etiqueta.')) return;
        const result = await deleteStimulusFeature(id);
        if (result && !result.error) {
            setStimuli(stimuli.filter(s => s.id !== id));
        } else {
            alert('Error al eliminar');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-cv-accent" size={32} />
            </div>
        );
    }

    return (
        <div className="h-full max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-cv-text-primary flex items-center gap-2">
                        <Zap className="text-cv-accent" size={24} />
                        Estímulos de Entrenamiento
                    </h2>
                    <p className="text-sm text-cv-text-tertiary mt-1">
                        Define los tipos de estímulos para categorizar tus sesiones (ej. Hipertrofia, Fuerza, Metabólico).
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* List of Existing Stimuli */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-cv-text-secondary mb-2">Estímulos Activos</h3>
                    {stimuli.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <p className="text-cv-text-tertiary">No hay estímulos configurados.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stimuli.map((stimulus) => (
                                <div
                                    key={stimulus.id}
                                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md"
                                    style={{ borderLeft: `4px solid ${stimulus.color}` }}
                                >
                                    <div>
                                        <h4 className="font-bold text-cv-text-primary">{stimulus.name}</h4>
                                        {stimulus.description && (
                                            <p className="text-xs text-cv-text-tertiary">{stimulus.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-600 shadow-inner"
                                            style={{ backgroundColor: stimulus.color }}
                                            title={stimulus.color}
                                        />
                                        <button
                                            onClick={() => handleDelete(stimulus.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create New Stimulus */}
                <div className="h-fit">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sticky top-6">
                        <h3 className="font-semibold text-cv-text-primary mb-4 flex items-center gap-2">
                            <Plus size={18} />
                            Crear Nuevo Estímulo
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-cv-text-secondary mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={newStimulus.name}
                                    onChange={(e) => setNewStimulus({ ...newStimulus, name: e.target.value })}
                                    className="cv-input w-full"
                                    placeholder="Ej. Hipertrofia Funcional"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-cv-text-secondary mb-1">Color</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={newStimulus.color}
                                        onChange={(e) => setNewStimulus({ ...newStimulus, color: e.target.value })}
                                        className="h-10 w-20 rounded cursor-pointer border-0 p-0 overflow-hidden"
                                    />
                                    <input
                                        type="text"
                                        value={newStimulus.color}
                                        onChange={(e) => setNewStimulus({ ...newStimulus, color: e.target.value })}
                                        className="cv-input flex-1 font-mono text-sm uppercase"
                                        maxLength={7}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-cv-text-secondary mb-1">Descripción (Opcional)</label>
                                <textarea
                                    value={newStimulus.description}
                                    onChange={(e) => setNewStimulus({ ...newStimulus, description: e.target.value })}
                                    className="cv-input w-full min-h-[80px]"
                                    placeholder="Breve descripción del objetivo..."
                                />
                            </div>

                            <button
                                onClick={handleCreate}
                                disabled={isSaving || !newStimulus.name.trim()}
                                className="w-full cv-btn-primary py-2.5 flex items-center justify-center gap-2"
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                Guardar Estímulo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
