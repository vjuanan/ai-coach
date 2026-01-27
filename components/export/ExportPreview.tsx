'use client';

import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { X, Download, Image, FileText, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExportPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    workoutContent: {
        dayName: string;
        date?: string;
        blocks: Array<{
            type: string;
            name: string;
            content: string[];
        }>;
    };
    clientInfo: {
        name: string;
        logo?: string;
    };
    coachName: string;
}

export function ExportPreview({
    isOpen,
    onClose,
    workoutContent,
    clientInfo,
    coachName,
}: ExportPreviewProps) {
    const exportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<'png' | 'pdf'>('png');

    const handleExport = async () => {
        if (!exportRef.current) return;

        setIsExporting(true);

        try {
            const canvas = await html2canvas(exportRef.current, {
                backgroundColor: '#0A0A0B',
                scale: 2,
                useCORS: true,
            });

            if (exportFormat === 'png') {
                const link = document.createElement('a');
                link.download = `${clientInfo.name}-${workoutContent.dayName}.png`;
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
                pdf.save(`${clientInfo.name}-${workoutContent.dayName}.pdf`);
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
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-auto bg-cv-bg-secondary border border-cv-border rounded-xl shadow-cv-lg z-50"
                    >
                        {/* Header */}
                        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-cv-border bg-cv-bg-secondary">
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

                        {/* Preview */}
                        <div className="p-6">
                            <div
                                ref={exportRef}
                                className="bg-[#0A0A0B] rounded-xl overflow-hidden"
                                style={{ minWidth: '400px' }}
                            >
                                {/* Export Header - Client Branding */}
                                <div className="p-6 border-b border-gray-800">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {clientInfo.logo ? (
                                                <img
                                                    src={clientInfo.logo}
                                                    alt={clientInfo.name}
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cv-accent to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                                                    {clientInfo.name.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <h1 className="text-xl font-bold text-white">{clientInfo.name}</h1>
                                                <p className="text-gray-400 text-sm">{workoutContent.date || workoutContent.dayName}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Workout Content */}
                                <div className="p-6 space-y-6">
                                    {workoutContent.blocks.map((block, index) => (
                                        <div key={index} className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1 h-6 rounded-full ${block.type === 'strength_linear' ? 'bg-red-500' :
                                                    block.type === 'metcon_structured' ? 'bg-orange-500' :
                                                        block.type === 'warmup' ? 'bg-green-500' :
                                                            block.type === 'skill' ? 'bg-blue-500' :
                                                                'bg-gray-500'
                                                    }`} />
                                                <h3 className="text-lg font-semibold text-white uppercase tracking-wide">
                                                    {block.name}
                                                </h3>
                                            </div>
                                            <div className="pl-3 space-y-1">
                                                {block.content.map((line, lineIndex) => (
                                                    <p key={lineIndex} className="text-gray-300 font-mono text-sm">
                                                        {line}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer - Coach Signature */}
                                <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
                                    <p className="text-gray-500 text-xs uppercase tracking-wider">
                                        Programado por {coachName}
                                    </p>
                                    <p className="text-gray-600 text-xs font-mono">
                                        CV-OS
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

// Demo component showing how to use ExportPreview
export function ExportDemo() {
    const [isOpen, setIsOpen] = useState(false);

    const mockWorkout = {
        dayName: 'Monday',
        date: 'January 27, 2026',
        blocks: [
            {
                type: 'warmup',
                name: 'Warm-up',
                content: [
                    '500m Row',
                    '3 Rounds:',
                    '  10 Air Squats',
                    '  10 Push-ups',
                    '  10 Ring Rows',
                ],
            },
            {
                type: 'strength_linear',
                name: 'Back Squat',
                content: [
                    '5 x 5 @ 75%',
                    'Rest 2:00 between sets',
                    'Focus on depth and speed out of hole',
                ],
            },
            {
                type: 'metcon_structured',
                name: 'AMRAP 12',
                content: [
                    '15 Wall Balls (20/14)',
                    '10 Burpees',
                    '5 Pull-ups',
                ],
            },
        ],
    };

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="cv-btn-primary">
                Export Preview Demo
            </button>
            <ExportPreview
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                workoutContent={mockWorkout}
                clientInfo={{ name: 'John Doe' }}
                coachName="Coach Mike"
            />
        </>
    );
}
