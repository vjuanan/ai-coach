import { useEffect, useRef, useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface InputCardProps {
    label: string;
    subLabel?: string;
    value: string | number;
    onChange: (val: any) => void;
    type?: 'number' | 'text' | 'number-text' | 'time';
    icon?: LucideIcon;
    presets?: (string | number)[];
    placeholder?: string;
    headerAction?: React.ReactNode;
    isDistance?: boolean;
    defaultValue?: string | number;
    badge?: string;
    isInvalid?: boolean; // Highlight in red if required but missing
    className?: string;
    compact?: boolean;
    valueSize?: 'short' | 'medium' | 'time' | 'auto';
    cardSize?: 'short' | 'medium' | 'time' | 'auto';
    presetsPlacement?: 'bottom' | 'popover';
    maxVisiblePresets?: number;
    labelLines?: 1 | 2;
    density?: 'compact' | 'micro';
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

export function InputCard({
    label,
    subLabel,
    value,
    onChange,
    type = 'text',
    icon: Icon,
    presets = [],
    placeholder,
    headerAction,
    isDistance,
    defaultValue,
    badge,
    isInvalid,
    className = '',
    compact = true,
    valueSize,
    cardSize,
    presetsPlacement = 'bottom',
    maxVisiblePresets = 3,
    labelLines = 1,
    density = 'compact',
}: InputCardProps) {
    const [localValue, setLocalValue] = useState<string>(value !== undefined && value !== null ? String(value) : '');
    const [isFocused, setIsFocused] = useState(false);
    const defaultAppliedRef = useRef(false);

    // Sync from props
    useEffect(() => {
        setLocalValue(value !== undefined && value !== null ? String(value) : '');
    }, [value]);

    // Apply default value when field is empty
    useEffect(() => {
        if (defaultAppliedRef.current) return;
        if ((value === undefined || value === null || value === '') && defaultValue !== undefined) {
            defaultAppliedRef.current = true;
            onChange(defaultValue);
        }
    }, [defaultValue, onChange, value]);

    const resolvedSize = valueSize || (type === 'time' ? 'time' : type === 'number' ? 'short' : 'medium');
    const widthClass = resolvedSize === 'short'
        ? 'cv-width-short'
        : resolvedSize === 'time'
            ? 'cv-width-time'
            : resolvedSize === 'auto'
                ? 'w-auto min-w-[2.5rem]'
                : 'cv-width-medium';
    const resolvedCardSize = cardSize || (resolvedSize === 'time' ? 'time' : resolvedSize === 'medium' ? 'medium' : 'short');
    const cardWidthClass = resolvedCardSize === 'short'
        ? 'cv-card-short'
        : resolvedCardSize === 'time'
            ? 'cv-card-time'
            : resolvedCardSize === 'auto'
                ? 'w-auto'
                : 'cv-card-medium';
    const visiblePresets = selectStrategicPresets(presets, maxVisiblePresets);
    const labelHeightClass = labelLines === 2
        ? 'h-[1.5rem] leading-tight'
        : 'inline-flex items-center h-[1.5rem] leading-none';
    const labelTextClampClass = labelLines === 2 ? '' : 'whitespace-nowrap overflow-hidden text-ellipsis';
    const isMicro = density === 'micro';
    const cardPaddingClass = compact ? (isMicro ? 'cv-radius-soft p-1' : 'cv-radius-soft p-1.5') : 'rounded-xl p-2';
    const inputHeightClass = isMicro ? 'cv-input-micro text-base' : 'h-[var(--cv-input-height-compact)] text-lg';
    const chipDensityClass = isMicro ? 'cv-chip-micro text-[9px]' : 'h-6 text-[10px]';
    const valueRowClass = isMicro ? 'min-h-[1.9rem]' : 'min-h-[2.2rem]';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;

        if (type === 'number') {
            // Strictly numbers
            const numericVal = val.replace(/[^0-9.]/g, '');
            if (val !== numericVal) {
                e.target.value = numericVal; // Force DOM override sync
            }
            setLocalValue(numericVal);
            onChange(numericVal === '' ? '' : Number(numericVal));
        } else if (type === 'time') {
            // Strictly numbers and colon
            const timeVal = val.replace(/[^0-9:]/g, '');
            if (val !== timeVal) {
                e.target.value = timeVal; // Force DOM override sync
            }
            setLocalValue(timeVal);
            onChange(timeVal);
        } else {
            setLocalValue(val);
            onChange(val);
        }
    };

    const handleBlur = () => {
        if (type === 'time' && localValue && typeof localValue === 'string') {
            // Hard enforce format on blur to ensure it looks like MM:SS
            let val = localValue.replace(/[^0-9]/g, '');
            if (val.length > 0) {
                let formatted = '';
                if (val.length <= 2) {
                    formatted = `00:${val.padStart(2, '0')}`;
                } else {
                    const sec = val.slice(-2);
                    const min = val.slice(0, -2);
                    formatted = `${min.padStart(2, '0')}:${sec}`;
                }
                setLocalValue(formatted);
                onChange(formatted);
            }
        }
        window.setTimeout(() => setIsFocused(false), 120);
    };

    const handlePresetClick = (preset: string | number) => {
        setLocalValue(String(preset));
        onChange(preset);
        setIsFocused(false);
    };

    return (
        <div className={`${cardPaddingClass} border flex flex-col gap-1 transition-all group relative ${cardWidthClass}
            ${isInvalid
                ? 'bg-red-50/50 dark:bg-red-900/10 border-red-400'
                : 'bg-white dark:bg-cv-bg-secondary border-slate-200 dark:border-slate-700'
            } ${className}`}
        >
            <div className="flex items-center justify-between">
                <div className={`flex gap-1.5 ${labelLines === 2 ? 'items-start' : 'items-center'}`}>
                    {Icon && <Icon size={13} className={`${isInvalid ? 'text-red-500' : 'text-cv-text-tertiary'}`} />}
                    <span className={`text-[10px] uppercase tracking-wider font-bold ${labelHeightClass} ${labelTextClampClass} ${isInvalid ? 'text-red-600' : 'text-cv-text-tertiary'}`}>
                        {label}
                    </span>
                </div>
                {headerAction}
            </div>

            {subLabel && (
                <div className="text-[10px] text-cv-text-tertiary -mt-1 leading-tight">{subLabel}</div>
            )}

            {badge && (
                <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-cv-accent/10 border border-cv-accent/20 rounded-md text-[10px] font-bold text-cv-accent">
                    {badge}
                </div>
            )}

            <div className={`flex items-center justify-center gap-1 ${valueRowClass}`}>
                <div className="flex items-end justify-center gap-1 min-w-0">
                    <input
                        type="text"
                        value={localValue}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={() => setIsFocused(true)}
                        placeholder={placeholder || '-'}
                        className={`bg-transparent border border-slate-200 dark:border-slate-700 cv-radius-soft ${inputHeightClass} px-1 font-bold text-center focus:ring-1 focus:ring-cv-accent/40 focus:border-cv-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${widthClass}
                            ${isInvalid ? 'text-red-600 placeholder:text-red-300' : 'text-cv-text-primary placeholder:text-slate-300 dark:placeholder:text-slate-600'}
                        `}
                    />
                    {isDistance && <span className="text-xs font-medium text-cv-text-tertiary">m</span>}
                    {label === '% 1RM' && <span className="text-xs font-medium text-cv-text-tertiary">%</span>}
                </div>
            </div>

            {visiblePresets.length > 0 && presetsPlacement === 'bottom' && (
                <div className="flex flex-wrap justify-center gap-1">
                    {visiblePresets.map(preset => (
                        <button
                            key={preset}
                            onClick={() => handlePresetClick(preset)}
                            className={`cv-chip-compact ${chipDensityClass} px-0 rounded-md font-semibold transition-all border
                                ${value == preset
                                    ? 'bg-cv-accent text-white border-cv-accent'
                                    : 'bg-slate-50 dark:bg-slate-800 text-cv-text-secondary border-slate-200 dark:border-slate-700 hover:border-cv-accent/40'}
                            `}
                        >
                            {preset}
                        </button>
                    ))}
                </div>
            )}

            {visiblePresets.length > 0 && presetsPlacement === 'popover' && isFocused && (
                <div className="absolute z-20 top-full mt-1 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg p-1.5 flex gap-1 min-w-max">
                    {visiblePresets.map((preset) => (
                        <button
                            key={preset}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handlePresetClick(preset)}
                            className={`${isMicro ? 'h-5 text-[9px]' : 'h-6 text-[10px]'} px-2 rounded-md font-semibold transition-colors
                                ${value == preset
                                    ? 'bg-cv-accent text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-cv-text-secondary hover:bg-slate-200 dark:hover:bg-slate-600'}
                            `}
                        >
                            {preset}
                        </button>
                    ))}
                </div>
            )}

            {presetsPlacement === 'popover' && (
                <button
                    type="button"
                    onClick={() => setIsFocused((prev) => !prev)}
                    className="self-center text-[10px] text-cv-text-tertiary hover:text-cv-accent transition-colors"
                >
                    Presets
                </button>
            )}
        </div>
    );
}
