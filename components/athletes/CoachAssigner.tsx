'use client';

import { useState } from 'react';
import { assignCoach } from '@/lib/actions-coach';
import { UserCog, Check, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Coach {
    id: string;
    full_name: string;
    business_name: string | null;
}

interface CoachAssignerProps {
    athleteId: string;
    currentCoachId: string | null;
    coaches: Coach[];
}

export function CoachAssigner({ athleteId, currentCoachId, coaches }: CoachAssignerProps) {
    const [selectedCoach, setSelectedCoach] = useState<string>(currentCoachId || '');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();

    async function handleAssign() {
        if (!selectedCoach || selectedCoach === currentCoachId) return;

        setIsLoading(true);
        setMessage(null);

        try {
            await assignCoach(athleteId, selectedCoach);
            setMessage({ type: 'success', text: 'Entrenador asignado correctamente' });
            router.refresh();
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al asignar entrenador' });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="cv-card">
            <h3 className="font-semibold text-cv-text-primary mb-3 flex items-center gap-2">
                <UserCog size={18} className="text-cv-text-tertiary" />
                Entrenador Asignado
            </h3>

            <div className="space-y-3">
                <div className="relative">
                    <select
                        value={selectedCoach}
                        onChange={(e) => {
                            setSelectedCoach(e.target.value);
                            setMessage(null);
                        }}
                        className="w-full p-2 pr-8 rounded-lg bg-cv-bg-tertiary border border-cv-border-subtle text-cv-text-primary focus:outline-none focus:border-cv-accent appearance-none text-sm"
                        disabled={isLoading}
                    >
                        <option value="">Sin Asignar</option>
                        {coaches.map(coach => (
                            <option key={coach.id} value={coach.id}>
                                {coach.full_name} {coach.business_name ? `(${coach.business_name})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedCoach !== currentCoachId && (
                    <button
                        onClick={handleAssign}
                        disabled={isLoading || !selectedCoach}
                        className="w-full cv-btn-primary flex justify-center py-1.5 text-sm"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Guardar Cambios'}
                    </button>
                )}

                {message && (
                    <div className={`p-2 rounded text-xs flex items-center gap-1.5 ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                        {message.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    );
}
