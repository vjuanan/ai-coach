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
        headerTagBg: string;
        weekBannerBg: string;
        weekBannerText: string;

        dayHeaderBg: string;
        dayHeaderText: string;

        activationBg: string;
        activationTitle: string;
        activationBorder: string;
        activationText: string;

        finisherBg: string;
        finisherTitle: string;
        finisherBorder: string;
        finisherText: string;

        exerciseNumber: string;
        progressionBorder: string;
        progressionBg: string;
        progressionText: string;
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
            accent: '#0071E3', // Apple Blue
            accentLight: '#F5F5F7',
            border: '#D2D2D7',
            headerTagBg: '#1D1D1F',
            weekBannerBg: '#F5F5F7',
            weekBannerText: '#1D1D1F',
            dayHeaderBg: '#FFFFFF', // Clean
            dayHeaderText: '#1D1D1F',
            activationBg: '#F5F5F7', // Subtle gray box
            activationTitle: '#86868B', // Muted title
            activationBorder: 'transparent',
            activationText: '#1D1D1F',
            finisherBg: '#FFF5F5',
            finisherTitle: '#FF3B30',
            finisherBorder: '#FF3B30',
            finisherText: '#1D1D1F',
            exerciseNumber: '#0071E3',
            progressionBorder: '#0071E3',
            progressionBg: '#F5F9FF',
            progressionText: '#1D1D1F',
        }
    },
    dark: {
        id: 'dark',
        label: 'Pro (Apple Dark)',
        colors: {
            bgPrimary: '#000000',
            textPrimary: '#F5F5F7',
            textSecondary: '#A1A1A6',
            accent: '#0A84FF', // Apple Blue Light
            accentLight: '#1C1C1E',
            border: '#38383A',
            headerTagBg: '#2C2C2E',
            weekBannerBg: '#1C1C1E',
            weekBannerText: '#F5F5F7',
            dayHeaderBg: '#000000',
            dayHeaderText: '#F5F5F7',
            activationBg: '#1C1C1E', // Dark gray box
            activationTitle: '#A1A1A6',
            activationBorder: 'transparent',
            activationText: '#D1D1D6',
            finisherBg: '#1A0505',
            finisherTitle: '#FF453A',
            finisherBorder: '#FF453A',
            finisherText: '#D1D1D6',
            exerciseNumber: '#0A84FF',
            progressionBorder: '#0A84FF',
            progressionBg: '#0A121E',
            progressionText: '#F5F5F7',
        }
    },
    pinky: {
        id: 'pinky',
        label: 'Rose Gold',
        colors: {
            bgPrimary: '#FFF5F7', // Very subtle pink-white
            textPrimary: '#4A2C36', // Deep brownish-red
            textSecondary: '#8E6E79',
            accent: '#BE123C', // Rose 700
            accentLight: '#FFE4E9',
            border: '#FECDD3',
            headerTagBg: '#BE123C',
            weekBannerBg: '#BE123C',
            weekBannerText: '#FFFFFF',
            dayHeaderBg: '#FFFFFF',
            dayHeaderText: '#BE123C',
            activationBg: '#FFF0F3',
            activationTitle: '#BE123C',
            activationBorder: 'transparent',
            activationText: '#881337',
            finisherBg: '#881337', // Rose 900
            finisherTitle: '#FFFFFF',
            finisherBorder: '#881337',
            finisherText: '#FFE4E6',
            exerciseNumber: '#BE123C',
            progressionBorder: '#BE123C',
            progressionBg: '#FFF1F2',
            progressionText: '#881337',
        }
    },
    hard: {
        id: 'hard',
        label: 'Titanium',
        colors: {
            bgPrimary: '#F2F2F7', // System Gray 6
            textPrimary: '#1C1C1E', // System Gray 6 Dark
            textSecondary: '#636366',
            accent: '#8E8E93', // System Gray
            accentLight: '#FFFFFF',
            border: '#C7C7CC',
            headerTagBg: '#000000',
            weekBannerBg: '#000000',
            weekBannerText: '#FFFFFF',
            dayHeaderBg: '#F2F2F7',
            dayHeaderText: '#000000',
            activationBg: '#FFFFFF',
            activationTitle: '#636366',
            activationBorder: 'transparent',
            activationText: '#1C1C1E',
            finisherBg: '#000000',
            finisherTitle: '#FFFFFF',
            finisherBorder: '#000000',
            finisherText: '#8E8E93',
            exerciseNumber: '#000000',
            progressionBorder: '#000000',
            progressionBg: '#E5E5EA',
            progressionText: '#000000',
        }
    },
    crazy: {
        id: 'crazy',
        label: 'Cyber (Electric)',
        colors: {
            bgPrimary: '#09090B', // Zinc 950
            textPrimary: '#F0F0F0', // Brighter White
            textSecondary: '#A1A1AA',
            accent: '#22D3EE', // Cyan 400
            accentLight: '#27272A', // Zinc 800 - Lighter for visibility
            border: '#27272A',
            headerTagBg: '#C026D3', // Fuchsia 600
            weekBannerBg: 'linear-gradient(135deg, #C026D3 0%, #7C3AED 100%)',
            weekBannerText: '#FFFFFF',
            dayHeaderBg: '#09090B',
            dayHeaderText: '#E879F9', // Fuchsia 400
            activationBg: '#18181B',
            activationTitle: '#22D3EE',
            activationBorder: '#22D3EE',
            activationText: '#E2E8F0',
            finisherBg: '#2E1065', // Violet 950
            finisherTitle: '#F472B6', // Pink 400
            finisherBorder: '#C026D3',
            finisherText: '#E9D5FF',
            exerciseNumber: '#22D3EE',
            progressionBorder: '#C026D3',
            progressionBg: 'rgba(192, 38, 211, 0.15)', // Slightly more visible
            progressionText: '#F0F0F0', // White text for better contrast vs progressionBg
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

    // Get current theme object, fallback to white safely
    const theme = THEMES[currentThemeId] || THEMES.white;

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
                backgroundColor: theme.colors.bgPrimary,
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true,
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
        // Filter out completely empty blocks (no name AND no content/empty content)
        const validBlocks = blocks.filter(b => {
            const hasName = b.name && b.name.trim().length > 0;
            const hasContent = b.content && b.content.some(c => c && c.trim().length > 0);
            return hasName || hasContent;
        });

        const activation = validBlocks.filter(b => b.section === 'warmup' || b.type === 'warmup' || b.type === 'mobility');
        const finisher = validBlocks.filter(b => b.section === 'cooldown' || b.type === 'finisher');
        const main = validBlocks.filter(b => !activation.includes(b) && !finisher.includes(b));
        return { activation, main, finisher };
    };

    const getProgressionForBlock = (blockName: string) => {
        if (!monthlyStrategy?.progressions) return null;
        const normName = blockName.trim().toLowerCase();
        return monthlyStrategy.progressions.find(p => p.name.trim().toLowerCase() === normName);
    };

    // -- COMPONENT RENDERERS --
    const renderExercise = (block: WorkoutBlock, index: number, isSuperSet: boolean = false, superSetLetter: string = '') => {
        // dynamic icon determination
        const IconComponent = BLOCK_ICONS[block.type] || Dumbbell;
        const progression = getProgressionForBlock(block.name || '');
        const numberDisplay = isSuperSet ? `${index}${superSetLetter}.` : `${index}.`;

        // Validation: If no content provided and no progression, do not render
        const hasContent = block.content && block.content.length > 0 && block.content.some(c => c.trim().length > 0);
        const hasProgression = progression && progression.progression.some(p => p && p !== '-');

        if (!hasContent && !hasProgression) return null;

        return (
            <div key={`${index}-${block.name}`} style={{ marginBottom: '24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{
                        fontSize: '24px',
                        fontWeight: '800',
                        color: theme.colors.exerciseNumber,
                        marginRight: '12px',
                        width: '40px',
                        textAlign: 'right',
                        fontFamily: 'SF Pro Display, -apple-system, system-ui, sans-serif'
                    }}>
                        {numberDisplay}
                    </span>
                    <h4 style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: theme.colors.textPrimary,
                        margin: 0,
                        marginRight: '12px',
                        fontFamily: 'SF Pro Display, -apple-system, system-ui, sans-serif',
                        letterSpacing: '-0.02em'
                    }}>
                        {block.name || 'Bloque'}
                    </h4>

                    {/* Icon Badge */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.colors.accentLight,
                        borderRadius: '6px',
                        padding: '4px',
                        color: theme.colors.accent
                    }}>
                        <IconComponent size={16} strokeWidth={2.5} />
                    </div>
                </div>

                {/* Content */}
                <div style={{ paddingLeft: '52px' }}>
                    {block.cue && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '8px',
                            color: theme.colors.textSecondary,
                            fontSize: '13px',
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                        }}>
                            <span style={{ marginRight: '6px' }}>💡</span>
                            <span style={{ fontStyle: 'italic', lineHeight: '1.4' }}>
                                {block.cue}
                            </span>
                        </div>
                    )}

                    <div style={{
                        backgroundColor: theme.colors.progressionBg,
                        // Removing the borderLeft to make it cleaner - "Apple Style" card look
                        borderRadius: '12px',
                        padding: '16px',
                        marginTop: '8px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}>
                        {progression ? (
                            <div style={{ fontSize: '14px', lineHeight: '1.6', color: theme.colors.progressionText, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px 16px' }}>
                                    {progression.progression.map((val, idx) => {
                                        if (val === '-' || !val) return null;
                                        return (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                                                <span style={{
                                                    fontWeight: '600',
                                                    color: theme.colors.textSecondary,
                                                    fontSize: '11px',
                                                    textTransform: 'uppercase',
                                                    marginRight: '6px',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    SEM {idx + 1}
                                                </span>
                                                <span style={{ fontWeight: '500', color: theme.colors.textPrimary }}>
                                                    {val}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div style={{ fontSize: '14px', lineHeight: '1.6', color: theme.colors.progressionText, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                                {block.content.map((line, i) => (
                                    <div key={i} style={{ marginBottom: i < block.content.length - 1 ? '4px' : 0 }}>
                                        {line}
                                    </div>
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
                        {/* Theme Select */}
                        <div className="relative">
                            <select
                                value={currentThemeId}
                                onChange={(e) => setCurrentThemeId(e.target.value)}
                                className="h-9 w-[140px] rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer appearance-none"
                            >
                                {Object.values(THEMES).map(t => (
                                    <option key={t.id} value={t.id}>{t.label}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <ImageIcon size={14} />
                            </div>
                        </div>

                        {/* Format Select */}
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
                            minHeight: '1000px',
                            height: 'auto', // Allow growth
                            backgroundColor: theme.colors.bgPrimary,
                            padding: '60px', // More generous padding
                            boxSizing: 'border-box',
                            fontFamily: 'Inter, system-ui, sans-serif',
                            color: theme.colors.textPrimary,
                            position: 'relative',
                            overflow: 'visible' // Ensure shadows/etc don't clip
                        }}
                    >
                        {/* 1. Header Section */}
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                            {weekDateRanges && (
                                <div style={{
                                    display: 'inline-block',
                                    background: theme.colors.weekBannerBg.includes('gradient') ? theme.colors.weekBannerBg : undefined,
                                    backgroundColor: !theme.colors.weekBannerBg.includes('gradient') ? theme.colors.weekBannerBg : undefined,
                                    color: theme.colors.weekBannerText,
                                    padding: '8px 20px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    marginBottom: '20px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
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
                                color: theme.colors.accent,
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
                                color: theme.colors.textPrimary
                            }}>
                                Plan de Entrenamiento
                            </h1>
                            <div style={{
                                display: 'inline-block',
                                backgroundColor: theme.colors.headerTagBg,
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
                                backgroundColor: theme.colors.accentLight,
                                padding: '20px 24px',
                                borderRadius: '12px',
                                marginBottom: '40px',
                                borderLeft: `6px solid ${theme.colors.accent}`
                            }}>
                                <h3 style={{
                                    color: theme.colors.accent,
                                    fontSize: '18px',
                                    fontWeight: '800',
                                    marginBottom: '8px'
                                }}>
                                    🎯 Misión: {mission.split(':')[0]}
                                </h3>
                                <p style={{
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    color: theme.colors.textSecondary
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
                                <div key={dayIdx} style={{ marginBottom: '32px' }}>
                                    {/* Link Day Header */}
                                    <div style={{
                                        backgroundColor: theme.colors.dayHeaderBg,
                                        color: theme.colors.dayHeaderText,
                                        padding: '12px 0', // Remove horizontal padding for cleaner look if transparent
                                        borderBottom: `2px solid ${theme.colors.accent}`,
                                        marginBottom: '30px',
                                        fontSize: '22px',
                                        fontWeight: '800',
                                        letterSpacing: '-0.5px',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ marginRight: '10px', opacity: 0.8, display: 'flex' }}><Calendar size={24} /></span>
                                        {day.name}
                                    </div>

                                    {/* Activation */}
                                    {activation.length > 0 && (
                                        <div style={{
                                            marginBottom: '32px',
                                            backgroundColor: theme.colors.activationBg,
                                            padding: '20px',
                                            borderRadius: '12px',
                                            // Only render border if it is not transparent
                                            border: theme.colors.activationBorder !== 'transparent' ? `1px solid ${theme.colors.activationBorder}` : 'none'
                                        }}>
                                            <h4 style={{
                                                color: theme.colors.activationTitle,
                                                fontWeight: '800',
                                                textTransform: 'uppercase',
                                                fontSize: '12px',
                                                marginBottom: '16px',
                                                letterSpacing: '1px'
                                            }}>
                                                Warm Up
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {activation.map((block, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', fontSize: '14px', color: theme.colors.activationText }}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            width: '6px',
                                                            height: '6px',
                                                            borderRadius: '50%',
                                                            backgroundColor: theme.colors.accent,
                                                            marginTop: '6px',
                                                            marginRight: '12px',
                                                            flexShrink: 0
                                                        }} />
                                                        <div>
                                                            <span style={{ fontWeight: '600', color: theme.colors.textPrimary, marginRight: '6px' }}>{block.name}</span>
                                                            {block.content && block.content.length > 0 && (
                                                                <span style={{ opacity: 0.85, fontSize: '13px' }}>
                                                                    — {block.content.join(', ')}
                                                                </span>
                                                            )}
                                                        </div>
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
                                            backgroundColor: theme.colors.finisherBg,
                                            borderLeft: `4px solid ${theme.colors.finisherBorder}`,
                                            borderRadius: '0 8px 8px 0'
                                        }}>
                                            <h4 style={{
                                                color: theme.colors.finisherTitle,
                                                fontSize: '16px',
                                                fontWeight: '800',
                                                marginBottom: '10px',
                                                textTransform: 'uppercase'
                                            }}>
                                                🔥 Finisher
                                            </h4>
                                            {finisher.map((block, i) => (
                                                <div key={i} style={{ marginBottom: '12px' }}>
                                                    <div style={{ fontWeight: '700', color: theme.colors.textPrimary }}>
                                                        {block.name}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: theme.colors.finisherText }}>
                                                        {block.content.map((line, l) => (
                                                            <div key={l}>{line}</div>
                                                        ))}
                                                    </div>
                                                    {block.cue && (
                                                        <div style={{ fontSize: '12px', fontStyle: 'italic', color: theme.colors.textSecondary, marginTop: '2px' }}>
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
                            borderTop: `2px solid ${theme.colors.border}`,
                            paddingTop: '20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: theme.colors.textSecondary,
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
