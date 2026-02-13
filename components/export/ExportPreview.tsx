'use client';

import { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { X, Download, Image, FileText, Loader2 } from 'lucide-react';
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
    section?: string;
    cue?: string;
    format?: string | null;
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
    notes?: string;
}

interface WeekDateRange {
    weekNumber: number;
    startDate: string;
    endDate: string;
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
    weekDateRanges?: WeekDateRange[];
}

// ─── Light Theme Palette ─────────────────────────────────────────────
const C = {
    bgPage: '#FAFAF8',
    bgCard: '#FFFFFF',
    bgWarm: '#F5F0EB',
    bgAccentBanner: '#8B1A4A',
    bgAccentBannerLight: '#A83262',
    bgMission: '#FFF8F0',
    bgActivacion: '#FFF9F5',
    bgExercise: '#FFFFFF',
    bgProgression: '#F8F5F2',
    bgSuperSerie: '#F3EDE7',
    bgFinisher: '#FFF5EE',
    textDark: '#2D2926',
    textMedium: '#5C5550',
    textLight: '#8A8580',
    textMuted: '#B0ABA6',
    accent: '#8B1A4A',
    accentLight: '#A83262',
    accentSoft: '#C94D7A',
    gold: '#D4A853',
    green: '#5B8C3E',
    orange: '#D4763A',
    blue: '#4A7FB5',
    red: '#C94444',
    border: '#E5E0DA',
    borderLight: '#EDE8E3',
};

// ─── Block type color + emoji ────────────────────────────────────────
const BLOCK_STYLE: Record<string, { color: string; emoji: string; label: string }> = {
    strength_linear: { color: C.orange, emoji: '🟠', label: 'Fuerza' },
    metcon_structured: { color: C.red, emoji: '🔥', label: 'MetCon' },
    warmup: { color: C.green, emoji: '✨', label: 'Activación' },
    accessory: { color: C.blue, emoji: '◆', label: 'Accesorio' },
    skill: { color: C.blue, emoji: '◆', label: 'Skill' },
    finisher: { color: C.orange, emoji: '🔥', label: 'Finisher' },
    free_text: { color: C.textLight, emoji: '📝', label: 'Notas' },
};

const getBlockStyle = (type: string) => BLOCK_STYLE[type] || BLOCK_STYLE.free_text;

// ─── Helper: format date to short Spanish ────────────────────────────
function formatDateShort(dateStr: string): string {
    try {
        const d = new Date(dateStr + 'T00:00:00');
        const day = String(d.getDate()).padStart(2, '0');
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${day} ${months[d.getMonth()]}`;
    } catch {
        return dateStr;
    }
}

// ─── Component ───────────────────────────────────────────────────────
export function ExportPreview({
    isOpen,
    onClose,
    programName,
    clientInfo,
    coachName,
    monthlyStrategy,
    weeks,
    strategy,
    mission,
    weekDateRanges,
}: ExportPreviewProps) {
    const exportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<'png' | 'pdf'>('png');

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleExport = async () => {
        if (!exportRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(exportRef.current, {
                backgroundColor: C.bgPage,
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

    // ─── Build a progression lookup: exercise name → per-week values ─
    const progressionMap = new Map<string, string[]>();
    if (monthlyStrategy?.progressions) {
        for (const p of monthlyStrategy.progressions) {
            progressionMap.set(p.name, p.progression);
        }
    }

    // ─── Group blocks by section within a day ────────────────────────
    function groupBlocksBySection(blocks: WorkoutBlock[]) {
        const warmup: WorkoutBlock[] = [];
        const main: WorkoutBlock[] = [];
        const finishers: WorkoutBlock[] = [];

        for (const b of blocks) {
            if (b.section === 'warmup' || b.type === 'warmup') {
                warmup.push(b);
            } else if (b.type === 'finisher' || (b.type === 'metcon_structured' && b.section === 'cooldown')) {
                finishers.push(b);
            } else {
                main.push(b);
            }
        }
        return { warmup, main, finishers };
    }

    // ─── Build exercise numbering (1, 2, 3A, 3B, etc) ───────────────
    function buildNumberedExercises(mainBlocks: WorkoutBlock[]) {
        const result: { label: string; block: WorkoutBlock; isSuperSet: boolean; superSetLabel?: string }[] = [];
        let counter = 1;
        let i = 0;

        while (i < mainBlocks.length) {
            const block = mainBlocks[i];

            // Detect super-set: if block name starts with pattern like "3A." or block has accessory type paired
            // For now, use a simpler approach: consecutive accessory blocks form a super-set
            // Better approach: detect blocks that share the same "group" (we'll use consecutive accessory blocks)

            if (block.type === 'accessory' || block.type === 'skill') {
                // Check if next block is also accessory → super-set
                const superSetBlocks: WorkoutBlock[] = [block];
                let j = i + 1;
                while (j < mainBlocks.length && (mainBlocks[j].type === 'accessory' || mainBlocks[j].type === 'skill')) {
                    superSetBlocks.push(mainBlocks[j]);
                    j++;
                }

                if (superSetBlocks.length > 1) {
                    // It's a super-set
                    const letters = 'ABCDEFGH';
                    for (let k = 0; k < superSetBlocks.length; k++) {
                        result.push({
                            label: `${counter}${letters[k] || String.fromCharCode(65 + k)}`,
                            block: superSetBlocks[k],
                            isSuperSet: true,
                            superSetLabel: k === 0 ? `SUPER SERIE ${letters[0]}` : undefined,
                        });
                    }
                    counter++;
                    i = j;
                } else {
                    result.push({ label: `${counter}`, block, isSuperSet: false });
                    counter++;
                    i++;
                }
            } else {
                result.push({ label: `${counter}`, block, isSuperSet: false });
                counter++;
                i++;
            }
        }
        return result;
    }

    // ─── Render a single exercise block ──────────────────────────────
    function renderExercise(
        label: string,
        block: WorkoutBlock,
        progression: string[] | undefined
    ) {
        const style = getBlockStyle(block.type);

        return (
            <div key={`${label}-${block.name}`} style={{
                marginBottom: '20px',
                paddingLeft: '8px',
            }}>
                {/* Exercise header: number + name + emoji */}
                <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '10px',
                    marginBottom: '4px',
                }}>
                    <span style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: C.accent,
                        minWidth: '24px',
                    }}>
                        {label}.
                    </span>
                    <span style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: C.textDark,
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}>
                        {block.name}
                    </span>
                    <span style={{ fontSize: '14px' }}>{style.emoji}</span>
                </div>

                {/* Cue (coaching note) */}
                {block.cue && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px',
                        marginLeft: '34px',
                        marginBottom: '8px',
                    }}>
                        <span style={{ fontSize: '12px', marginTop: '1px' }}>💡</span>
                        <span style={{
                            fontStyle: 'italic',
                            fontSize: '13px',
                            color: C.textMedium,
                            lineHeight: 1.4,
                        }}>
                            {block.cue}
                        </span>
                    </div>
                )}

                {/* Progression inline or content */}
                {progression && progression.length > 0 ? (
                    <div style={{
                        marginLeft: '34px',
                        padding: '8px 12px',
                        backgroundColor: C.bgProgression,
                        borderLeft: `3px solid ${style.color}`,
                        borderRadius: '0 6px 6px 0',
                        fontSize: '13px',
                        color: C.textMedium,
                        lineHeight: 1.6,
                    }}>
                        {progression.map((val, idx) => (
                            <span key={idx}>
                                <span style={{ fontWeight: '600', color: C.textDark }}>
                                    Sem {idx + 1}:
                                </span>{' '}
                                <span>{val}</span>
                                {idx < progression.length - 1 && (
                                    <span style={{ color: C.textMuted, margin: '0 6px' }}>→</span>
                                )}
                            </span>
                        ))}
                    </div>
                ) : (
                    /* Regular content (non-progression) */
                    block.content.length > 0 && (
                        <div style={{
                            marginLeft: '34px',
                            padding: '8px 12px',
                            backgroundColor: C.bgProgression,
                            borderLeft: `3px solid ${style.color}`,
                            borderRadius: '0 6px 6px 0',
                        }}>
                            {block.content.filter(l => l.trim()).map((line, idx) => (
                                <p key={idx} style={{
                                    fontSize: '13px',
                                    lineHeight: 1.5,
                                    color: idx === 0 ? C.textDark : C.textMedium,
                                    fontWeight: idx === 0 ? '600' : 'normal',
                                    margin: '2px 0',
                                }}>
                                    {line}
                                </p>
                            ))}
                        </div>
                    )
                )}
            </div>
        );
    }

    // ─── Render warmup section ───────────────────────────────────────
    function renderWarmupSection(warmupBlocks: WorkoutBlock[]) {
        if (warmupBlocks.length === 0) return null;

        // Collect all movements from warmup blocks
        const movements: string[] = [];
        for (const b of warmupBlocks) {
            if (b.format) {
                // Add format header (e.g., "3 VUELTAS")
            }
            for (const line of b.content) {
                if (line.trim()) movements.push(line);
            }
        }

        // Try extract round info from first block
        const firstBlock = warmupBlocks[0];
        const roundInfo = firstBlock.content.find(c => c.toLowerCase().includes('round') || c.toLowerCase().includes('vuelta'));

        return (
            <div style={{
                backgroundColor: C.bgActivacion,
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                border: `1px solid ${C.borderLight}`,
            }}>
                <div style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: C.accent,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                }}>
                    <span>✨</span>
                    ACTIVACIÓN {firstBlock.format ? `(${firstBlock.format})` : ''}
                </div>
                {movements.map((m, idx) => (
                    <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        fontSize: '14px',
                        color: C.textDark,
                        marginBottom: '4px',
                        paddingLeft: '4px',
                    }}>
                        <span style={{ color: C.accent, marginTop: '2px', fontSize: '8px' }}>●</span>
                        <span>{m}</span>
                    </div>
                ))}
            </div>
        );
    }

    // ─── Render finisher section ─────────────────────────────────────
    function renderFinisherSection(finisherBlocks: WorkoutBlock[]) {
        if (finisherBlocks.length === 0) return null;

        return (
            <div style={{ marginTop: '24px' }}>
                {finisherBlocks.map((block, idx) => {
                    const formatStr = block.format ? ` ${block.format}` : '';
                    return (
                        <div key={idx}>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: C.orange,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}>
                                <span>🔥</span>
                                {block.name || 'FINISHER'}{formatStr ? ` · ${formatStr}` : ''}
                            </div>
                            <div style={{
                                padding: '10px 14px',
                                backgroundColor: C.bgFinisher,
                                borderLeft: `3px solid ${C.orange}`,
                                borderRadius: '0 6px 6px 0',
                            }}>
                                {block.content.filter(l => l.trim()).map((line, lineIdx) => (
                                    <p key={lineIdx} style={{
                                        fontSize: '13px',
                                        lineHeight: 1.5,
                                        color: lineIdx === 0 ? C.textDark : C.textMedium,
                                        fontWeight: lineIdx === 0 ? '600' : 'normal',
                                        margin: '2px 0',
                                    }}>
                                        {line}
                                    </p>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // ─── Render super-set header ─────────────────────────────────────
    function renderSuperSetHeader(label: string) {
        return (
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                backgroundColor: C.bgSuperSerie,
                borderRadius: '4px',
                marginBottom: '12px',
                marginLeft: '8px',
                border: `1px solid ${C.border}`,
            }}>
                <span style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: C.textMedium,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                }}>
                    SUPER SERIE
                </span>
                <span style={{
                    fontSize: '11px',
                    color: C.textLight,
                }}>
                    (Pausa ◆ al final)
                </span>
            </div>
        );
    }

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

                                <button onClick={handleExport} disabled={isExporting} className="cv-btn-primary">
                                    {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                    {isExporting ? 'Exportando...' : 'Exportar'}
                                </button>

                                <button onClick={onClose} className="cv-btn-ghost p-2">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Preview Area */}
                        <div className="flex-1 overflow-auto p-4 md:p-6" style={{ backgroundColor: '#e8e4de' }}>
                            {/* ══════════════════════════════════════════════
                                EXPORT CONTENT — INLINE STYLES for html2canvas
                               ══════════════════════════════════════════════ */}
                            <div
                                ref={exportRef}
                                style={{
                                    backgroundColor: C.bgPage,
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    maxWidth: '500px',
                                    margin: '0 auto',
                                    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
                                    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                                }}
                            >
                                {/* ── WEEK DATES BANNER ─────────────────── */}
                                {weekDateRanges && weekDateRanges.length > 0 && (
                                    <div style={{
                                        backgroundColor: C.bgAccentBanner,
                                        padding: '12px 20px',
                                        textAlign: 'center',
                                    }}>
                                        <div style={{
                                            fontSize: '11px',
                                            color: '#FFFFFF',
                                            fontWeight: '600',
                                            lineHeight: 1.8,
                                            letterSpacing: '0.02em',
                                        }}>
                                            {weekDateRanges.map((w, i) => (
                                                <div key={i}>
                                                    <span style={{ fontWeight: 'bold' }}>SEM {w.weekNumber}:</span>{' '}
                                                    {formatDateShort(w.startDate)} - {formatDateShort(w.endDate)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ── HERO HEADER ──────────────────────── */}
                                <div style={{
                                    padding: '32px 24px 24px',
                                    textAlign: 'center',
                                    background: `linear-gradient(180deg, ${C.bgWarm} 0%, ${C.bgPage} 100%)`,
                                }}>
                                    {/* "Para [Name]" */}
                                    <p style={{
                                        fontSize: '20px',
                                        color: C.accent,
                                        margin: '0 0 4px 0',
                                        fontStyle: 'italic',
                                        fontWeight: '500',
                                    }}>
                                        Para {clientInfo.name} ❤️
                                    </p>

                                    {/* Program Title */}
                                    <h1 style={{
                                        fontSize: '28px',
                                        fontWeight: '900',
                                        color: C.textDark,
                                        margin: '8px 0 6px',
                                        lineHeight: 1.2,
                                    }}>
                                        Plan de Entrenamiento
                                    </h1>

                                    {/* Program Name as subtitle */}
                                    <p style={{
                                        fontSize: '13px',
                                        color: C.textLight,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.15em',
                                        margin: '0 0 4px',
                                        fontWeight: '600',
                                    }}>
                                        {programName}
                                    </p>

                                    {/* Focus tags */}
                                    {monthlyStrategy?.focus && (
                                        <p style={{
                                            fontSize: '11px',
                                            color: C.textMuted,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.2em',
                                            margin: '8px 0 0',
                                        }}>
                                            {monthlyStrategy.focus}
                                        </p>
                                    )}
                                </div>

                                {/* ── MISSION SECTION ──────────────────── */}
                                {mission && (
                                    <div style={{
                                        margin: '0 20px 20px',
                                        padding: '16px 18px',
                                        backgroundColor: C.bgMission,
                                        borderRadius: '10px',
                                        border: `1px solid ${C.borderLight}`,
                                    }}>
                                        <h3 style={{
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            color: C.accent,
                                            margin: '0 0 8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            borderBottom: `2px solid ${C.accent}`,
                                            paddingBottom: '6px',
                                        }}>
                                            🎯 Misión: {programName}
                                        </h3>
                                        <p style={{
                                            fontSize: '14px',
                                            lineHeight: 1.7,
                                            color: C.textMedium,
                                            margin: 0,
                                            whiteSpace: 'pre-line',
                                        }}>
                                            {mission}
                                        </p>
                                    </div>
                                )}

                                {/* ── PROGRESSIONS TABLE ───────────────── */}
                                {monthlyStrategy?.progressions && monthlyStrategy.progressions.length > 0 && (
                                    <div style={{
                                        margin: '0 20px 20px',
                                        padding: '16px',
                                        backgroundColor: C.bgCard,
                                        borderRadius: '10px',
                                        border: `1px solid ${C.border}`,
                                    }}>
                                        <h3 style={{
                                            fontSize: '13px',
                                            fontWeight: 'bold',
                                            color: C.green,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em',
                                            margin: '0 0 12px',
                                        }}>
                                            📈 Progresiones del Ciclo
                                        </h3>
                                        <div style={{
                                            backgroundColor: C.bgProgression,
                                            borderRadius: '8px',
                                            padding: '12px',
                                        }}>
                                            {/* Header */}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: '2fr repeat(4, 1fr)',
                                                gap: '6px',
                                                textAlign: 'center',
                                                marginBottom: '6px',
                                            }}>
                                                <div style={{ textAlign: 'left', fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                                                    Ejercicio
                                                </div>
                                                {['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'].map((s, i) => (
                                                    <div key={i} style={{ fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                                                        {s}
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Rows */}
                                            {monthlyStrategy.progressions.map((prog, idx) => (
                                                <div key={idx} style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '2fr repeat(4, 1fr)',
                                                    gap: '6px',
                                                    alignItems: 'center',
                                                    padding: '6px 0',
                                                    borderTop: idx > 0 ? `1px solid ${C.borderLight}` : 'none',
                                                }}>
                                                    <div style={{ textAlign: 'left' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: '500', color: C.textDark }}>
                                                            {prog.name}
                                                        </span>
                                                        {prog.variable && (
                                                            <span style={{
                                                                display: 'inline-block',
                                                                marginLeft: '6px',
                                                                fontSize: '9px',
                                                                fontWeight: 'bold',
                                                                color: (prog.variable === 'sets' || prog.variable === 'reps') ? C.green : C.accent,
                                                                textTransform: 'uppercase',
                                                                padding: '1px 4px',
                                                                borderRadius: '3px',
                                                                backgroundColor: (prog.variable === 'sets' || prog.variable === 'reps') ? `${C.green}15` : `${C.accent}15`,
                                                            }}>
                                                                {(prog.variable === 'sets' || prog.variable === 'reps') ? 'VOL' : '%'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {prog.progression.map((val, wIdx) => (
                                                        <div key={wIdx} style={{ textAlign: 'center' }}>
                                                            <span style={{
                                                                fontFamily: 'monospace',
                                                                fontSize: '12px',
                                                                color: wIdx === prog.progression.length - 1 ? C.accent : C.textMedium,
                                                                fontWeight: wIdx === prog.progression.length - 1 ? 'bold' : 'normal',
                                                            }}>
                                                                {val}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {Array.from({ length: Math.max(0, 4 - prog.progression.length) }).map((_, i) => (
                                                        <div key={`e-${i}`} style={{ textAlign: 'center', color: C.textMuted }}>—</div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ── WEEKLY DETAIL ─── ALL WEEKS TOGETHER ───── */}
                                {weeks && weeks.length > 0 && (
                                    <div style={{ padding: '0 20px 20px' }}>
                                        {weeks.map((week, weekIdx) => (
                                            <div key={weekIdx} style={{ marginBottom: '16px' }}>
                                                {/* We render each DAY in each week */}
                                                {week.days && week.days.map((day, dayIdx) => {
                                                    const { warmup, main, finishers } = groupBlocksBySection(day.blocks);
                                                    const numberedMain = buildNumberedExercises(main);

                                                    // Only show day header + content for the first week
                                                    // (subsequent weeks' data goes into the progression inline)
                                                    // BUT if we don't have progressions, we show all weeks
                                                    if (weekIdx > 0 && progressionMap.size > 0) return null;

                                                    return (
                                                        <div key={`${weekIdx}-${dayIdx}`} style={{ marginBottom: '24px' }}>
                                                            {/* Day Header */}
                                                            <div style={{
                                                                backgroundColor: C.bgAccentBannerLight,
                                                                padding: '10px 18px',
                                                                borderRadius: '8px',
                                                                marginBottom: '16px',
                                                            }}>
                                                                <h3 style={{
                                                                    fontSize: '18px',
                                                                    fontWeight: 'bold',
                                                                    fontStyle: 'italic',
                                                                    color: '#FFFFFF',
                                                                    margin: 0,
                                                                }}>
                                                                    {day.name}: {week.focus || programName}
                                                                </h3>
                                                            </div>

                                                            {/* Warmup / Activación */}
                                                            {renderWarmupSection(warmup)}

                                                            {/* Main exercises */}
                                                            {numberedMain.length > 0 && (
                                                                <div>
                                                                    {numberedMain.map((item, mIdx) => {
                                                                        const prog = progressionMap.get(item.block.name);
                                                                        return (
                                                                            <div key={mIdx}>
                                                                                {item.superSetLabel && renderSuperSetHeader(item.superSetLabel)}
                                                                                {renderExercise(item.label, item.block, prog)}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}

                                                            {/* Finishers */}
                                                            {renderFinisherSection(finishers)}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* ── FOOTER ───────────────────────────── */}
                                <div style={{
                                    padding: '14px 24px',
                                    borderTop: `1px solid ${C.border}`,
                                    backgroundColor: C.bgWarm,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                    <p style={{
                                        color: C.textLight,
                                        fontSize: '11px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        margin: 0,
                                        fontWeight: '500',
                                    }}>
                                        Programado por {coachName}
                                    </p>
                                    <p style={{
                                        color: C.textLight,
                                        fontSize: '11px',
                                        fontFamily: 'monospace',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        margin: 0,
                                        fontWeight: '600',
                                    }}>
                                        <span style={{
                                            width: '6px',
                                            height: '6px',
                                            backgroundColor: C.accent,
                                            borderRadius: '50%',
                                            display: 'inline-block',
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
