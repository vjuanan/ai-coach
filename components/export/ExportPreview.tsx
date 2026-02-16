/* eslint-disable @next/next/no-img-element */
import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Loader2, X, Heart, Target, ArrowRight, Clock } from 'lucide-react';

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
    structure?: {
        sets?: string;
        reps?: string;
        weight?: string;
        rpe?: string;
        rest?: string;
        text?: string;
        notes?: string;
    };
    section?: 'warmup' | 'main' | 'cooldown';
    cue?: string;
    format?: string;
    rest?: string | null;
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
    rest?: string;
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

// -- THEME SYSTEM --
interface ExportTheme {
    id: string;
    label: string;
    c: {
        bg: string;
        bgAlt: string;
        text: string;
        textMuted: string;
        accent: string;
        accentSoft: string;
        accentMuted: string;
        border: string;
        borderSoft: string;
        rowEven: string;
        rowOdd: string;
        headerBg: string;
        dayBg: string;
        badge: string;
        badgeText: string;
        cueBg: string;
        cueText: string;
        warmupBg: string;
    };
}

const THEMES: Record<string, ExportTheme> = {
    white: {
        id: 'white',
        label: 'Clean Light',
        c: {
            bg: '#FFFFFF',
            bgAlt: '#FAFBFC',
            text: '#1a1a2e',
            textMuted: '#6b7280',
            accent: '#2563eb',
            accentSoft: '#dbeafe',
            accentMuted: '#93c5fd',
            border: '#e5e7eb',
            borderSoft: '#f3f4f6',
            rowEven: '#f8fafc',
            rowOdd: '#ffffff',
            headerBg: '#f0f4ff',
            dayBg: '#f0f4ff',
            badge: '#1e3a5f',
            badgeText: '#ffffff',
            cueBg: '#fef9e7',
            cueText: '#92400e',
            warmupBg: '#f0f7ff',
        }
    },
    dark: {
        id: 'dark',
        label: 'Pro Dark',
        c: {
            bg: '#0f0f14',
            bgAlt: '#161621',
            text: '#e8e8ed',
            textMuted: '#8b8b99',
            accent: '#6366f1',
            accentSoft: 'rgba(99, 102, 241, 0.12)',
            accentMuted: '#818cf8',
            border: '#2a2a3a',
            borderSoft: '#1e1e2e',
            rowEven: '#13131d',
            rowOdd: '#0f0f14',
            headerBg: '#161621',
            dayBg: '#1a1a28',
            badge: '#e8e8ed',
            badgeText: '#0f0f14',
            cueBg: 'rgba(99, 102, 241, 0.08)',
            cueText: '#a5b4fc',
            warmupBg: 'rgba(99, 102, 241, 0.06)',
        }
    },
    pinky: {
        id: 'pinky',
        label: 'Rose Gold',
        c: {
            bg: '#fff8f9',
            bgAlt: '#fff0f3',
            text: '#6b2139',
            textMuted: '#b85c75',
            accent: '#d6336c',
            accentSoft: '#ffe0eb',
            accentMuted: '#f06595',
            border: '#fcc2d7',
            borderSoft: '#ffe0eb',
            rowEven: '#fff5f7',
            rowOdd: '#fff8f9',
            headerBg: '#ffe0eb',
            dayBg: '#ffe0eb',
            badge: '#d6336c',
            badgeText: '#ffffff',
            cueBg: '#fff0f3',
            cueText: '#a61e4d',
            warmupBg: '#fff5f7',
        }
    },
    hard: {
        id: 'hard',
        label: 'Titanium',
        c: {
            bg: '#f4f4f8',
            bgAlt: '#eaeaef',
            text: '#18181b',
            textMuted: '#71717a',
            accent: '#3f3f46',
            accentSoft: '#e4e4e7',
            accentMuted: '#a1a1aa',
            border: '#d4d4d8',
            borderSoft: '#e4e4e7',
            rowEven: '#f0f0f4',
            rowOdd: '#f4f4f8',
            headerBg: '#e4e4e7',
            dayBg: '#e4e4e7',
            badge: '#18181b',
            badgeText: '#ffffff',
            cueBg: '#f0f0f4',
            cueText: '#52525b',
            warmupBg: '#ececf0',
        }
    },
    cyber: {
        id: 'cyber',
        label: 'Cyber Electric',
        c: {
            bg: '#0a0e17',
            bgAlt: '#111827',
            text: '#e2e8f0',
            textMuted: '#64748b',
            accent: '#06b6d4',
            accentSoft: 'rgba(6, 182, 212, 0.12)',
            accentMuted: '#22d3ee',
            border: '#1e293b',
            borderSoft: '#1a2332',
            rowEven: '#0d1220',
            rowOdd: '#0a0e17',
            headerBg: '#111827',
            dayBg: '#111827',
            badge: '#06b6d4',
            badgeText: '#0a0e17',
            cueBg: 'rgba(6, 182, 212, 0.08)',
            cueText: '#67e8f9',
            warmupBg: 'rgba(6, 182, 212, 0.05)',
        }
    }
};

// -- HELPERS --
const getWeekDateRange = (weekNum: number, weekDateRanges?: { weekNumber: number; startDate: string; endDate: string; }[]) => {
    if (!weekDateRanges) return null;
    const range = weekDateRanges.find(r => r.weekNumber === weekNum);
    if (!range) return null;
    const fmt = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${day} ${months[date.getMonth()]}`;
    };
    return `${fmt(range.startDate)} – ${fmt(range.endDate)}`;
};

const getProgressionForBlock = (blockName: string, monthlyStrategy?: { progressions: MonthlyProgression[] }) => {
    if (!monthlyStrategy?.progressions) return null;
    const normName = blockName.trim().toLowerCase();
    return monthlyStrategy.progressions.find(p => p.name.trim().toLowerCase() === normName);
};

const isConstantProgression = (vals: string[]): boolean => {
    const v = vals.filter(x => x && x !== '-');
    if (v.length <= 1) return true;
    return v.every(x => x === v[0]);
};

const getBlockDisplayName = (block: WorkoutBlock): string => {
    if (block.name && block.name !== block.type) return block.name;
    const map: Record<string, string> = {
        strength_linear: 'Ejercicio de Fuerza',
        metcon_structured: 'MetCon',
        warmup: 'Calentamiento',
        accessory: 'Accesorio',
        skill: 'Habilidad',
        finisher: 'Finisher',
        free_text: 'Notas',
        mobility: 'Movilidad',
    };
    return map[block.type] || block.type;
};

// -- EXERCISE ROW (Redesigned) --
const ExerciseRow = ({
    block, index, theme, monthlyStrategy, isEven
}: {
    block: WorkoutBlock; index: number; theme: ExportTheme;
    monthlyStrategy?: { progressions: MonthlyProgression[] }; isEven: boolean;
}) => {
    const displayName = getBlockDisplayName(block);
    const struct = block.structure;

    // Check if we have visible content
    if (!struct && (!block.content || block.content.length === 0)) return null;

    const hasProgression = getProgressionForBlock(block.name || '', monthlyStrategy);
    const showInlineProgression = hasProgression && !isConstantProgression(hasProgression.progression);

    // Render Logic
    return (
        <div style={{
            padding: '12px 16px',
            backgroundColor: isEven ? theme.c.rowEven : theme.c.rowOdd,
            borderBottom: `1px solid ${theme.c.borderSoft}`,
        }}>
            {/* Top Row: Number + Name */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
                <span style={{
                    fontSize: '12px',
                    fontWeight: '800',
                    color: theme.c.accent,
                    minWidth: '20px',
                }}>
                    {index}.
                </span>
                <span style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    color: theme.c.text,
                    flex: 1,
                }}>
                    {displayName}
                </span>

                {/* Rest Badge (if constant) */}
                {struct?.rest && (
                    <span style={{
                        fontSize: '11px',
                        color: theme.c.textMuted,
                        fontWeight: '600',
                        backgroundColor: theme.c.bgAlt,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: `1px solid ${theme.c.borderSoft}`
                    }}>
                        ⏱ {struct.rest}
                    </span>
                )}
            </div>

            {/* Prescription Row (Grid for variables) -- ONLY IF NO INLINE PROGRESSION */}
            {struct && !struct.text && !showInlineProgression && (
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginLeft: '30px',
                    fontSize: '13px',
                    color: theme.c.text,
                    alignItems: 'center'
                }}>
                    {struct.sets && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: theme.c.textMuted, fontSize: '10px', textTransform: 'uppercase', fontWeight: '700' }}>SETS</span>
                            <span style={{ fontWeight: '600' }}>{struct.sets}</span>
                        </div>
                    )}
                    {struct.reps && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: theme.c.textMuted, fontSize: '10px', textTransform: 'uppercase', fontWeight: '700' }}>REPS</span>
                            <span style={{ fontWeight: '600' }}>{struct.reps}</span>
                        </div>
                    )}
                    {struct.weight && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: theme.c.textMuted, fontSize: '10px', textTransform: 'uppercase', fontWeight: '700' }}>PESO</span>
                            <span style={{ fontWeight: '600' }}>{struct.weight}</span>
                        </div>
                    )}
                    {struct.rpe && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: theme.c.textMuted, fontSize: '10px', textTransform: 'uppercase', fontWeight: '700' }}>RPE</span>
                            <span style={{ fontWeight: '600' }}>{struct.rpe}</span>
                        </div>
                    )}
                </div>
            )}

            {/* If it's a MetCon or Text-based block */}
            {struct?.text && (
                <div style={{
                    marginTop: '8px',
                    marginLeft: '30px',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    color: theme.c.text,
                    whiteSpace: 'pre-line',
                    backgroundColor: theme.c.bgAlt,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    borderLeft: `3px solid ${theme.c.accent}`
                }}>
                    {struct.text}
                </div>
            )}

            {/* Legacy Content Fallback (if no structure but content exists) */}
            {!struct && block.content && block.content.length > 0 && (
                <div style={{
                    marginTop: '4px',
                    marginLeft: '30px',
                    fontSize: '13px',
                    color: theme.c.textMuted,
                    lineHeight: '1.6',
                }}>
                    {block.content.map((line, i) => (
                        <div key={i}>• {line}</div>
                    ))}
                </div>
            )}

            {/* CUES / NOTES */}
            {block.cue && (
                <div style={{
                    marginTop: '6px',
                    marginLeft: '30px',
                    fontSize: '12px',
                    fontStyle: 'italic',
                    color: theme.c.cueText,
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '4px'
                }}>
                    <span style={{ fontWeight: '700', fontSize: '10px', opacity: 0.7 }}>NOTA:</span>
                    {block.cue}
                </div>
            )}

            {/* Inline Progression Table (If applicable) */}
            {showInlineProgression && hasProgression && (
                <div style={{
                    marginTop: '10px',
                    marginLeft: '30px',
                    backgroundColor: theme.c.accentSoft,
                    borderRadius: '6px',
                    padding: '8px',
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto'
                }}>
                    {hasProgression.progression.map((val, idx) => {
                        if (!val || val === '-') return null;
                        return (
                            <div key={idx} style={{
                                flex: 1,
                                minWidth: '60px',
                                textAlign: 'center',
                                padding: '4px',
                                backgroundColor: theme.c.bg,
                                borderRadius: '4px',
                                border: `1px solid ${theme.c.borderSoft}`
                            }}>
                                <div style={{ fontSize: '9px', fontWeight: '800', color: theme.c.accent, marginBottom: '2px' }}>SEM {idx + 1}</div>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: theme.c.text, lineHeight: '1.2' }}>{val}</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// -- DAY SECTION --
const DaySection = ({
    day, theme, monthlyStrategy, dayIndex
}: {
    day: DayData; theme: ExportTheme;
    monthlyStrategy?: { progressions: MonthlyProgression[] }; dayIndex: number;
}) => {
    const warmupBlocks = day.blocks.filter(b => b.section === 'warmup' || b.type === 'warmup' || b.type === 'mobility');
    const cooldownBlocks = day.blocks.filter(b => b.section === 'cooldown' || b.type === 'finisher');
    const mainBlocks = day.blocks.filter(b => !warmupBlocks.includes(b) && !cooldownBlocks.includes(b));

    const hasWarmup = warmupBlocks.some(b => b.content?.some(c => c.trim()));
    const hasMain = mainBlocks.length > 0;
    const hasCooldown = cooldownBlocks.length > 0;

    if (!hasWarmup && !hasMain && !hasCooldown) return null;

    let exIdx = 1;

    return (
        <div style={{ marginBottom: '20px' }}>
            {/* Day name — italic, elegant */}
            <div style={{
                padding: '10px 16px',
                backgroundColor: theme.c.dayBg,
                borderBottom: `2px solid ${theme.c.accent}`,
                borderRadius: '8px 8px 0 0',
            }}>
                <span style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    fontStyle: 'italic',
                    color: theme.c.text,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                }}>
                    Día {dayIndex}: {day.name}
                </span>
            </div>

            {/* Exercises container */}
            <div style={{
                border: `1px solid ${theme.c.border}`,
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                overflow: 'hidden',
            }}>
                {/* Warmup compact */}
                {hasWarmup && (
                    <div style={{
                        padding: '8px 16px',
                        backgroundColor: theme.c.warmupBg,
                        borderBottom: `1px solid ${theme.c.borderSoft}`,
                        fontSize: '12px',
                        color: theme.c.textMuted,
                        lineHeight: '1.5',
                    }}>
                        <span style={{ fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '2px', color: theme.c.accent }}>
                            Calentamiento
                        </span>
                        {warmupBlocks.map((block, i) => (
                            <span key={i}>
                                {block.content.filter(c => c.trim()).join(' · ')}
                            </span>
                        ))}
                    </div>
                )}

                {/* Main exercises */}
                {mainBlocks.map((block, i) => {
                    const idx = exIdx++;
                    return <ExerciseRow key={i} block={block} index={idx} theme={theme} monthlyStrategy={monthlyStrategy} isEven={i % 2 === 0} />;
                })}

                {/* Finisher */}
                {hasCooldown && cooldownBlocks.map((block, i) => (
                    <ExerciseRow key={`cd-${i}`} block={block} index={i + 1} theme={theme} monthlyStrategy={monthlyStrategy} isEven={mainBlocks.length % 2 === 0} />
                ))}
            </div>
        </div>
    );
};

// -- MAIN COMPONENT --
export function ExportPreview({
    isOpen, onClose, programName, clientInfo, coachName,
    monthlyStrategy, weeks, mission, weekDateRanges
}: ExportPreviewProps) {
    const exportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<'png' | 'pdf'>('png');
    const [currentThemeId, setCurrentThemeId] = useState<string>('white');

    const theme = THEMES[currentThemeId] || THEMES.white;

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const baseWeek = weeks.length > 0 ? weeks[0] : null;
    const totalWeeks = weeks.length;

    // Progressions where values change — for summary table
    const changingProgressions = monthlyStrategy?.progressions.filter(p => {
        const v = p.progression.filter(x => x && x !== '-');
        return !isConstantProgression(v) && v.length > 1;
    }) || [];

    const handleExport = async () => {
        if (!exportRef.current) return;
        setIsExporting(true);
        try {
            await document.fonts.ready;
            await new Promise(resolve => setTimeout(resolve, 500));
            const el = exportRef.current;
            const canvas = await html2canvas(el, {
                backgroundColor: theme.c.bg,
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true,
                imageTimeout: 15000,
                width: el.scrollWidth,
                height: el.scrollHeight,
                windowWidth: el.scrollWidth,
                windowHeight: el.scrollHeight,
                scrollX: 0,
                scrollY: 0,
                onclone: (clonedDoc) => {
                    const clonedEl = clonedDoc.getElementById('export-container');
                    if (clonedEl) {
                        clonedEl.style.height = 'auto';
                        clonedEl.style.overflow = 'visible';
                    }
                }
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
                const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: [imgWidth, imgHeight] });
                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                pdf.save(`${clientInfo.name}-${programName.replace(/\s+/g, '_')}.pdf`);
            }
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    // Build mission text — always show something
    const missionText = mission || monthlyStrategy?.focus || 'Programa de entrenamiento personalizado';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl h-[95vh] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Toolbar */}
                <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Export Preview</h2>
                    <div className="flex items-center gap-2.5">
                        <select
                            value={currentThemeId}
                            onChange={(e) => setCurrentThemeId(e.target.value)}
                            className="h-7 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-xs focus:outline-none cursor-pointer text-gray-900 dark:text-gray-100"
                        >
                            {Object.values(THEMES).map(t => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                        </select>
                        <select
                            value={exportFormat}
                            onChange={(e) => setExportFormat(e.target.value as 'png' | 'pdf')}
                            className="h-7 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-xs focus:outline-none cursor-pointer text-gray-900 dark:text-gray-100"
                        >
                            <option value="png">PNG</option>
                            <option value="pdf">PDF</option>
                        </select>
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="h-7 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                            {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                            {isExporting ? 'Exportando...' : 'Exportar'}
                        </button>
                        <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-400">
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* Preview scroll area */}
                <div className="flex-1 overflow-y-auto bg-gray-100/60 dark:bg-zinc-950/50 p-4">
                    <div
                        id="export-container"
                        ref={exportRef}
                        style={{
                            width: '420px',
                            margin: '0 auto',
                            backgroundColor: theme.c.bg,
                            padding: '32px 24px',
                            boxSizing: 'border-box',
                            color: theme.c.text,
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                        }}
                    >
                        {/* ═══════════════════ COVER / HEADER ═══════════════════ */}
                        <div style={{
                            textAlign: 'center',
                            marginBottom: '24px',
                            paddingBottom: '20px',
                            borderBottom: `2px solid ${theme.c.border}`,
                        }}>
                            {/* Week dates at top */}
                            {weekDateRanges && weekDateRanges.length > 0 && (
                                <div style={{
                                    fontSize: '10px',
                                    color: theme.c.textMuted,
                                    marginBottom: '12px',
                                    lineHeight: '1.6',
                                }}>
                                    {weekDateRanges.map((w, i) => (
                                        <div key={i}>
                                            <span style={{ fontWeight: '700' }}>SEM {w.weekNumber}:</span>{' '}
                                            {getWeekDateRange(w.weekNumber, weekDateRanges)}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* "Para [nombre]" — cursive */}
                            <div style={{
                                fontFamily: 'Georgia, "Times New Roman", serif',
                                fontStyle: 'italic',
                                fontSize: '14px',
                                color: theme.c.accent,
                                marginBottom: '8px',
                                fontWeight: '400',
                            }}>
                                Para {clientInfo.name} ♥
                            </div>

                            {/* Program name — big, bold */}
                            <h1 style={{
                                fontSize: '22px',
                                fontWeight: '900',
                                margin: '0 0 12px 0',
                                lineHeight: '1.2',
                                color: theme.c.text,
                                letterSpacing: '-0.3px',
                            }}>
                                {programName}
                            </h1>

                            {/* Tags */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '8px',
                                flexWrap: 'wrap',
                            }}>
                                <span style={{
                                    backgroundColor: theme.c.badge,
                                    color: theme.c.badgeText,
                                    padding: '3px 12px',
                                    borderRadius: '100px',
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}>
                                    {monthlyStrategy?.focus || 'General'}
                                </span>
                                <span style={{
                                    backgroundColor: theme.c.accentSoft,
                                    color: theme.c.textMuted,
                                    padding: '3px 12px',
                                    borderRadius: '100px',
                                    fontSize: '10px',
                                    fontWeight: '600',
                                }}>
                                    {totalWeeks} semanas
                                </span>
                                <span style={{
                                    backgroundColor: theme.c.accentSoft,
                                    color: theme.c.textMuted,
                                    padding: '3px 12px',
                                    borderRadius: '100px',
                                    fontSize: '10px',
                                    fontWeight: '600',
                                }}>
                                    Coach {coachName}
                                </span>
                            </div>
                        </div>

                        {/* ═══════════════════ MISSION (always shown) ═══════════════════ */}
                        <div style={{
                            backgroundColor: theme.c.accentSoft,
                            padding: '14px 16px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            borderLeft: `3px solid ${theme.c.accent}`,
                        }}>
                            <div style={{
                                fontSize: '10px',
                                fontWeight: '800',
                                color: theme.c.accent,
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                marginBottom: '4px',
                            }}>
                                Misión del Programa
                            </div>
                            <p style={{
                                fontSize: '13px',
                                lineHeight: '1.5',
                                color: theme.c.text,
                                margin: 0,
                            }}>
                                {missionText}
                            </p>
                        </div>

                        {/* ═══════════════════ PROGRESSION TABLE (at top) ═══════════════════ */}
                        {changingProgressions.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    color: theme.c.text,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    marginBottom: '8px',
                                }}>
                                    Progresión Semanal
                                </div>

                                <div style={{
                                    border: `1px solid ${theme.c.border}`,
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    fontSize: '11px',
                                }}>
                                    {/* Header row */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: `minmax(140px, 2.5fr) ${Array(totalWeeks).fill('minmax(55px, 1fr)').join(' ')}`,
                                        backgroundColor: theme.c.headerBg,
                                        borderBottom: `1px solid ${theme.c.border}`,
                                    }}>
                                        <div style={{ padding: '8px 12px', fontWeight: '700', color: theme.c.text }}>
                                            Ejercicio
                                        </div>
                                        {Array.from({ length: totalWeeks }, (_, i) => (
                                            <div key={i} style={{
                                                padding: '8px 6px',
                                                fontWeight: '700',
                                                color: theme.c.accent,
                                                textAlign: 'center',
                                            }}>
                                                S{i + 1}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Data rows */}
                                    {changingProgressions.map((prog, pIdx) => (
                                        <div key={pIdx} style={{
                                            display: 'grid',
                                            gridTemplateColumns: `minmax(140px, 2.5fr) ${Array(totalWeeks).fill('minmax(55px, 1fr)').join(' ')}`,
                                            borderBottom: pIdx < changingProgressions.length - 1 ? `1px solid ${theme.c.borderSoft}` : 'none',
                                            backgroundColor: pIdx % 2 === 0 ? theme.c.rowEven : theme.c.rowOdd,
                                        }}>
                                            <div style={{
                                                padding: '8px 10px',
                                                fontWeight: '600',
                                                color: theme.c.text,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                gap: '3px',
                                            }}>
                                                <span style={{ lineHeight: '1.3', fontSize: '11px' }}>{prog.name}</span>
                                                {prog.rest && (
                                                    <span style={{
                                                        fontSize: '9px',
                                                        fontWeight: '600',
                                                        color: theme.c.textMuted,
                                                        backgroundColor: theme.c.accentSoft,
                                                        padding: '1px 6px',
                                                        borderRadius: '100px',
                                                        whiteSpace: 'nowrap',
                                                        alignSelf: 'flex-start',
                                                    }}>
                                                        ⏱ {prog.rest}
                                                    </span>
                                                )}
                                            </div>
                                            {Array.from({ length: totalWeeks }, (_, i) => {
                                                const v = prog.progression[i] || '-';
                                                return (
                                                    <div key={i} style={{
                                                        padding: '6px 4px',
                                                        color: v === '-' ? theme.c.textMuted : theme.c.text,
                                                        textAlign: 'center',
                                                        fontWeight: v !== '-' ? '700' : '400',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '10px',
                                                        lineHeight: '1.2',
                                                        wordBreak: 'break-word',
                                                        whiteSpace: 'pre-wrap', // Allow wrapping
                                                    }}>
                                                        {v}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ═══════════════════ TRAINING DAYS ═══════════════════ */}
                        {baseWeek && baseWeek.days.map((day, dIdx) => (
                            <DaySection
                                key={dIdx}
                                day={day}
                                theme={theme}
                                monthlyStrategy={monthlyStrategy}
                                dayIndex={dIdx + 1}
                            />
                        ))}

                        {/* ═══════════════════ FOOTER ═══════════════════ */}
                        <div style={{
                            marginTop: '28px',
                            paddingTop: '16px',
                            borderTop: `1px solid ${theme.c.border}`,
                            textAlign: 'center',
                            color: theme.c.textMuted,
                            fontSize: '10px',
                            letterSpacing: '0.5px',
                        }}>
                            <p style={{ margin: 0, fontWeight: '500' }}>
                                GENERADO CON AI COACH · {new Date().getFullYear()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
