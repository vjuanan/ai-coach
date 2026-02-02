'use client';

import { useState } from 'react';
import { Loader2, Users, Building2, X, FileInput } from 'lucide-react';

interface Client {
    id: string;
    name: string;
    email?: string | null;
}

interface DuplicateTemplateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (assignedClientId?: string) => Promise<void>;
    templateName: string;
    athletes: Client[];
    gyms: Client[];
    isProcessing: boolean;
}

export function DuplicateTemplateDialog({
    isOpen,
    onClose,
    onConfirm,
    templateName,
    athletes,
    gyms,
    isProcessing
}: DuplicateTemplateDialogProps) {
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [assignType, setAssignType] = useState<'none' | 'athlete' | 'gym'>('none');

    if (!isOpen) return null;

    const handleAssignTypeChange = (type: 'none' | 'athlete' | 'gym') => {
        setAssignType(type);
        setSelectedClientId('');
    };

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
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <FileInput size={20} className="text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">Usar como Base</h3>
                    </div>
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

                    {/* Tipo de asignación */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-300">
                            ¿A quién deseas asignar este programa?
                        </label>

                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => handleAssignTypeChange('none')}
                                className={`px-3 py-3 rounded-xl border text-sm font-medium transition-all ${assignType === 'none'
                                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                        : 'bg-black/20 border-white/10 text-gray-400 hover:bg-black/30'
                                    }`}
                            >
                                Solo yo
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAssignTypeChange('athlete')}
                                className={`px-3 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${assignType === 'athlete'
                                        ? 'bg-green-600/20 border-green-500 text-green-400'
                                        : 'bg-black/20 border-white/10 text-gray-400 hover:bg-black/30'
                                    }`}
                            >
                                <Users size={16} />
                                Atleta
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAssignTypeChange('gym')}
                                className={`px-3 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${assignType === 'gym'
                                        ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                                        : 'bg-black/20 border-white/10 text-gray-400 hover:bg-black/30'
                                    }`}
                            >
                                <Building2 size={16} />
                                Gimnasio
                            </button>
                        </div>
                    </div>

                    {/* Selector de cliente */}
                    {assignType !== 'none' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                {assignType === 'athlete' ? <Users size={16} /> : <Building2 size={16} />}
                                Seleccionar {assignType === 'athlete' ? 'Atleta' : 'Gimnasio'}
                            </label>

                            <select
                                value={selectedClientId}
                                onChange={(e) => setSelectedClientId(e.target.value)}
                                disabled={isProcessing}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer hover:bg-black/30 transition-colors"
                            >
                                <option value="" className="bg-[#1a1b1e] text-gray-400">
                                    -- Seleccionar {assignType === 'athlete' ? 'atleta' : 'gimnasio'} --
                                </option>
                                {(assignType === 'athlete' ? athletes : gyms).map(client => (
                                    <option key={client.id} value={client.id} className="bg-[#1a1b1e]">
                                        {client.name} {client.email ? `(${client.email})` : ''}
                                    </option>
                                ))}
                            </select>

                            {(assignType === 'athlete' ? athletes : gyms).length === 0 && (
                                <p className="text-xs text-amber-400">
                                    No hay {assignType === 'athlete' ? 'atletas' : 'gimnasios'} disponibles.
                                </p>
                            )}
                        </div>
                    )}

                    <p className="text-xs text-cv-text-secondary">
                        {assignType === 'none'
                            ? 'El programa se creará como borrador para tu uso personal.'
                            : 'El programa se asignará automáticamente y estará listo para editar.'}
                    </p>
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
                        onClick={() => onConfirm(selectedClientId || undefined)}
                        disabled={isProcessing || (assignType !== 'none' && !selectedClientId)}
                        className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Creando...
                            </>
                        ) : (
                            'Confirmar'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
