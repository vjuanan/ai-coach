'use client';

import { useState } from 'react';
import {
    Building2, MapPin, Clock, Users, Settings, Phone, Globe,
    Edit2, Save, X, ChevronDown, ChevronRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { EQUIPMENT_CATEGORIES, EQUIPMENT_LABELS, getEquipmentDisplayValue } from '@/lib/equipment-constants';

interface GymProfileEditorProps {
    userId: string;
    initialData: {
        gym_name?: string;
        gym_type?: string;
        gym_location?: string;
        operating_hours?: string;
        member_count?: number;
        equipment_available?: Record<string, boolean | number>;
        contact_phone?: string;
        website_url?: string;
    };
}

const GYM_TYPE_LABELS: Record<string, string> = {
    crossfit: '🏋️ Box CrossFit',
    globo: '🏢 Gimnasio Tradicional',
    functional: '⚡ Funcional / HIIT',
};

export function GymProfileEditor({ userId, initialData }: GymProfileEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState(initialData);
    const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
    const supabase = createClient();
    const router = useRouter();

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    gym_name: data.gym_name,
                    gym_type: data.gym_type,
                    gym_location: data.gym_location,
                    operating_hours: data.operating_hours,
                    member_count: data.member_count,
                    equipment_available: data.equipment_available,
                    contact_phone: data.contact_phone,
                    website_url: data.website_url,
                })
                .eq('id', userId);

            if (error) throw error;
            setIsEditing(false);
            router.refresh();
        } catch (error) {
            console.error('Failed to update gym profile:', error);
            alert('Error al actualizar el perfil del gimnasio');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const InputGroup = ({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) => (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-cv-text-secondary text-sm font-medium">
                <Icon size={16} className="text-cv-text-tertiary" />
                {label}
            </div>
            {children}
        </div>
    );

    const InfoRow = ({ label, value, icon: Icon }: { label: string; value: string | number | null | undefined; icon?: any }) => {
        if (!value) return null;
        return (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-cv-bg-tertiary/30 border border-transparent hover:border-cv-border transition-colors">
                {Icon && <Icon size={18} className="text-cv-text-tertiary mt-0.5" />}
                <div>
                    <p className="text-xs font-semibold text-cv-text-tertiary uppercase mb-0.5">{label}</p>
                    <p className="text-cv-text-primary font-medium">{value}</p>
                </div>
            </div>
        );
    };

    if (isEditing) {
        return (
            <div className="cv-card space-y-6 border-2 border-purple-500/20">
                <div className="flex items-center justify-between border-b border-cv-border pb-4">
                    <h3 className="font-bold text-lg text-cv-text-primary">Editar Gimnasio</h3>
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
                    <InputGroup icon={Building2} label="Nombre del Gimnasio">
                        <input
                            type="text"
                            value={data.gym_name || ''}
                            onChange={(e) => handleChange('gym_name', e.target.value)}
                            className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                            placeholder="CrossFit Buenos Aires"
                        />
                    </InputGroup>

                    <InputGroup icon={Building2} label="Tipo de Establecimiento">
                        <select
                            value={data.gym_type || 'crossfit'}
                            onChange={(e) => handleChange('gym_type', e.target.value)}
                            className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                        >
                            <option value="crossfit">Box CrossFit</option>
                            <option value="globo">Gimnasio Tradicional</option>
                            <option value="functional">Funcional / HIIT</option>
                        </select>
                    </InputGroup>

                    <InputGroup icon={MapPin} label="Ubicación">
                        <input
                            type="text"
                            value={data.gym_location || ''}
                            onChange={(e) => handleChange('gym_location', e.target.value)}
                            className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                            placeholder="Buenos Aires, Argentina"
                        />
                    </InputGroup>

                    <InputGroup icon={Clock} label="Horarios de Operación">
                        <input
                            type="text"
                            value={data.operating_hours || ''}
                            onChange={(e) => handleChange('operating_hours', e.target.value)}
                            className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                            placeholder="Lun-Vie 6:00-22:00, Sáb 8:00-14:00"
                        />
                    </InputGroup>

                    <InputGroup icon={Users} label="Número de Miembros">
                        <input
                            type="number"
                            value={data.member_count || ''}
                            onChange={(e) => handleChange('member_count', parseInt(e.target.value) || 0)}
                            className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                            min={0}
                        />
                    </InputGroup>

                    <InputGroup icon={Phone} label="Teléfono de Contacto">
                        <input
                            type="tel"
                            value={data.contact_phone || ''}
                            onChange={(e) => handleChange('contact_phone', e.target.value)}
                            className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                            placeholder="+54 9 11 1234 5678"
                        />
                    </InputGroup>

                    <InputGroup icon={Globe} label="Sitio Web">
                        <input
                            type="url"
                            value={data.website_url || ''}
                            onChange={(e) => handleChange('website_url', e.target.value)}
                            className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                            placeholder="https://www.migym.com"
                        />
                    </InputGroup>

                    {/* Equipment Categorized */}
                    <div className="md:col-span-2">
                        <InputGroup icon={Settings} label="Equipamiento Disponible">
                            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                                {EQUIPMENT_CATEGORIES.map(cat => {
                                    const isExpanded = expandedCats[cat.id] ?? false;
                                    const selectedCount = cat.items.filter(it => {
                                        const val = data.equipment_available?.[it.key];
                                        return typeof val === 'number' ? val > 0 : !!val;
                                    }).length;
                                    return (
                                        <div key={cat.id} className="border border-cv-border rounded-lg overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setExpandedCats(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                                                className="w-full flex items-center justify-between px-3 py-2.5 bg-cv-bg-tertiary/50 hover:bg-cv-bg-tertiary transition-colors text-left"
                                            >
                                                <span className="font-medium text-sm text-cv-text-primary">
                                                    {cat.emoji} {cat.title}
                                                    {selectedCount > 0 && (
                                                        <span className="ml-2 px-2 py-0.5 text-xs bg-purple-500/10 text-purple-400 rounded-full">
                                                            {selectedCount}
                                                        </span>
                                                    )}
                                                </span>
                                                {isExpanded ? <ChevronDown size={16} className="text-cv-text-tertiary" /> : <ChevronRight size={16} className="text-cv-text-tertiary" />}
                                            </button>
                                            {isExpanded && (
                                                <div className="p-2 grid grid-cols-1 gap-1.5">
                                                    {cat.items.map(item => {
                                                        const val = data.equipment_available?.[item.key];
                                                        const isActive = typeof val === 'number' ? val > 0 : !!val;
                                                        return (
                                                            <label
                                                                key={item.key}
                                                                className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all text-sm ${isActive
                                                                    ? 'border-purple-500/50 bg-purple-500/5 text-cv-text-primary'
                                                                    : 'border-cv-border bg-cv-bg-tertiary/30 text-cv-text-secondary hover:bg-cv-bg-tertiary/50'
                                                                    }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isActive}
                                                                    onChange={(e) => {
                                                                        const newVal = item.hasQuantity
                                                                            ? (e.target.checked ? 1 : 0)
                                                                            : e.target.checked;
                                                                        handleChange('equipment_available', {
                                                                            ...data.equipment_available,
                                                                            [item.key]: newVal,
                                                                        });
                                                                    }}
                                                                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                                />
                                                                <span className="flex-1">{item.emoji} {item.label}</span>
                                                                {item.hasQuantity && isActive && (
                                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                                        <input
                                                                            type="number"
                                                                            min={1}
                                                                            value={typeof val === 'number' ? val : 1}
                                                                            onChange={(e) => {
                                                                                e.stopPropagation();
                                                                                handleChange('equipment_available', {
                                                                                    ...data.equipment_available,
                                                                                    [item.key]: Math.max(1, parseInt(e.target.value) || 1),
                                                                                });
                                                                            }}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="w-14 h-7 text-center bg-cv-bg-tertiary border border-cv-border rounded text-sm focus:ring-1 focus:ring-purple-500 focus:outline-none text-cv-text-primary"
                                                                        />
                                                                        <span className="text-xs text-cv-text-tertiary">{item.quantityUnit}</span>
                                                                    </div>
                                                                )}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </InputGroup>
                    </div>
                </div>
            </div>
        );
    }

    // VIEW MODE
    const activeEquipment: string[] = [];
    if (data.equipment_available) {
        Object.entries(data.equipment_available).forEach(([k, v]) => {
            const display = getEquipmentDisplayValue(k, v as boolean | number);
            if (display) activeEquipment.push(display);
        });
    }

    return (
        <div className="cv-card space-y-6">
            <div className="flex items-center justify-between border-b border-cv-border pb-4">
                <h3 className="font-bold text-lg text-cv-text-primary flex items-center gap-2">
                    <Building2 size={20} className="text-purple-500" />
                    Datos del Gimnasio
                </h3>
                <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-sm text-cv-accent hover:text-cv-accent-hover font-medium px-3 py-1.5 rounded-lg hover:bg-cv-accent/5 transition-colors"
                >
                    <Edit2 size={16} />
                    Editar
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoRow icon={Building2} label="Nombre" value={data.gym_name} />
                <InfoRow icon={Building2} label="Tipo" value={GYM_TYPE_LABELS[data.gym_type || ''] || data.gym_type} />
                <InfoRow icon={MapPin} label="Ubicación" value={data.gym_location} />
                <InfoRow icon={Clock} label="Horarios" value={data.operating_hours} />
                <InfoRow icon={Users} label="Miembros" value={data.member_count ? `${data.member_count} miembros` : null} />
                <InfoRow icon={Phone} label="Teléfono" value={data.contact_phone} />
                <InfoRow icon={Globe} label="Sitio Web" value={data.website_url} />
            </div>

            {activeEquipment.length > 0 && (
                <div className="p-4 rounded-lg bg-cv-bg-tertiary border border-cv-border">
                    <h4 className="text-sm font-bold text-cv-text-primary mb-3 flex items-center gap-2">
                        <Settings size={16} className="text-cv-text-tertiary" />
                        Equipamiento Disponible
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {activeEquipment.map((eq, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-700 border border-purple-500/20"
                            >
                                {eq}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

