'use client';

import { useState } from 'react';
import { Dumbbell, Flame, Loader2, Sparkles, Eye, FileInput } from 'lucide-react';
import { copyTemplateToProgram } from '@/lib/actions';
import type { Program } from '@/lib/supabase/types';
import { DuplicateTemplateDialog } from '@/components/programs/DuplicateTemplateDialog';

interface TemplateGridProps {
    templates: Program[];
    athletes: { id: string; name: string; email?: string | null }[];
    gyms: { id: string; name: string; email?: string | null }[];
}

export function TemplateGrid({ templates, athletes, gyms }: TemplateGridProps) {
    const [copyingId, setCopyingId] = useState<string | null>(null);
    const [duplicateDialogState, setDuplicateDialogState] = useState<{ isOpen: boolean; template: Program | null }>({
        isOpen: false,
        template: null
    });

    const handleOpenDuplicate = (e: React.MouseEvent, template: Program) => {
        e.stopPropagation(); // Prevent card click
        setDuplicateDialogState({ isOpen: true, template });
    };

    const handleCloseDuplicate = () => {
        if (copyingId) return; // Prevent closing while processing
        setDuplicateDialogState({ isOpen: false, template: null });
    };

    const handleConfirmDuplicate = async (assignedClientId?: string) => {
        const template = duplicateDialogState.template;
        if (!template) return;

        setCopyingId(template.id);

        try {
            const res = await copyTemplateToProgram(template.id, assignedClientId);

            if (res.error) {
                alert('Error al duplicar template: ' + res.error);
                setCopyingId(null);
                // Don't close dialog on error so user can retry?
                // Or maybe close it. Let's keep it open for now or close? 
                // Alert handles message.
                handleCloseDuplicate();
                return;
            }

            if (res.data) {
                // Success - Redirect
                window.location.assign(`/editor/${res.data.id}`);
            } else {
                setCopyingId(null);
                handleCloseDuplicate();
            }
        } catch (e) {
            console.error(e);
            setCopyingId(null);
            handleCloseDuplicate();
            alert('Ocurrió un error inesperado.');
        }
    };

    const handleCardClick = (templateId: string) => {
        // Navigate to preview/read-only mode or just editor?
        // User asked to "visualizar y editar". 
        // If we send them to /editor/[id], they are editing the TEMPLATE itself if they are admin.
        // We probably want to send them to a preview page.
        // For now, let's assume /templates/[id] will be the preview page.
        // But I haven't created that page yet.
        // Plan says: [NEW] [app/(dashboard)/templates/[templateId]/page.tsx]
        window.location.assign(`/templates/${templateId}`);
    };

    const getVisuals = (program: Program) => {
        // Use gradient from attributes if available
        const attrs = program.attributes;
        if (attrs?.gradient) {
            const focus = attrs.focus || 'general';
            let icon = Flame;
            let label = 'General';

            if (focus === 'crossfit' || program.name.toLowerCase().includes('crossfit')) {
                icon = Flame;
                label = 'CrossFit';
            } else if (focus === 'strength' || program.name.toLowerCase().includes('fuerza')) {
                icon = Dumbbell;
                label = 'Fuerza';
            } else if (focus === 'hypertrophy' || program.name.toLowerCase().includes('hipertrofia')) {
                icon = Dumbbell;
                label = 'Hipertrofia';
            }

            return {
                icon,
                bgClass: `bg-gradient-to-br ${attrs.gradient}`,
                label,
                textColor: 'text-white',
                iconColor: 'text-white'
            };
        }

        // Fallback to name-based detection
        const name = program.name.toLowerCase();
        if (name.includes('fuerza') || name.includes('strength')) {
            return {
                icon: Dumbbell,
                bgClass: 'bg-gradient-to-br from-[#2193b0] to-[#6dd5ed]',
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
        if (name.includes('crossfit') || name.includes('galpin')) {
            return {
                icon: Flame,
                bgClass: 'bg-gradient-to-br from-[#FF416C] to-[#FF4B2B]',
                label: 'CrossFit',
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
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => {
                    const { icon: Icon, bgClass, label, textColor, iconColor } = getVisuals(template);
                    const isCopying = copyingId === template.id;
                    const attrs = template.attributes;

                    return (
                        <div
                            key={template.id}
                            onClick={() => handleCardClick(template.id)}
                            className={`
                                group relative overflow-hidden rounded-2xl p-6 h-full flex flex-col
                                transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 cursor-pointer
                                ${bgClass}
                            `}
                        >
                            {/* Overlay texture for depth */}
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <div className="relative z-10 flex flex-col h-full pointer-events-none">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ${iconColor}`}>
                                        <Icon size={24} />
                                    </div>
                                    <div className={`px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium ${textColor} border border-white/10`}>
                                        {label}
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className={`text-xl font-bold mb-2 ${textColor}`}>
                                    {template.name}
                                </h3>

                                {/* Inspired By Badge */}
                                {attrs?.inspired_by && (
                                    <div className={`flex items-center gap-1 mb-3 ${textColor} opacity-80`}>
                                        <Sparkles size={14} />
                                        <span className="text-xs font-medium">Inspirado en {attrs.inspired_by}</span>
                                    </div>
                                )}

                                {/* Description */}
                                <p className={`text-sm opacity-90 line-clamp-3 mb-4 flex-grow ${textColor}`}>
                                    {template.description || 'Sin descripción'}
                                </p>

                                {/* Methodology Tags */}
                                {attrs?.methodology && attrs.methodology.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {attrs.methodology.slice(0, 3).map((method, idx) => (
                                            <span
                                                key={idx}
                                                className={`px-2 py-0.5 rounded-md bg-black/20 text-xs ${textColor} opacity-80`}
                                            >
                                                {method}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Duration info */}
                                {attrs?.duration_weeks && (
                                    <div className={`text-xs mb-4 ${textColor} opacity-80`}>
                                        {attrs.duration_weeks} semanas • {attrs.days_per_week || 4} días/semana
                                    </div>
                                )}

                                {/* Action Buttons - Enable pointer events for buttons */}
                                <div className="mt-auto flex gap-2 pointer-events-auto">

                                    <button
                                        onClick={(e) => handleOpenDuplicate(e, template)}
                                        disabled={isCopying}
                                        className={`
                                            flex-1 flex items-center justify-center gap-2 
                                            py-3 px-4 rounded-xl
                                            bg-white/20 hover:bg-white/30 
                                            backdrop-blur-sm border border-white/10
                                            transition-all duration-200
                                            ${textColor} font-medium
                                            ${isCopying ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                                        `}
                                    >
                                        {isCopying ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FileInput className="w-4 h-4" />
                                                <span>Usar como Base</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        className={`
                                            w-12 flex items-center justify-center rounded-xl
                                            bg-white/10 hover:bg-white/20 
                                            backdrop-blur-sm border border-white/10
                                            transition-all duration-200
                                            ${textColor}
                                        `}
                                    >
                                        <Eye className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <DuplicateTemplateDialog
                isOpen={duplicateDialogState.isOpen}
                onClose={handleCloseDuplicate}
                onConfirm={handleConfirmDuplicate}
                templateName={duplicateDialogState.template?.name || ''}
                athletes={athletes}
                gyms={gyms}
                isProcessing={copyingId !== null}
            />
        </>
    );
}
