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
    maxVisiblePresets?: number;
}

function dedupePresets(presets: (string | number)[]) {
    const seen = new Set<string>();
    return presets.filter((preset) => {
        const key = `${typeof preset}:${String(preset)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function selectStrategicPresets(presets: (string | number)[], maxVisible = 3) {
    if (maxVisible <= 0) return [];
    const unique = dedupePresets(presets);
    if (unique.length <= maxVisible) return unique;

    if (maxVisible === 1) return [unique[0]];
    if (maxVisible === 2) return [unique[0], unique[unique.length - 1]];

    const asNumbers = unique.map((preset) => (typeof preset === 'number' ? preset : Number(preset)));
    const allNumeric = asNumbers.every((num) => Number.isFinite(num));

    if (allNumeric) {
        const minValue = Math.min(...asNumbers);
        const maxValue = Math.max(...asNumbers);
        const midpoint = (minValue + maxValue) / 2;
        const minIndex = asNumbers.findIndex((value) => value === minValue);
        const maxIndex = asNumbers.findIndex((value) => value === maxValue);

        let middleIndex = -1;
        let bestDistance = Number.POSITIVE_INFINITY;
        let bestCenterDistance = Number.POSITIVE_INFINITY;
        const visualCenter = (unique.length - 1) / 2;

        for (let i = 0; i < asNumbers.length; i++) {
            if (i === minIndex || i === maxIndex) continue;
            const distance = Math.abs(asNumbers[i] - midpoint);
            const centerDistance = Math.abs(i - visualCenter);
            if (distance < bestDistance || (distance === bestDistance && centerDistance < bestCenterDistance)) {
                bestDistance = distance;
                bestCenterDistance = centerDistance;
                middleIndex = i;
            }
        }

        if (middleIndex === -1) {
            middleIndex = Math.floor((unique.length - 1) / 2);
        }

        const picks = [unique[minIndex], unique[middleIndex], unique[maxIndex]];
        return dedupePresets(picks).slice(0, maxVisible);
    }

    const middleIndex = Math.floor((unique.length - 1) / 2);
    const picks = [unique[0], unique[middleIndex], unique[unique.length - 1]];
    return dedupePresets(picks).slice(0, maxVisible);
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
    maxVisiblePresets = 3,
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
    const visiblePresets = selectStrategicPresets(presets, maxVisiblePresets);

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

            {chipLayout === 'bottom' && visiblePresets.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1">
                    {visiblePresets.map((preset) => (
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

            {chipLayout === 'popover' && isFocused && visiblePresets.length > 0 && (
                <div className="absolute z-50 top-full mt-1 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg p-1.5 flex gap-1 min-w-max animate-in fade-in zoom-in-95 duration-100">
                    {visiblePresets.map((preset) => (
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
