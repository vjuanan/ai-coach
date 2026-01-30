import * as React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'outline';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className = '', variant = 'default', ...props }, ref) => {
        const variantClass = variant === 'outline'
            ? 'border border-current'
            : 'bg-cv-bg-tertiary';

        return (
            <div
                ref={ref}
                className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${variantClass} ${className}`}
                {...props}
            />
        );
    }
);
Badge.displayName = 'Badge';

export { Badge };
