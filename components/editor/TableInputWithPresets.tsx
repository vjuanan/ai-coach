import { useState, useRef, useEffect } from 'react';

interface TableInputWithPresetsProps {
    value: string | number;
    onChange: (value: string) => void;
    presets: (string | number)[];
    type?: string;
    placeholder?: string;
    width?: string;
    min?: number;
    step?: number;
    suffix?: React.ReactNode;
}

export function TableInputWithPresets({
    value,
    onChange,
    presets,
    type = "number",
    placeholder,
    width = "w-full",
    min = 0,
    step = 1,
    suffix
}: TableInputWithPresetsProps) {
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative flex justify-center ${width}`} ref={containerRef}>
            <div className="relative w-full">
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    className="w-full bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-cv-accent p-1 text-center font-semibold text-cv-text-primary text-sm focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder={placeholder}
                    min={min}
                    step={step}
                />
                {suffix && (
                    <div className="absolute right-0 top-1 pointer-events-none">
                        {suffix}
                    </div>
                )}
            </div>

            {isFocused && presets.length > 0 && (
                <div className="absolute z-50 top-full mt-1 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg p-1.5 flex gap-1 min-w-max animate-in fade-in zoom-in-95 duration-100">
                    {presets.map((preset) => (
                        <button
                            key={preset}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(preset.toString());
                                setIsFocused(false);
                            }}
                            className={`
                                px-2 py-1 text-xs font-medium rounded transition-colors
                                ${value == preset
                                    ? 'bg-cv-accent text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }
                            `}
                        >
                            {preset}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
