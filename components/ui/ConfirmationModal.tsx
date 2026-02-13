'use client';

import { useEffect } from 'react';
import { X, AlertTriangle, Info } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
    isLoading = false
}: ConfirmationModalProps) {
    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isLoading) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose, isLoading]);

    if (!isOpen) return null;

    // Resolve colors based on variant
    const getVariantStyles = () => {
        switch (variant) {
            case 'danger':
                return {
                    icon: <AlertTriangle className="text-red-500" size={24} />,
                    iconBg: 'bg-red-500/10',
                    confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
                    title: 'text-gray-900 dark:text-gray-100'
                };
            case 'warning':
                return {
                    icon: <AlertTriangle className="text-amber-500" size={24} />,
                    iconBg: 'bg-amber-500/10',
                    confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
                    title: 'text-gray-900 dark:text-gray-100'
                };
            case 'info':
            default:
                return {
                    icon: <Info className="text-blue-500" size={24} />,
                    iconBg: 'bg-blue-500/10',
                    confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
                    title: 'text-gray-900 dark:text-gray-100'
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={!isLoading ? onClose : undefined}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header & Body */}
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full shrink-0 ${styles.iconBg}`}>
                            {styles.icon}
                        </div>
                        <div className="flex-1">
                            <h3 className={`text-lg font-semibold ${styles.title} mb-2`}>
                                {title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                {description}
                            </p>
                        </div>
                        {!isLoading && (
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors -mt-1 -mr-2 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer - Actions */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${styles.confirmBtn}`}
                    >
                        {isLoading && (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
