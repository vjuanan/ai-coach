'use client';

import { useState } from 'react';
import { assignCoach } from '@/lib/actions-coach';
import { UserCog, Check, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();

    const assignedCoach = coaches.find(c => c.id === currentCoachId);
    const currentSelection = coaches.find(c => c.id === selectedCoach);

    async function handleAssign() {
        if (!selectedCoach || selectedCoach === currentCoachId) {
            setIsEditing(false);
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            await assignCoach(athleteId, selectedCoach);
            toast.success('Entrenador asignado correctamente');
            setMessage({ type: 'success', text: 'Entrenador asignado correctamente' });
            setIsEditing(false);
            router.refresh();
        } catch (error) {
            toast.error('Error al asignar entrenador');
            setMessage({ type: 'error', text: 'Error al asignar entrenador' });
        } finally {
            setIsLoading(false);
        }
    }

    // If no coach assigned and not editing, show empty state
    if (!currentCoachId && !isEditing) {
        return (
            <div className="cv-card border-dashed border-cv-border flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cv-bg-tertiary flex items-center justify-center text-cv-text-tertiary">
                        <UserCog size={20} />
                    </div>
                    <div>
                        <p className="font-semibold text-cv-text-primary text-sm">Sin Entrenador</p>
                        <p className="text-xs text-cv-text-tertiary">Asigna un coach a este atleta</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-semibold text-cv-accent hover:underline"
                >
                    Asignar
                </button>
            </div>
        );
    }

    // Viewing Mode (Profile Card)
    if (!isEditing && assignedCoach) {
        const initials = assignedCoach.full_name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

        return (
            <div className="cv-card flex items-center justify-between p-4 border-l-4 border-l-cv-accent">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cv-accent to-cv-accent-muted flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cv-accent/20">
                        {initials}
                    </div>
                    <div>
                        <p className="text-xs text-cv-text-tertiary font-medium uppercase tracking-wider mb-0.5">Entrenador Asignado</p>
                        <h3 className="font-bold text-cv-text-primary text-lg leading-tight">{assignedCoach.full_name}</h3>
                        {assignedCoach.business_name && (
                            <p className="text-sm text-cv-text-secondary">{assignedCoach.business_name}</p>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => {
                        setSelectedCoach(currentCoachId || '');
                        setIsEditing(true);
                    }}
                    className="cv-btn-secondary text-xs py-1.5 px-3"
                >
                    Cambiar
                </button>
            </div>
        );
    }

    // Editing Mode
    return (
        <div className="cv-card p-4 border-cv-accent/50">
            <h3 className="font-semibold text-cv-text-primary mb-3 flex items-center gap-2 text-sm">
                <UserCog size={16} className="text-cv-accent" />
                Seleccionar Entrenador
            </h3>

            <div className="space-y-3">
                <div className="relative">
                    <select
                        value={selectedCoach}
                        onChange={(e) => {
                            setSelectedCoach(e.target.value);
                            setMessage(null);
                        }}
                        className="w-full p-2.5 rounded-lg bg-cv-bg-secondary border border-cv-border text-cv-text-primary focus:outline-none focus:border-cv-accent appearance-none text-sm"
                        disabled={isLoading}
                    >
                        <option value="">-- Seleccionar --</option>
                        {coaches.map(coach => (
                            <option key={coach.id} value={coach.id}>
                                {coach.full_name} {coach.business_name ? `(${coach.business_name})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-2 justify-end mt-2">
                    <button
                        onClick={() => setIsEditing(false)}
                        disabled={isLoading}
                        className="cv-btn-ghost text-xs py-1.5 px-3"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={isLoading || !selectedCoach}
                        className="cv-btn-primary flex items-center gap-2 py-1.5 px-3 text-xs"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}
