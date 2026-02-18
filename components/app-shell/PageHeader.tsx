'use client';

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-3 mb-6 border-b border-cv-border pb-4 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-semibold tracking-tight text-cv-text-primary">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-sm text-cv-text-secondary max-w-2xl">
                            {description}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
