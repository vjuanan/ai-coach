'use client';

import { useState } from 'react';
import {
    Calendar, Ruler, Weight, Target, MapPin, Clock, Activity,
    MessageSquare, Phone, Edit2, Save, X, AlertCircle
} from 'lucide-react';
import { updateAthleteProfile } from '@/lib/actions';
import { useRouter } from 'next/navigation';

interface ProfileDetailsProps {
    athleteId: string;
    initialData: {
        dob?: string;
        height?: number;
        weight?: number;
        goal?: string;
        training_place?: string;
        equipment?: string[];
        days_per_week?: number;
        minutes_per_session?: number;
        level?: string;
        injuries?: string;
        preferences?: string;
        whatsapp?: string;
        email?: string;
    };
    isEditable?: boolean;
}

export function ProfileDetailsEditor({ athleteId, initialData, isEditable = true }: ProfileDetailsProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState(initialData);
    const router = useRouter();

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updateAthleteProfile(athleteId, data);
            setIsEditing(false);
            router.refresh();
        } catch (error) {
            console.error('Failed to update profile', error);
            alert('Error al actualizar el perfil');
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
                    <h3 className="font-bold text-lg text-cv-text-primary">Editar Perfil</h3>
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
                    {/* Bio Data */}
                    <div className="space-y-4">
                        <InputGroup icon={Calendar} label="Fecha de Nacimiento">
                            <input
                                type="date"
                                value={data.dob || ''}
                                onChange={(e) => handleChange('dob', e.target.value)}
                                className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                            />
                        </InputGroup>
                        <div className="flex gap-4">
                            <InputGroup icon={Ruler} label="Altura (cm)">
                                <input
                                    type="number"
                                    value={data.height || ''}
                                    onChange={(e) => handleChange('height', parseInt(e.target.value))}
                                    className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                                />
                            </InputGroup>
                            <InputGroup icon={Weight} label="Peso (kg)">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={data.weight || ''}
                                    onChange={(e) => handleChange('weight', parseFloat(e.target.value))}
                                    className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                                />
                            </InputGroup>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4">
                        <InputGroup icon={Phone} label="WhatsApp">
                            <input
                                type="tel"
                                value={data.whatsapp || ''}
                                onChange={(e) => handleChange('whatsapp', e.target.value)}
                                className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                                placeholder="+54 9..."
                            />
                        </InputGroup>
                        <InputGroup icon={Activity} label="Nivel de Experiencia">
                            <select
                                value={data.level || 'beginner'}
                                onChange={(e) => handleChange('level', e.target.value)}
                                className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                            >
                                <option value="beginner">Principiante</option>
                                <option value="intermediate">Intermedio</option>
                                <option value="advanced">Avanzado</option>
                            </select>
                        </InputGroup>
                    </div>

                    {/* Training Focus */}
                    <div className="space-y-4 md:col-span-2">
                        <InputGroup icon={Target} label="Objetivo Principal">
                            <select
                                value={data.goal || 'hypertrophy'}
                                onChange={(e) => handleChange('goal', e.target.value)}
                                className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                            >
                                <option value="hypertrophy">Ganar Masa Muscular</option>
                                <option value="fat_loss">Perder Grasa</option>
                                <option value="performance">Mejorar Rendimiento</option>
                                <option value="maintenance">Salud y Mantenimiento</option>
                            </select>
                        </InputGroup>
                    </div>

                    {/* Logistics */}
                    <div className="space-y-4">
                        <InputGroup icon={MapPin} label="Lugar de Entrenamiento">
                            <select
                                value={data.training_place || 'gym'}
                                onChange={(e) => handleChange('training_place', e.target.value)}
                                className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                            >
                                <option value="gym">Gimnasio</option>
                                <option value="crossfit">Box CrossFit</option>
                                <option value="home">En Casa</option>
                            </select>
                        </InputGroup>
                    </div>

                    <div className="space-y-4">
                        <InputGroup icon={Clock} label="Disponibilidad">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <span className="text-xs text-cv-text-tertiary">Días/Semana</span>
                                    <input
                                        type="number" max="7" min="1"
                                        value={data.days_per_week || 3}
                                        onChange={(e) => handleChange('days_per_week', parseInt(e.target.value))}
                                        className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                                    />
                                </div>
                                <div className="flex-1">
                                    <span className="text-xs text-cv-text-tertiary">Min/Sesión</span>
                                    <select
                                        value={data.minutes_per_session || 60}
                                        onChange={(e) => handleChange('minutes_per_session', parseInt(e.target.value))}
                                        className="w-full p-2 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none"
                                    >
                                        <option value={30}>30m</option>
                                        <option value={45}>45m</option>
                                        <option value={60}>60m</option>
                                        <option value={90}>90m</option>
                                        <option value={120}>120m</option>
                                    </select>
                                </div>
                            </div>
                        </InputGroup>
                    </div>

                    {/* Open Text Fields */}
                    <div className="md:col-span-2 space-y-4 border-t border-cv-border pt-4">
                        <InputGroup icon={AlertCircle} label="Lesiones">
                            <textarea
                                value={data.injuries || ''}
                                onChange={(e) => handleChange('injuries', e.target.value)}
                                className="w-full p-3 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none min-h-[80px]"
                                placeholder="Describe lesiones actuales..."
                            />
                        </InputGroup>
                        <InputGroup icon={MessageSquare} label="Preferencias / Notas">
                            <textarea
                                value={data.preferences || ''}
                                onChange={(e) => handleChange('preferences', e.target.value)}
                                className="w-full p-3 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none min-h-[80px]"
                                placeholder="Preferencias de entrenamiento..."
                            />
                        </InputGroup>
                        {(data.training_place === 'home' || (data.equipment && data.equipment.length > 0)) && (
                            <InputGroup icon={Weight} label="Equipamiento (En Casa)">
                                <textarea
                                    value={Array.isArray(data.equipment) ? data.equipment.join(', ') : data.equipment || ''}
                                    onChange={(e) => handleChange('equipment', e.target.value.split(',').map(s => s.trim()))}
                                    className="w-full p-3 bg-cv-bg-tertiary border border-cv-border rounded-lg text-cv-text-primary focus:border-cv-accent outline-none min-h-[80px]"
                                    placeholder="Lista de equipo separado por comas..."
                                />
                            </InputGroup>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // VIEW MODE
    const InfoRow = ({ label, value, icon: Icon }: { label: string, value: string | number | null | undefined, icon?: any }) => {
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

    return (
        <div className="cv-card space-y-6">
            <div className="flex items-center justify-between border-b border-cv-border pb-4">
                <h3 className="font-bold text-lg text-cv-text-primary flex items-center gap-2">
                    <Activity size={20} className="text-cv-accent" />
                    Perfil del Atleta
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
                    icon={Target}
                    label="Objetivo"
                    value={
                        data.goal === 'hypertrophy' ? 'Ganar Masa Muscular' :
                            data.goal === 'fat_loss' ? 'Perder Grasa' :
                                data.goal === 'performance' ? 'Rendimiento' :
                                    data.goal === 'maintenance' ? 'Mantenimiento' : data.goal
                    }
                />

                <InfoRow
                    icon={Activity}
                    label="Nivel"
                    value={
                        data.level === 'beginner' ? 'Principiante' :
                            data.level === 'intermediate' ? 'Intermedio' :
                                data.level === 'advanced' ? 'Avanzado' : data.level
                    }
                />

                <InfoRow icon={Calendar} label="Fecha Nacimiento" value={data.dob ? new Date(data.dob).toLocaleDateString() : null} />

                <div className="flex gap-4 col-span-1">
                    <div className="flex-1">
                        <InfoRow icon={Ruler} label="Altura" value={data.height ? `${data.height} cm` : null} />
                    </div>
                    <div className="flex-1">
                        <InfoRow icon={Weight} label="Peso" value={data.weight ? `${data.weight} kg` : null} />
                    </div>
                </div>

                <InfoRow
                    icon={MapPin}
                    label="Lugar de Entreno"
                    value={
                        data.training_place === 'gym' ? 'Gimnasio Comercial' :
                            data.training_place === 'crossfit' ? 'Box de CrossFit' :
                                data.training_place === 'home' ? 'En Casa' : data.training_place
                    }
                />

                <InfoRow icon={Clock} label="Frecuencia" value={data.days_per_week ? `${data.days_per_week} días / semana` : null} />
                <InfoRow icon={Clock} label="Duración Sesión" value={data.minutes_per_session ? `${data.minutes_per_session} minutos` : null} />
                <InfoRow icon={Phone} label="WhatsApp" value={data.whatsapp} />
            </div>

            {/* Long Text Areas */}
            <div className="space-y-4 pt-2">
                {data.injuries && (
                    <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10">
                        <h4 className="text-sm font-bold text-red-500 mb-2 flex items-center gap-2">
                            <AlertCircle size={16} />
                            Lesiones / Molestias
                        </h4>
                        <p className="text-cv-text-secondary text-sm whitespace-pre-wrap">{data.injuries}</p>
                    </div>
                )}

                {data.preferences && (
                    <div className="p-4 rounded-lg bg-cv-bg-tertiary border border-cv-border">
                        <h4 className="text-sm font-bold text-cv-text-primary mb-2 flex items-center gap-2">
                            <MessageSquare size={16} className="text-cv-text-tertiary" />
                            Preferencias y Notas
                        </h4>
                        <p className="text-cv-text-secondary text-sm whitespace-pre-wrap">{data.preferences}</p>
                    </div>
                )}

                {data.equipment && (Array.isArray(data.equipment) ? data.equipment.length > 0 : !!data.equipment) && (
                    <div className="p-4 rounded-lg bg-cv-bg-tertiary border border-cv-border">
                        <h4 className="text-sm font-bold text-cv-text-primary mb-2 flex items-center gap-2">
                            <Weight size={16} className="text-cv-text-tertiary" />
                            Equipamiento Disponible
                        </h4>
                        <p className="text-cv-text-secondary text-sm whitespace-pre-wrap">
                            {Array.isArray(data.equipment) ? data.equipment.join(', ') : data.equipment}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
