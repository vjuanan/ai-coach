'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useEditorStore } from '@/lib/store';
import { saveMesocycleChanges } from '@/lib/actions';

export type SaveStatus = 'idle' | 'typing' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
    programId: string;
    debounceMs?: number;
}

export function useAutoSave({ programId, debounceMs = 500 }: UseAutoSaveOptions) {
    const [status, setStatus] = useState<SaveStatus>('idle');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastMesocyclesRef = useRef<string>('');

    const { mesocycles, hasUnsavedChanges, markAsClean } = useEditorStore();

    // Stringify mesocycles to detect actual changes
    const mesocyclesString = JSON.stringify(mesocycles);

    const save = useCallback(async () => {
        if (!programId || mesocycles.length === 0) return;

        setStatus('saving');
        try {
            const result = await saveMesocycleChanges(programId, mesocycles);
            if (result.success) {
                markAsClean();
                setLastSaved(new Date());
                setStatus('saved');
                // Reset to idle after 2 seconds
                setTimeout(() => setStatus('idle'), 2000);
            } else {
                setStatus('error');
                console.error('Auto-save failed:', result.error);
            }
        } catch (error) {
            setStatus('error');
            console.error('Auto-save error:', error);
        }
    }, [programId, mesocycles, markAsClean]);

    // Debounced save effect
    useEffect(() => {
        // Skip if nothing has changed
        if (mesocyclesString === lastMesocyclesRef.current) {
            return;
        }

        // Skip initial load
        if (lastMesocyclesRef.current === '') {
            lastMesocyclesRef.current = mesocyclesString;
            return;
        }

        lastMesocyclesRef.current = mesocyclesString;

        // Only trigger if there are unsaved changes
        if (!hasUnsavedChanges) return;

        // User is typing
        setStatus('typing');

        // Clear previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new debounce timeout
        timeoutRef.current = setTimeout(() => {
            save();
        }, debounceMs);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [mesocyclesString, hasUnsavedChanges, save, debounceMs]);

    // Force save function (for manual trigger or before navigation)
    const forceSave = useCallback(async () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        await save();
    }, [save]);

    return {
        status,
        lastSaved,
        forceSave,
    };
}
