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

// -- EXERCISE ROW (Redesigned - True Minimalist) --
const ExerciseRow = ({
    block, index, theme, monthlyStrategy
}: {
    block: WorkoutBlock; index: number; theme: ExportTheme;
    monthlyStrategy?: { progressions: MonthlyProgression[] };
}) => {
    const displayName = getBlockDisplayName(block);
    const struct = block.structure;

    // Check if we have visible content
    if (!struct && (!block.content || block.content.length === 0)) return null;

    const hasProgression = getProgressionForBlock(block.name || '', monthlyStrategy);
    const showInlineProgression = hasProgression && !isConstantProgression(hasProgression.progression);

    // Build minimalist prescription string
    const parts = [];
    if (struct) {
        if (struct.sets) parts.push(`${struct.sets} series`);
        if (struct.reps) parts.push(`${struct.reps} reps`);
        if (struct.weight) parts.push(`${struct.weight}`);
        if (struct.rest) parts.push(`Descanso: ${struct.rest}`);
        if (struct.rpe) parts.push(`@ RPE ${struct.rpe}`);
    }
    const prescriptionText = parts.join('  ·  ');

    // Render Logic
    return (
        <div style={{
            padding: '16px 0', // Vertical spacing only
            borderBottom: `1px solid ${theme.c.borderSoft}`, // Subtle divider
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
        }}>
            {/* Top Line: Name + Index */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span style={{
                    fontSize: '12px',
                    color: theme.c.textMuted,
                    width: '20px',
                    fontFamily: 'monospace',
                    opacity: 0.5
                }}>
                    {index < 10 ? `0${index}` : index}
                </span>
                <span style={{
                    fontSize: '15px',
                    fontWeight: '600', // Semi-bold for name only
                    color: theme.c.text,
                    letterSpacing: '-0.2px',
                    flex: 1
                }}>
                    {displayName}
                </span>
            </div>

            {/* Prescription Line - Clean Text */}
            {struct && !struct.text && prescriptionText && (
                <div style={{
                    marginLeft: '32px',
                    fontSize: '13px',
                    color: theme.c.textMuted,
                    fontWeight: '400',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                }}>
                    {prescriptionText}
                </div>
            )}

            {/* MetCon / Text Blocks - Simplified */}
            {struct?.text && (
                <div style={{
                    marginTop: '8px',
                    marginLeft: '32px',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: theme.c.text,
                    whiteSpace: 'pre-line',
                    paddingLeft: '12px',
                    borderLeft: `2px solid ${theme.c.borderSoft}`
                }}>
                    {struct.text}
                </div>
            )}

            {/* Legacy Content */}
            {!struct && block.content && block.content.length > 0 && (
                <div style={{
                    marginTop: '4px',
                    marginLeft: '32px',
                    fontSize: '13px',
                    color: theme.c.textMuted,
                    lineHeight: '1.6',
                }}>
                    {block.content.map((line, i) => (
                        <div key={i}>• {line}</div>
                    ))}
                </div>
            )}

            {/* Notes / Cues - Very Subtle */}
            {block.cue && (
                <div style={{
                    marginTop: '4px',
                    marginLeft: '32px',
                    fontSize: '12px',
                    fontStyle: 'italic',
                    color: theme.c.textMuted,
                    opacity: 0.7
                }}>
                    {block.cue}
                </div>
            )}

            {/* Inline Progression - Text Only, No Cards */}
            {showInlineProgression && hasProgression && (
                <div style={{
                    marginTop: '6px',
                    marginLeft: '32px',
                    fontSize: '11px',
                    color: theme.c.textMuted,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    opacity: 0.9
                }}>
                    {hasProgression.progression.map((val, idx) => {
                        if (!val || val === '-') return null;
                        return (
                            <span key={idx} style={{ display: 'inline-flex', gap: '4px' }}>
                                <span style={{ fontWeight: '600', opacity: 0.7 }}>S{idx + 1}:</span>
                                <span>{val}</span>
                            </span>
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
        <div style={{ marginBottom: '40px', breakInside: 'avoid' }}>
            {/* Day Header - Clean, No Box */}
            <div style={{
                marginBottom: '16px',
                borderBottom: `2px solid ${theme.c.text}`,
                paddingBottom: '8px',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between'
            }}>
                <span style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: theme.c.text,
                    letterSpacing: '-0.5px'
                }}>
                    {day.name}
                </span>
                <span style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: theme.c.textMuted
                }}>
                    DÍA {dayIndex}
                </span>
            </div>

            {/* Exercises Container - Open, No Border */}
            <div>
                {/* Warmup - Subtle Text Block */}
                {hasWarmup && (
                    <div style={{
                        marginBottom: '20px',
                        paddingBottom: '16px',
                        borderBottom: `1px solid ${theme.c.borderSoft}`
                    }}>
                        <div style={{
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            color: theme.c.accent,
                            marginBottom: '8px',
                            fontWeight: '700'
                        }}>
                            Warm Up
                        </div>
                        {warmupBlocks.map((block, i) => {
                            const rounds = block.config?.rounds as string | number | undefined;
                            return (
                                <div key={i}>
                                    {rounds && (
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: theme.c.text,
                                            marginBottom: '2px',
                                            marginTop: i > 0 ? '8px' : '0'
                                        }}>
                                            {rounds} {String(rounds) === '1' ? 'Vuelta' : 'Vueltas'}:
                                        </div>
                                    )}
                                    <div style={{
                                        fontSize: '13px',
                                        color: theme.c.textMuted,
                                        marginBottom: '4px',
                                        lineHeight: '1.5'
                                    }}>
                                        • {block.content.filter(c => c.trim()).join(' + ')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Main exercises */}
                {mainBlocks.map((block, i) => {
                    const idx = exIdx++;
                    return <ExerciseRow key={i} block={block} index={idx} theme={theme} monthlyStrategy={monthlyStrategy} />;
                })}

                {/* Finisher */}
                {hasCooldown && cooldownBlocks.map((block, i) => (
                    <div key={`cd-${i}`} style={{ marginTop: '20px' }}>
                        <div style={{
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            color: theme.c.accent,
                            marginBottom: '8px',
                            fontWeight: '700'
                        }}>
                            Finisher
                        </div>
                        <ExerciseRow block={block} index={exIdx++} theme={theme} monthlyStrategy={monthlyStrategy} />
                    </div>
                ))}
            </div>
        </div>
    );
};

// -- MAIN COMPONENT --

// -- MINIMALIST SUMMARY COMPONENT --
const MinimalistProgression = ({
    weeks,
    monthlyStrategy,
    theme
}: {
    weeks: WeekData[];
    monthlyStrategy?: { progressions: MonthlyProgression[] };
    theme: ExportTheme;
}) => {
    // Extract unique exercises that have progressions
    const exercises = new Set<string>();
    if (monthlyStrategy?.progressions) {
        monthlyStrategy.progressions.forEach(p => {
            if (!isConstantProgression(p.progression)) {
                exercises.add(p.name);
            }
        });
    }

    // Also scan weeks for exercises that might not be in strategy but are main lifts
    weeks.forEach(w => w.days.forEach(d => d.blocks.forEach(b => {
        if (b.type === 'strength_linear' && b.name) exercises.add(b.name);
    })));

    const exerciseList = Array.from(exercises).sort();
    if (exerciseList.length === 0) return null;

    return (
        <div style={{ marginBottom: '50px', breakInside: 'avoid' }}>
            <div style={{
                fontSize: '10px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                color: theme.c.textMuted,
                marginBottom: '16px',
            }}>
                Progresión Semanal
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(120px, 1.5fr) repeat(4, 1fr)',
                gap: '8px',
                alignItems: 'center'
            }}>
                {/* Header */}
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: theme.c.textMuted, paddingBottom: '8px', borderBottom: `1px solid ${theme.c.border}` }}>Ejercicio</div>
                {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{ fontSize: '9px', fontWeight: '700', textAlign: 'center', color: theme.c.accent, paddingBottom: '8px', borderBottom: `1px solid ${theme.c.border}` }}>
                        S{i + 1}
                    </div>
                ))}

                {/* Rows */}
                {exerciseList.map((exName, i) => {
                    // Try to find progression in strategy
                    let progression = getProgressionForBlock(exName, monthlyStrategy)?.progression;

                    // Fallback: Try to find actual values in weeks if missing from strategy
                    if (!progression) {
                        progression = [0, 1, 2, 3].map(wIdx => {
                            const week = weeks.find(w => w.weekNumber === wIdx + 1);
                            if (!week) return '-';
                            // Find block in this week
                            for (const day of week.days) {
                                const block = day.blocks.find(b => b.name === exName);
                                if (block && block.structure) {
                                    // Construct simple representation
                                    if (block.structure.weight) return block.structure.weight;
                                    if (block.structure.reps) return `${block.structure.sets}x${block.structure.reps}`;
                                }
                            }
                            return '-';
                        });
                    }

                    // If still empty/boring, skip
                    if (!progression || progression.every(p => p === '-')) return null;

                    return (
                        <React.Fragment key={i}>
                            <div style={{
                                padding: '8px 0',
                                borderBottom: `1px solid ${theme.c.borderSoft}`,
                                fontSize: '11px',
                                fontWeight: '500',
                                color: theme.c.text,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {exName}
                            </div>
                            {progression.slice(0, 4).map((val, idx) => (
                                <div key={idx} style={{
                                    padding: '8px 0',
                                    borderBottom: `1px solid ${theme.c.borderSoft}`,
                                    fontSize: '10px',
                                    fontFamily: 'monospace',
                                    textAlign: 'center',
                                    color: theme.c.textMuted
                                }}>
                                    {val || '-'}
                                </div>
                            ))}
                        </React.Fragment>
                    );
                })}
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

    const totalWeeks = weeks.length;

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
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Export Preview v2.1</h2> {/* Added version to verify reload */}
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
                            width: '600px', // INCREASED WIDTH
                            margin: '0 auto',
                            backgroundColor: theme.c.bg,
                            padding: '60px 48px', // HIGH FASHION PADDING
                            boxSizing: 'border-box',
                            color: theme.c.text,
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                        }}
                    >
                        {/* ═══════════════════ HEADER ═══════════════════ */}
                        <div style={{
                            textAlign: 'center',
                            marginBottom: '40px',
                            paddingBottom: '20px',
                            borderBottom: `1px solid ${theme.c.borderSoft}`
                        }}>
                            <div style={{
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                letterSpacing: '3px',
                                color: theme.c.accent,
                                fontWeight: '700',
                                marginBottom: '12px'
                            }}>
                                Program Design
                            </div>
                            <h1 style={{
                                fontSize: '28px',
                                fontWeight: '300', // Very light
                                margin: '0 0 12px 0',
                                color: theme.c.text,
                                letterSpacing: '-0.5px',
                                lineHeight: '1.2',
                            }}>
                                {programName}
                            </h1>
                            <div style={{
                                fontSize: '13px',
                                color: theme.c.textMuted,
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '24px',
                                alignItems: 'center'
                            }}>
                                <span>{clientInfo.name}</span>
                                <span style={{ width: '4px', height: '4px', backgroundColor: theme.c.border, borderRadius: '50%' }} />
                                <span>{monthlyStrategy?.focus || 'General'}</span>
                                <span style={{ width: '4px', height: '4px', backgroundColor: theme.c.border, borderRadius: '50%' }} />
                                <span>{coachName}</span>
                            </div>
                        </div>

                        {/* ═══════════════════ MISSION (always shown) ═══════════════════ */}
                        {missionText && (
                            <div style={{
                                backgroundColor: theme.c.bgAlt,
                                padding: '20px 24px',
                                borderRadius: '2px', // Sharper corners for minimalism
                                marginBottom: '40px',
                                textAlign: 'center'
                            }}>
                                <p style={{
                                    fontSize: '13px',
                                    lineHeight: '1.6',
                                    fontStyle: 'italic',
                                    color: theme.c.text,
                                    margin: 0,
                                    fontFamily: 'Georgia, serif'
                                }}>
                                    &quot;{missionText}&quot;
                                </p>
                            </div>
                        )}

                        {/* ═══════════════════ SUMMARY TABLE (Redesigned) ═══════════════════ */}
                        <MinimalistProgression weeks={weeks} monthlyStrategy={monthlyStrategy} theme={theme} />

                        {/* ═══════════════════ WEEKS ═══════════════════ */}
                        {weeks.map((week, wIndex) => (
                            <div key={wIndex} style={{ marginBottom: '60px', breakInside: 'avoid' }}>
                                {/* Week Header - Minimalist Line */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    marginBottom: '30px',
                                    paddingTop: '20px',
                                    borderTop: wIndex > 0 ? `1px dashed ${theme.c.borderSoft}` : 'none',
                                }}>
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        color: theme.c.text,
                                    }}>
                                        SEMANA {week.weekNumber}
                                    </div>
                                    <div style={{ flex: 1, height: '1px', backgroundColor: theme.c.borderSoft }} />
                                    <div style={{
                                        fontSize: '10px',
                                        color: theme.c.textMuted,
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px'
                                    }}>
                                        {getWeekDateRange(week.weekNumber, weekDateRanges) || 'Fase 1'}
                                    </div>
                                </div>

                                {week.days.map((day, dIndex) => (
                                    <DaySection
                                        key={dIndex}
                                        day={day}
                                        dayIndex={dIndex + 1}
                                        theme={theme}
                                        monthlyStrategy={monthlyStrategy}
                                    />
                                ))}
                            </div>
                        ))}

                        {/* ═══════════════════ FOOTER ═══════════════════ */}
                        <div style={{
                            marginTop: '60px',
                            paddingTop: '24px',
                            borderTop: `1px solid ${theme.c.borderSoft}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            color: theme.c.textMuted,
                            fontSize: '9px',
                            letterSpacing: '1px',
                            textTransform: 'uppercase'
                        }}>
                            <span>AI Coach · 2026</span>
                            <span>{clientInfo.name}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

