'use client';

import { useState, useEffect } from 'react';
import { Clock, Copy, X, Check } from 'lucide-react';

const DAYS = [
    { key: 'lun', label: 'Lunes', short: 'Lun' },
    { key: 'mar', label: 'Martes', short: 'Mar' },
    { key: 'mie', label: 'Miércoles', short: 'Mié' },
    { key: 'jue', label: 'Jueves', short: 'Jue' },
    { key: 'vie', label: 'Viernes', short: 'Vie' },
    { key: 'sab', label: 'Sábado', short: 'Sáb' },
    { key: 'dom', label: 'Domingo', short: 'Dom' },
];

interface DaySchedule {
    open: boolean;
    from: string; // "HH:MM"
    to: string;   // "HH:MM"
}

type WeekSchedule = Record<string, DaySchedule>;

function defaultSchedule(): WeekSchedule {
    const schedule: WeekSchedule = {};
    DAYS.forEach(day => {
        const isWeekend = day.key === 'sab' || day.key === 'dom';
        schedule[day.key] = {
            open: !isWeekend,
            from: isWeekend ? '08:00' : '06:00',
            to: isWeekend ? '14:00' : '22:00',
        };
    });
    return schedule;
}

// Parse existing string like "Lun-Vie 06:00-22:00, Sáb 08:00-14:00" back to schedule
function parseHoursString(str: string): WeekSchedule | null {
    if (!str || str.trim().length === 0) return null;
    // This is a best-effort parser; if it fails, return null to use defaults
    try {
        const schedule = defaultSchedule();
        // Mark all as closed first
        DAYS.forEach(d => { schedule[d.key].open = false; });

        const shortToKey: Record<string, string> = {};
        DAYS.forEach(d => {
            shortToKey[d.short.toLowerCase()] = d.key;
            shortToKey[d.label.toLowerCase()] = d.key;
        });

        const segments = str.split(',').map(s => s.trim());
        for (const seg of segments) {
            // Match pattern like "Lun-Vie 06:00-22:00" or "Sáb 08:00-14:00"
            const match = seg.match(/^(.+?)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
            if (!match) continue;

            const daysPart = match[1].trim();
            const from = match[2].padStart(5, '0');
            const to = match[3].padStart(5, '0');

            // Check if range (Lun-Vie) or single (Sáb)
            const rangeMatch = daysPart.match(/^(.+?)\s*-\s*(.+?)$/);
            if (rangeMatch) {
                const startKey = shortToKey[rangeMatch[1].toLowerCase()];
                const endKey = shortToKey[rangeMatch[2].toLowerCase()];
                if (startKey && endKey) {
                    let inRange = false;
                    for (const d of DAYS) {
                        if (d.key === startKey) inRange = true;
                        if (inRange) {
                            schedule[d.key] = { open: true, from, to };
                        }
                        if (d.key === endKey) break;
                    }
                }
            } else {
                const key = shortToKey[daysPart.toLowerCase()];
                if (key) {
                    schedule[key] = { open: true, from, to };
                }
            }
        }
        return schedule;
    } catch {
        return null;
    }
}

// Serialize schedule to readable string, grouping consecutive days with same hours
function serializeSchedule(schedule: WeekSchedule): string {
    const groups: { days: typeof DAYS[number][]; from: string; to: string }[] = [];

    for (const day of DAYS) {
        const s = schedule[day.key];
        if (!s.open) continue;

        const lastGroup = groups[groups.length - 1];
        if (lastGroup && lastGroup.from === s.from && lastGroup.to === s.to) {
            // Check if this day is consecutive to the last day in the group
            const lastDay = lastGroup.days[lastGroup.days.length - 1];
            const lastIdx = DAYS.findIndex(d => d.key === lastDay.key);
            const curIdx = DAYS.findIndex(d => d.key === day.key);
            if (curIdx === lastIdx + 1) {
                lastGroup.days.push(day);
                continue;
            }
        }
        groups.push({ days: [day], from: s.from, to: s.to });
    }

    return groups.map(g => {
        const dayStr = g.days.length === 1
            ? g.days[0].short
            : `${g.days[0].short}-${g.days[g.days.length - 1].short}`;
        return `${dayStr} ${g.from}-${g.to}`;
    }).join(', ');
}

interface OperatingHoursModalProps {
    value: string;
    onChange: (value: string) => void;
    accentColor?: string; // 'purple' | 'blue'
}

export function OperatingHoursModal({ value, onChange, accentColor = 'purple' }: OperatingHoursModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [schedule, setSchedule] = useState<WeekSchedule>(() => {
        return parseHoursString(value) || defaultSchedule();
    });

    // Sync from external value changes
    useEffect(() => {
        const parsed = parseHoursString(value);
        if (parsed) setSchedule(parsed);
    }, [value]);

    const updateDay = (key: string, field: keyof DaySchedule, val: any) => {
        setSchedule(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: val },
        }));
    };

    const copyFirstToAll = () => {
        // Find first open day
        const firstOpen = DAYS.find(d => schedule[d.key].open);
        if (!firstOpen) return;
        const src = schedule[firstOpen.key];
        setSchedule(prev => {
            const next = { ...prev };
            DAYS.forEach(d => {
                next[d.key] = { ...next[d.key], open: true, from: src.from, to: src.to };
            });
            return next;
        });
    };

    const handleConfirm = () => {
        const str = serializeSchedule(schedule);
        onChange(str);
        setIsOpen(false);
    };

    const accent = accentColor === 'blue' ? {
        ring: 'focus:ring-blue-500',
        bg: 'bg-blue-600 hover:bg-blue-700',
        bgLight: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-500',
        toggle: 'bg-blue-600',
    } : {
        ring: 'focus:ring-purple-500',
        bg: 'bg-purple-600 hover:bg-purple-700',
        bgLight: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-500',
        toggle: 'bg-purple-600',
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`w-full p-4 border-2 border-gray-200 rounded-xl text-left transition-colors hover:border-gray-300 flex items-center gap-3 ${value ? 'text-gray-900' : 'text-gray-400'}`}
            >
                <Clock size={18} className="text-gray-400 flex-shrink-0" />
                <span className="truncate">
                    {value || 'Configurar horarios...'}
                </span>
            </button>

            {/* Modal Backdrop */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

                    {/* Modal Content */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Clock size={20} className={accent.text} />
                                Horarios de Operación
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-4 space-y-2 max-h-[60vh] overflow-y-auto">
                            {/* Copy All Button */}
                            <button
                                type="button"
                                onClick={copyFirstToAll}
                                className={`flex items-center gap-2 text-xs font-semibold ${accent.text} hover:underline mb-2`}
                            >
                                <Copy size={14} />
                                Copiar primer horario a todos los días
                            </button>

                            {/* Day Rows */}
                            {DAYS.map(day => {
                                const s = schedule[day.key];
                                return (
                                    <div
                                        key={day.key}
                                        className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${s.open ? accent.bgLight : 'bg-gray-50'}`}
                                    >
                                        {/* Toggle */}
                                        <button
                                            type="button"
                                            onClick={() => updateDay(day.key, 'open', !s.open)}
                                            className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${s.open ? accent.toggle : 'bg-gray-300'}`}
                                        >
                                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${s.open ? 'left-5' : 'left-1'}`} />
                                        </button>

                                        {/* Day Name */}
                                        <span className={`w-20 font-medium text-sm ${s.open ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {day.label}
                                        </span>

                                        {s.open ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <input
                                                    type="time"
                                                    value={s.from}
                                                    onChange={(e) => updateDay(day.key, 'from', e.target.value)}
                                                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-purple-400 bg-white"
                                                />
                                                <span className="text-gray-400 text-xs font-medium">a</span>
                                                <input
                                                    type="time"
                                                    value={s.to}
                                                    onChange={(e) => updateDay(day.key, 'to', e.target.value)}
                                                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-purple-400 bg-white"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic">Cerrado</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className={`px-6 py-2 text-sm font-bold text-white ${accent.bg} rounded-lg transition-colors flex items-center gap-2 shadow-lg`}
                            >
                                <Check size={16} />
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
