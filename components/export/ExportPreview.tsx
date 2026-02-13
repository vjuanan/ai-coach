/* eslint-disable @next/next/no-img-element */
import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Loader2, X, FileText, ImageIcon } from 'lucide-react';

// -- DATA INTERFACES --
interface MesocycleStrategy {
    focus: string;
    considerations?: string;
    technicalClarifications?: string;
    scalingAlternatives?: string;
}

interface WorkoutBlock {
    type: string;
    name?: string;
    config?: any;
    content: string[];
    section?: 'warmup' | 'main' | 'cooldown';
    cue?: string;
    format?: string;
}

interface DayData {
    name: string;
    blocks: WorkoutBlock[];
}

interface WeekData {
    weekNumber: number;
    focus: string;
    days: DayData[];
}

interface MonthlyProgression {
    name: string;
    progression: string[];
    variable?: string;
}

interface ExportPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    programName: string;
    clientInfo: {
        name: string;
        logo?: string;
    };
    coachName: string;
    monthlyStrategy?: {
        focus: string;
        duration: string;
        objectives: string[];
        progressions: MonthlyProgression[];
    };
    weeks: WeekData[];
    strategy?: MesocycleStrategy;
    mission?: string;
    weekDateRanges?: { weekNumber: number; startDate: string; endDate: string; }[];
}

// -- CONSTANTS & STYLES (Light Theme) --
const EXPORT_COLORS = {
    bgPrimary: '#FAFAF8', // Cream/Off-white background
    textPrimary: '#2D2926', // Almost black
    textSecondary: '#5C5550', // Dark gray
    accent: '#9D174D', // Deep Pink/Berry (Pink-700/800 range)
    accentLight: '#FCE7F3', // Light Pink background
    bgWarmup: '#FFF9F5',
    bgFinisher: '#FFF5EE',
    border: '#E5E7EB',
};

const BLOCK_STYLE: Record<string, { color: string; emoji: string; label: string }> = {
    strength_linear: { color: '#ef4444', emoji: '🔴', label: 'Fuerza' },
    metcon_structured: { color: '#f97316', emoji: '🔥', label: 'MetCon' },
    warmup: { color: '#22c55e', emoji: '✨', label: 'Activación' },
    accessory: { color: '#3b82f6', emoji: '🔹', label: 'Accesorio' },
    skill: { color: '#3b82f6', emoji: '🔹', label: 'Skill' },
    finisher: { color: '#ef4444', emoji: '🔥', label: 'Finisher' },
    free_text: { color: '#6b7280', emoji: '📝', label: 'Notas' },
    mobility: { color: '#8b5cf6', emoji: '🧘', label: 'Movilidad' },
};

function getBlockStyle(type: string) {
    return BLOCK_STYLE[type] || { color: '#6b7280', emoji: '▪️', label: 'Bloque' };
}

// -- MAIN COMPONENT --
export function ExportPreview({
    isOpen,
    onClose,
    programName,
    clientInfo,
    coachName,
    monthlyStrategy,
    weeks,
    mission,
    weekDateRanges
}: ExportPreviewProps) {
    const exportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<'png' | 'pdf'>('png');

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // -- EXPORT HANDLER --
    const handleExport = async () => {
        if (!exportRef.current) return;

        setIsExporting(true);

        try {
            await document.fonts.ready;

            const canvas = await html2canvas(exportRef.current, {
                backgroundColor: EXPORT_COLORS.bgPrimary,
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true,
            });

            if (exportFormat === 'png') {
                const link = document.createElement('a');
                link.download = `${clientInfo.name}-${programName.replace(/\s+/g, '_')}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } else {
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = 595.28;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                const pdf = new jsPDF({
                    orientation: imgHeight > imgWidth ? 'p' : 'l',
                    unit: 'pt',
                    format: [imgWidth, imgHeight],
                });

                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                pdf.save(`${clientInfo.name}-${programName.replace(/\s+/g, '_')}.pdf`);
            }
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    // -- HELPER FUNCTIONS --
    const getWeekDateRange = (weekNum: number) => {
        if (!weekDateRanges) return null;
        const range = weekDateRanges.find(r => r.weekNumber === weekNum);
        if (!range) return null;

        const formatDate = (dateStr: string) => {
            const date = new Date(dateStr);
            const day = date.getDate().toString().padStart(2, '0');
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const month = monthNames[date.getMonth()];
            return `${day} ${month}`;
        };

        return `${formatDate(range.startDate)} - ${formatDate(range.endDate)}`;
    };

    const groupBlocks = (blocks: WorkoutBlock[]) => {
        const activation = blocks.filter(b => b.section === 'warmup' || b.type === 'warmup' || b.type === 'mobility');
        const finisher = blocks.filter(b => b.section === 'cooldown' || b.type === 'finisher');
        const main = blocks.filter(b => !activation.includes(b) && !finisher.includes(b));
        return { activation, main, finisher };
    };

    const getProgressionForBlock = (blockName: string) => {
        if (!monthlyStrategy?.progressions) return null;
        const normName = blockName.trim().toLowerCase();
        return monthlyStrategy.progressions.find(p => p.name.trim().toLowerCase() === normName);
    };

    // -- COMPONENT RENDERERS --
    const renderExercise = (block: WorkoutBlock, index: number, isSuperSet: boolean = false, superSetLetter: string = '') => {
        const style = getBlockStyle(block.type);
        const progression = getProgressionForBlock(block.name || '');
        const numberDisplay = isSuperSet ? `${index}${superSetLetter}.` : `${index}.`;

        return (
            <div key={`${index}-${block.name}`} style={{ marginBottom: '24px', breakInside: 'avoid' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{
                        fontSize: '20px',
                        fontWeight: '800',
                        color: EXPORT_COLORS.accent,
                        marginRight: '8px',
                        width: '35px',
                        textAlign: 'right'
                    }}>
                        {numberDisplay}
                    </span>
                    <h4 style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: EXPORT_COLORS.textPrimary,
                        margin: 0,
                        marginRight: '8px',
                        fontFamily: 'Inter, system-ui, sans-serif'
                    }}>
                        {block.name || 'Bloque'}
                    </h4>
                    <span style={{ fontSize: '16px' }}>{style.emoji}</span>
                </div>

                {/* Content */}
                <div style={{ paddingLeft: '50px' }}>
                    {block.cue && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            marginBottom: '6px',
                            color: EXPORT_COLORS.textSecondary
                        }}>
                            <span style={{ marginRight: '6px', fontSize: '14px' }}>💡</span>
                            <span style={{ fontStyle: 'italic', fontSize: '14px', lineHeight: '1.4' }}>
                                {block.cue}
                            </span>
                        </div>
                    )}

                    <div style={{
                        borderLeft: `3px solid ${EXPORT_COLORS.accent}`,
                        paddingLeft: '12px',
                        backgroundColor: '#FFF0F5',
                        padding: '8px 12px',
                        borderRadius: '0 4px 4px 0',
                        marginTop: '4px'
                    }}>
                        {progression ? (
                            <div style={{ fontSize: '13px', lineHeight: '1.6', color: EXPORT_COLORS.textPrimary }}>
                                {progression.progression.map((val, idx) => {
                                    if (val === '-' || !val) return null;
                                    return (
                                        <span key={idx} style={{ display: 'inline-block', marginRight: '12px' }}>
                                            <span style={{ fontWeight: '700', color: EXPORT_COLORS.textPrimary }}>Sem {idx + 1}:</span> {val}
                                            {idx < progression.progression.length - 1 && (
                                                <span style={{ margin: '0 4px', color: '#9CA3AF' }}>→</span>
                                            )}
                                        </span>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ fontSize: '13px', lineHeight: '1.5', color: EXPORT_COLORS.textPrimary }}>
                                {block.content.map((line, i) => (
                                    <div key={i}>{line}</div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Content */}
            <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
                    <h2 className="text-lg font-semibold text-gray-900">Vista Previa del Export</h2>

                    <div className="flex items-center gap-3">
                        {/* Custom Select for format */}
                        <div className="relative">
                            <select
                                value={exportFormat}
                                onChange={(e) => setExportFormat(e.target.value as 'png' | 'pdf')}
                                className="h-9 w-[100px] rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer appearance-none"
                            >
                                <option value="png">PNG</option>
                                <option value="pdf">PDF</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <FileText size={14} />
                            </div>
                        </div>

                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-pink-700 px-4 py-2 text-sm font-medium text-white shadow hover:bg-pink-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 transition-colors"
                        >
                            {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                            Exportar
                        </button>

                        <button
                            onClick={onClose}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-transparent text-sm font-medium transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Preview Area */}
                <div className="flex-1 overflow-y-auto bg-gray-100 p-8 flex justify-center">
                    <div
                        ref={exportRef}
                        style={{
                            width: '800px',
                            minHeight: '1123px',
                            backgroundColor: EXPORT_COLORS.bgPrimary,
                            padding: '40px',
                            boxSizing: 'border-box',
                            fontFamily: 'Inter, system-ui, sans-serif',
                            color: EXPORT_COLORS.textPrimary,
                            position: 'relative'
                        }}
                    >
                        {/* 1. Header Section */}
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                            {weekDateRanges && (
                                <div style={{
                                    display: 'inline-block',
                                    backgroundColor: '#4A044E', // Plum
                                    color: 'white',
                                    padding: '6px 16px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    marginBottom: '20px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    {weekDateRanges.map(range => (
                                        <div key={range.weekNumber}>
                                            SEM {range.weekNumber}: {getWeekDateRange(range.weekNumber)}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <h2 style={{
                                fontFamily: 'cursive',
                                fontSize: '28px',
                                color: EXPORT_COLORS.accent,
                                marginBottom: '4px',
                                fontStyle: 'italic'
                            }}>
                                Para {clientInfo.name} ❤️
                            </h2>
                            <h1 style={{
                                fontSize: '40px',
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                lineHeight: '1.1',
                                marginBottom: '16px',
                                color: '#1F2937'
                            }}>
                                Plan de Entrenamiento
                            </h1>
                            <div style={{
                                display: 'inline-block',
                                backgroundColor: '#831843', // Pink-900
                                color: 'white',
                                padding: '6px 16px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                {programName} • {monthlyStrategy?.focus || 'General'}
                            </div>
                        </div>

                        {/* 2. Mission Statement */}
                        {mission && (
                            <div style={{
                                backgroundColor: EXPORT_COLORS.accentLight,
                                padding: '20px 24px',
                                borderRadius: '12px',
                                marginBottom: '40px',
                                borderLeft: `6px solid ${EXPORT_COLORS.accent}`
                            }}>
                                <h3 style={{
                                    color: EXPORT_COLORS.accent,
                                    fontSize: '18px',
                                    fontWeight: '800',
                                    marginBottom: '8px'
                                }}>
                                    🎯 Misión: {mission.split(':')[0]}
                                </h3>
                                <p style={{
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    color: EXPORT_COLORS.textSecondary
                                }}>
                                    {mission.includes(':') ? mission.split(':').slice(1).join(':').trim() : mission}
                                </p>
                            </div>
                        )}

                        {/* 3. Daily Workouts */}
                        {weeks.flatMap(week => week.days).map((day, dayIdx) => {
                            const { activation, main, finisher } = groupBlocks(day.blocks);
                            if (day.blocks.length === 0) return null;

                            return (
                                <div key={dayIdx} style={{ marginBottom: '50px', breakInside: 'avoid' }}>
                                    {/* Link Day Header */}
                                    <div style={{
                                        backgroundColor: '#9D174D',
                                        color: 'white',
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        marginBottom: '24px',
                                        fontSize: '18px',
                                        fontWeight: '800',
                                        fontStyle: 'italic',
                                        boxShadow: '0 4px 6px -1px rgba(157, 23, 77, 0.3)'
                                    }}>
                                        {day.name}: {day.blocks[0]?.name?.split('(')[0] || 'Entrenamiento'}
                                    </div>

                                    {/* Activation */}
                                    {activation.length > 0 && (
                                        <div style={{
                                            marginBottom: '24px',
                                            backgroundColor: '#FDF2F8',
                                            padding: '16px',
                                            borderRadius: '8px',
                                            border: '1px dashed #FBCFE8'
                                        }}>
                                            <h4 style={{
                                                color: '#DB2777',
                                                fontWeight: '800',
                                                textTransform: 'uppercase',
                                                fontSize: '13px',
                                                marginBottom: '10px',
                                                letterSpacing: '0.5px'
                                            }}>
                                                ✨ Activación ({activation.length} ejercicios)
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {activation.map((block, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'baseline', fontSize: '14px', color: EXPORT_COLORS.textSecondary }}>
                                                        <span style={{ color: '#DB2777', marginRight: '8px', fontSize: '10px' }}>●</span>
                                                        <span style={{ fontWeight: '600', color: EXPORT_COLORS.textPrimary, marginRight: '6px' }}>{block.name}</span>
                                                        {block.content && block.content.length > 0 && (
                                                            <span style={{ fontStyle: 'italic', fontSize: '13px' }}>
                                                                — {block.content.join(', ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Main Blocks */}
                                    <div>
                                        {main.map((block, i) => renderExercise(block, i + 1))}
                                    </div>

                                    {/* Finisher */}
                                    {finisher.length > 0 && (
                                        <div style={{
                                            marginTop: '24px',
                                            padding: '16px',
                                            backgroundColor: '#FFF1F2',
                                            borderLeft: '4px solid #E11D48',
                                            borderRadius: '0 8px 8px 0'
                                        }}>
                                            <h4 style={{
                                                color: '#BE123C',
                                                fontSize: '16px',
                                                fontWeight: '800',
                                                marginBottom: '10px',
                                                textTransform: 'uppercase'
                                            }}>
                                                🔥 Finisher
                                            </h4>
                                            {finisher.map((block, i) => (
                                                <div key={i} style={{ marginBottom: '12px' }}>
                                                    <div style={{ fontWeight: '700', color: EXPORT_COLORS.textPrimary }}>
                                                        {block.name}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: EXPORT_COLORS.textSecondary }}>
                                                        {block.content.map((line, l) => (
                                                            <div key={l}>{line}</div>
                                                        ))}
                                                    </div>
                                                    {block.cue && (
                                                        <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#9CA3AF', marginTop: '2px' }}>
                                                            💡 {block.cue}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Footer */}
                        <div style={{
                            marginTop: '60px',
                            borderTop: `2px solid ${EXPORT_COLORS.border}`,
                            paddingTop: '20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: EXPORT_COLORS.textSecondary,
                            fontSize: '11px',
                            fontWeight: '500'
                        }}>
                            <div>Coach {coachName}</div>
                            <div>Generado por AI Coach • {new Date().getFullYear()}</div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
