'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

interface StrategyInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    suggestions: string[];
}

export function StrategyInput({
    value,
    onChange,
    placeholder,
    className,
    suggestions
}: StrategyInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    // Calculate position
    const updatePosition = () => {
        if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    // Update position when opening
    useEffect(() => {
        if (isOpen) {
            updatePosition();
            // Optional: Update on scroll/resize
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);
        }
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen]);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            const clickedInsideInput = wrapperRef.current?.contains(target);
            const clickedInsideDropdown = dropdownRef.current?.contains(target);

            if (!clickedInsideInput && !clickedInsideDropdown) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleSelect = (suggestion: string) => {
        onChange(suggestion);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className={`${className} pr-8`}
                />
                <button
                    type="button"
                    onClick={() => {
                        if (isOpen) {
                            setIsOpen(false);
                        } else {
                            setIsOpen(true);
                            inputRef.current?.focus();
                        }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-cv-text-tertiary hover:text-cv-text-primary transition-colors p-1"
                >
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    style={{
                        position: 'absolute',
                        top: coords.top + 4, // 4px gap
                        left: coords.left,
                        width: coords.width,
                        zIndex: 9999
                    }}
                    className="bg-white dark:bg-slate-800 border border-cv-border rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
                >
                    {suggestions.map((suggestion) => {
                        const isSelected = value === suggestion;
                        return (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => handleSelect(suggestion)}
                                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors
                                    ${isSelected ? 'text-cv-accent font-medium bg-slate-50/50 dark:bg-slate-700/30' : 'text-cv-text-secondary'}
                                `}
                            >
                                <span>{suggestion}</span>
                                {isSelected && <Check size={14} />}
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}
        </div>
    );
}
