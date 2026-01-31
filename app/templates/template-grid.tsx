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
    const [copyingId, setCopyingId] = useState<string | null>(null);
    const router = useRouter();

    const handleUseTemplate = async (template: Program) => {
        if (copyingId) return;

        setCopyingId(template.id);
        try {
            const res = await copyTemplateToProgram(template.id);
            if (res.error) {
                alert('Error copying template: ' + res.error);
                setCopyingId(null);
                return;
            }

            if (res.data) {
                // Force navigation since router.push was unreliable in verification
                window.location.assign(`/editor/${res.data.id}`);
            } else {
                setCopyingId(null);
            }
        } catch (e) {
            console.error(e);
            setCopyingId(null);
        }
    };

    const getVisuals = (program: Program) => {
        const name = program.name.toLowerCase();
        if (name.includes('fuerza') || name.includes('strength')) {
            return {
                icon: Dumbbell,
                bgClass: 'bg-gradient-to-br from-[#FF416C] to-[#FF4B2B]',
                label: 'Fuerza',
                textColor: 'text-white',
                iconColor: 'text-white'
            };
        }
        if (name.includes('hipertrofia') || name.includes('hypertrophy')) {
            return {
                icon: Dumbbell,
                bgClass: 'bg-gradient-to-br from-[#8A2387] via-[#E94057] to-[#F27121]',
                label: 'Hipertrofia',
                textColor: 'text-white',
                iconColor: 'text-white'
            };
        }
        if (name.includes('cardio') || name.includes('aerob') || name.includes('run')) {
            return {
                icon: Clock,
                bgClass: 'bg-gradient-to-br from-[#11998e] to-[#38ef7d]',
                label: 'Cardio',
                textColor: 'text-white',
                iconColor: 'text-white'
            };
        }
        return {
            icon: Flame,
            bgClass: 'bg-gradient-to-br from-[#2193b0] to-[#6dd5ed]',
            label: 'General',
            textColor: 'text-white',
            iconColor: 'text-white'
        };
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
                const { icon: Icon, bgClass, label, textColor, iconColor } = getVisuals(template);
                const isCopying = copyingId === template.id;

                return (
                    <div
                        key={template.id}
                        onClick={() => handleUseTemplate(template)}
                        className={`
                            group relative overflow-hidden rounded-2xl p-6 h-full flex flex-col
                            transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1
                            ${bgClass}
                            ${isCopying ? 'opacity-70 pointer-events-none' : ''}
                        `}
                    >
                        {/* Overlay texture/gradient for depth */}
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ${iconColor}`}>
                                    <Icon size={24} />
                                </div>
                                <div className={`px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium ${textColor} border border-white/10`}>
                                    {label}
                                </div>
                            </div>

                            <h3 className={`text-xl font-bold mb-3 ${textColor}`}>
                                {template.name}
                            </h3>

                            <p className={`text-sm opacity-90 line-clamp-3 mb-6 flex-grow ${textColor}`}>
                                {template.description || 'Sin descripción'}
                            </p>

                            <div className={`flex items-center justify-between text-sm pt-4 border-t border-white/20 ${textColor}`}>
                                <span className="font-medium opacity-90">
                                    Click para usar
                                </span>
                                {isCopying ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-all" />
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
