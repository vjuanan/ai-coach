'use client';

import { useState } from 'react';
import { Trophy, Edit2, Save, X, Loader2, Timer, Activity } from 'lucide-react';
// import { updateAthleteProfile } from '@/lib/actions'; // Unused, using fetch now
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';

interface OneRmStats {
    snatch?: number | null;
    cnj?: number | null;
    backSquat?: number | null;
    frontSquat?: number | null;
    deadlift?: number | null;
    clean?: number | null;
    strictPress?: number | null;
    benchPress?: number | null;
}

interface BenchmarksEditorProps {
    athleteId: string;
    initialStats: OneRmStats;
    franTime?: number | null;
    run1km?: number | null;
    run5km?: number | null;
}

const RM_FIELDS: { key: keyof OneRmStats; label: string }[] = [
    { key: 'snatch', label: 'Snatch' },
    { key: 'cnj', label: 'C&J' },
    { key: 'backSquat', label: 'Back Squat' },
    { key: 'frontSquat', label: 'Front Squat' },
    { key: 'deadlift', label: 'Deadlift' },
    { key: 'clean', label: 'Clean' },
    { key: 'strictPress', label: 'Strict Press' },
    { key: 'benchPress', label: 'Bench Press' },
];

function formatTime(seconds: number | null | undefined): string {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Helper for Time Input
function TimeInput({ value, onChange, placeholder }: { value: number | null, onChange: (val: number | null) => void, placeholder?: string }) {
    const mins = value ? Math.floor(value / 60) : '';
    const secs = value ? value % 60 : '';

    const handleChange = (newMins: string, newSecs: string) => {
        const m = parseInt(newMins) || 0;
        const s = parseInt(newSecs) || 0;
        if (!newMins && !newSecs && value === null) return;
        if (newMins === '' && newSecs === '') onChange(null);
        else onChange(m * 60 + s);
    };

    return (
        <div className="flex items-center gap-2">
            <div className="relative flex-1">
                <input
                    type="number"
                    value={mins}
                    onChange={(e) => handleChange(e.target.value, secs.toString())}
                    placeholder="Min"
                    className="cv-input text-lg py-2 pr-8 text-center bg-cv-bg-secondary w-full"
                    min={0}
                />
                <span className="absolute right-3 top-3 text-xs text-cv-text-tertiary">m</span>
            </div>
            <span className="text-cv-text-tertiary font-bold">:</span>
            <div className="relative flex-1">
                <input
                    type="number"
                    value={secs === 0 && !mins ? '' : secs}
                    onChange={(e) => handleChange(mins.toString(), e.target.value)}
                    placeholder="Seg"
                    className="cv-input text-lg py-2 pr-8 text-center bg-cv-bg-secondary w-full"
                    min={0}
                    max={59}
                />
                <span className="absolute right-3 top-3 text-xs text-cv-text-tertiary">s</span>
            </div>
        </div>
    );
}

export function BenchmarksEditor({ athleteId, initialStats, franTime, run1km, run5km }: BenchmarksEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [stats, setStats] = useState<OneRmStats>(initialStats || {});
    const [times, setTimes] = useState({
        franTime: franTime || null as number | null,
        run1km: run1km || null as number | null,
        run5km: run5km || null as number | null,
    });
    const router = useRouter();

    const handleSave = async () => {
        setIsSaving(true);
        const toastId = toast.loading('Guardando marcajes...');

        try {
            console.log('Sending update via API for athlete:', athleteId);

            const response = await fetch(`/api/athletes/${athleteId}/benchmarks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    oneRmStats: stats,
                    franTime: times.franTime,
                    run1km: times.run1km,
                    run5km: times.run5km,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Marcajes guardados correctamente', { id: toastId });
                setIsEditing(false);
                router.refresh();
            } else {
                const msg = data.error || 'Error desconocido al guardar';
                toast.error(`Error del servidor: ${msg}`, { id: toastId, duration: 5000 });
            }
        } catch (err: any) {
            console.error('Error saving benchmarks:', err);
            toast.error(`Error de red: ${err.message}`, { id: toastId, duration: 5000 });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setStats(initialStats || {});
        setTimes({
            franTime: franTime || null,
            run1km: run1km || null,
            run5km: run5km || null,
        });
        setIsEditing(false);
    };

    return (
        <>
            <div className="cv-card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-cv-text-primary flex items-center gap-2">
                        <Trophy size={18} className="text-cv-text-tertiary" />
                        Marcajes (1RM)
                    </h3>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="cv-btn-ghost p-1.5 hover:bg-cv-bg-secondary rounded-lg transition-colors"
                        title="Editar Marcajes"
                    >
                        <Edit2 size={14} />
                    </button>
                </div>

                {/* 1RM Grid (Read Only) */}
                <div className="grid grid-cols-4 gap-3">
                    {RM_FIELDS.map(({ key, label }) => (
                        <div key={key} className="p-2 rounded-lg bg-cv-bg-tertiary border border-cv-border">
                            <p className="text-2xs text-cv-text-tertiary uppercase font-bold truncate" title={label}>{label}</p>
                            <p className="text-lg font-bold text-cv-text-primary">
                                {stats[key] || '-'}{' '}
                                {stats[key] && <span className="text-xs font-normal">kg</span>}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Time-based benchmarks (Read Only) */}
                {(times.franTime || times.run1km || times.run5km) && (
                    <div className="mt-4 space-y-2">
                        {times.franTime && (
                            <div className="p-2 rounded-lg bg-cv-accent-muted border border-cv-accent/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Timer size={16} className="text-cv-accent" />
                                    <span className="text-xs font-bold text-cv-accent uppercase">Fran</span>
                                </div>
                                <p className="font-bold text-cv-accent">{formatTime(times.franTime)}</p>
                            </div>
                        )}
                        {times.run1km && (
                            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity size={16} className="text-blue-400" />
                                    <span className="text-xs font-bold text-blue-400 uppercase">1KM Run</span>
                                </div>
                                <p className="font-bold text-blue-400">{formatTime(times.run1km)}</p>
                            </div>
                        )}
                        {times.run5km && (
                            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity size={16} className="text-blue-400" />
                                    <span className="text-xs font-bold text-blue-400 uppercase">5KM Run</span>
                                </div>
                                <p className="font-bold text-blue-400">{formatTime(times.run5km)}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* EDIT MODAL */}
            {isEditing && (
                <Modal
                    isOpen={isEditing}
                    onClose={handleCancel}
                    title="Editar Marcajes y Tiempos"
                    description="Actualiza los records personales (PR) del atleta. Utiliza el espacio completo para mayor comodidad."
                    maxWidth="max-w-4xl"
                >
                    <div className="space-y-8">
                        {/* Section 1: Weightlifting */}
                        <div>
                            <h4 className="flex items-center gap-2 text-sm font-bold text-cv-text-primary mb-4 uppercase tracking-wider">
                                <Trophy size={16} className="text-cv-accent" />
                                Levantamientos (1RM)
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {RM_FIELDS.map(({ key, label }) => (
                                    <div key={key} className="bg-cv-bg-tertiary/50 p-4 rounded-xl border border-white/5 hover:border-cv-accent/40 transition-colors">
                                        <label className="block text-xs font-bold text-cv-text-secondary uppercase mb-2">
                                            {label}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={stats[key] ?? ''}
                                                onChange={(e) => setStats(prev => ({
                                                    ...prev,
                                                    [key]: e.target.value ? parseInt(e.target.value) : null
                                                }))}
                                                placeholder="0"
                                                className="cv-input w-full text-xl font-bold bg-cv-bg-secondary py-3 text-center"
                                            />
                                            <span className="absolute right-3 top-4 text-xs font-bold text-cv-text-tertiary pointer-events-none">
                                                KG
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section 2: Metabolic Conditioning */}
                        <div className="pt-6 border-t border-white/10">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-cv-text-primary mb-4 uppercase tracking-wider">
                                <Timer size={16} className="text-blue-400" />
                                Tiempos de Referencia
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-cv-bg-tertiary/50 p-4 rounded-xl border border-white/5">
                                    <label className="block text-xs font-bold text-cv-text-secondary uppercase mb-2 text-center">
                                        Fran (21-15-9)
                                    </label>
                                    <TimeInput
                                        value={times.franTime}
                                        onChange={(val) => setTimes(prev => ({ ...prev, franTime: val }))}
                                    />
                                </div>
                                <div className="bg-cv-bg-tertiary/50 p-4 rounded-xl border border-white/5">
                                    <label className="block text-xs font-bold text-cv-text-secondary uppercase mb-2 text-center">
                                        1KM Run
                                    </label>
                                    <TimeInput
                                        value={times.run1km}
                                        onChange={(val) => setTimes(prev => ({ ...prev, run1km: val }))}
                                    />
                                </div>
                                <div className="bg-cv-bg-tertiary/50 p-4 rounded-xl border border-white/5">
                                    <label className="block text-xs font-bold text-cv-text-secondary uppercase mb-2 text-center">
                                        5KM Run
                                    </label>
                                    <TimeInput
                                        value={times.run5km}
                                        onChange={(val) => setTimes(prev => ({ ...prev, run5km: val }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-sm font-medium text-cv-text-secondary hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="cv-btn-primary py-2 px-6 flex items-center gap-2"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
}
