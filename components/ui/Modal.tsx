'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`relative w-full h-full sm:h-auto ${maxWidth} max-h-[85vh] bg-white sm:rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col`}>

                {/* Header */}
                <div className="relative flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 shrink-0">
                    <div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h3>
                        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="relative p-4 sm:p-6 overflow-y-auto flex-1 h-full sm:h-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
