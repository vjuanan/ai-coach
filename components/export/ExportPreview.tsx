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
    pinky: {
        id: 'pinky',
        label: 'Pinky (Original)',
        colors: {
            bgPrimary: '#FAFAF8',
            textPrimary: '#2D2926',
            textSecondary: '#5C5550',
            accent: '#9D174D',
            accentLight: '#FCE7F3',
            border: '#E5E7EB',
            headerTagBg: '#831843',
            weekBannerBg: '#4A044E',
            weekBannerText: '#FFFFFF',
            dayHeaderBg: '#9D174D',
            dayHeaderText: '#FFFFFF',
            activationBg: '#FDF2F8',
            activationTitle: '#DB2777',
            activationBorder: '#FBCFE8',
            activationText: '#5C5550',
            finisherBg: '#FFF1F2',
            finisherTitle: '#BE123C',
            finisherBorder: '#E11D48',
            finisherText: '#5C5550',
            exerciseNumber: '#9D174D',
            progressionBorder: '#9D174D',
            progressionBg: '#FFF0F5',
            progressionText: '#2D2926',
        }
    },
    dark: {
        id: 'dark',
        label: 'Dark Mode',
        colors: {
            bgPrimary: '#18181B', // Zinc 900
            textPrimary: '#F4F4F5', // Zinc 100
            textSecondary: '#A1A1AA', // Zinc 400
            accent: '#3B82F6', // Blue 500
            accentLight: '#1E293B', // Slate 800
            border: '#27272A', // Zinc 800
            headerTagBg: '#1E40AF', // Blue 800
            weekBannerBg: '#1E3A8A', // Blue 900
            weekBannerText: '#EFF6FF',
            dayHeaderBg: '#2563EB', // Blue 600
            dayHeaderText: '#FFFFFF',
            activationBg: '#0F172A', // Slate 900
            activationTitle: '#60A5FA', // Blue 400
            activationBorder: '#1E293B', // Slate 800
            activationText: '#94A3B8', // Slate 400
            finisherBg: '#271A1A', // Dark Red/Brown
            finisherTitle: '#F87171', // Red 400
            finisherBorder: '#7F1D1D', // Red 900
            finisherText: '#9CA3AF',
            exerciseNumber: '#3B82F6',
            progressionBorder: '#3B82F6',
            progressionBg: '#1E293B',
            progressionText: '#E2E8F0',
        }
    },
    white: {
        id: 'white',
        label: 'Minimalist White',
        colors: {
            bgPrimary: '#FFFFFF',
            textPrimary: '#000000',
            textSecondary: '#4B5563',
            accent: '#000000',
            accentLight: '#F3F4F6',
            border: '#E5E7EB',
            headerTagBg: '#000000',
            weekBannerBg: '#000000',
            weekBannerText: '#FFFFFF',
            dayHeaderBg: '#000000',
            dayHeaderText: '#FFFFFF',
            activationBg: '#FFFFFF',
            activationTitle: '#000000',
            activationBorder: '#D1D5DB', // Gray 300
            activationText: '#374151',
            finisherBg: '#FFFFFF',
            finisherTitle: '#000000',
            finisherBorder: '#000000',
            finisherText: '#374151',
            exerciseNumber: '#000000',
            progressionBorder: '#000000',
            progressionBg: '#F9FAFB', // Gray 50
            progressionText: '#000000',
        }
    },
    crazy: {
        id: 'crazy',
        label: 'Crazy (Cyberpunk)',
        colors: {
            bgPrimary: '#0F0524', // Deep Purple
            textPrimary: '#E0E0E0',
            textSecondary: '#A0A0C0',
            accent: '#39FF14', // Neon Green
            accentLight: '#2D1B4E',
            border: '#39FF14',
            headerTagBg: '#FF00FF', // Magenta
            weekBannerBg: '#00F3FF', // Cyan
            weekBannerText: '#000000',
            dayHeaderBg: '#FF00FF', // Magenta
            dayHeaderText: '#FFFFFF',
            activationBg: '#1A0B2E',
            activationTitle: '#00F3FF', // Cyan
            activationBorder: '#00F3FF',
            activationText: '#D1D1E9',
            finisherBg: '#2E0B1A',
            finisherTitle: '#FF00FF',
            finisherBorder: '#FF00FF',
            finisherText: '#E9D1D1',
            exerciseNumber: '#39FF14',
            progressionBorder: '#39FF14',
            progressionBg: 'rgba(57, 255, 20, 0.1)',
            progressionText: '#39FF14',
        }
    },
    hard: {
        id: 'hard',
        label: 'Hard (Old School)',
        colors: {
            bgPrimary: '#1C1917', // Stone 900
            textPrimary: '#E7E5E4', // Stone 200
            textSecondary: '#A8A29E', // Stone 400
            accent: '#DC2626', // Red 600
            accentLight: '#292524', // Stone 800
            border: '#44403C', // Stone 700
            headerTagBg: '#7F1D1D', // Red 900
            weekBannerBg: '#7F1D1D',
            weekBannerText: '#FECACA', // Red 200
            dayHeaderBg: '#DC2626',
            dayHeaderText: '#FFFFFF',
            activationBg: '#292524',
            activationTitle: '#A8A29E',
            activationBorder: '#57534E',
            activationText: '#D6D3D1',
            finisherBg: '#000000',
            finisherTitle: '#DC2626',
            finisherBorder: '#DC2626',
            finisherText: '#A8A29E',
            exerciseNumber: '#DC2626',
            progressionBorder: '#DC2626',
            progressionBg: '#292524',
            progressionText: '#E7E5E4',
        }
    }
};

const BLOCK_STYLE: Record<string, { emoji: string; label: string }> = {
    strength_linear: { emoji: '🔴', label: 'Fuerza' },
    metcon_structured: { emoji: '🔥', label: 'MetCon' },
    warmup: { emoji: '✨', label: 'Activación' },
    accessory: { emoji: '🔹', label: 'Accesorio' },
    skill: { emoji: '🔹', label: 'Skill' },
    finisher: { emoji: '🔥', label: 'Finisher' },
    free_text: { emoji: '📝', label: 'Notas' },
    mobility: { emoji: '🧘', label: 'Movilidad' },
};

function getBlockStyle(type: string) {
    return BLOCK_STYLE[type] || { emoji: '▪️', label: 'Bloque' };
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
    const [currentThemeId, setCurrentThemeId] = useState<string>('pinky');

    // Get current theme object, fallback to pinky safely
    const theme = THEMES[currentThemeId] || THEMES.pinky;

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
                        color: theme.colors.exerciseNumber,
                        marginRight: '8px',
                        width: '35px',
                        textAlign: 'right'
                    }}>
                        {numberDisplay}
                    </span>
                    <h4 style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: theme.colors.textPrimary,
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
                            color: theme.colors.textSecondary
                        }}>
                            <span style={{ marginRight: '6px', fontSize: '14px' }}>💡</span>
                            <span style={{ fontStyle: 'italic', fontSize: '14px', lineHeight: '1.4' }}>
                                {block.cue}
                            </span>
                        </div>
                    )}

                    <div style={{
                        borderLeft: `3px solid ${theme.colors.progressionBorder}`,
                        paddingLeft: '12px',
                        backgroundColor: theme.colors.progressionBg,
                        padding: '8px 12px',
                        borderRadius: '0 4px 4px 0',
                        marginTop: '4px'
                    }}>
                        {progression ? (
                            <div style={{ fontSize: '13px', lineHeight: '1.6', color: theme.colors.progressionText }}>
                                {progression.progression.map((val, idx) => {
                                    if (val === '-' || !val) return null;
                                    return (
                                        <span key={idx} style={{ display: 'inline-block', marginRight: '12px' }}>
                                            <span style={{ fontWeight: '700', color: theme.colors.progressionText }}>Sem {idx + 1}:</span> {val}
                                            {idx < progression.progression.length - 1 && (
                                                <span style={{ margin: '0 4px', opacity: 0.5 }}>→</span>
                                            )}
                                        </span>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ fontSize: '13px', lineHeight: '1.5', color: theme.colors.progressionText }}>
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
                            minHeight: '1123px',
                            backgroundColor: theme.colors.bgPrimary,
                            padding: '40px',
                            boxSizing: 'border-box',
                            fontFamily: 'Inter, system-ui, sans-serif',
                            color: theme.colors.textPrimary,
                            position: 'relative'
                        }}
                    >
                        {/* 1. Header Section */}
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                            {weekDateRanges && (
                                <div style={{
                                    display: 'inline-block',
                                    backgroundColor: theme.colors.weekBannerBg,
                                    color: theme.colors.weekBannerText,
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
                                <div key={dayIdx} style={{ marginBottom: '50px', breakInside: 'avoid' }}>
                                    {/* Link Day Header */}
                                    <div style={{
                                        backgroundColor: theme.colors.dayHeaderBg,
                                        color: theme.colors.dayHeaderText,
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        marginBottom: '24px',
                                        fontSize: '18px',
                                        fontWeight: '800',
                                        fontStyle: 'italic',
                                        boxShadow: `0 4px 6px -1px ${theme.colors.accent}40`
                                    }}>
                                        {day.name}: {day.blocks[0]?.name?.split('(')[0] || 'Entrenamiento'}
                                    </div>

                                    {/* Activation */}
                                    {activation.length > 0 && (
                                        <div style={{
                                            marginBottom: '24px',
                                            backgroundColor: theme.colors.activationBg,
                                            padding: '16px',
                                            borderRadius: '8px',
                                            border: `1px dashed ${theme.colors.activationBorder}`
                                        }}>
                                            <h4 style={{
                                                color: theme.colors.activationTitle,
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
                                                    <div key={i} style={{ display: 'flex', alignItems: 'baseline', fontSize: '14px', color: theme.colors.activationText }}>
                                                        <span style={{ color: theme.colors.activationTitle, marginRight: '8px', fontSize: '10px' }}>●</span>
                                                        <span style={{ fontWeight: '600', color: theme.colors.textPrimary, marginRight: '6px' }}>{block.name}</span>
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
