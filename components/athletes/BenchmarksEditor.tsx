'use client';

import { useState } from 'react';
import { Trophy, Edit2, Save, X, Loader2, Timer, Activity, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
function TimeInput({ value, onChange }: { value: number | null, onChange: (val: number | null) => void }) {
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
        <div className="flex items-center gap-2 bg-cv-bg-secondary p-1 rounded-lg border border-white/5">
            <div className="relative flex-1">
                <input
                    type="number"
                    value={mins}
                    onChange={(e) => handleChange(e.target.value, secs.toString())}
                    placeholder="00"
                    className="w-full bg-transparent text-center font-mono text-sm focus:outline-none py-1"
                    min={0}
                />
                <span className="absolute right-1 top-1 text-[10px] text-cv-text-tertiary">m</span>
            </div>
            <span className="text-cv-text-tertiary font-bold">:</span>
            <div className="relative flex-1">
                <input
                    type="number"
                    value={secs === 0 && !mins ? '' : secs}
                    onChange={(e) => handleChange(mins.toString(), e.target.value)}
                    placeholder="00"
                    className="w-full bg-transparent text-center font-mono text-sm focus:outline-none py-1"
                    min={0}
                    max={59}
                />
                <span className="absolute right-1 top-1 text-[10px] text-cv-text-tertiary">s</span>
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
        <div className="cv-card p-0 overflow-hidden border-cv-accent/20">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-gradient-to-r from-cv-bg-secondary to-transparent flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cv-accent/10 flex items-center justify-center text-cv-accent">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-cv-text-primary">Benchmarks & RMs</h3>
                        <p className="text-xs text-cv-text-tertiary">Gestiona los récords personales y tiempos de referencia.</p>
                    </div>
                </div>

                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="cv-btn-secondary text-xs py-2 px-4 flex items-center gap-2"
                    >
                        <Edit2 size={14} />
                        Editar RMs
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCancel}
                            disabled={isSaving}
                            className="cv-btn-ghost text-xs py-2 px-4"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="cv-btn-primary text-xs py-2 px-4 flex items-center gap-2"
                        >
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Guardar Cambios
                        </button>
                    </div>
                )}
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-8 bg-cv-bg-primary/30">

                {/* Section: Weightlifting */}
                <div>
                    <h4 className="text-xs font-bold text-cv-text-tertiary uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Trophy size={14} /> Levantamientos (1RM)
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                        {RM_FIELDS.map(({ key, label }) => (
                            <div key={key} className={`
                                group relative p-3 rounded-xl border transition-all duration-200
                                ${isEditing
                                    ? 'bg-cv-bg-tertiary border-cv-accent/30 hover:border-cv-accent shadow-lg shadow-black/20'
                                    : 'bg-cv-bg-secondary/50 border-white/5 hover:bg-cv-bg-tertiary'
                                }
                            `}>
                                <label className="block text-[10px] font-bold text-cv-text-tertiary uppercase mb-1 truncate" title={label}>
                                    {label}
                                </label>

                                {isEditing ? (
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={stats[key] ?? ''}
                                            onChange={(e) => setStats(prev => ({
                                                ...prev,
                                                [key]: e.target.value ? parseInt(e.target.value) : null
                                            }))}
                                            placeholder="-"
                                            className="w-full bg-transparent text-xl font-bold text-white placeholder-white/20 focus:outline-none text-center"
                                        />
                                        <span className="absolute right-0 top-1 text-[9px] font-bold text-cv-text-tertiary pointer-events-none">OK</span>
                                    </div>
                                ) : (
                                    <div className="flex items-end justify-between">
                                        <span className={`text-lg font-bold ${stats[key] ? 'text-white' : 'text-white/20'}`}>
                                            {stats[key] || '-'}
                                        </span>
                                        <span className="text-[10px] text-cv-text-tertiary mb-1">kg</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section: Metcon */}
                <div className="pt-6 border-t border-white/5">
                    <h4 className="text-xs font-bold text-cv-text-tertiary uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Timer size={14} /> Tiempos de Referencia
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
                        {/* Fran */}
                        <div className={`
                             flex items-center justify-between p-4 rounded-xl border
                             ${isEditing ? 'bg-cv-bg-tertiary border-cv-accent/30' : 'bg-cv-bg-secondary/20 border-white/5'}
                        `}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-cv-accent/10 text-cv-accent">
                                    <Activity size={16} />
                                </div>
                                <span className="text-sm font-bold text-cv-text-secondary">Fran</span>
                            </div>
                            {isEditing ? (
                                <div className="w-32">
                                    <TimeInput
                                        value={times.franTime}
                                        onChange={(val) => setTimes(prev => ({ ...prev, franTime: val }))}
                                    />
                                </div>
                            ) : (
                                <span className="text-lg font-bold text-cv-text-primary font-mono">{formatTime(times.franTime)}</span>
                            )}
                        </div>

                        {/* 1km Run */}
                        <div className={`
                             flex items-center justify-between p-4 rounded-xl border
                             ${isEditing ? 'bg-cv-bg-tertiary border-cv-accent/30' : 'bg-cv-bg-secondary/20 border-white/5'}
                        `}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                    <Activity size={16} />
                                </div>
                                <span className="text-sm font-bold text-cv-text-secondary">1KM Run</span>
                            </div>
                            {isEditing ? (
                                <div className="w-32">
                                    <TimeInput
                                        value={times.run1km}
                                        onChange={(val) => setTimes(prev => ({ ...prev, run1km: val }))}
                                    />
                                </div>
                            ) : (
                                <span className="text-lg font-bold text-cv-text-primary font-mono">{formatTime(times.run1km)}</span>
                            )}
                        </div>

                        {/* 5km Run */}
                        <div className={`
                             flex items-center justify-between p-4 rounded-xl border
                             ${isEditing ? 'bg-cv-bg-tertiary border-cv-accent/30' : 'bg-cv-bg-secondary/20 border-white/5'}
                        `}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                                    <Activity size={16} />
                                </div>
                                <span className="text-sm font-bold text-cv-text-secondary">5KM Run</span>
                            </div>
                            {isEditing ? (
                                <div className="w-32">
                                    <TimeInput
                                        value={times.run5km}
                                        onChange={(val) => setTimes(prev => ({ ...prev, run5km: val }))}
                                    />
                                </div>
                            ) : (
                                <span className="text-lg font-bold text-cv-text-primary font-mono">{formatTime(times.run5km)}</span>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
