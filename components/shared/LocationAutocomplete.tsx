'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';

// Curated list of cities — Argentina-first, then major LatAm cities
const CITIES = [
    // Argentina
    'Buenos Aires, Argentina',
    'Córdoba, Argentina',
    'Rosario, Argentina',
    'Mendoza, Argentina',
    'San Miguel de Tucumán, Argentina',
    'La Plata, Argentina',
    'Mar del Plata, Argentina',
    'Salta, Argentina',
    'Santa Fe, Argentina',
    'San Juan, Argentina',
    'Resistencia, Argentina',
    'Corrientes, Argentina',
    'Posadas, Argentina',
    'San Luis, Argentina',
    'Paraná, Argentina',
    'Neuquén, Argentina',
    'Santiago del Estero, Argentina',
    'Formosa, Argentina',
    'San Fernando del Valle de Catamarca, Argentina',
    'San Salvador de Jujuy, Argentina',
    'La Rioja, Argentina',
    'Rawson, Argentina',
    'Viedma, Argentina',
    'Santa Rosa, Argentina',
    'Río Gallegos, Argentina',
    'Ushuaia, Argentina',
    'Bahía Blanca, Argentina',
    'Tandil, Argentina',
    'Quilmes, Argentina',
    'Vicente López, Argentina',
    'San Isidro, Argentina',
    'Pilar, Argentina',
    'Tigre, Argentina',
    'Morón, Argentina',
    'Lanús, Argentina',
    'Avellaneda, Argentina',
    'Lomas de Zamora, Argentina',
    // Uruguay
    'Montevideo, Uruguay',
    'Punta del Este, Uruguay',
    // Chile
    'Santiago, Chile',
    'Valparaíso, Chile',
    'Concepción, Chile',
    // Colombia
    'Bogotá, Colombia',
    'Medellín, Colombia',
    'Cali, Colombia',
    'Barranquilla, Colombia',
    // México
    'Ciudad de México, México',
    'Guadalajara, México',
    'Monterrey, México',
    'Cancún, México',
    // Brasil
    'São Paulo, Brasil',
    'Río de Janeiro, Brasil',
    // Perú
    'Lima, Perú',
    // Ecuador
    'Quito, Ecuador',
    'Guayaquil, Ecuador',
    // Paraguay
    'Asunción, Paraguay',
    // Bolivia
    'La Paz, Bolivia',
    'Santa Cruz de la Sierra, Bolivia',
    // Costa Rica
    'San José, Costa Rica',
    // Panamá
    'Ciudad de Panamá, Panamá',
    // España
    'Madrid, España',
    'Barcelona, España',
    // USA (Spanish-speaking communities)
    'Miami, Estados Unidos',
];

// Normalize text for fuzzy matching (remove accents, lowercase)
function normalize(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

interface LocationAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function LocationAutocomplete({
    value,
    onChange,
    placeholder = 'Buenos Aires, Argentina',
    className,
}: LocationAutocompleteProps) {
    const [query, setQuery] = useState(value || '');
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter cities based on query
    const filtered = query.trim().length >= 2
        ? CITIES.filter(city => normalize(city).includes(normalize(query.trim()))).slice(0, 8)
        : [];

    // Sync external value changes
    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const selectCity = useCallback((city: string) => {
        setQuery(city);
        onChange(city);
        setShowDropdown(false);
        setHighlightedIndex(-1);
    }, [onChange]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        onChange(val);
        setShowDropdown(true);
        setHighlightedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || filtered.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev + 1) % filtered.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
        } else if (e.key === 'Enter' && highlightedIndex >= 0) {
            e.preventDefault();
            selectCity(filtered[highlightedIndex]);
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    return (
        <div ref={wrapperRef} className="relative">
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                onFocus={() => query.trim().length >= 2 && setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={className || 'w-full p-4 text-xl border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none'}
                autoComplete="off"
            />

            {showDropdown && filtered.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-[280px] overflow-y-auto">
                    {filtered.map((city, idx) => (
                        <button
                            key={city}
                            type="button"
                            onClick={() => selectCity(city)}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors text-sm ${idx === highlightedIndex
                                    ? 'bg-purple-50 text-purple-700'
                                    : 'hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            <MapPin size={14} className="flex-shrink-0 text-gray-400" />
                            <span>{city}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
