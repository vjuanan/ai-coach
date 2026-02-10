'use client';

import { useState } from 'react';
import { Trophy, Edit2, Save, X, Loader2, Timer, Activity } from 'lucide-react';
import { updateAthleteProfile } from '@/lib/actions';
import { useRouter } from 'next/navigation';

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
        <div className="flex items-center gap-1">
            <div className="relative flex-1">
                <input
                    type="number"
                    value={mins}
                    onChange={(e) => handleChange(e.target.value, secs.toString())}
                    placeholder="Min"
                    className="cv-input text-sm pr-6 text-center"
                    min={0}
                />
                <span className="absolute right-2 top-1.5 text-xs text-cv-text-tertiary">m</span>
            </div>
            <span className="text-cv-text-tertiary font-bold">:</span>
            <div className="relative flex-1">
                <input
                    type="number"
                    value={secs === 0 && !mins ? '' : secs}
                    onChange={(e) => handleChange(mins.toString(), e.target.value)}
                    placeholder="Seg"
                    className="cv-input text-sm pr-6 text-center"
                    min={0}
                    max={59}
                />
                <span className="absolute right-2 top-1.5 text-xs text-cv-text-tertiary">s</span>
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
        try {
            await updateAthleteProfile(athleteId, {
                oneRmStats: stats,
                franTime: times.franTime,
                run1km: times.run1km,
                run5km: times.run5km,
            });
            setIsEditing(false);
            router.refresh();
        } catch (err) {
            console.error('Error saving benchmarks:', err);
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

    if (!isEditing) {
        return (
            <div className="cv-card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-cv-text-primary flex items-center gap-2">
                        <Trophy size={18} className="text-cv-text-tertiary" />
                        Marcajes (1RM)
                    </h3>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="cv-btn-ghost p-1.5"
                        title="Editar Marcajes"
                    >
                        <Edit2 size={14} />
                    </button>
                </div>

                {/* 1RM Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {RM_FIELDS.map(({ key, label }) => (
                        <div key={key} className="p-2 rounded-lg bg-cv-bg-tertiary border border-cv-border">
                            <p className="text-2xs text-cv-text-tertiary uppercase font-bold">{label}</p>
                            <p className="text-lg font-bold text-cv-text-primary">
                                {stats[key] || '-'}{' '}
                                {stats[key] && <span className="text-xs font-normal">kg</span>}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Time-based benchmarks */}
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
        );
    }

    // EDIT MODE
    return (
        <div className="cv-card border-cv-accent/50">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-cv-text-primary flex items-center gap-2">
                    <Trophy size={18} className="text-cv-accent" />
                    Editar Marcajes (1RM)
                </h3>
                <div className="flex gap-1">
                    <button onClick={handleCancel} className="cv-btn-ghost p-1.5" title="Cancelar">
                        <X size={14} />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="cv-btn-primary py-1 px-2 text-xs"
                    >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Guardar
                    </button>
                </div>
            </div>

            {/* 1RM Inputs */}
            <div className="grid grid-cols-2 gap-2">
                {RM_FIELDS.map(({ key, label }) => (
                    <div key={key}>
                        <label className="block text-2xs text-cv-text-tertiary uppercase font-bold mb-1">{label}</label>
                        <input
                            type="number"
                            value={stats[key] ?? ''}
                            onChange={(e) => setStats(prev => ({
                                ...prev,
                                [key]: e.target.value ? parseInt(e.target.value) : null
                            }))}
                            placeholder="kg"
                            className="cv-input text-sm"
                        />
                    </div>
                ))}
            </div>

            {/* Time inputs */}
            <div className="mt-4 pt-3 border-t border-cv-border">
                <label className="block text-xs font-semibold text-cv-text-secondary mb-2">Tiempos</label>
                <div className="grid grid-cols-1 gap-3">
                    <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
                        <label className="text-2xs text-cv-text-tertiary uppercase font-bold text-right">Fran</label>
                        <TimeInput
                            value={times.franTime}
                            onChange={(val) => setTimes(prev => ({ ...prev, franTime: val }))}
                        />
                    </div>
                    <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
                        <label className="text-2xs text-cv-text-tertiary uppercase font-bold text-right">1KM Run</label>
                        <TimeInput
                            value={times.run1km}
                            onChange={(val) => setTimes(prev => ({ ...prev, run1km: val }))}
                        />
                    </div>
                    <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
                        <label className="text-2xs text-cv-text-tertiary uppercase font-bold text-right">5KM Run</label>
                        <TimeInput
                            value={times.run5km}
                            onChange={(val) => setTimes(prev => ({ ...prev, run5km: val }))}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
