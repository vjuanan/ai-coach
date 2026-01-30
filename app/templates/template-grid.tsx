'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Flame, Clock, Copy, Loader2, ArrowRight } from 'lucide-react';
import { copyTemplateToProgram } from '@/lib/actions';
import type { Database } from '@/lib/supabase/types';

type Program = Database['public']['Tables']['programs']['Row'];

interface TemplateGridProps {
    templates: Program[];
}

export function TemplateGrid({ templates }: TemplateGridProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [copyingId, setCopyingId] = useState<string | null>(null);

    const handleUseTemplate = (template: Program) => {
        if (copyingId) return;

        setCopyingId(template.id);
        startTransition(async () => {
            try {
                const res = await copyTemplateToProgram(template.id);
                if (res.error) {
                    alert('Error copying template: ' + res.error);
                    setCopyingId(null);
                    return;
                }

                if (res.data) {
                    router.push(`/editor/${res.data.id}`);
                }
            } catch (e) {
                console.error(e);
                setCopyingId(null);
            }
        });
    };

    const getVisuals = (program: Program) => {
        const name = program.name.toLowerCase();
        if (name.includes('fuerza') || name.includes('strength')) {
            return { icon: Dumbbell, color: 'text-red-400 bg-red-500/15', label: 'Fuerza' };
        }
        if (name.includes('hipertrofia') || name.includes('hypertrophy')) {
            return { icon: Dumbbell, color: 'text-purple-400 bg-purple-500/15', label: 'Hipertrofia' };
        }
        if (name.includes('cardio') || name.includes('aerob') || name.includes('run')) {
            return { icon: Clock, color: 'text-green-400 bg-green-500/15', label: 'Cardio' };
        }
        return { icon: Flame, color: 'text-cv-accent bg-cv-accent-muted', label: 'General' };
    };

    if (templates.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-cv-text-secondary">No hay plantillas disponibles en este momento.</p>
                <p className="text-sm text-gray-500 mt-2">Ejecuta el script de migración para cargar las plantillas base.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => {
                const { icon: Icon, color, label } = getVisuals(template);
                const isCopying = copyingId === template.id;

                return (
                    <div
                        key={template.id}
                        onClick={() => handleUseTemplate(template)}
                        className={`
                            group relative overflow-hidden rounded-xl border border-white/5 bg-cv-bg-surface p-6
                            hover:border-cv-accent/50 transition-all duration-300 cursor-pointer
                            ${isCopying ? 'opacity-70 pointer-events-none' : ''}
                        `}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-cv-accent/0 to-cv-accent/0 group-hover:from-cv-accent/5 group-hover:to-transparent transition-all duration-500" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
                                    <Icon size={24} />
                                </div>
                                <div className="px-2 py-1 rounded bg-white/5 text-xs text-cv-text-secondary border border-white/5">
                                    {label}
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-cv-text-primary mb-2 group-hover:text-cv-accent transition-colors">
                                {template.name}
                            </h3>

                            <p className="text-sm text-cv-text-secondary line-clamp-2 h-10 mb-6">
                                {template.description || 'Sin descripción'}
                            </p>

                            <div className="flex items-center justify-between text-sm pt-4 border-t border-white/5">
                                <span className="text-cv-text-tertiary">
                                    Click para usar
                                </span>
                                {isCopying ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-cv-accent" />
                                ) : (
                                    <ArrowRight className="w-5 h-5 text-cv-text-secondary group-hover:text-cv-accent transform group-hover:translate-x-1 transition-all" />
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
