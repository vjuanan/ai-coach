'use client';

import { useState } from 'react';
import { Building2, Pencil, Check, X, Loader2 } from 'lucide-react';
import { updateClient } from '@/lib/actions';
import { useRouter } from 'next/navigation';

interface GymAssignerProps {
    athleteId: string;
    currentGymId: string | null;
    gymName: string | null;
    gyms: any[];
}

export function GymAssigner({ athleteId, currentGymId, gymName, gyms }: GymAssignerProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedGymId, setSelectedGymId] = useState(currentGymId || 'none');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    async function handleSave() {
        if (selectedGymId === (currentGymId || 'none')) {
            setIsEditing(false);
            return;
        }

        setIsLoading(true);
        try {
            await updateClient(athleteId, {
                gym_id: selectedGymId === 'none' ? null : selectedGymId
            });
            setIsEditing(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Error al asignar gimnasio');
        } finally {
            setIsLoading(false);
        }
    }

    if (isEditing) {
        return (
            <div className="cv-card p-4 space-y-3 bg-blue-50/50 border-blue-100">
                <label className="text-xs font-bold text-blue-600 uppercase flex items-center gap-2">
                    <Building2 size={14} /> Asignar Box / Gimnasio
                </label>
                <div className="flex gap-2">
                    <select
                        value={selectedGymId}
                        onChange={(e) => setSelectedGymId(e.target.value)}
                        className="flex-1 h-9 px-2 rounded-md border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="none">Sin Gimnasio (Independiente)</option>
                        {gyms.map(gym => (
                            <option key={gym.id} value={gym.id}>{gym.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="h-9 w-9 bg-blue-600 text-white rounded-md flex items-center justify-center hover:bg-blue-700 transition-colors"
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    </button>
                    <button
                        onClick={() => setIsEditing(false)}
                        className="h-9 w-9 bg-white border border-gray-200 text-gray-500 rounded-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="cv-card p-4 flex items-center justify-between group">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Building2 size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">Gimnasio</h3>
                    <p className="text-sm text-gray-500">{gymName || 'Sin asignar'}</p>
                </div>
            </div>
            <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-blue-600"
            >
                <Pencil size={16} />
            </button>
        </div>
    );
}
