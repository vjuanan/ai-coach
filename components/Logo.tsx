import { Dumbbell } from 'lucide-react';

interface LogoProps {
    className?: string; // Allow overriding colors and other styles
    size?: number;
}

export function Logo({ className = "text-slate-900", size = 32 }: LogoProps) {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <Dumbbell size={size} />
        </div>
    );
}
