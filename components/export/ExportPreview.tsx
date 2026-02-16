/* eslint-disable @next/next/no-img-element */
import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Loader2, X } from 'lucide-react';

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

// -- THEME DEFINITIONS --
interface ExportTheme {
    id: string;
    label: string;
    colors: {
        bgPrimary: string;
        textPrimary: string;
        textSecondary: string;
        accent: string;
        accentLight: string;
        border: string;
        dayHeaderBg: string;
        dayHeaderText: string;
        exerciseBg: string;
        exerciseHover: string;
        badgeBg: string;
        badgeText: string;
        tableBg: string;
        tableHeaderBg: string;
        tableHeaderText: string;
        tableBorder: string;
        cueBg: string;
        cueText: string;
        warmupBg: string;
        warmupBorder: string;
    };
}

const THEMES: Record<string, ExportTheme> = {
    white: {
        id: 'white',
        label: 'Clean (Apple Light)',
        colors: {
            bgPrimary: '#FFFFFF',
            textPrimary: '#1D1D1F',
            textSecondary: '#86868B',
            accent: '#0071E3',
            accentLight: '#F5F5F7',
            border: '#E5E5EA',
            dayHeaderBg: '#F5F5F7',
            dayHeaderText: '#1D1D1F',
            exerciseBg: '#FFFFFF',
            exerciseHover: '#F9F9FB',
            badgeBg: '#1D1D1F',
            badgeText: '#FFFFFF',
            tableBg: '#F5F9FF',
            tableHeaderBg: '#F0F0F5',
            tableHeaderText: '#1D1D1F',
            tableBorder: '#E5E5EA',
            cueBg: '#FFF8E1',
            cueText: '#B8860B',
            warmupBg: '#F0F7FF',
            warmupBorder: '#D0E4FF',
        }
    },
    dark: {
        id: 'dark',
        label: 'Pro (Apple Dark)',
        colors: {
            bgPrimary: '#000000',
            textPrimary: '#F5F5F7',
            textSecondary: '#86868B',
            accent: '#0A84FF',
            accentLight: '#1C1C1E',
            border: '#2C2C2E',
            dayHeaderBg: '#1C1C1E',
            dayHeaderText: '#F5F5F7',
            exerciseBg: '#1C1C1E',
            exerciseHover: '#2C2C2E',
            badgeBg: '#F5F5F7',
            badgeText: '#000000',
            tableBg: '#0A121E',
            tableHeaderBg: '#1C1C1E',
            tableHeaderText: '#F5F5F7',
            tableBorder: '#2C2C2E',
            cueBg: '#2A2000',
            cueText: '#FFD700',
            warmupBg: '#0A1520',
            warmupBorder: '#1A3050',
        }
    },
    pinky: {
        id: 'pinky',
        label: 'Rose Gold',
        colors: {
            bgPrimary: '#FFF5F7',
            textPrimary: '#881337',
            textSecondary: '#BE123C',
            accent: '#E11D48',
            accentLight: '#FFE4E6',
            border: '#FECDD3',
            dayHeaderBg: '#FFE4E6',
            dayHeaderText: '#881337',
            exerciseBg: '#FFFFFF',
            exerciseHover: '#FFF5F7',
            badgeBg: '#E11D48',
            badgeText: '#FFFFFF',
            tableBg: '#FFF1F2',
            tableHeaderBg: '#FFE4E6',
            tableHeaderText: '#881337',
            tableBorder: '#FECDD3',
            cueBg: '#FFF0F0',
            cueText: '#B91C1C',
            warmupBg: '#FFF5F7',
            warmupBorder: '#FECDD3',
        }
    },
    hard: {
        id: 'hard',
        label: 'Titanium',
        colors: {
            bgPrimary: '#F2F2F7',
            textPrimary: '#000000',
            textSecondary: '#636366',
            accent: '#636366',
            accentLight: '#FFFFFF',
            border: '#D1D1D6',
            dayHeaderBg: '#E5E5EA',
            dayHeaderText: '#000000',
            exerciseBg: '#FFFFFF',
            exerciseHover: '#F2F2F7',
            badgeBg: '#000000',
            badgeText: '#FFFFFF',
            tableBg: '#F2F2F7',
            tableHeaderBg: '#E5E5EA',
            tableHeaderText: '#000000',
            tableBorder: '#D1D1D6',
            cueBg: '#F5F5DC',
            cueText: '#6B7280',
            warmupBg: '#F0F0F5',
            warmupBorder: '#D1D1D6',
        }
    },
    cyber: {
        id: 'cyber',
        label: 'Cyber (Electric)',
        colors: {
            bgPrimary: '#09090B',
            textPrimary: '#E2E8F0',
            textSecondary: '#94A3B8',
            accent: '#22D3EE',
            accentLight: 'rgba(34, 211, 238, 0.1)',
            border: '#334155',
            dayHeaderBg: '#1E293B',
            dayHeaderText: '#F8FAFC',
            exerciseBg: '#1E293B',
            exerciseHover: '#334155',
            badgeBg: '#22D3EE',
            badgeText: '#09090B',
            tableBg: '#0F172A',
            tableHeaderBg: '#1E293B',
            tableHeaderText: '#22D3EE',
            tableBorder: '#334155',
            cueBg: '#1a2a1a',
            cueText: '#22D3EE',
            warmupBg: '#0F172A',
            warmupBorder: '#334155',
        }
    }
};

// -- HELPER FUNCTIONS --
const getWeekDateRange = (weekNum: number, weekDateRanges?: { weekNumber: number; startDate: string; endDate: string; }[]) => {
    if (!weekDateRanges) return null;
    const range = weekDateRanges.find(r => r.weekNumber === weekNum);
    if (!range) return null;
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${day} ${monthNames[date.getMonth()]}`;
    };
    return `${formatDate(range.startDate)} – ${formatDate(range.endDate)}`;
};

const getProgressionForBlock = (blockName: string, monthlyStrategy?: { progressions: MonthlyProgression[] }) => {
    if (!monthlyStrategy?.progressions) return null;
    const normName = blockName.trim().toLowerCase();
    return monthlyStrategy.progressions.find(p => p.name.trim().toLowerCase() === normName);
};

// Check if all progression values are the same
const isConstantProgression = (progression: string[]): boolean => {
    const validValues = progression.filter(v => v && v !== '-');
    if (validValues.length <= 1) return true;
    return validValues.every(v => v === validValues[0]);
};

// Get a clean display name for a block
const getBlockDisplayName = (block: WorkoutBlock): string => {
    if (block.name && block.name !== block.type) return block.name;
    // Map raw type names to human-readable names
    const typeNames: Record<string, string> = {
        strength_linear: 'Ejercicio de Fuerza',
        metcon_structured: 'MetCon',
        warmup: 'Calentamiento',
        accessory: 'Accesorio',
        skill: 'Habilidad',
        finisher: 'Finisher',
        free_text: 'Notas',
        mobility: 'Movilidad',
    };
    return typeNames[block.type] || block.type;
};

// -- EXERCISE ROW COMPONENT (compact, scannable) --
const ExerciseRow = ({
    block,
    index,
    theme,
    monthlyStrategy
}: {
    block: WorkoutBlock;
    index: number;
    theme: ExportTheme;
    monthlyStrategy?: { progressions: MonthlyProgression[] };
}) => {
    const progression = getProgressionForBlock(block.name || '', monthlyStrategy);
    const hasContent = block.content && block.content.length > 0 && block.content.some(c => c.trim().length > 0);
    const hasProgression = progression && progression.progression.some(p => p && p !== '-' && p !== 'Active');
    const displayName = getBlockDisplayName(block);

    if (!hasContent && !hasProgression) return null;

    // Determine the "prescription" text (sets x reps, etc.)
    let prescriptionText = '';
    if (hasProgression && progression) {
        const validValues = progression.progression.filter(v => v && v !== '-');
        if (isConstantProgression(progression.progression)) {
            // All weeks same: show single value
            prescriptionText = validValues[0] || '';
        }
        // If values differ, we'll show them inline
    } else if (hasContent) {
        prescriptionText = block.content.filter(c => c.trim()).join(' · ');
    }

    const showMultiWeek = hasProgression && progression && !isConstantProgression(progression.progression);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '12px 16px',
            borderBottom: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.exerciseBg,
        }}>
            {/* Main row: number, name, prescription */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
            }}>
                {/* Number badge */}
                <div style={{
                    minWidth: '26px',
                    height: '26px',
                    borderRadius: '8px',
                    backgroundColor: theme.colors.badgeBg,
                    color: theme.colors.badgeText,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '700',
                    flexShrink: 0,
                }}>
                    {index}
                </div>

                {/* Exercise name */}
                <div style={{
                    flex: 1,
                    fontSize: '15px',
                    fontWeight: '600',
                    color: theme.colors.textPrimary,
                    lineHeight: '1.3',
                }}>
                    {displayName}
                </div>

                {/* Prescription (single value) */}
                {prescriptionText && !showMultiWeek && (
                    <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: theme.colors.accent,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                    }}>
                        {prescriptionText}
                    </div>
                )}
            </div>

            {/* Cue/notes */}
            {block.cue && (
                <div style={{
                    marginTop: '6px',
                    marginLeft: '38px',
                    fontSize: '12px',
                    fontStyle: 'italic',
                    color: theme.colors.cueText,
                    backgroundColor: theme.colors.cueBg,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    display: 'inline-block',
                    maxWidth: 'fit-content',
                }}>
                    💡 {block.cue}
                </div>
            )}

            {/* Multi-week progression (inline, only if values differ) */}
            {showMultiWeek && progression && (
                <div style={{
                    marginTop: '8px',
                    marginLeft: '38px',
                    display: 'flex',
                    gap: '6px',
                    flexWrap: 'wrap',
                }}>
                    {progression.progression.map((val, idx) => {
                        if (!val || val === '-') return null;
                        return (
                            <div key={idx} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                backgroundColor: theme.colors.tableBg,
                                border: `1px solid ${theme.colors.tableBorder}`,
                                borderRadius: '8px',
                                padding: '4px 12px',
                                minWidth: '60px',
                            }}>
                                <span style={{
                                    fontSize: '9px',
                                    fontWeight: '700',
                                    color: theme.colors.accent,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}>
                                    S{idx + 1}
                                </span>
                                <span style={{
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: theme.colors.textPrimary,
                                }}>
                                    {val}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Content list for warmup/metcon blocks */}
            {!hasProgression && block.content && block.content.length > 1 && (
                <div style={{
                    marginTop: '6px',
                    marginLeft: '38px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px 16px',
                    fontSize: '13px',
                    color: theme.colors.textSecondary,
                    lineHeight: '1.5',
                }}>
                    {block.content.filter(c => c.trim()).map((line, i) => (
                        <span key={i} style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span style={{ color: theme.colors.accent, fontSize: '8px' }}>●</span>
                            {line}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

// -- DAY SECTION COMPONENT --
const DaySection = ({
    day,
    theme,
    monthlyStrategy
}: {
    day: DayData;
    theme: ExportTheme;
    monthlyStrategy?: { progressions: MonthlyProgression[] };
}) => {
    // Group blocks by section
    const warmupBlocks = day.blocks.filter(b => b.section === 'warmup' || b.type === 'warmup' || b.type === 'mobility');
    const cooldownBlocks = day.blocks.filter(b => b.section === 'cooldown' || b.type === 'finisher');
    const mainBlocks = day.blocks.filter(b => !warmupBlocks.includes(b) && !cooldownBlocks.includes(b));

    // Filter out empty blocks
    const hasWarmup = warmupBlocks.some(b => b.content?.some(c => c.trim()));
    const hasMain = mainBlocks.some(b => b.content?.some(c => c.trim()));
    const hasCooldown = cooldownBlocks.some(b => b.content?.some(c => c.trim()));

    if (!hasWarmup && !hasMain && !hasCooldown) return null;

    let mainIndex = 1;

    return (
        <div style={{ marginBottom: '24px' }}>
            {/* Day Header */}
            <div style={{
                backgroundColor: theme.colors.dayHeaderBg,
                padding: '12px 20px',
                borderRadius: '12px 12px 0 0',
                borderBottom: `2px solid ${theme.colors.accent}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{
                    fontSize: '16px',
                    fontWeight: '800',
                    color: theme.colors.dayHeaderText,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    📅 {day.name}
                </div>
                <div style={{
                    fontSize: '11px',
                    color: theme.colors.textSecondary,
                    fontWeight: '500',
                }}>
                    {mainBlocks.length} ejercicio{mainBlocks.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Exercises container */}
            <div style={{
                border: `1px solid ${theme.colors.border}`,
                borderTop: 'none',
                borderRadius: '0 0 12px 12px',
                overflow: 'hidden',
            }}>
                {/* Warm Up */}
                {hasWarmup && (
                    <div style={{
                        backgroundColor: theme.colors.warmupBg,
                        borderBottom: `1px solid ${theme.colors.warmupBorder}`,
                        padding: '10px 16px',
                    }}>
                        <div style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            color: theme.colors.textSecondary,
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '6px',
                        }}>
                            🔥 CALENTAMIENTO
                        </div>
                        <div style={{
                            fontSize: '13px',
                            color: theme.colors.textPrimary,
                            lineHeight: '1.5',
                        }}>
                            {warmupBlocks.map((block, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '4px 12px',
                                }}>
                                    {block.content.filter(c => c.trim()).map((line, j) => (
                                        <span key={j} style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                            <span style={{ color: theme.colors.accent, fontSize: '8px' }}>●</span>
                                            {line}
                                        </span>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Training */}
                {mainBlocks.map((block, i) => {
                    const idx = mainIndex++;
                    return <ExerciseRow key={i} block={block} index={idx} theme={theme} monthlyStrategy={monthlyStrategy} />;
                })}

                {/* Finisher */}
                {hasCooldown && cooldownBlocks.map((block, i) => (
                    <ExerciseRow key={`cd-${i}`} block={block} index={i + 1} theme={theme} monthlyStrategy={monthlyStrategy} />
                ))}
            </div>
        </div>
    );
};

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

    // Use week 1 for the primary layout (all weeks have same day structure)
    const baseWeek = weeks.length > 0 ? weeks[0] : null;

    // Build progression data — only exercises whose values change across weeks
    const changingProgressions = monthlyStrategy?.progressions.filter(p => {
        const validValues = p.progression.filter(v => v && v !== '-');
        return !isConstantProgression(validValues) && validValues.length > 1;
    }) || [];

    const totalWeeks = weeks.length;

    const handleExport = async () => {
        if (!exportRef.current) return;
        setIsExporting(true);

        try {
            await document.fonts.ready;

            // Wait for images to load
            const images = Array.from(exportRef.current.getElementsByTagName('img'));
            await Promise.all(images.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }));

            await new Promise(resolve => setTimeout(resolve, 500));

            const el = exportRef.current;
            const fullHeight = el.scrollHeight;
            const fullWidth = el.scrollWidth;

            const canvas = await html2canvas(el, {
                backgroundColor: theme.colors.bgPrimary,
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true,
                imageTimeout: 15000,
                width: fullWidth,
                height: fullHeight,
                windowWidth: fullWidth,
                windowHeight: fullHeight,
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
                link.download = `${clientInfo.name}-${programName.replace(/\s+/g, '_')}-${theme.id}.png`;
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
                pdf.save(`${clientInfo.name}-${programName.replace(/\s+/g, '_')}-${theme.id}.pdf`);
            }
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-sans">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-5xl h-[95vh] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Toolbar */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Vista Previa del Export</h2>
                    <div className="flex items-center gap-3">
                        <select
                            value={currentThemeId}
                            onChange={(e) => setCurrentThemeId(e.target.value)}
                            className="h-8 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm shadow-sm focus:outline-none cursor-pointer text-gray-900 dark:text-gray-100"
                        >
                            {Object.values(THEMES).map(t => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                        </select>
                        <select
                            value={exportFormat}
                            onChange={(e) => setExportFormat(e.target.value as 'png' | 'pdf')}
                            className="h-8 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm shadow-sm focus:outline-none cursor-pointer text-gray-900 dark:text-gray-100"
                        >
                            <option value="png">PNG</option>
                            <option value="pdf">PDF</option>
                        </select>
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="h-8 px-4 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                            {isExporting ? 'Exportando...' : 'Exportar'}
                        </button>
                        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-500">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Preview */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-zinc-950/50 p-6">
                    <div
                        id="export-container"
                        ref={exportRef}
                        style={{
                            width: '780px',
                            margin: '0 auto',
                            backgroundColor: theme.colors.bgPrimary,
                            padding: '48px',
                            boxSizing: 'border-box',
                            color: theme.colors.textPrimary,
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                        }}
                    >
                        {/* ══════════ HEADER ══════════ */}
                        <div style={{
                            textAlign: 'center',
                            marginBottom: '32px',
                            paddingBottom: '24px',
                            borderBottom: `2px solid ${theme.colors.border}`,
                        }}>
                            {/* Client name */}
                            <div style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: theme.colors.accent,
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                marginBottom: '8px',
                            }}>
                                Para {clientInfo.name}  ❤️
                            </div>

                            {/* Program title */}
                            <h1 style={{
                                fontSize: '28px',
                                fontWeight: '900',
                                margin: '0 0 12px 0',
                                lineHeight: '1.15',
                                color: theme.colors.textPrimary,
                                letterSpacing: '-0.5px',
                            }}>
                                {programName}
                            </h1>

                            {/* Info badges */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '12px',
                                flexWrap: 'wrap',
                            }}>
                                <span style={{
                                    display: 'inline-block',
                                    backgroundColor: theme.colors.badgeBg,
                                    color: theme.colors.badgeText,
                                    padding: '4px 14px',
                                    borderRadius: '100px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    letterSpacing: '0.5px',
                                }}>
                                    {monthlyStrategy?.focus || 'General'}
                                </span>
                                <span style={{
                                    display: 'inline-block',
                                    backgroundColor: theme.colors.accentLight,
                                    color: theme.colors.textSecondary,
                                    padding: '4px 14px',
                                    borderRadius: '100px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                }}>
                                    {totalWeeks} semanas
                                </span>
                                <span style={{
                                    display: 'inline-block',
                                    backgroundColor: theme.colors.accentLight,
                                    color: theme.colors.textSecondary,
                                    padding: '4px 14px',
                                    borderRadius: '100px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                }}>
                                    Coach: {coachName}
                                </span>
                            </div>

                            {/* Date range if available */}
                            {weekDateRanges && weekDateRanges.length > 0 && (
                                <div style={{
                                    marginTop: '10px',
                                    fontSize: '12px',
                                    color: theme.colors.textSecondary,
                                }}>
                                    {getWeekDateRange(1, weekDateRanges)} → {getWeekDateRange(totalWeeks, weekDateRanges)}
                                </div>
                            )}
                        </div>

                        {/* ══════════ MISSION ══════════ */}
                        {mission && (
                            <div style={{
                                backgroundColor: theme.colors.accentLight,
                                padding: '16px 20px',
                                borderRadius: '12px',
                                marginBottom: '28px',
                                borderLeft: `4px solid ${theme.colors.accent}`,
                            }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    color: theme.colors.accent,
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    marginBottom: '4px',
                                }}>
                                    🎯 Objetivo
                                </div>
                                <p style={{
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                    color: theme.colors.textPrimary,
                                    margin: 0,
                                }}>
                                    {mission}
                                </p>
                            </div>
                        )}

                        {/* ══════════ TRAINING DAYS ══════════ */}
                        {baseWeek && (
                            <div>
                                {baseWeek.days.map((day, dIdx) => (
                                    <DaySection
                                        key={dIdx}
                                        day={day}
                                        theme={theme}
                                        monthlyStrategy={monthlyStrategy}
                                    />
                                ))}
                            </div>
                        )}

                        {/* ══════════ PROGRESSION TABLE ══════════ */}
                        {changingProgressions.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: '800',
                                    color: theme.colors.textPrimary,
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    marginBottom: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}>
                                    📊 Progresión Semanal
                                </div>

                                <div style={{
                                    border: `1px solid ${theme.colors.tableBorder}`,
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                }}>
                                    {/* Table header */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: `2fr ${Array(totalWeeks).fill('1fr').join(' ')}`,
                                        backgroundColor: theme.colors.tableHeaderBg,
                                        borderBottom: `1px solid ${theme.colors.tableBorder}`,
                                    }}>
                                        <div style={{
                                            padding: '10px 16px',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            color: theme.colors.tableHeaderText,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                        }}>
                                            Ejercicio
                                        </div>
                                        {Array.from({ length: totalWeeks }, (_, i) => (
                                            <div key={i} style={{
                                                padding: '10px 12px',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                color: theme.colors.tableHeaderText,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                textAlign: 'center',
                                            }}>
                                                Sem {i + 1}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Table rows */}
                                    {changingProgressions.map((prog, pIdx) => (
                                        <div key={pIdx} style={{
                                            display: 'grid',
                                            gridTemplateColumns: `2fr ${Array(totalWeeks).fill('1fr').join(' ')}`,
                                            borderBottom: pIdx < changingProgressions.length - 1 ? `1px solid ${theme.colors.tableBorder}` : 'none',
                                            backgroundColor: pIdx % 2 === 0 ? theme.colors.tableBg : 'transparent',
                                        }}>
                                            <div style={{
                                                padding: '10px 16px',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: theme.colors.textPrimary,
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}>
                                                {prog.name}
                                            </div>
                                            {Array.from({ length: totalWeeks }, (_, i) => {
                                                const val = prog.progression[i] || '-';
                                                return (
                                                    <div key={i} style={{
                                                        padding: '10px 12px',
                                                        fontSize: '13px',
                                                        fontWeight: '500',
                                                        color: val === '-' ? theme.colors.textSecondary : theme.colors.textPrimary,
                                                        textAlign: 'center',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}>
                                                        {val}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ══════════ FOOTER ══════════ */}
                        <div style={{
                            marginTop: '40px',
                            paddingTop: '20px',
                            borderTop: `1px solid ${theme.colors.border}`,
                            textAlign: 'center',
                            color: theme.colors.textSecondary,
                            fontSize: '11px',
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
