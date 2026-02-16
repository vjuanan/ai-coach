/* eslint-disable @next/next/no-img-element */
import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Loader2, X, FileText, ImageIcon, Dumbbell, Flame, Zap, Target, Calendar } from 'lucide-react';

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
        accent: string;       // Primary brand color
        accentLight: string;  // Backgrounds for boxes
        border: string;

        // Specific Sections
        headerTagBg: string; // The Pill for program name
        headerTagText: string;

        weekBannerBg: string;
        weekBannerText: string;

        dayHeaderBg: string;
        dayHeaderText: string;
        dayHeaderBorder: string;

        sectionTitle: string; // "WARM UP", "TRAINING"

        cardBg: string;
        cardBorder: string;
        cardShadow: string;

        exerciseNumberBg: string;
        exerciseNumberText: string;

        progressionBg: string;
        progressionBorder: string;
        progressionText: string;
        progressionLabel: string; // "SEMANA 1"
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
            border: '#D2D2D7',

            headerTagBg: '#1D1D1F',
            headerTagText: '#FFFFFF',

            weekBannerBg: '#F5F5F7',
            weekBannerText: '#1D1D1F',

            dayHeaderBg: '#FFFFFF',
            dayHeaderText: '#1D1D1F',
            dayHeaderBorder: '#E5E5EA',

            sectionTitle: '#86868B',

            cardBg: '#FFFFFF',
            cardBorder: '#E5E5EA',
            cardShadow: '0 4px 12px rgba(0,0,0,0.04)',

            exerciseNumberBg: '#F5F5F7',
            exerciseNumberText: '#1D1D1F',

            progressionBg: '#F5F9FF',
            progressionBorder: 'transparent',
            progressionText: '#1D1D1F',
            progressionLabel: '#0071E3',
        }
    },
    dark: {
        id: 'dark',
        label: 'Pro (Apple Dark)',
        colors: {
            bgPrimary: '#000000',
            textPrimary: '#F5F5F7',
            textSecondary: '#86868B', // A bit darker than white theme secondary
            accent: '#0A84FF',
            accentLight: '#1C1C1E',
            border: '#38383A',

            headerTagBg: '#2C2C2E',
            headerTagText: '#F5F5F7',

            weekBannerBg: '#1C1C1E',
            weekBannerText: '#F5F5F7',

            dayHeaderBg: '#000000',
            dayHeaderText: '#F5F5F7',
            dayHeaderBorder: '#2C2C2E',

            sectionTitle: '#6E6E73',

            cardBg: '#1C1C1E',
            cardBorder: '#2C2C2E',
            cardShadow: '0 4px 12px rgba(0,0,0,0.4)',

            exerciseNumberBg: '#2C2C2E',
            exerciseNumberText: '#F5F5F7',

            progressionBg: '#0A121E',
            progressionBorder: 'transparent',
            progressionText: '#F5F5F7',
            progressionLabel: '#0A84FF',
        }
    },
    pinky: {
        id: 'pinky',
        label: 'Rose Gold',
        colors: {
            bgPrimary: '#FFF5F7',
            textPrimary: '#881337', // Rose 900
            textSecondary: '#BE123C', // Rose 700
            accent: '#E11D48', // Rose 600
            accentLight: '#FFE4E6', // Rose 100
            border: '#FECDD3', // Rose 200

            headerTagBg: '#E11D48',
            headerTagText: '#FFFFFF',

            weekBannerBg: '#FFE4E6',
            weekBannerText: '#881337',

            dayHeaderBg: 'transparent',
            dayHeaderText: '#881337',
            dayHeaderBorder: '#FECDD3',

            sectionTitle: '#BE123C',

            cardBg: '#FFFFFF',
            cardBorder: '#F43F5E', // Rose 500
            cardShadow: '0 4px 12px rgba(225, 29, 72, 0.1)',

            exerciseNumberBg: '#FFE4E6',
            exerciseNumberText: '#881337',

            progressionBg: '#FFF1F2',
            progressionBorder: '#FECDD3',
            progressionText: '#881337',
            progressionLabel: '#E11D48',
        }
    },
    hard: {
        id: 'hard',
        label: 'Titanium',
        colors: {
            bgPrimary: '#F2F2F7',
            textPrimary: '#000000',
            textSecondary: '#636366',
            accent: '#8E8E93',
            accentLight: '#FFFFFF',
            border: '#C7C7CC',

            headerTagBg: '#000000',
            headerTagText: '#FFFFFF',

            weekBannerBg: '#E5E5EA',
            weekBannerText: '#000000',

            dayHeaderBg: 'transparent',
            dayHeaderText: '#000000',
            dayHeaderBorder: '#D1D1D6',

            sectionTitle: '#8E8E93',

            cardBg: '#FFFFFF',
            cardBorder: '#C7C7CC',
            cardShadow: '0 2px 6px rgba(0,0,0,0.05)',

            exerciseNumberBg: '#E5E5EA',
            exerciseNumberText: '#000000',

            progressionBg: '#F2F2F7',
            progressionBorder: 'transparent',
            progressionText: '#000000',
            progressionLabel: '#636366',
        }
    },
    cyber: {
        id: 'cyber',
        label: 'Cyber (Electric)',
        colors: {
            bgPrimary: '#09090B',
            textPrimary: '#E2E8F0',
            textSecondary: '#94A3B8',
            accent: '#22D3EE', // Cyan
            accentLight: 'rgba(34, 211, 238, 0.1)',
            border: '#334155',

            headerTagBg: '#22D3EE',
            headerTagText: '#09090B',

            weekBannerBg: 'linear-gradient(90deg, #0F172A 0%, #1E293B 100%)',
            weekBannerText: '#22D3EE',

            dayHeaderBg: 'transparent',
            dayHeaderText: '#F8FAFC',
            dayHeaderBorder: '#334155',

            sectionTitle: '#64748B',

            cardBg: '#1E293B',
            cardBorder: '#334155',
            cardShadow: '0 0 15px rgba(34, 211, 238, 0.1)',

            exerciseNumberBg: 'rgba(34, 211, 238, 0.2)',
            exerciseNumberText: '#22D3EE',

            progressionBg: '#0F172A',
            progressionBorder: '#1E293B',
            progressionText: '#E2E8F0',
            progressionLabel: '#22D3EE',
        }
    }
};

// -- ICON MAPPING --
const BLOCK_ICONS: Record<string, any> = {
    strength_linear: Dumbbell,
    metcon_structured: Flame,
    warmup: Zap,
    accessory: Target,
    skill: Target,
    finisher: Flame,
    free_text: FileText,
    mobility: ImageIcon,
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
        const month = monthNames[date.getMonth()];
        return `${day} ${month}`;
    };

    return `${formatDate(range.startDate)} - ${formatDate(range.endDate)}`;
};

const getProgressionForBlock = (blockName: string, monthlyStrategy?: { progressions: MonthlyProgression[] }) => {
    if (!monthlyStrategy?.progressions) return null;
    const normName = blockName.trim().toLowerCase();
    return monthlyStrategy.progressions.find(p => p.name.trim().toLowerCase() === normName);
};

// -- SUB-COMPONENTS --

// 1. Exercise Card
const ExerciseCard = ({
    block,
    index,
    isSuperSet = false,
    superSetLetter = '',
    theme,
    monthlyStrategy
}: {
    block: WorkoutBlock,
    index: number,
    isSuperSet?: boolean,
    superSetLetter?: string,
    theme: ExportTheme,
    monthlyStrategy?: { progressions: MonthlyProgression[] }
}) => {
    const IconComponent = BLOCK_ICONS[block.type] || Dumbbell;
    const progression = getProgressionForBlock(block.name || '', monthlyStrategy);
    const numberDisplay = isSuperSet ? `${index}${superSetLetter}` : `${index}`;

    // Skip empty blocks
    const hasContent = block.content && block.content.length > 0 && block.content.some(c => c.trim().length > 0);
    const hasProgression = progression && progression.progression.some(p => p && p !== '-' && p !== 'Active');

    if (!hasContent && !hasProgression) return null;

    return (
        <div style={{
            marginBottom: '16px',
            backgroundColor: theme.colors.cardBg,
            border: `1px solid ${theme.colors.cardBorder}`,
            borderRadius: '16px',
            boxShadow: theme.colors.cardShadow,
            padding: '20px',
            breakInside: 'avoid',
            position: 'relative'
        }}>
            {/* Header: Number, Title, Icon */}
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                {/* Number Badge */}
                <div style={{
                    backgroundColor: theme.colors.exerciseNumberBg,
                    color: theme.colors.exerciseNumberText,
                    minWidth: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '14px',
                    marginRight: '12px',
                    flexShrink: 0,
                    marginTop: '2px'
                }}>
                    {numberDisplay}
                </div>

                {/* Title & Badge */}
                <div style={{ flex: 1 }}>
                    <h4 style={{
                        fontSize: '17px',
                        fontWeight: '700',
                        color: theme.colors.textPrimary,
                        margin: 0,
                        lineHeight: '1.3',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                    }}>
                        {block.name || 'Ejercicio'}
                    </h4>
                    {block.cue && (
                        <div style={{
                            marginTop: '4px',
                            color: theme.colors.textSecondary,
                            fontSize: '13px',
                            fontStyle: 'italic',
                            lineHeight: '1.4'
                        }}>
                            {block.cue}
                        </div>
                    )}
                </div>

                {/* Icon */}
                <div style={{
                    color: theme.colors.accent,
                    marginLeft: '12px',
                    opacity: 0.8
                }}>
                    <IconComponent size={18} strokeWidth={2.5} />
                </div>
            </div>

            {/* Content / Progression */}
            <div style={{
                paddingLeft: '40px', // Indent to align with text
            }}>
                {progression ? (
                    // Progression Table
                    <div style={{
                        backgroundColor: theme.colors.progressionBg,
                        borderRadius: '12px',
                        border: theme.colors.progressionBorder !== 'transparent' ? `1px solid ${theme.colors.progressionBorder}` : 'none',
                        padding: '12px 16px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                        gap: '12px'
                    }}>
                        {progression.progression.map((val, idx) => {
                            if (val === '-' || !val) return null;
                            return (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{
                                        fontSize: '10px',
                                        fontWeight: '700',
                                        color: theme.colors.progressionLabel,
                                        textTransform: 'uppercase',
                                        marginBottom: '2px'
                                    }}>
                                        SEM {idx + 1}
                                    </span>
                                    <span style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: theme.colors.progressionText
                                    }}>
                                        {val}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // Static Content List
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                    }}>
                        {block.content.map((line, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                fontSize: '14px',
                                color: theme.colors.textPrimary,
                                lineHeight: '1.5'
                            }}>
                                <span style={{
                                    color: theme.colors.accent,
                                    marginRight: '8px',
                                    fontWeight: 'bold',
                                    marginTop: '1px' // optical alignment
                                }}>•</span>
                                <span>{line}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


// 2. Day Column
const DayColumn = ({
    day,
    theme,
    monthlyStrategy
}: {
    day: DayData,
    theme: ExportTheme,
    monthlyStrategy?: { progressions: MonthlyProgression[] }
}) => {
    // Group blocks by section
    const warmupBlocks = day.blocks.filter(b => b.section === 'warmup' || b.type === 'warmup' || b.type === 'mobility');
    const cooldownBlocks = day.blocks.filter(b => b.section === 'cooldown' || b.type === 'finisher');
    const mainBlocks = day.blocks.filter(b => !warmupBlocks.includes(b) && !cooldownBlocks.includes(b));
    let mainExIndex = 1;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginBottom: '32px' // Spacing between days if stacked, or bottom margin
        }}>
            {/* Day Header */}
            <div style={{
                paddingBottom: '12px',
                borderBottom: `2px solid ${theme.colors.dayHeaderBorder}`,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <h3 style={{
                    fontSize: '22px',
                    fontWeight: '800',
                    color: theme.colors.dayHeaderText,
                    textTransform: 'uppercase',
                    margin: 0,
                    letterSpacing: '-0.5px'
                }}>
                    {day.name}
                </h3>
                {/* Optional: Add day generic info if needed */}
            </div>

            {/* Warm Up Section */}
            {warmupBlocks.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        color: theme.colors.sectionTitle,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <Zap size={12} style={{ marginRight: '6px' }} />
                        CALENTAMIENTO
                    </div>
                    {warmupBlocks.map((block, i) => (
                        <ExerciseCard key={i} block={block} index={i + 1} theme={theme} monthlyStrategy={monthlyStrategy} />
                    ))}
                </div>
            )}

            {/* Main Training Section */}
            {mainBlocks.length > 0 && (
                <div>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        color: theme.colors.sectionTitle,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '12px',
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <Dumbbell size={12} style={{ marginRight: '6px' }} />
                        ENTRENAMIENTO
                    </div>
                    {mainBlocks.map((block, i) => {
                        const idx = mainExIndex++;
                        return <ExerciseCard key={i} block={block} index={idx} theme={theme} monthlyStrategy={monthlyStrategy} />;
                    })}
                </div>
            )}

            {/* Finisher Section */}
            {cooldownBlocks.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        color: theme.colors.sectionTitle,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <Flame size={12} style={{ marginRight: '6px' }} />
                        FINISHER / COOL DOWN
                    </div>
                    {cooldownBlocks.map((block, i) => (
                        <ExerciseCard key={i} block={block} index={i + 1} theme={theme} monthlyStrategy={monthlyStrategy} />
                    ))}
                </div>
            )}
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

    const handleExport = async () => {
        if (!exportRef.current) return;
        setIsExporting(true);

        try {
            await document.fonts.ready;

            // wait for images to load
            const images = Array.from(exportRef.current.getElementsByTagName('img'));
            await Promise.all(images.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }));

            // Force a small delay to ensure rendering is settled
            await new Promise(resolve => setTimeout(resolve, 500));

            // Capture the FULL scrollHeight of the element so nothing is clipped
            const el = exportRef.current;
            const fullHeight = el.scrollHeight;
            const fullWidth = el.scrollWidth;

            const canvas = await html2canvas(el, {
                backgroundColor: theme.colors.bgPrimary,
                scale: 2, // 2x is enough and avoids memory issues on large plans
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
                        // Force the cloned element to show its full height without overflow constraints
                        clonedEl.style.height = 'auto';
                        clonedEl.style.overflow = 'visible';
                        clonedEl.style.fontFeatureSettings = '"liga" 0';
                        clonedEl.style.fontVariantLigatures = 'none';
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
                const imgWidth = 595.28; // A4 width in pt
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
            <div className="relative w-full max-w-7xl h-[95vh] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Toolbar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Vista Previa</h2>
                    <div className="flex items-center gap-3">
                        <select
                            value={currentThemeId}
                            onChange={(e) => setCurrentThemeId(e.target.value)}
                            className="h-9 w-[140px] rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none text-gray-900 dark:text-gray-100"
                        >
                            {Object.values(THEMES).map(t => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                        </select>
                        <select
                            value={exportFormat}
                            onChange={(e) => setExportFormat(e.target.value as 'png' | 'pdf')}
                            className="h-9 w-[100px] rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none text-gray-900 dark:text-gray-100"
                        >
                            <option value="png">PNG</option>
                            <option value="pdf">PDF</option>
                        </select>
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus-visible:outline-none disabled:opacity-50 transition-colors"
                        >
                            {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                            Exportar
                        </button>
                        <button
                            onClick={onClose}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 dark:border-zinc-700 bg-transparent text-sm font-medium hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-500 dark:text-gray-400"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Preview Container */}
                {/* NO flex on the scroll container — flex constrains child height to viewport */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-zinc-950/50 p-8">
                    <div
                        id="export-container"
                        ref={exportRef}
                        style={{
                            width: '900px',
                            margin: '0 auto', // center horizontally without flex
                            backgroundColor: theme.colors.bgPrimary,
                            padding: '60px',
                            boxSizing: 'border-box',
                            color: theme.colors.textPrimary,
                            transition: 'background-color 0.3s ease',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                        }}
                    >
                        {/* 1. BRAND HEADER */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '40px',
                            borderBottom: `1px solid ${theme.colors.border}`,
                            paddingBottom: '24px'
                        }}>
                            <div>
                                <div style={{
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    color: theme.colors.accent,
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    marginBottom: '8px'
                                }}>
                                    PREPARADO PARA {clientInfo.name.toUpperCase()}
                                </div>
                                <h1 style={{
                                    fontSize: '36px',
                                    fontWeight: '900',
                                    margin: 0,
                                    lineHeight: '1.2',
                                    color: theme.colors.textPrimary,
                                    letterSpacing: '-1px'
                                }}>
                                    {programName}
                                </h1>
                                <div style={{
                                    marginTop: '12px',
                                    display: 'inline-block',
                                    backgroundColor: theme.colors.headerTagBg,
                                    color: theme.colors.headerTagText,
                                    padding: '6px 16px',
                                    borderRadius: '100px',
                                    fontSize: '13px',
                                    fontWeight: '600'
                                }}>
                                    {monthlyStrategy?.focus || 'General Conditioning'}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                {/* Optional Logo Placeholder or Date */}
                                <div style={{
                                    fontSize: '14px',
                                    color: theme.colors.textSecondary,
                                    fontWeight: '500'
                                }}>
                                    COACH {coachName.toUpperCase()}
                                </div>
                            </div>
                        </div>

                        {/* 2. MISSION STATEMENT */}
                        {mission && (
                            <div style={{
                                backgroundColor: theme.colors.accentLight,
                                padding: '24px',
                                borderRadius: '16px',
                                marginBottom: '40px',
                                borderLeft: `4px solid ${theme.colors.accent}`
                            }}>
                                <h3 style={{
                                    fontSize: '14px',
                                    fontWeight: '800',
                                    color: theme.colors.accent,
                                    textTransform: 'uppercase',
                                    marginBottom: '8px',
                                    letterSpacing: '0.5px'
                                }}>
                                    OBJETIVO PRINCIPAL
                                </h3>
                                <p style={{
                                    fontSize: '16px',
                                    lineHeight: '1.5',
                                    color: theme.colors.textPrimary,
                                    margin: 0
                                }}>
                                    {mission}
                                </p>
                            </div>
                        )}

                        {/* 3. WEEKS LOOP */}
                        {weeks.map((week) => (
                            <div key={week.weekNumber} style={{ marginBottom: '60px', breakInside: 'avoid' }}>
                                {/* Week Banner */}
                                {weekDateRanges && (
                                    <div style={{
                                        background: theme.colors.weekBannerBg,
                                        color: theme.colors.weekBannerText,
                                        padding: '12px 24px',
                                        borderRadius: '12px',
                                        marginBottom: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <span style={{ fontWeight: '800', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            SEMANA {week.weekNumber}
                                        </span>
                                        <span style={{ fontSize: '14px', fontWeight: '500', opacity: 0.9 }}>
                                            {getWeekDateRange(week.weekNumber, weekDateRanges)}
                                        </span>
                                    </div>
                                )}

                                {/* Days Grid - MASONRY / COLUMNS Layout */}
                                {/* We use CSS Columns for masonry-like effect or simple Flex for robust rendering */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr', // 2 Columns fixed
                                    gap: '40px',
                                    alignItems: 'start'
                                }}>
                                    {week.days.map((day, dIdx) => (
                                        <div key={dIdx} style={{ minWidth: 0 }}> {/* minWidth 0 prevents grid blowout */}
                                            <DayColumn
                                                day={day}
                                                theme={theme}
                                                monthlyStrategy={monthlyStrategy}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* FOOTER */}
                        <div style={{
                            marginTop: '80px',
                            paddingTop: '32px',
                            borderTop: `1px solid ${theme.colors.border}`,
                            textAlign: 'center',
                            color: theme.colors.textSecondary,
                            fontSize: '12px'
                        }}>
                            <p style={{ margin: 0, fontWeight: '500' }}>
                                PROGRAMA DISEÑADO CON AI COACH
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

// Add these global styles to handle font smoothing in the export container if needed
// const globalStyles = `
//   #export-container {
//     -webkit-font-smoothing: antialiased;
//     -moz-osx-font-smoothing: grayscale;
//   }
// `;
