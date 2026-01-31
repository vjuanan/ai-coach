import { useEffect } from 'react';

export function useEscapeKey(handler: () => void, isActive: boolean = true) {
    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handler();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handler, isActive]);
}
