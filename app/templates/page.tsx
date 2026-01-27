'use client';

import { AppShell } from '@/components/app-shell';
import {
    FileText,
    Dumbbell,
    Clock,
    Flame
} from 'lucide-react';

const templates = [
    {
        id: '1',
        name: 'Bloque de Fuerza',
        description: 'Progresión lineal de 4 semanas enfocada en los 3 grandes levantamientos',
        focus: 'Fuerza',
        weeks: 4,
        icon: Dumbbell,
        color: 'text-red-400 bg-red-500/15',
    },
    {
        id: '2',
        name: 'Preparación Competición',
        description: 'Ciclo de rendimiento máximo para próximas competiciones',
        focus: 'Mixto',
        weeks: 8,
        icon: Flame,
        color: 'text-cv-accent bg-cv-accent-muted',
    },
    {
        id: '3',
        name: 'Capacidad Aeróbica',
        description: 'Enfoque en capacidad aeróbica y acondicionamiento',
        focus: 'Cardio',
        weeks: 6,
        icon: Clock,
        color: 'text-green-400 bg-green-500/15',
    },
];

export default function TemplatesPage() {
    return (
        <AppShell title="Plantillas">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-cv-text-primary">Plantillas</h1>
                    <p className="text-cv-text-secondary">Estructuras de programas predefinidas para empezar rápido</p>
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-3 gap-4">
                    {templates.map((template) => {
                        const Icon = template.icon;
                        return (
                            <div
                                key={template.id}
                                className="cv-card hover:border-cv-accent/50 cursor-pointer transition-all group"
                            >
                                <div className={`w-12 h-12 rounded-lg ${template.color} flex items-center justify-center mb-4`}>
                                    <Icon size={24} />
                                </div>
                                <h3 className="font-semibold text-cv-text-primary group-hover:text-cv-accent transition-colors">
                                    {template.name}
                                </h3>
                                <p className="text-sm text-cv-text-tertiary mt-1 mb-4">
                                    {template.description}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-cv-text-secondary">
                                    <span className="cv-badge">{template.focus}</span>
                                    <span>{template.weeks} semanas</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 text-center text-cv-text-tertiary">
                    <p>Más plantillas próximamente...</p>
                </div>
            </div>
        </AppShell>
    );
}
