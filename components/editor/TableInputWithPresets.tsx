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
    inputClassName?: string;
    chipLayout?: 'bottom' | 'popover';
}

export function TableInputWithPresets({
    value,
    onChange,
    presets,
    type = "number",
    placeholder,
    width = "cv-width-short",
    min = 0,
    step = 1,
    suffix,
    inputClassName,
    chipLayout = 'bottom',
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

    // Default underline style if no class provided
    const defaultInputClass = `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cv-input-compact cv-radius-soft px-1 text-center font-semibold text-cv-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-cv-accent/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${width} ${suffix ? 'pr-5' : ''}`;

    return (
        <div className="relative flex flex-col items-center gap-1" ref={containerRef}>
            <div className="relative">
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    className={inputClassName || defaultInputClass}
                    placeholder={placeholder}
                    min={min}
                    step={step}
                />
                {suffix && (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                        {suffix}
                    </div>
                )}
            </div>

            {chipLayout === 'bottom' && presets.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1">
                    {presets.map((preset) => (
                        <button
                            key={preset}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(preset.toString());
                                setIsFocused(false);
                            }}
                            className={`
                                cv-chip-compact h-6 px-0 text-[10px] font-medium rounded border transition-colors
                                ${value == preset
                                    ? 'bg-cv-accent text-white border-cv-accent'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-cv-accent/40'
                                }
                            `}
                        >
                            {preset}
                        </button>
                    ))}
                </div>
            )}

            {chipLayout === 'popover' && isFocused && presets.length > 0 && (
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
                                h-6 px-2 text-[10px] font-medium rounded transition-colors
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
