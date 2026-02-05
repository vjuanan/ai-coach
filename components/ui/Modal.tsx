'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a utils file for merging classes, if not simple string concat is fine

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: React.ReactNode;
    children: React.ReactNode;
    description?: string;
    maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, description, maxWidth = 'max-w-md' }: ModalProps) {
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`relative w-full ${maxWidth} bg-gradient-to-br from-[#1a1b1e] to-[#141518] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]`}>

                {/* Decorative gradient */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />

                {/* Header */}
                <div className="relative flex items-center justify-between p-6 border-b border-white/5 shrink-0">
                    <div>
                        <h3 className="text-xl font-semibold text-white">{title}</h3>
                        {description && <p className="text-sm text-gray-400">{description}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="relative p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
