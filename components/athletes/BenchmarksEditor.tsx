// ... imports
import { toast } from 'sonner';

// ... (rest of imports)

// ... (inside BenchmarksEditor component)

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
        toast.success('Marcajes guardados correctamente');
        router.refresh();
    } catch (err) {
        console.error('Error saving benchmarks:', err);
        toast.error('Error al guardar marcajes');
    } finally {
        setIsSaving(false);
    }
};

// ... (rest of component logic)

{/* 1RM Inputs */ }
<div className="grid grid-cols-4 gap-2">
    {RM_FIELDS.map(({ key, label }) => (
        <div key={key}>
            <label className="block text-2xs text-cv-text-tertiary uppercase font-bold mb-1 truncate" title={label}>{label}</label>
            <input
                type="number"
                value={stats[key] ?? ''}
                onChange={(e) => setStats(prev => ({
                    ...prev,
                    [key]: e.target.value ? parseInt(e.target.value) : null
                }))}
                placeholder="kg"
                className="cv-input text-sm w-full"
            />
        </div>
    ))}
</div>


{/* Time inputs */ }
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
        </div >
    );
}
