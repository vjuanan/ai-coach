'use client';

import { useState } from 'react';
import { Loader2, Users, X } from 'lucide-react';

interface Athlete {
    id: string;
    name: string;
    email?: string | null;
}

interface DuplicateTemplateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (assignedClientId?: string) => Promise<void>;
    templateName: string;
    athletes: Athlete[];
    isProcessing: boolean;
}

export function DuplicateTemplateDialog({
    isOpen,
    onClose,
    onConfirm,
    templateName,
    athletes,
    isProcessing
}: DuplicateTemplateDialogProps) {
    const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={!isProcessing ? onClose : undefined}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-[#1a1b1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h3 className="text-xl font-semibold text-white">Duplicar Plantilla</h3>
                    {!isProcessing && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div>
                        <p className="text-sm text-gray-400 mb-1">Plantilla seleccionada</p>
                        <p className="text-white font-medium text-lg">{templateName}</p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Users size={16} />
                            Asignar a Atleta (Opcional)
                        </label>

                        <select
                            value={selectedAthleteId}
                            onChange={(e) => setSelectedAthleteId(e.target.value)}
                            disabled={isProcessing}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer hover:bg-black/30 transition-colors"
                        >
                            <option value="" className="bg-[#1a1b1e] text-gray-400">-- No asignar (Solo borrador) --</option>
                            {athletes.map(athlete => (
                                <option key={athlete.id} value={athlete.id} className="bg-[#1a1b1e]">
                                    {athlete.name} {athlete.email ? `(${athlete.email})` : ''}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-cv-text-secondary">
                            Si seleccionas un atleta, el programa se asignará automáticamente a su perfil.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 bg-white/5 border-t border-white/5">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm(selectedAthleteId || undefined)}
                        disabled={isProcessing}
                        className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Duplicando...
                            </>
                        ) : (
                            'Confirmar Copia'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
