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
    progression: string[]; // e.g., ["70%", "75%", "80%", "85%"] for each week
    notes?: string;
}

interface ExportPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    // Monthly view data
    programName: string;
    clientInfo: {
        name: string;
        logo?: string;
    };
    coachName: string;
    monthlyStrategy?: {
        focus: string;
        duration: string; // e.g., "4 semanas"
        objectives: string[];
        progressions: MonthlyProgression[];
    };
    // Weekly breakdown
    weeks: WeekData[];
    // Current week strategy (for backwards compatibility)
    strategy?: MesocycleStrategy;
}

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
                backgroundColor: '#111827', // Softer black (gray-900)
                scale: 2,
                useCORS: true,
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
                            <div
                                ref={exportRef}
                                className="bg-[#111827] rounded-xl overflow-hidden max-w-3xl mx-auto shadow-2xl"
                                style={{ minWidth: '500px' }}
                            >
                                {/* ============================================ */}
                                {/* HEADER - Client & Program Info */}
                                {/* ============================================ */}
                                <div className="p-6 border-b border-gray-800">
                                    <div className="flex items-center gap-4">
                                        {clientInfo.logo ? (
                                            <img
                                                src={clientInfo.logo}
                                                alt={clientInfo.name}
                                                className="w-14 h-14 rounded-xl object-cover"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cv-accent to-orange-600 flex items-center justify-center text-white font-bold text-xl">
                                                {clientInfo.name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h1 className="text-2xl font-bold text-white">{clientInfo.name}</h1>
                                            <p className="text-gray-400">{programName}</p>
                                        </div>
                                        {monthlyStrategy?.duration && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700/50">
                                                <Calendar size={16} className="text-cv-accent" />
                                                <span className="text-sm text-gray-300">{monthlyStrategy.duration}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ============================================ */}
                                {/* MONTHLY OVERVIEW - Progressions as Main Focus */}
                                {/* ============================================ */}
                                {monthlyStrategy && (
                                    <div className="p-6 border-b border-gray-800 bg-gradient-to-b from-gray-900/50 to-transparent">
                                        {/* Main Focus */}
                                        {monthlyStrategy.focus && (
                                            <div className="mb-6">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Target size={18} className="text-cv-accent" />
                                                    <h2 className="text-lg font-semibold text-cv-accent uppercase tracking-wide">
                                                        Foco del Mesociclo
                                                    </h2>
                                                </div>
                                                <p className="text-gray-200 text-lg">{monthlyStrategy.focus}</p>
                                            </div>
                                        )}

                                        {/* Progressions - THE MAIN FOCUS */}
                                        {monthlyStrategy.progressions && monthlyStrategy.progressions.length > 0 && (
                                            <div className="mb-6">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <TrendingUp size={18} className="text-green-500" />
                                                    <h2 className="text-lg font-semibold text-green-500 uppercase tracking-wide">
                                                        Progresiones
                                                    </h2>
                                                </div>
                                                <div className="bg-gray-800/40 rounded-xl p-4 space-y-4 border border-gray-800">
                                                    {/* Header Row */}
                                                    <div className="grid grid-cols-5 gap-2 text-center">
                                                        <div className="text-left text-gray-500 text-xs uppercase tracking-wide">Ejercicio</div>
                                                        <div className="text-gray-500 text-xs uppercase tracking-wide">Sem 1</div>
                                                        <div className="text-gray-500 text-xs uppercase tracking-wide">Sem 2</div>
                                                        <div className="text-gray-500 text-xs uppercase tracking-wide">Sem 3</div>
                                                        <div className="text-gray-500 text-xs uppercase tracking-wide">Sem 4</div>
                                                    </div>
                                                    {/* Progression Rows */}
                                                    {monthlyStrategy.progressions.map((prog, idx) => (
                                                        <div key={idx} className="grid grid-cols-5 gap-2 items-center py-2 border-t border-gray-800/50">
                                                            <div className="text-left">
                                                                <span className="text-white font-medium">{prog.name}</span>
                                                                {prog.notes && (
                                                                    <p className="text-gray-500 text-xs mt-0.5">{prog.notes}</p>
                                                                )}
                                                            </div>
                                                            {prog.progression.map((value, weekIdx) => (
                                                                <div key={weekIdx} className="text-center">
                                                                    <span className={`font-mono text-sm ${weekIdx === prog.progression.length - 1 ? 'text-green-400 font-bold' : 'text-gray-300'
                                                                        }`}>
                                                                        {value}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                            {/* Fill empty cells if less than 4 weeks */}
                                                            {Array.from({ length: 4 - prog.progression.length }).map((_, i) => (
                                                                <div key={`empty-${i}`} className="text-center text-gray-600">-</div>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Objectives */}
                                        {monthlyStrategy.objectives && monthlyStrategy.objectives.length > 0 && (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Objetivos del Ciclo</p>
                                                <ul className="space-y-1">
                                                    {monthlyStrategy.objectives.map((obj, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                                                            <span className="text-cv-accent mt-1">•</span>
                                                            {obj}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Strategy section from current week (backwards compatibility) */}
                                {!monthlyStrategy && strategy && (strategy.focus || strategy.considerations) && (
                                    <div className="p-6 border-b border-gray-800">
                                        {strategy.focus && (
                                            <>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-1 h-4 rounded-full bg-cv-accent" />
                                                    <span className="text-sm font-semibold text-cv-accent uppercase tracking-wide">
                                                        Enfoque
                                                    </span>
                                                </div>
                                                <p className="text-gray-300 text-sm mb-3">{strategy.focus}</p>
                                            </>
                                        )}
                                        {strategy.considerations && (
                                            <div className="bg-gray-800/50 rounded-lg p-3 mt-2">
                                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Consideraciones del Coach</p>
                                                <p className="text-gray-300 text-sm whitespace-pre-line">{strategy.considerations}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Technical Clarifications & Scaling (backwards compatibility) */}
                                {!monthlyStrategy && strategy && (strategy.technicalClarifications || strategy.scalingAlternatives) && (
                                    <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/30">
                                        <div className="grid grid-cols-2 gap-4">
                                            {strategy.technicalClarifications && (
                                                <div>
                                                    <p className="text-xs text-blue-400 uppercase tracking-wide mb-1">🔧 Aclaraciones Técnicas</p>
                                                    <p className="text-gray-400 text-xs whitespace-pre-line">{strategy.technicalClarifications}</p>
                                                </div>
                                            )}
                                            {strategy.scalingAlternatives && (
                                                <div>
                                                    <p className="text-xs text-orange-400 uppercase tracking-wide mb-1">⚠️ Escalado & Alternativas</p>
                                                    <p className="text-gray-400 text-xs whitespace-pre-line">{strategy.scalingAlternatives}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ============================================ */}
                                {/* WEEKLY BREAKDOWN */}
                                {/* ============================================ */}
                                {weeks && weeks.length > 0 && (
                                    <div className="p-6 space-y-8">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Dumbbell size={18} className="text-orange-500" />
                                            <h2 className="text-lg font-semibold text-orange-500 uppercase tracking-wide">
                                                Detalle Semanal
                                            </h2>
                                        </div>

                                        {weeks.map((week, weekIdx) => (
                                            <div key={weekIdx} className="space-y-4">
                                                {/* Week Header */}
                                                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                                                    <h3 className="text-white text-lg font-bold">
                                                        Semana {week.weekNumber}
                                                    </h3>
                                                    {week.focus && (
                                                        <span className="text-xs text-gray-400 bg-gray-800/80 px-2 py-1 rounded border border-gray-700/50">
                                                            {week.focus}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Days Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {week.days && week.days.map((day, dayIdx) => (
                                                        <div key={dayIdx} className="bg-gray-800/30 rounded-xl border border-gray-800/50 overflow-hidden flex flex-col h-full">

                                                            {/* Day Header - Clearly distinct */}
                                                            <div className="px-4 py-2 bg-gray-800/60 border-b border-gray-800/50 flex items-center justify-between">
                                                                <h4 className="text-gray-200 font-semibold text-sm uppercase tracking-wide">
                                                                    {day.name}
                                                                </h4>
                                                                <div className="h-1.5 w-1.5 rounded-full bg-gray-600"></div>
                                                            </div>

                                                            <div className="p-4 space-y-4 flex-1">
                                                                {day.blocks.length > 0 ? (
                                                                    day.blocks.map((block, blockIdx) => (
                                                                        <div key={blockIdx} className="relative pl-3">
                                                                            {/* Vertical line connector */}
                                                                            <div className={`absolute left-0 top-1 bottom-1 w-0.5 rounded-full ${block.type === 'strength_linear' ? 'bg-red-500/80' :
                                                                                block.type === 'metcon_structured' ? 'bg-orange-500/80' :
                                                                                    block.type === 'warmup' ? 'bg-green-500/80' :
                                                                                        block.type === 'skill' ? 'bg-blue-500/80' :
                                                                                            'bg-gray-500/80'
                                                                                }`} />

                                                                            <div className="mb-1">
                                                                                <span className="text-sm font-medium text-gray-100 block">
                                                                                    {block.name}
                                                                                </span>
                                                                            </div>

                                                                            <div className="space-y-0.5">
                                                                                {block.content.map((line, lineIdx) => (
                                                                                    <p key={lineIdx} className={`font-mono text-xs leading-relaxed ${lineIdx === 0
                                                                                            ? 'text-gray-200 font-semibold'
                                                                                            : 'text-gray-500'
                                                                                        }`}>
                                                                                        {line}
                                                                                    </p>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <p className="text-gray-600 text-xs italic py-2 text-center">Descanso</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* ============================================ */}
                                {/* FOOTER - Coach Signature */}
                                {/* ============================================ */}
                                <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between bg-gray-900/50">
                                    <p className="text-gray-500 text-xs uppercase tracking-wider">
                                        Programado por {coachName}
                                    </p>
                                    <p className="text-gray-600 text-xs font-mono flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-cv-accent rounded-full mb-px"></span>
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
