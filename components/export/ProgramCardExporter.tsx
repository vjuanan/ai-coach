'use client';

import { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { X, Download, Image as ImageIcon, FileText, Loader2, Calendar, Dumbbell, Flame, Target, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgramType {
    id: string;
    name: string;
    status: string;
    created_at: string;
    updated_at: string;
}

interface ProgramCardExporterProps {
    isOpen: boolean;
    onClose: () => void;
    programs: ProgramType[];
}

// Hardcoded colors for html2canvas compatibility
const EXPORT_COLORS = {
    bgPrimary: '#1f2937',
    bgSecondary: '#111827',
    textPrimary: '#ffffff',
    textSecondary: '#d1d5db',
    textMuted: '#9ca3af',
    accent: '#f97316',
    border: '#374151',
};

// Gradient colors (hardcoded for export)
const CARD_GRADIENTS = [
    { from: '#667eea', to: '#764ba2' },
    { from: '#f093fb', to: '#f5576c' },
    { from: '#4facfe', to: '#00f2fe' },
    { from: '#43e97b', to: '#38f9d7' },
    { from: '#fa709a', to: '#fee140' },
    { from: '#a8edea', to: '#fed6e3' },
    { from: '#ff9a9e', to: '#fecfef' },
    { from: '#ffecd2', to: '#fcb69f' },
    { from: '#667eea', to: '#f093fb' },
    { from: '#5ee7df', to: '#b490ca' },
];

const ICONS = [Dumbbell, Flame, Target, Zap];

export function ProgramCardExporter({ isOpen, onClose, programs }: ProgramCardExporterProps) {
    const exportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<'png' | 'pdf'>('png');

    // Handle ESC key to close modal
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleExport = async () => {
        if (!exportRef.current) return;

        setIsExporting(true);

        try {
            const canvas = await html2canvas(exportRef.current, {
                backgroundColor: EXPORT_COLORS.bgPrimary,
                scale: 2,
                useCORS: true,
                logging: false,
            });

            const filename = programs.length === 1
                ? `programa-${programs[0].name.slice(0, 20)}`
                : `programas-exportados-${programs.length}`;

            if (exportFormat === 'png') {
                const link = document.createElement('a');
                link.download = `${filename}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } else {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                    unit: 'px',
                    format: [canvas.width / 2, canvas.height / 2],
                });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
                pdf.save(`${filename}.pdf`);
            }
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const getGradient = (index: number) => CARD_GRADIENTS[index % CARD_GRADIENTS.length];
    const getIcon = (index: number) => ICONS[index % ICONS.length];

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
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-cv-border bg-cv-bg-secondary shrink-0">
                            <h2 className="font-semibold text-cv-text-primary">
                                Exportar {programs.length === 1 ? 'Programa' : `${programs.length} Programas`}
                            </h2>
                            <div className="flex items-center gap-3">
                                {/* Format Toggle */}
                                <div className="flex bg-cv-bg-tertiary rounded-lg p-1">
                                    <button
                                        onClick={() => setExportFormat('png')}
                                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-1.5
                                            ${exportFormat === 'png' ? 'bg-cv-accent text-white' : 'text-cv-text-secondary hover:text-cv-text-primary'}`}
                                    >
                                        <ImageIcon size={14} />
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

                        {/* Preview Area */}
                        <div className="flex-1 overflow-auto p-4 md:p-6">
                            <div
                                ref={exportRef}
                                style={{
                                    backgroundColor: EXPORT_COLORS.bgPrimary,
                                    borderRadius: '16px',
                                    padding: '24px',
                                    maxWidth: '800px',
                                    margin: '0 auto',
                                    fontFamily: 'system-ui, -apple-system, sans-serif',
                                }}
                            >
                                {/* Header */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: '24px',
                                    paddingBottom: '16px',
                                    borderBottom: `1px solid ${EXPORT_COLORS.border}`,
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: `linear-gradient(135deg, ${EXPORT_COLORS.accent}, #ea580c)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Dumbbell size={20} color="white" />
                                    </div>
                                    <div>
                                        <h1 style={{
                                            fontSize: '20px',
                                            fontWeight: 'bold',
                                            color: EXPORT_COLORS.textPrimary,
                                            margin: 0,
                                        }}>
                                            {programs.length === 1 ? programs[0].name : `${programs.length} Programas`}
                                        </h1>
                                        <p style={{
                                            fontSize: '12px',
                                            color: EXPORT_COLORS.textMuted,
                                            margin: 0,
                                        }}>
                                            AI Coach
                                        </p>
                                    </div>
                                </div>

                                {/* Cards Grid */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: programs.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                                    gap: '16px',
                                }}>
                                    {programs.map((program, index) => {
                                        const gradient = getGradient(index);
                                        const Icon = getIcon(index);

                                        return (
                                            <div
                                                key={program.id}
                                                style={{
                                                    background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                                                    borderRadius: '16px',
                                                    padding: '20px',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {/* Decorative circle */}
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '-20px',
                                                    right: '-20px',
                                                    width: '80px',
                                                    height: '80px',
                                                    borderRadius: '50%',
                                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                                }} />

                                                {/* Icon */}
                                                <div style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '12px',
                                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginBottom: '16px',
                                                }}>
                                                    <Icon size={24} color="white" />
                                                </div>

                                                {/* Title */}
                                                <h3 style={{
                                                    fontSize: '18px',
                                                    fontWeight: 'bold',
                                                    color: 'white',
                                                    margin: '0 0 8px 0',
                                                    lineHeight: 1.3,
                                                }}>
                                                    {program.name}
                                                </h3>

                                                {/* Created date */}
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    marginBottom: '16px',
                                                }}>
                                                    <Calendar size={14} color="rgba(255,255,255,0.8)" />
                                                    <span style={{
                                                        fontSize: '14px',
                                                        color: 'rgba(255,255,255,0.8)',
                                                    }}>
                                                        Creado {formatDate(program.created_at)}
                                                    </span>
                                                </div>

                                                {/* Footer */}
                                                <div style={{
                                                    paddingTop: '12px',
                                                    borderTop: '1px solid rgba(255,255,255,0.2)',
                                                }}>
                                                    <span style={{
                                                        fontSize: '12px',
                                                        color: 'rgba(255,255,255,0.7)',
                                                    }}>
                                                        Actualizado {formatDate(program.updated_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Footer */}
                                <div style={{
                                    marginTop: '24px',
                                    paddingTop: '16px',
                                    borderTop: `1px solid ${EXPORT_COLORS.border}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                    <p style={{
                                        fontSize: '11px',
                                        color: EXPORT_COLORS.textMuted,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        margin: 0,
                                    }}>
                                        Exportado desde AI Coach
                                    </p>
                                    <p style={{
                                        fontSize: '11px',
                                        color: EXPORT_COLORS.textMuted,
                                        fontFamily: 'monospace',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        margin: 0,
                                    }}>
                                        <span style={{
                                            width: '6px',
                                            height: '6px',
                                            backgroundColor: EXPORT_COLORS.accent,
                                            borderRadius: '50%',
                                        }} />
                                        {new Date().toLocaleDateString('es-ES')}
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
