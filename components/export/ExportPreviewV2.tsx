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
        metrics?: Array<{ label: string; value: string }>;
    };
    section?: 'warmup' | 'main' | 'cooldown';
    cue?: string;
    format?: string;
    rest?: string | null;
    progression_id?: string | null;
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
    },
    anto: {
        id: 'anto',
        label: 'Antopanti Gold',
        c: {
            bg: '#E2E4E9', // Outer solid gray background
            bgAlt: '#FFFFFF', // Inner pure white card
            text: '#111827', // Main black/darkest gray text
            textMuted: '#6B7280', // Medium gray for cues/subtitles
            accent: '#F8719D', // Magenta/pink for numbers & titles
            accentSoft: '#FFF5F8', // Very light pink for backgrounds/pills/grids
            accentMuted: '#F472B6', // Standard deeper pink
            border: '#FBCFE8', // Soft pink edge for cards
            borderSoft: '#FFE4E6', // Very subtle pink border
            rowEven: '#FFFFFF',
            rowOdd: '#FFFFFF',
            headerBg: '#5B0F2A', // Deep burgundy DÍA headers
            dayBg: '#FFFFFF',
            badge: '#F59E0B', // Gold solid font (was text #F59E0B, back off slightly for label #EAB308)
            badgeText: '#FFFFFF',
            cueBg: '#FFFFFF',
            cueText: '#4B5563',
            warmupBg: '#FFF5F8',
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

const FORMAT_LABELS: Record<string, string> = {
    EMOM: 'EMOM',
    EMOM_ALT: 'EMOM Alternado',
    E2MOM: 'E2MOM',
    AMRAP: 'AMRAP',
    RFT: 'Rondas por Tiempo',
    FOR_TIME: 'Por Tiempo',
    CHIPPER: 'Chipper',
    DEATH_BY: 'Death By',
    TABATA: 'Tabata',
    LADDER: 'Escalera',
    INTERVALS: 'Intervalos',
    STANDARD: 'Series x Reps',
    CLUSTER: 'Cluster',
    DROP_SET: 'Drop Set',
    GIANT_SET: 'Giant Set',
    SUPER_SET: 'Super Set',
    NOT_FOR_TIME: 'Not For Time',
    TEMPO: 'Tempo',
    DROPSET_FINISHER: 'Dropset',
    REST_PAUSE: 'Rest-Pause',
    LADDER_FINISHER: 'Escalera',
    '21S': '21s',
    ISO_HOLD: 'Iso-Hold',
    '1_5_REPS': '1.5 Reps',
};

// -- EXERCISE ROW (Redesigned - Antopanti Card) --
const ExerciseRow = ({
    block, index, theme, monthlyStrategy
}: {
    block: WorkoutBlock; index: number; theme: ExportTheme;
    monthlyStrategy?: { progressions: MonthlyProgression[] };
}) => {
    const displayName = getBlockDisplayName(block);
    const struct = block.structure;
    const formatLabel = block.format ? (FORMAT_LABELS[String(block.format)] || String(block.format)) : null;
    const metrics = struct?.metrics || [];
    const movementLines = struct?.text
        ? struct.text.split('\n').map((line) => line.trim()).filter(Boolean)
        : (block.content || []).map((line) => line.trim()).filter(Boolean);

    if (metrics.length === 0 && movementLines.length === 0 && !struct) return null;

    const hasProgression = getProgressionForBlock(block.name || '', monthlyStrategy);
    const showInlineProgression = hasProgression && hasProgression.progression.some(p => p && p !== '-');
    const prescriptionText = metrics.map((metric) => `${metric.label}: ${metric.value}`).join(' · ');

    // Default to 4 weeks for the progression grid if available
    const progWeeks = hasProgression?.progression || [];
    const displayProg = progWeeks.length > 0 ? progWeeks : [];

    return (
        <div style={{
            marginBottom: '12px',
            backgroundColor: theme.c.bgAlt,
            border: 'none',
            borderRadius: '14px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'row',
            gap: '14px',
            boxShadow: '0 8px 16px rgba(248, 113, 157, 0.06)'
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'center',
                paddingTop: '2px'
            }}>
                <span style={{
                    fontSize: '36px',
                    fontWeight: '900',
                    background: `linear-gradient(135deg, ${theme.c.accent}, ${theme.c.accentMuted})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-1.5px',
                    lineHeight: '1',
                    textShadow: '0 2px 10px rgba(248, 113, 157, 0.15)'
                }}>
                    {index}
                </span>
            </div>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minWidth: 0
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '6px'
                }}>
                    <span style={{
                        fontSize: '16px',
                        fontWeight: '800',
                        color: theme.c.text,
                        letterSpacing: '-0.3px',
                        lineHeight: '1.2',
                    }}>
                        {displayName}
                    </span>
                    {formatLabel && (
                        <span style={{
                            fontSize: '10px',
                            fontWeight: '800',
                            color: theme.c.badge,
                            backgroundColor: theme.c.accentSoft,
                            border: `1px solid ${theme.c.borderSoft}`,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px'
                        }}>
                            {formatLabel}
                        </span>
                    )}
                </div>

                {prescriptionText && (
                    <div style={{
                        backgroundColor: theme.c.accentSoft,
                        borderRadius: '8px',
                        border: `1px solid ${theme.c.borderSoft}`,
                        padding: '8px 10px',
                        marginBottom: '8px',
                        fontSize: '12px',
                        color: theme.c.text,
                        fontWeight: '700',
                        lineHeight: '1.35',
                    }}>
                        {prescriptionText}
                    </div>
                )}

                {movementLines.length > 0 && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        marginBottom: showInlineProgression ? '10px' : '4px'
                    }}>
                        {movementLines.map((line, lineIdx) => (
                            <div key={`${index}-line-${lineIdx}`} style={{
                                fontSize: '12.5px',
                                color: theme.c.textMuted,
                                lineHeight: '1.4',
                                borderLeft: `2px solid ${theme.c.borderSoft}`,
                                paddingLeft: '8px',
                            }}>
                                {line}
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: '4px' }}>
                    {showInlineProgression && displayProg.length > 0 ? (
                        <div style={{
                            display: 'flex',
                            width: '100%',
                            backgroundColor: theme.c.accentSoft,
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: `1px solid ${theme.c.borderSoft}`
                        }}>
                            {displayProg.map((val, idx) => {
                                return (
                                    <div key={idx} style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '8px 2px',
                                        borderRight: idx < displayProg.length - 1 ? `1px solid ${theme.c.borderSoft}` : 'none'
                                    }}>
                                        <div style={{
                                            fontSize: '9.5px',
                                            fontWeight: '800',
                                            color: theme.c.badge,
                                            textTransform: 'uppercase',
                                            marginBottom: '2px',
                                            opacity: 0.9
                                        }}>
                                            SEM {idx + 1}
                                        </div>
                                        <div style={{
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            color: theme.c.text,
                                            textAlign: 'center',
                                            lineHeight: '1.1'
                                        }}>
                                            {val || '-'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        prescriptionText && (
                            <div style={{
                                backgroundColor: theme.c.accentSoft,
                                borderRadius: '6px',
                                padding: '6px 10px',
                                fontSize: '12px',
                                color: theme.c.text,
                                fontWeight: '700',
                                display: 'inline-block',
                                border: `1px solid ${theme.c.borderSoft}`
                            }}>
                                {prescriptionText}
                            </div>
                        )
                    )}
                </div>
            </div>
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
        <div style={{ paddingBottom: '32px', breakInside: 'avoid' }}>
            {/* ═══════════════════ DAY HEADER (Full Bleed) ═══════════════════ */}
            <div style={{
                marginBottom: '20px',
                background: `linear-gradient(135deg, ${theme.c.headerBg}, #3B0A1A)`, // Burgundy con sutil gradiente a más oscuro
                padding: '16px 24px', // Match global mobile padding
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                color: '#FFFFFF' // Force white text on burgundy background
            }}>
                <span style={{
                    fontSize: '24px',
                    fontWeight: '900', // Black
                    letterSpacing: '-0.5px',
                }}>
                    DÍA {dayIndex}
                </span>
                <span style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'right'
                }}>
                    {day.name}
                </span>
            </div>

            {/* Exercises Container (Inner padding) */}
            <div style={{ padding: '0 24px' }}>
                {/* ═══════════════════ WARMUP (Activación as List) ═══════════════════ */}
                {hasWarmup && (
                    <div style={{
                        marginBottom: '32px',
                        paddingBottom: '24px',
                        borderBottom: `1px solid ${theme.c.borderSoft}` // Subtle divider
                    }}>
                        {warmupBlocks.map((block, i) => {
                            const rounds = block.config?.rounds as string | number | undefined;
                            const blockName = getBlockDisplayName(block);
                            const isGenericActivacion = blockName.toLowerCase().includes('calentamiento') || blockName.toLowerCase().includes('activación');
                            const metrics = block.structure?.metrics || [];
                            const metricText = metrics.map((metric) => `${metric.label}: ${metric.value}`).join(' · ');
                            const movements = block.structure?.text
                                ? block.structure.text.split('\n').map((line) => line.trim()).filter(Boolean)
                                : block.content.filter(c => c.trim());
                            return (
                                <div key={i} style={{ marginBottom: i < warmupBlocks.length - 1 ? '20px' : '0' }}>
                                    <div style={{
                                        fontSize: '14px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        color: theme.c.badge, // Gold
                                        marginBottom: '12px',
                                        fontWeight: '900',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <span>⚡</span>
                                        <span>{isGenericActivacion ? 'ACTIVACIÓN' : blockName} {rounds ? `(${rounds} VUELTAS)` : ''}</span>
                                    </div>
                                    {metricText && (
                                        <div style={{
                                            backgroundColor: theme.c.accentSoft,
                                            border: `1px solid ${theme.c.borderSoft}`,
                                            borderRadius: '8px',
                                            padding: '6px 10px',
                                            marginBottom: '10px',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            color: theme.c.text
                                        }}>
                                            {metricText}
                                        </div>
                                    )}
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}>
                                        {movements.map((mov, mIdx) => (
                                            <div key={mIdx} style={{
                                                fontSize: '13.5px',
                                                color: theme.c.text,
                                                fontWeight: '500', // Better readability
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '8px',
                                                borderLeft: `3px solid ${theme.c.accentSoft}`,
                                                paddingLeft: '10px',
                                                lineHeight: '1.4'
                                            }}>
                                                <span>{mov}</span>
                                            </div>
                                        ))}
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

                {/* ═══════════════════ FINISHER (Redesigned) ═══════════════════ */}
                {hasCooldown && cooldownBlocks.map((block, i) => {
                    // Si el finisher no tiene estructura/contenido, no lo renderizamos con caja
                    if (!block.structure && (!block.content || block.content.length === 0)) return null;
                    const metrics = block.structure?.metrics || [];
                    const metricText = metrics.map((metric) => `${metric.label}: ${metric.value}`).join(' · ');
                    const detailLines = block.structure?.text
                        ? block.structure.text.split('\n').map((line) => line.trim()).filter(Boolean)
                        : (block.content || []).map((line) => line.trim()).filter(Boolean);

                    return (
                        <div key={`cd-${i}`} style={{
                            marginTop: '24px',
                            backgroundColor: '#7E1231', // Brighter burgundy according to reference
                            borderRadius: '12px',
                            padding: '24px',
                            color: '#FFFFFF',
                            boxShadow: '0 4px 12px rgba(91, 15, 42, 0.15)'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '16px'
                            }}>
                                <span style={{
                                    backgroundColor: theme.c.badge, // Gold badge
                                    color: '#000000', // Black text specifically for Gold Finisher pill
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '900',
                                    letterSpacing: '1px'
                                }}>
                                    FINISHER
                                </span>
                                <span style={{
                                    fontSize: '18px',
                                    fontWeight: '800',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    {getBlockDisplayName(block)}
                                </span>
                            </div>

                            {metricText && (
                                <div style={{
                                    fontSize: '12.5px',
                                    lineHeight: '1.45',
                                    opacity: 0.98,
                                    fontWeight: '700',
                                    marginBottom: '10px',
                                    backgroundColor: 'rgba(255,255,255,0.10)',
                                    border: '1px solid rgba(255,255,255,0.14)',
                                    borderRadius: '8px',
                                    padding: '8px 10px'
                                }}>
                                    {metricText}
                                </div>
                            )}

                            {detailLines.length > 0 && (
                                <div style={{
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    opacity: 0.95,
                                    fontWeight: '400',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px'
                                }}>
                                    {detailLines.map((line, lineIdx) => (
                                        <div key={`fin-line-${lineIdx}`}>{line}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
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
    // Extract unique exercises that have progressions enabled
    // We check the first instance of the exercise (usually Week 1) to determine its toggle state
    // This prevents glitches where an exercise might have a stale progression_id in later weeks
    const exerciseToggleState = new Map<string, boolean>();
    const sortedWeeks = [...weeks].sort((a, b) => a.weekNumber - b.weekNumber);

    sortedWeeks.forEach(w => w.days.forEach(d => d.blocks.forEach(b => {
        if (b.type === 'strength_linear' && b.name) {
            if (!exerciseToggleState.has(b.name)) {
                const isOn = !!b.progression_id && b.progression_id !== 'null' && b.progression_id !== 'false';
                exerciseToggleState.set(b.name, isOn);
            }
        }
    })));

    const exercises = new Set<string>();
    exerciseToggleState.forEach((isOn, name) => {
        if (isOn) exercises.add(name);
    });

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
    const [currentThemeId, setCurrentThemeId] = useState<string>('anto');

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
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Export Preview v2.6</h2> {/* Added version to verify reload */}
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
                ```
                <div className="flex-1 overflow-y-auto bg-gray-100/60 dark:bg-zinc-950/50 p-4">
                    <div
                        id="export-container"
                        ref={exportRef}
                        style={{
                            width: '430px', // Tamaño Mobile (iPhone Pro Max aprox)
                            margin: '0 auto',
                            backgroundColor: '#FCFAFB', // Off-white/very light gray to make the white cards pop
                            boxSizing: 'border-box',
                            color: theme.c.text,
                            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                            overflow: 'hidden',
                        }}
                    >
                        {/* ═══════════════════ HEADER (ANTOPANTI REDESIGN) ═══════════════════ */}
                        <div style={{ padding: '40px 24px 24px', backgroundColor: theme.c.bgAlt }}>
                            {/* Top row: Client Name & Badge */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px'
                            }}>
                                <span style={{
                                    fontSize: '18px',
                                    color: theme.c.accentMuted,
                                    fontStyle: 'italic',
                                    fontWeight: '500' // Semi-bold soft
                                }}>
                                    Para {clientInfo.name}
                                </span>
                                <span style={{
                                    border: `1.5px solid ${theme.c.badge}`,
                                    color: theme.c.badge,
                                    padding: '6px 16px',
                                    borderRadius: '24px',
                                    fontSize: '12px',
                                    fontWeight: '800',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    boxShadow: '0 0 15px rgba(245, 158, 11, 0.25)' // Glow sutil dorado
                                }}>
                                    GOLD EDITION
                                </span>
                            </div>

                            {/* Main Title */}
                            <h1 style={{
                                fontSize: '38px',
                                fontWeight: '900', // Black
                                margin: '0 0 12px 0',
                                color: theme.c.headerBg, // Burgundy
                                letterSpacing: '-1.5px',
                                lineHeight: '1.05',
                                textTransform: 'uppercase'
                            }}>
                                PLAN DE<br />ENTRENAMIENTO
                            </h1>

                            {/* Gold Divider Line */}
                            <div style={{
                                width: '64px',
                                height: '6px',
                                backgroundColor: theme.c.badge,
                                borderRadius: '3px',
                                marginBottom: '20px'
                            }} />

                            {/* Program Subtitle / Focus */}
                            <div style={{
                                fontSize: '14px',
                                color: theme.c.accent, // Magenta
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '28px'
                            }}>
                                <span>✨</span>
                                <span>FASE {weeks.length}: {programName}</span>
                            </div>

                            {/* ═══════════════════ WEEKS TABULAR LAYOUT (White background, above bleed) ═══════════════════ */}
                            {weeks.length > 0 && (
                                <div style={{
                                    display: 'flex',
                                    borderTop: `1px solid ${theme.c.borderSoft}`, // Borde sutil gris/rosa
                                    padding: '24px 0 0 0', // Sólo margin top ya que abajo limitará con el bleed
                                }}>
                                    {weeks.map((week, idx) => (
                                        <div key={idx} style={{
                                            flex: 1,
                                            textAlign: 'center',
                                            padding: '0 2px',
                                            borderRight: idx < weeks.length - 1 ? `1px solid ${theme.c.borderSoft}` : 'none'
                                        }}>
                                            <div style={{
                                                fontSize: '11px',
                                                fontWeight: '800',
                                                color: theme.c.badge, // Gold
                                                marginBottom: '4px',
                                                textTransform: 'uppercase'
                                            }}>
                                                SEM {week.weekNumber}
                                            </div>
                                            {getWeekDateRange(week.weekNumber, weekDateRanges) && (
                                                <div style={{
                                                    fontSize: '10px',
                                                    color: theme.c.textMuted,
                                                    fontWeight: '600',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {getWeekDateRange(week.weekNumber, weekDateRanges)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ═══════════════════ BLOQUE DE SANGRADO (Solo Misión) ═══════════════════ */}
                        {missionText && missionText.trim() !== '' && (
                            <div style={{
                                backgroundColor: theme.c.accentSoft, // Fondo rosado muy claro
                                padding: '24px 24px', // Sangrado Mobile
                            }}>
                                <div style={{
                                    backgroundColor: theme.c.bgAlt,
                                    borderLeft: `6px solid ${theme.c.badge}`, // Thick gold left border
                                    padding: '20px',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                                }}>
                                    <h3 style={{
                                        fontSize: '16px',
                                        fontWeight: '900',
                                        color: theme.c.accent, // Magenta
                                        margin: '0 0 10px 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        textTransform: 'uppercase'
                                    }}>
                                        <span>🏆</span> OBJETIVO DEL MESOCICLO
                                    </h3>
                                    <p style={{
                                        fontSize: '14px',
                                        lineHeight: '1.6',
                                        fontStyle: 'italic',
                                        color: theme.c.textMuted,
                                        margin: 0,
                                        fontWeight: '500' // slightly thicker than normal
                                    }}>
                                        {missionText}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ═══════════════════ PAUSE INFO / SUMMARY TABLE (Full Bleed White) ═══════════════════ */}
                        <div style={{
                            display: 'flex',
                        }}>
                            {/* Pausa Larga */}
                            <div style={{
                                flex: 1,
                                backgroundColor: theme.c.bgAlt, // White block 
                                padding: '24px 16px', // Scaled down padding for Mobile
                                textAlign: 'center',
                                borderRight: `1px solid ${theme.c.borderSoft}`, // Separator
                                borderBottom: `1px solid ${theme.c.borderSoft}`
                            }}>
                                <div style={{
                                    fontSize: '22px',
                                    fontWeight: '900',
                                    color: theme.c.headerBg, // Burgundy text
                                    marginBottom: '4px',
                                    letterSpacing: '-1px'
                                }}>
                                    2&apos; a 3&apos;
                                </div>
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: '800',
                                    color: theme.c.accentMuted, // Pink
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    PAUSA LARGA (FUERZA)
                                </div>
                            </div>
                            {/* Pausa Corta */}
                            <div style={{
                                flex: 1,
                                backgroundColor: theme.c.bgAlt, // White
                                padding: '24px 16px',
                                textAlign: 'center',
                                borderBottom: `1px solid ${theme.c.borderSoft}`
                            }}>
                                <div style={{
                                    fontSize: '22px',
                                    fontWeight: '900',
                                    color: theme.c.headerBg,
                                    marginBottom: '4px',
                                    letterSpacing: '-1px'
                                }}>
                                    60&quot; a 90&quot;
                                </div>
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: '800',
                                    color: theme.c.accentMuted,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    PAUSA CORTA (ACCESORIOS)
                                </div>
                            </div>
                        </div>

                        {/* Summary table logic continues below */}
                        {theme.id !== 'anto' && (
                            <MinimalistProgression weeks={weeks} monthlyStrategy={monthlyStrategy} theme={theme} />
                        )}

                        {/* ═══════════════════ DAYS ITERATION (Antopanti Integrated Layout) ═══════════════════ */}
                        {/* 
                          En el diseño Antopanti, solo renderizamos la estructura base (típicamente de la Semana 1).
                          La progresión en el tiempo (Semana 1, 2, 3, 4) se muestra ahora dentro de cada ExerciseRow.
                        */}
                        {weeks.length > 0 && (
                            <div style={{ marginBottom: '32px', breakInside: 'avoid' }}>
                                {weeks[0].days.map((day, dIndex) => (
                                    <DaySection
                                        key={dIndex}
                                        day={day}
                                        dayIndex={dIndex + 1}
                                        theme={theme}
                                        monthlyStrategy={monthlyStrategy}
                                    />
                                ))}
                            </div>
                        )}

                        {/* ═══════════════════ FOOTER WATERMARK ═══════════════════ */}
                        <div style={{
                            padding: '32px 24px',
                            textAlign: 'center',
                            backgroundColor: theme.c.bgAlt,
                            borderTop: `1px solid ${theme.c.borderSoft}`
                        }}>
                            <div style={{
                                fontSize: '11px',
                                fontWeight: '900',
                                color: theme.c.badge,
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                marginBottom: '6px'
                            }}>
                                POWERED BY AI COACH
                            </div>
                            <div style={{
                                fontSize: '13px',
                                color: theme.c.textMuted,
                                fontWeight: '600',
                                fontStyle: 'italic'
                            }}>
                                Para {clientInfo.name}
                            </div>
                        </div>
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
