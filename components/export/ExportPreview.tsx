'use client';

import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { X, Download, Image, FileText, Loader2, Calendar, Target, TrendingUp, Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MesocycleStrategy {
    focus: string;
    considerations: string;
    technicalClarifications: string;
    scalingAlternatives: string;
}

interface WorkoutBlock {
    type: string;
    name: string;
    content: string[];
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
    notes?: string;
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
}

// Color palette for export - hardcoded to ensure html2canvas compatibility
const EXPORT_COLORS = {
    bgPrimary: '#1f2937',
    bgSecondary: '#111827',
    bgTertiary: '#374151',
    textPrimary: '#ffffff',
    textSecondary: '#d1d5db',
    textTertiary: '#9ca3af',
    textMuted: '#6b7280',
    accent: '#f97316',
    accentGreen: '#22c55e',
    border: '#374151',
    borderLight: '#4b5563',
};

// Block type to color mapping
const getBlockColor = (type: string): string => {
    switch (type) {
        case 'strength_linear': return '#ef4444';
        case 'metcon_structured': return '#f97316';
        case 'warmup': return '#22c55e';
        case 'skill': return '#3b82f6';
        default: return '#6b7280';
    }
};

export function ExportPreview({
    isOpen,
    onClose,
    programName,
    clientInfo,
    coachName,
    monthlyStrategy,
    weeks,
    strategy,
}: ExportPreviewProps) {
    const exportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<'png' | 'pdf'>('png');

    const handleExport = async () => {
        if (!exportRef.current) return;

        setIsExporting(true);

        try {
            const canvas = await html2canvas(exportRef.current, {
                backgroundColor: EXPORT_COLORS.bgPrimary,
                scale: 2,
                useCORS: true,
                logging: false,
            });

            if (exportFormat === 'png') {
                const link = document.createElement('a');
                link.download = `${clientInfo.name}-${programName}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } else {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: [canvas.width / 2, canvas.height / 2],
                });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
                pdf.save(`${clientInfo.name}-${programName}.pdf`);
            }
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-4 md:inset-8 lg:inset-12 bg-cv-bg-secondary border border-cv-border rounded-xl shadow-cv-lg z-50 flex flex-col overflow-hidden"
                    >
                        {/* Header - Fixed */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-cv-border bg-cv-bg-secondary shrink-0">
                            <h2 className="font-semibold text-cv-text-primary">Vista Previa Exportación</h2>
                            <div className="flex items-center gap-3">
                                {/* Format Toggle */}
                                <div className="flex bg-cv-bg-tertiary rounded-lg p-1">
                                    <button
                                        onClick={() => setExportFormat('png')}
                                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-1.5
                      ${exportFormat === 'png' ? 'bg-cv-accent text-white' : 'text-cv-text-secondary hover:text-cv-text-primary'}`}
                                    >
                                        <Image size={14} />
                                        PNG
                                    </button>
                                    <button
                                        onClick={() => setExportFormat('pdf')}
                                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-1.5
                      ${exportFormat === 'pdf' ? 'bg-cv-accent text-white' : 'text-cv-text-secondary hover:text-cv-text-primary'}`}
                                    >
                                        <FileText size={14} />
                                        PDF
                                    </button>
                                </div>

                                {/* Export Button */}
                                <button
                                    onClick={handleExport}
                                    disabled={isExporting}
                                    className="cv-btn-primary"
                                >
                                    {isExporting ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Download size={16} />
                                    )}
                                    {isExporting ? 'Exportando...' : 'Exportar'}
                                </button>

                                <button onClick={onClose} className="cv-btn-ghost p-2">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Preview Area */}
                        <div className="flex-1 overflow-auto p-4 md:p-6">
                            {/* EXPORT CONTENT - Using INLINE STYLES for html2canvas compatibility */}
                            <div
                                ref={exportRef}
                                style={{
                                    backgroundColor: EXPORT_COLORS.bgPrimary,
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    maxWidth: '700px',
                                    margin: '0 auto',
                                    fontFamily: 'system-ui, -apple-system, sans-serif',
                                }}
                            >
                                {/* HEADER - Client & Program Info */}
                                <div style={{
                                    padding: '24px',
                                    borderBottom: `1px solid ${EXPORT_COLORS.border}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                }}>
                                    {clientInfo.logo ? (
                                        <img
                                            src={clientInfo.logo}
                                            alt={clientInfo.name}
                                            style={{
                                                width: '56px',
                                                height: '56px',
                                                borderRadius: '12px',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: '12px',
                                            background: `linear-gradient(135deg, ${EXPORT_COLORS.accent}, #ea580c)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: EXPORT_COLORS.textPrimary,
                                            fontWeight: 'bold',
                                            fontSize: '20px',
                                        }}>
                                            {clientInfo.name.charAt(0)}
                                        </div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <h1 style={{
                                            fontSize: '24px',
                                            fontWeight: 'bold',
                                            color: EXPORT_COLORS.textPrimary,
                                            margin: 0,
                                        }}>
                                            {clientInfo.name}
                                        </h1>
                                        <p style={{
                                            color: EXPORT_COLORS.textTertiary,
                                            margin: 0,
                                            fontSize: '14px',
                                        }}>
                                            {programName}
                                        </p>
                                    </div>
                                    {monthlyStrategy?.duration && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '6px 12px',
                                            backgroundColor: `${EXPORT_COLORS.bgSecondary}80`,
                                            borderRadius: '8px',
                                            border: `1px solid ${EXPORT_COLORS.border}50`,
                                        }}>
                                            <Calendar size={16} color={EXPORT_COLORS.accent} />
                                            <span style={{
                                                fontSize: '14px',
                                                color: EXPORT_COLORS.textSecondary,
                                            }}>
                                                {monthlyStrategy.duration}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* MONTHLY OVERVIEW */}
                                {monthlyStrategy && (
                                    <div style={{
                                        padding: '24px',
                                        borderBottom: `1px solid ${EXPORT_COLORS.border}`,
                                        background: `linear-gradient(180deg, ${EXPORT_COLORS.bgSecondary}50, transparent)`,
                                    }}>
                                        {/* Main Focus */}
                                        {monthlyStrategy.focus && (
                                            <div style={{
                                                display: 'flex',
                                                gap: '12px',
                                                marginBottom: '24px',
                                            }}>
                                                <Target size={18} color={EXPORT_COLORS.accent} style={{ flexShrink: 0, marginTop: '4px' }} />
                                                <div>
                                                    <h2 style={{
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        color: EXPORT_COLORS.accent,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        margin: '0 0 4px 0',
                                                    }}>
                                                        Foco del Mesociclo
                                                    </h2>
                                                    <p style={{
                                                        color: EXPORT_COLORS.textSecondary,
                                                        fontSize: '16px',
                                                        lineHeight: 1.6,
                                                        margin: 0,
                                                    }}>
                                                        {monthlyStrategy.focus}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Progressions */}
                                        {monthlyStrategy.progressions && monthlyStrategy.progressions.length > 0 && (
                                            <div style={{
                                                display: 'flex',
                                                gap: '12px',
                                                marginBottom: '24px',
                                            }}>
                                                <TrendingUp size={18} color={EXPORT_COLORS.accentGreen} style={{ flexShrink: 0, marginTop: '4px' }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <h2 style={{
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        color: EXPORT_COLORS.accentGreen,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        margin: '0 0 12px 0',
                                                    }}>
                                                        Progresiones
                                                    </h2>
                                                    <div style={{
                                                        backgroundColor: `${EXPORT_COLORS.bgTertiary}40`,
                                                        borderRadius: '12px',
                                                        padding: '16px',
                                                        border: `1px solid ${EXPORT_COLORS.border}`,
                                                    }}>
                                                        {/* Header Row */}
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '2fr repeat(4, 1fr)',
                                                            gap: '8px',
                                                            textAlign: 'center',
                                                            marginBottom: '8px',
                                                        }}>
                                                            <div style={{
                                                                textAlign: 'left',
                                                                color: EXPORT_COLORS.textMuted,
                                                                fontSize: '11px',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.05em',
                                                            }}>
                                                                Ejercicio
                                                            </div>
                                                            {['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'].map((sem, i) => (
                                                                <div key={i} style={{
                                                                    color: EXPORT_COLORS.textMuted,
                                                                    fontSize: '11px',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.05em',
                                                                }}>
                                                                    {sem}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {/* Progression Rows */}
                                                        {monthlyStrategy.progressions.map((prog, idx) => (
                                                            <div key={idx} style={{
                                                                display: 'grid',
                                                                gridTemplateColumns: '2fr repeat(4, 1fr)',
                                                                gap: '8px',
                                                                alignItems: 'center',
                                                                padding: '8px 0',
                                                                borderTop: idx > 0 ? `1px solid ${EXPORT_COLORS.border}50` : 'none',
                                                            }}>
                                                                <div style={{ textAlign: 'left' }}>
                                                                    <span style={{
                                                                        color: EXPORT_COLORS.textPrimary,
                                                                        fontWeight: '500',
                                                                        fontSize: '14px',
                                                                    }}>
                                                                        {prog.name}
                                                                    </span>
                                                                    {prog.notes && (
                                                                        <p style={{
                                                                            color: EXPORT_COLORS.textMuted,
                                                                            fontSize: '11px',
                                                                            margin: '2px 0 0 0',
                                                                        }}>
                                                                            {prog.notes}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                {prog.progression.map((value, weekIdx) => (
                                                                    <div key={weekIdx} style={{ textAlign: 'center' }}>
                                                                        <span style={{
                                                                            fontFamily: 'monospace',
                                                                            fontSize: '13px',
                                                                            color: weekIdx === prog.progression.length - 1 ? EXPORT_COLORS.accentGreen : EXPORT_COLORS.textSecondary,
                                                                            fontWeight: weekIdx === prog.progression.length - 1 ? 'bold' : 'normal',
                                                                        }}>
                                                                            {value}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                                {/* Fill empty cells */}
                                                                {Array.from({ length: 4 - prog.progression.length }).map((_, i) => (
                                                                    <div key={`empty-${i}`} style={{
                                                                        textAlign: 'center',
                                                                        color: EXPORT_COLORS.textMuted,
                                                                    }}>
                                                                        -
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Objectives */}
                                        {monthlyStrategy.objectives && monthlyStrategy.objectives.length > 0 && (
                                            <div style={{
                                                display: 'flex',
                                                gap: '12px',
                                            }}>
                                                <div style={{ width: '18px', flexShrink: 0 }} />
                                                <div>
                                                    <p style={{
                                                        fontSize: '11px',
                                                        color: EXPORT_COLORS.textMuted,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        margin: '0 0 8px 0',
                                                    }}>
                                                        Objetivos del Ciclo
                                                    </p>
                                                    <ul style={{
                                                        margin: 0,
                                                        padding: 0,
                                                        listStyle: 'none',
                                                    }}>
                                                        {monthlyStrategy.objectives.map((obj, idx) => (
                                                            <li key={idx} style={{
                                                                display: 'flex',
                                                                alignItems: 'flex-start',
                                                                gap: '8px',
                                                                fontSize: '14px',
                                                                color: EXPORT_COLORS.textSecondary,
                                                                marginBottom: '4px',
                                                            }}>
                                                                <span style={{ color: EXPORT_COLORS.accent, marginTop: '4px' }}>•</span>
                                                                {obj}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Strategy section (backwards compatibility) */}
                                {!monthlyStrategy && strategy && (strategy.focus || strategy.considerations) && (
                                    <div style={{
                                        padding: '24px',
                                        borderBottom: `1px solid ${EXPORT_COLORS.border}`,
                                    }}>
                                        {strategy.focus && (
                                            <>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    marginBottom: '8px',
                                                }}>
                                                    <div style={{
                                                        width: '4px',
                                                        height: '16px',
                                                        borderRadius: '2px',
                                                        backgroundColor: EXPORT_COLORS.accent,
                                                    }} />
                                                    <span style={{
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        color: EXPORT_COLORS.accent,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                    }}>
                                                        Enfoque
                                                    </span>
                                                </div>
                                                <p style={{
                                                    color: EXPORT_COLORS.textSecondary,
                                                    fontSize: '14px',
                                                    marginBottom: '12px',
                                                }}>
                                                    {strategy.focus}
                                                </p>
                                            </>
                                        )}
                                        {strategy.considerations && (
                                            <div style={{
                                                backgroundColor: `${EXPORT_COLORS.bgTertiary}50`,
                                                borderRadius: '8px',
                                                padding: '12px',
                                                marginTop: '8px',
                                            }}>
                                                <p style={{
                                                    fontSize: '11px',
                                                    color: EXPORT_COLORS.textTertiary,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    marginBottom: '4px',
                                                }}>
                                                    Consideraciones del Coach
                                                </p>
                                                <p style={{
                                                    color: EXPORT_COLORS.textSecondary,
                                                    fontSize: '14px',
                                                    whiteSpace: 'pre-line',
                                                    margin: 0,
                                                }}>
                                                    {strategy.considerations}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* WEEKLY BREAKDOWN */}
                                {weeks && weeks.length > 0 && (
                                    <div style={{ padding: '24px' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '16px',
                                        }}>
                                            <Dumbbell size={18} color={EXPORT_COLORS.accent} />
                                            <h2 style={{
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: EXPORT_COLORS.accent,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                margin: 0,
                                            }}>
                                                Detalle Semanal
                                            </h2>
                                        </div>

                                        {weeks.map((week, weekIdx) => (
                                            <div key={weekIdx} style={{ marginBottom: weekIdx < weeks.length - 1 ? '32px' : 0 }}>
                                                {/* Week Header */}
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    borderBottom: `1px solid ${EXPORT_COLORS.borderLight}`,
                                                    paddingBottom: '8px',
                                                    marginBottom: '16px',
                                                }}>
                                                    <h3 style={{
                                                        color: EXPORT_COLORS.textPrimary,
                                                        fontSize: '18px',
                                                        fontWeight: 'bold',
                                                        margin: 0,
                                                    }}>
                                                        Semana {week.weekNumber}
                                                    </h3>
                                                    {week.focus && (
                                                        <span style={{
                                                            fontSize: '12px',
                                                            color: EXPORT_COLORS.textSecondary,
                                                            backgroundColor: `${EXPORT_COLORS.bgSecondary}20`,
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            border: `1px solid ${EXPORT_COLORS.border}50`,
                                                        }}>
                                                            {week.focus}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Days Grid */}
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                                    gap: '16px',
                                                }}>
                                                    {week.days && week.days.map((day, dayIdx) => (
                                                        <div key={dayIdx} style={{
                                                            backgroundColor: `${EXPORT_COLORS.bgSecondary}20`,
                                                            borderRadius: '12px',
                                                            border: `1px solid ${EXPORT_COLORS.border}50`,
                                                            overflow: 'hidden',
                                                        }}>
                                                            {/* Day Header */}
                                                            <div style={{
                                                                padding: '8px 16px',
                                                                backgroundColor: `${EXPORT_COLORS.bgSecondary}20`,
                                                                borderBottom: `1px solid ${EXPORT_COLORS.border}50`,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                            }}>
                                                                <h4 style={{
                                                                    color: EXPORT_COLORS.textSecondary,
                                                                    fontWeight: '600',
                                                                    fontSize: '12px',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.05em',
                                                                    margin: 0,
                                                                }}>
                                                                    {day.name}
                                                                </h4>
                                                                <div style={{
                                                                    width: '6px',
                                                                    height: '6px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: EXPORT_COLORS.textMuted,
                                                                }} />
                                                            </div>

                                                            {/* Day Content */}
                                                            <div style={{ padding: '16px' }}>
                                                                {day.blocks.length > 0 ? (
                                                                    day.blocks.map((block, blockIdx) => (
                                                                        <div key={blockIdx} style={{
                                                                            display: 'flex',
                                                                            gap: '12px',
                                                                            marginBottom: blockIdx < day.blocks.length - 1 ? '16px' : 0,
                                                                        }}>
                                                                            {/* Vertical line */}
                                                                            <div style={{
                                                                                width: '4px',
                                                                                borderRadius: '2px',
                                                                                backgroundColor: `${getBlockColor(block.type)}cc`,
                                                                                minHeight: '40px',
                                                                                flexShrink: 0,
                                                                            }} />
                                                                            {/* Block content */}
                                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                                <div style={{ marginBottom: '4px' }}>
                                                                                    <span style={{
                                                                                        fontSize: '14px',
                                                                                        fontWeight: '500',
                                                                                        color: EXPORT_COLORS.textPrimary,
                                                                                        display: 'block',
                                                                                    }}>
                                                                                        {block.name}
                                                                                    </span>
                                                                                </div>
                                                                                <div>
                                                                                    {block.content.map((line, lineIdx) => (
                                                                                        <p key={lineIdx} style={{
                                                                                            fontFamily: 'monospace',
                                                                                            fontSize: '12px',
                                                                                            lineHeight: 1.5,
                                                                                            color: lineIdx === 0 ? EXPORT_COLORS.textSecondary : EXPORT_COLORS.textMuted,
                                                                                            fontWeight: lineIdx === 0 ? '600' : 'normal',
                                                                                            margin: '2px 0',
                                                                                        }}>
                                                                                            {line}
                                                                                        </p>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <p style={{
                                                                        color: EXPORT_COLORS.textMuted,
                                                                        fontSize: '12px',
                                                                        fontStyle: 'italic',
                                                                        padding: '8px 0',
                                                                        textAlign: 'center',
                                                                    }}>
                                                                        Descanso
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* FOOTER - Coach Signature */}
                                <div style={{
                                    padding: '16px 24px',
                                    borderTop: `1px solid ${EXPORT_COLORS.border}`,
                                    backgroundColor: `${EXPORT_COLORS.bgSecondary}50`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                    <p style={{
                                        color: EXPORT_COLORS.textMuted,
                                        fontSize: '11px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        margin: 0,
                                    }}>
                                        Programado por {coachName}
                                    </p>
                                    <p style={{
                                        color: EXPORT_COLORS.textMuted,
                                        fontSize: '11px',
                                        fontFamily: 'monospace',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        margin: 0,
                                    }}>
                                        <span style={{
                                            width: '6px',
                                            height: '6px',
                                            backgroundColor: EXPORT_COLORS.accent,
                                            borderRadius: '50%',
                                        }} />
                                        AI COACH
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
