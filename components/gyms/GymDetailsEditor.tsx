'use client';

import { useState } from 'react';
import {
    Building2, MapPin, Users, Dumbbell, Globe, Phone, Clock,
    Edit2, Save, X, MessageSquare
} from 'lucide-react';
import { updateGymProfile } from '@/lib/actions';
import { useRouter } from 'next/navigation';

interface GymDetailsProps {
    gymId: string;
    initialData: {
        gym_type?: string;
        location?: string;
        member_count?: string;
        equipment?: string;
        operating_hours?: string;
        website?: string;
        phone?: string;
        email?: string;
    };
    isEditable?: boolean;
}

export function GymDetailsEditor({ gymId, initialData, isEditable = true }: GymDetailsProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState(initialData);
    const router = useRouter();

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updateGymProfile(gymId, data);
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

    const InputGroup = ({ icon: Icon, label, children }: { icon: any, label: string, children: React.ReactNode }) => (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-cv-text-secondary text-sm font-medium">
                <Icon size={16} className="text-cv-text-tertiary" />
                {label}
            </div>
            {children}
        </div>
    );

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

                    {/* Text Areas */}
                    <div className="md:col-span-2 space-y-4 border-t border-cv-border pt-4">
                        <InputGroup icon={Dumbbell} label="Equipamiento Disponible">
                            <textarea
                                value={data.equipment || ''}
                                onChange={(e) => handleChange('equipment', e.target.value)}
                                className="w-full p-3 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none min-h-[100px]"
                                placeholder="Listado del equipamiento principal..."
                            />
                        </InputGroup>
                    </div>
                </div>
            </div>
        );
    }

    // VIEW MODE
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

            {/* Long Text Areas */}
            <div className="space-y-4 pt-2">
                {data.equipment && (
                    <div className="p-4 rounded-lg bg-cv-bg-tertiary border border-cv-border">
                        <h4 className="text-sm font-bold text-cv-text-primary mb-2 flex items-center gap-2">
                            <Dumbbell size={16} className="text-cv-text-tertiary" />
                            Equipamiento
                        </h4>
                        <p className="text-cv-text-secondary text-sm whitespace-pre-wrap">{data.equipment}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
