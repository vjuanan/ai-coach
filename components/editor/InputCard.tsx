import { useEffect } from 'react';
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
    isInvalid
}: InputCardProps) {

    // Apply default value when field is empty
    useEffect(() => {
        if (!value && defaultValue !== undefined) {
            onChange(defaultValue);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;

        if (type === 'number') {
            // Strictly numbers
            val = val.replace(/[^0-9.]/g, '');
            onChange(val === '' ? '' : Number(val));
        } else if (type === 'time') {
            // Strictly mm:ss or m:ss
            val = val.replace(/[^0-9:]/g, '');
            // Auto-format logic: if they paste numbers, try to colon it, else just let them type the colon
            onChange(val);
        } else {
            onChange(val);
        }
    };

    const handleBlur = () => {
        if (type === 'time' && value && typeof value === 'string') {
            // Hard enforce format on blur to ensure it looks like MM:SS
            let val = value.replace(/[^0-9]/g, '');
            if (val.length > 0) {
                if (val.length <= 2) {
                    onChange(`0:${val.padStart(2, '0')}`);
                } else {
                    const sec = val.slice(-2);
                    const min = val.slice(0, -2);
                    onChange(`${min}:${sec}`);
                }
            }
        }
    };

    return (
        <div className={`rounded-xl border p-3 flex flex-col gap-2 shadow-sm transition-all group relative overflow-hidden
            ${isInvalid
                ? 'bg-red-50/50 dark:bg-red-900/10 border-red-500 shadow-red-500/20'
                : 'bg-white dark:bg-cv-bg-secondary border-slate-200 dark:border-slate-700 hover:shadow-md'
            }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5">
                    {Icon && <Icon size={14} className={`${isInvalid ? 'text-red-500' : 'text-cv-text-tertiary group-hover:text-cv-accent'} transition-colors`} />}
                    <span className={`text-[10px] uppercase tracking-wider font-bold ${isInvalid ? 'text-red-600' : 'text-cv-text-tertiary group-hover:text-cv-text-secondary'} transition-colors`}>
                        {label}
                    </span>
                </div>
                {headerAction}
            </div>

            {/* Input Area */}
            <div className="flex items-baseline justify-center gap-1 my-1 z-10">
                <input
                    type={type === 'number' ? 'number' : 'text'}
                    value={value || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={placeholder || '-'}
                    className={`bg-transparent border-none p-0 text-3xl font-bold text-center w-full focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                        ${isInvalid ? 'text-red-600 placeholder:text-red-300' : 'text-cv-text-primary placeholder:text-slate-200 dark:placeholder:text-slate-700'}
                    `}
                />
                {isDistance && <span className="text-sm font-medium text-cv-text-tertiary">meters</span>}
                {label === '% 1RM' && <span className="text-sm font-medium text-cv-text-tertiary">%</span>}
            </div>

            {badge && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-cv-accent/10 border border-cv-accent/20 rounded-md text-[10px] font-bold text-cv-accent animate-in fade-in zoom-in duration-200 z-20">
                    {badge}
                </div>
            )}

            {/* Presets */}
            <div className="flex items-center justify-center gap-1 z-10 mt-auto">
                <div className="flex gap-1 flex-wrap justify-center w-full">
                    {presets.map(preset => (
                        <button
                            key={preset}
                            onClick={() => onChange(preset)}
                            className={`
                                flex-shrink-0 min-w-[36px] px-2 py-1 rounded-md text-[10px] font-semibold transition-all border whitespace-nowrap
                                ${value == preset
                                    ? 'bg-cv-accent text-white border-cv-accent'
                                    : 'bg-slate-50 dark:bg-slate-800 text-cv-text-secondary border-slate-100 dark:border-slate-700 hover:border-cv-accent/30'}
                            `}
                        >
                            {preset}
                        </button>
                    ))}
                </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute -bottom-4 -right-4 text-slate-50 dark:text-slate-800/50 pointer-events-none group-hover:scale-110 transition-transform">
                {Icon && <Icon size={64} strokeWidth={1} />}
            </div>
        </div>
    );
}
