import { useEffect } from 'react';
import { LucideIcon } from 'lucide-react';

interface InputCardProps {
    label: string;
    subLabel?: string;
    value: string | number;
    onChange: (val: any) => void;
    type?: 'number' | 'text' | 'number-text';
    icon?: LucideIcon;
    presets?: (string | number)[];
    placeholder?: string;
    headerAction?: React.ReactNode;
    isDistance?: boolean;
    defaultValue?: string | number;
    badge?: string;
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
    badge
}: InputCardProps) {

    // Apply default value when field is empty
    useEffect(() => {
        if (!value && defaultValue !== undefined) {
            onChange(defaultValue);
        }
    }, []);

    return (
        <div className="bg-white dark:bg-cv-bg-secondary rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5">
                    {Icon && <Icon size={14} className="text-cv-text-tertiary group-hover:text-cv-accent transition-colors" />}
                    <span className="text-[10px] uppercase tracking-wider font-bold text-cv-text-tertiary group-hover:text-cv-text-secondary transition-colors">
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
                    onChange={(e) => {
                        const val = e.target.value;
                        if (type === 'number') onChange(val ? Number(val) : '');
                        else onChange(val);
                    }}
                    placeholder={placeholder || '-'}
                    className="bg-transparent border-none p-0 text-3xl font-bold text-cv-text-primary placeholder:text-slate-200 dark:placeholder:text-slate-700 text-center w-full focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
