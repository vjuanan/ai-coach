'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Link2, Check, UserPlus, Sparkles } from 'lucide-react';

interface InviteDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InviteDialog({ isOpen, onClose }: InviteDialogProps) {
    const [copied, setCopied] = useState(false);
    const signupUrl = 'https://aicoach.epnstore.com.ar/auth/signup';

    // Reset copied state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setCopied(false);
        }
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(signupUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleSendEmail = () => {
        const subject = encodeURIComponent('¡Te invito a unirte a AI Coach!');
        const body = encodeURIComponent(
            `¡Hola!\n\nTe invito a unirte a AI Coach, la plataforma de entrenamiento inteligente.\n\nRegístrate aquí: ${signupUrl}\n\n¡Nos vemos pronto!`
        );
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-gradient-to-br from-[#1a1b1e] to-[#141518] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Decorative gradient */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />

                {/* Header */}
                <div className="relative flex items-center justify-between p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <UserPlus className="text-white" size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-white">Invitar Usuarios</h3>
                            <p className="text-sm text-gray-400">Comparte AI Coach con otros</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="relative p-6 space-y-4">
                    {/* Email Option */}
                    <button
                        onClick={handleSendEmail}
                        className="w-full group p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 transition-all duration-200 text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 group-hover:from-blue-500/30 group-hover:to-blue-600/30 rounded-xl flex items-center justify-center transition-colors">
                                <Mail className="text-blue-400" size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-medium group-hover:text-blue-300 transition-colors">
                                    Enviar por Email
                                </h4>
                                <p className="text-sm text-gray-400">
                                    Abre tu cliente de correo con el enlace
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Copy Link Option */}
                    <button
                        onClick={handleCopyLink}
                        className="w-full group p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 transition-all duration-200 text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${copied
                                    ? 'bg-green-500/20'
                                    : 'bg-gradient-to-br from-purple-500/20 to-purple-600/20 group-hover:from-purple-500/30 group-hover:to-purple-600/30'
                                }`}>
                                {copied ? (
                                    <Check className="text-green-400" size={24} />
                                ) : (
                                    <Link2 className="text-purple-400" size={24} />
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className={`font-medium transition-colors ${copied ? 'text-green-400' : 'text-white group-hover:text-purple-300'
                                    }`}>
                                    {copied ? '¡Link Copiado!' : 'Copiar Link'}
                                </h4>
                                <p className="text-sm text-gray-400">
                                    {copied ? 'Pegalo donde quieras compartirlo' : 'Copia el enlace de registro'}
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Invite Link Preview */}
                    <div className="mt-4 p-3 rounded-xl bg-black/30 border border-white/5">
                        <p className="text-xs text-gray-500 mb-1">Link de invitación</p>
                        <p className="text-sm text-gray-300 font-mono truncate">{signupUrl}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative flex items-center justify-center gap-2 p-4 bg-white/5 border-t border-white/5">
                    <Sparkles size={14} className="text-yellow-500" />
                    <p className="text-xs text-gray-400">
                        Los invitados podrán crear su cuenta gratis
                    </p>
                </div>
            </div>
        </div>
    );
}
