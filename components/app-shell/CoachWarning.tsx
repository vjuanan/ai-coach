'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface CoachWarningProps {
    hasCoach: boolean;
    isAthlete: boolean;
}

export function CoachWarning({ hasCoach, isAthlete }: CoachWarningProps) {
    const [isVisible, setIsVisible] = useState(true);

    if (!isAthlete || hasCoach || !isVisible) return null;

    return (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <AlertTriangle className="text-yellow-500" size={20} />
                <div>
                    <p className="text-sm font-medium text-yellow-500">
                        No tienes un Coach asignado
                    </p>
                    <p className="text-xs text-yellow-500/80">
                        Algunas funciones pueden estar limitadas hasta que un entrenador te asigne a su equipo.
                    </p>
                </div>
            </div>
            <button
                onClick={() => setIsVisible(false)}
                className="text-yellow-500/60 hover:text-yellow-500 transition-colors"
            >
                <X size={18} />
            </button>
        </div>
    );
}
