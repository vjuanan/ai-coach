'use client';

import { useState, useRef, useEffect } from 'react';
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

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-cv-border rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    {suggestions.map((suggestion) => {
                        const isSelected = value === suggestion;
                        // Determine if we should show this suggestion logic:
                        // 1. If user typed something that is NOT in the suggestions, maybe filter?
                        // BUT requirement is: "not show selected only" -> basic datalist problem.
                        // Here we just show ALL suggestions always when open, ensuring easy switching.
                        // We can filter if the user explicitly types a partial match, 
                        // but if the value is an EXACT match to a suggestion (e.g. "Acumulación"), 
                        // we still want to show ALL options so they can switch to "Descarga".

                        // Simple logic: If value matches exactly one of the suggestions, SHOW ALL.
                        // If value is partial/different, filter? 
                        // The user said "should deploy all options.. not show the ones that coincide".
                        // Meaning: Always show all options.

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
                </div>
            )}
        </div>
    );
}
