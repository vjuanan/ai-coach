'use client';

import { useState, useMemo } from 'react';
import {
    Building2, MapPin, Users, Dumbbell, Globe, Phone, Clock,
    Edit2, Save, X, ChevronDown, ChevronRight
} from 'lucide-react';
import { updateGymProfile } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import {
    EQUIPMENT_CATEGORIES,
    buildDefaultEquipment,
    getEquipmentDisplayValue,
    type EquipmentCategory,
} from '@/lib/equipment-constants';

interface GymDetailsProps {
    gymId: string;
    initialData: {
        gym_type?: string;
        location?: string;
        member_count?: string;
        equipment?: string | Record<string, boolean | number>;
        operating_hours?: string;
        website?: string;
        phone?: string;
        email?: string;
    };
    isEditable?: boolean;
}

/**
 * Parse equipment data from DB.
 * It can be:
 * - A JSON string representing Record<string, boolean | number>
 * - A plain text string (legacy)
 * - Already a Record<string, boolean | number>
 * - null/undefined
 */
function parseEquipment(raw: string | Record<string, boolean | number> | undefined | null): Record<string, boolean | number> {
    if (!raw) return buildDefaultEquipment();

    // Already an object
    if (typeof raw === 'object') return { ...buildDefaultEquipment(), ...raw };

    // Try JSON parse
    try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
            return { ...buildDefaultEquipment(), ...parsed };
        }
    } catch {
        // Not JSON — legacy plain text string, start fresh
    }

    return buildDefaultEquipment();
}

/**
 * Build a human-readable summary of selected equipment
 */
function buildEquipmentSummary(eq: Record<string, boolean | number>): string {
    const parts: string[] = [];
    for (const cat of EQUIPMENT_CATEGORIES) {
        const selected = cat.items.filter(item => {
            const val = eq[item.key];
            return val === true || (typeof val === 'number' && val > 0);
        });
        if (selected.length > 0) {
            const labels = selected.map(item => {
                const val = eq[item.key];
                if (typeof val === 'number' && val > 0 && item.hasQuantity) {
                    return `${item.label} (${val} ${item.quantityUnit || 'unidades'})`;
                }
                return item.label;
            });
            parts.push(`${cat.emoji} ${cat.title}: ${labels.join(', ')}`);
        }
    }
    return parts.join('\n');
}

export function GymDetailsEditor({ gymId, initialData, isEditable = true }: GymDetailsProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState(initialData);
    const [equipmentData, setEquipmentData] = useState<Record<string, boolean | number>>(() =>
        parseEquipment(initialData.equipment)
    );
    const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
    const router = useRouter();

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // Save equipment as JSON object
            const saveData = {
                ...data,
                equipment: equipmentData,
            };
            await updateGymProfile(gymId, saveData);
            setData(prev => ({ ...prev, equipment: equipmentData }));
            setIsEditing(false);
            router.refresh();
        } catch (error) {
            console.error('Failed to update gym profile', error);
            alert('Error al actualizar el perfil del gimnasio');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const toggleEquipment = (key: string) => {
        setEquipmentData(prev => {
            const current = prev[key];
            if (typeof current === 'number') {
                return { ...prev, [key]: current > 0 ? 0 : 1 };
            }
            return { ...prev, [key]: !current };
        });
    };

    const setEquipmentQty = (key: string, qty: number) => {
        setEquipmentData(prev => ({ ...prev, [key]: Math.max(0, qty) }));
    };

    const toggleCategory = (catId: string) => {
        setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
    };

    const selectedCount = useMemo(() => {
        let count = 0;
        for (const val of Object.values(equipmentData)) {
            if (val === true || (typeof val === 'number' && val > 0)) count++;
        }
        return count;
    }, [equipmentData]);

    const getCategorySelectedCount = (cat: EquipmentCategory) => {
        return cat.items.filter(item => {
            const val = equipmentData[item.key];
            return val === true || (typeof val === 'number' && val > 0);
        }).length;
    };

    const InputGroup = ({ icon: Icon, label, children }: { icon: any, label: string, children: React.ReactNode }) => (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-cv-text-secondary text-sm font-medium">
                <Icon size={16} className="text-cv-text-tertiary" />
                {label}
            </div>
            {children}
        </div>
    );

    // VIEW MODE helpers (must be defined before conditional return for hooks rules)
    const InfoRow = ({ label, value, icon: Icon, isLink = false }: { label: string, value: string | null | undefined, icon?: any, isLink?: boolean }) => {
        if (!value) return null;
        return (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-cv-bg-tertiary/30 border border-transparent hover:border-cv-border transition-colors">
                {Icon && <Icon size={18} className="text-cv-text-tertiary mt-0.5" />}
                <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-semibold text-cv-text-tertiary uppercase mb-0.5">{label}</p>
                    {isLink ? (
                        <a href={value} target="_blank" rel="noopener noreferrer" className="text-cv-accent hover:underline truncate block">
                            {value}
                        </a>
                    ) : (
                        <p className="text-cv-text-primary font-medium truncate">{value}</p>
                    )}
                </div>
            </div>
        );
    };

    // Build equipment display for view mode
    const equipmentDisplay = useMemo(() => {
        const eq = data.equipment;
        if (!eq) return null;

        // If it's a structured object, build a nice display
        if (typeof eq === 'object') {
            return buildEquipmentSummary(eq as Record<string, boolean | number>);
        }

        // If string, try to parse as JSON
        if (typeof eq === 'string') {
            try {
                const parsed = JSON.parse(eq);
                if (typeof parsed === 'object' && parsed !== null) {
                    return buildEquipmentSummary(parsed as Record<string, boolean | number>);
                }
            } catch {
                // Plain text — return as-is
                return eq;
            }
        }

        return null;
    }, [data.equipment]);

    if (isEditing) {
        return (
            <div className="cv-card space-y-6 border-2 border-cv-accent/20">
                <div className="flex items-center justify-between border-b border-cv-border pb-4">
                    <h3 className="font-bold text-lg text-cv-text-primary">Editar Perfil del Gimnasio</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            disabled={isLoading}
                            className="p-2 hover:bg-cv-bg-tertiary rounded-lg text-cv-text-secondary transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-cv-accent hover:bg-cv-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            <Save size={18} />
                            {isLoading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <InputGroup icon={Building2} label="Tipo de Gimnasio">
                            <select
                                value={data.gym_type || 'commercial'}
                                onChange={(e) => handleChange('gym_type', e.target.value)}
                                className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                            >
                                <option value="commercial">Gimnasio Comercial</option>
                                <option value="crossfit">Box CrossFit</option>
                                <option value="functional">Centro Funcional</option>
                                <option value="studio">Estudio Personal</option>
                                <option value="home_gym">Home Gym</option>
                            </select>
                        </InputGroup>
                        <InputGroup icon={Users} label="Cantidad de Miembros">
                            <select
                                value={data.member_count || '0-50'}
                                onChange={(e) => handleChange('member_count', e.target.value)}
                                className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                            >
                                <option value="0-50">0 - 50</option>
                                <option value="50-200">50 - 200</option>
                                <option value="200-500">200 - 500</option>
                                <option value="500+">500+</option>
                            </select>
                        </InputGroup>
                    </div>

                    {/* Contact - Location */}
                    <div className="space-y-4">
                        <InputGroup icon={MapPin} label="Ubicación">
                            <input
                                type="text"
                                value={data.location || ''}
                                onChange={(e) => handleChange('location', e.target.value)}
                                className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                                placeholder="Dirección, Ciudad..."
                            />
                        </InputGroup>
                        <InputGroup icon={Globe} label="Sitio Web">
                            <input
                                type="url"
                                value={data.website || ''}
                                onChange={(e) => handleChange('website', e.target.value)}
                                className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                                placeholder="https://..."
                            />
                        </InputGroup>
                    </div>

                    <div className="space-y-4">
                        <InputGroup icon={Phone} label="Teléfono / WhatsApp">
                            <input
                                type="tel"
                                value={data.phone || ''}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                            />
                        </InputGroup>
                    </div>

                    <div className="space-y-4">
                        <InputGroup icon={Clock} label="Horarios de Atención">
                            <input
                                type="text"
                                value={data.operating_hours || ''}
                                onChange={(e) => handleChange('operating_hours', e.target.value)}
                                className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                                placeholder="ej. Lun-Vie 8-22hs"
                            />
                        </InputGroup>
                    </div>

                    {/* Equipment Section */}
                    <div className="md:col-span-2 space-y-4 border-t border-cv-border pt-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-cv-text-secondary text-sm font-medium">
                                <Dumbbell size={16} className="text-cv-text-tertiary" />
                                Equipamiento Disponible
                            </div>
                            <span className="text-xs text-cv-text-tertiary bg-cv-bg-tertiary px-2 py-1 rounded-full">
                                {selectedCount} seleccionados
                            </span>
                        </div>

                        <div className="space-y-2">
                            {EQUIPMENT_CATEGORIES.map(cat => {
                                const isExpanded = expandedCats[cat.id] ?? false;
                                const catSelected = getCategorySelectedCount(cat);

                                return (
                                    <div key={cat.id} className="border border-cv-border rounded-lg overflow-hidden">
                                        {/* Category Header */}
                                        <button
                                            type="button"
                                            onClick={() => toggleCategory(cat.id)}
                                            className="w-full flex items-center justify-between p-3 bg-cv-bg-tertiary/50 hover:bg-cv-bg-tertiary transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-2">
                                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                <span className="text-base">{cat.emoji}</span>
                                                <span className="font-medium text-sm text-cv-text-primary">{cat.title}</span>
                                            </div>
                                            {catSelected > 0 && (
                                                <span className="text-xs bg-cv-accent/10 text-cv-accent px-2 py-0.5 rounded-full font-medium">
                                                    {catSelected}/{cat.items.length}
                                                </span>
                                            )}
                                        </button>

                                        {/* Category Items */}
                                        {isExpanded && (
                                            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {cat.items.map(item => {
                                                    const val = equipmentData[item.key];
                                                    const isActive = val === true || (typeof val === 'number' && val > 0);

                                                    return (
                                                        <div
                                                            key={item.key}
                                                            className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${isActive
                                                                ? 'border-cv-accent/30 bg-cv-accent/5'
                                                                : 'border-transparent bg-cv-bg-tertiary/30 hover:bg-cv-bg-tertiary/60'
                                                                }`}
                                                        >
                                                            <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isActive}
                                                                    onChange={() => toggleEquipment(item.key)}
                                                                    className="w-4 h-4 rounded border-cv-border text-cv-accent focus:ring-cv-accent flex-shrink-0"
                                                                />
                                                                <span className="text-sm text-cv-text-primary truncate">
                                                                    {item.emoji} {item.label}
                                                                </span>
                                                            </label>
                                                            {item.hasQuantity && isActive && (
                                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                                    <input
                                                                        type="number"
                                                                        min={1}
                                                                        value={typeof val === 'number' ? val : 1}
                                                                        onChange={(e) => setEquipmentQty(item.key, parseInt(e.target.value) || 0)}
                                                                        className="w-14 p-1 text-center text-xs bg-white border border-cv-border rounded text-cv-text-primary focus:border-cv-accent outline-none"
                                                                    />
                                                                    <span className="text-[10px] text-cv-text-tertiary whitespace-nowrap">
                                                                        {item.quantityUnit}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // VIEW MODE
    return (
        <div className="cv-card space-y-6">
            <div className="flex items-center justify-between border-b border-cv-border pb-4">
                <h3 className="font-bold text-lg text-cv-text-primary flex items-center gap-2">
                    <Building2 size={20} className="text-cv-accent" />
                    Detalles del Gimnasio
                </h3>
                {isEditable && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 text-sm text-cv-accent hover:text-cv-accent-hover font-medium px-3 py-1.5 rounded-lg hover:bg-cv-accent/5 transition-colors"
                    >
                        <Edit2 size={16} />
                        Editar
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoRow
                    icon={Building2}
                    label="Tipo"
                    value={
                        data.gym_type === 'commercial' ? 'Comercial' :
                            data.gym_type === 'crossfit' ? 'Box CrossFit' :
                                data.gym_type === 'functional' ? 'Funcional' :
                                    data.gym_type === 'studio' ? 'Estudio' :
                                        data.gym_type === 'home_gym' ? 'Home Gym' : data.gym_type
                    }
                />

                <InfoRow
                    icon={Users}
                    label="Miembros"
                    value={data.member_count}
                />

                <InfoRow icon={MapPin} label="Ubicación" value={data.location} />
                <InfoRow icon={Phone} label="Contacto" value={data.phone} />
                <InfoRow icon={Clock} label="Horarios" value={data.operating_hours} />
                <InfoRow icon={Globe} label="Web" value={data.website} isLink />
            </div>

            {/* Equipment View */}
            <div className="space-y-4 pt-2">
                {equipmentDisplay && (
                    <div className="p-4 rounded-lg bg-cv-bg-tertiary border border-cv-border">
                        <h4 className="text-sm font-bold text-cv-text-primary mb-2 flex items-center gap-2">
                            <Dumbbell size={16} className="text-cv-text-tertiary" />
                            Equipamiento
                        </h4>
                        <p className="text-cv-text-secondary text-sm whitespace-pre-wrap">{equipmentDisplay}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
