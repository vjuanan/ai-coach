'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    User,
    Palette,
    Bell,
    Database,
    Camera,
    LogOut,
    Save,
    Check,
    Loader2,
    Dumbbell
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SettingsFormProps {
    user: any;
    initialProfile: any;
}

export function SettingsForm({ user, initialProfile }: SettingsFormProps) {
    const [darkMode, setDarkMode] = useState(true);
    const [notifications, setNotifications] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<any>(initialProfile || {});

    const supabase = createClient();
    const router = useRouter();

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            // 1. Update Profile in Database
            // We use spread to include all dynamic fields (athlete stats, etc)
            const payload = {
                full_name: profile.full_name,
                whatsapp_number: profile.whatsapp_number,
                birth_date: profile.birth_date,
                height: profile.height,
                weight: profile.weight,
                main_goal: profile.main_goal,
                training_place: profile.training_place,
                days_per_week: profile.days_per_week,
                minutes_per_session: profile.minutes_per_session,
                experience_level: profile.experience_level,
                injuries: profile.injuries,
                training_preferences: profile.training_preferences,
                equipment_list: profile.equipment_list
            };

            const { error } = await supabase
                .from('profiles')
                .update(payload)
                .eq('id', user.id);

            if (error) throw error;

            // 2. Update Auth Metadata (so headers/dashboard update instantly)
            const { error: authError } = await supabase.auth.updateUser({
                data: { full_name: profile.full_name }
            });

            if (authError) {
                console.error('Error syncing auth metadata:', authError);
                // We don't throw here to avoid rollback of the DB update, 
                // but we log it. The DB is the source of truth, but Auth is used for UI.
            }

            router.refresh(); // Refresh server data
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push('/login');
    };

    return (
        <div className="h-full">
            {/* 2-Column Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                {/* Left Column - Profile */}
                <div className="space-y-4">
                    <div className="cv-card h-fit">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-semibold text-cv-text-primary flex items-center gap-2">
                                <User size={18} />
                                Perfil
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {/* Avatar and Photo Section - Inline */}
                            <div className="flex items-center gap-4 pb-4 border-b border-cv-border">
                                <div className="relative group flex-shrink-0">
                                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cv-border bg-cv-bg-tertiary">
                                        {profile.avatar_url ? (
                                            <img
                                                src={profile.avatar_url}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-cv-accent/10 text-cv-accent text-xl font-bold">
                                                {profile.full_name
                                                    ? profile.full_name
                                                        .split(' ')
                                                        .map((n: string) => n[0])
                                                        .join('')
                                                        .substring(0, 2)
                                                        .toUpperCase()
                                                    : 'U'}
                                            </div>
                                        )}
                                        {/* Overlay for hover */}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                                            <Camera size={18} className="text-white" />
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            if (file.size > 5 * 1024 * 1024) {
                                                alert('La imagen no debe superar los 5MB');
                                                return;
                                            }

                                            setSaving(true);
                                            try {
                                                const fileExt = file.name.split('.').pop();
                                                const fileName = `${user.id}/${Math.random()}.${fileExt}`;
                                                const filePath = `${fileName}`;

                                                const { error: uploadError } = await supabase.storage
                                                    .from('avatars')
                                                    .upload(filePath, file);

                                                if (uploadError) throw uploadError;

                                                const { data: { publicUrl } } = supabase.storage
                                                    .from('avatars')
                                                    .getPublicUrl(filePath);

                                                const { error: updateError } = await supabase
                                                    .from('profiles')
                                                    .update({ avatar_url: publicUrl })
                                                    .eq('id', user.id);

                                                if (updateError) throw updateError;

                                                setProfile({ ...profile, avatar_url: publicUrl });
                                                router.refresh();

                                            } catch (error) {
                                                console.error('Error uploading avatar:', error);
                                                alert('Error al subir la imagen');
                                            } finally {
                                                setSaving(false);
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-cv-text-primary text-sm">Foto de Perfil</h3>
                                    <p className="text-xs text-cv-text-tertiary">
                                        Click para cambiar. Min 400x400px.
                                    </p>
                                </div>
                            </div>

                            {/* Form Fields - Generic */}
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-cv-text-secondary mb-1">Nombre completo</label>
                                    <input
                                        type="text"
                                        value={profile.full_name || ''}
                                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                        className="cv-input py-2"
                                        placeholder="Tu nombre"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-cv-text-secondary mb-1">Correo</label>
                                    <input
                                        type="email"
                                        value={profile.email || user?.email || ''}
                                        className="cv-input py-2 opacity-60 cursor-not-allowed"
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-cv-text-secondary mb-1">WhatsApp</label>
                                    <input
                                        type="tel"
                                        value={profile.whatsapp_number || ''}
                                        onChange={(e) => setProfile({ ...profile, whatsapp_number: e.target.value })}
                                        className="cv-input py-2"
                                        placeholder="+54 9 11 1234 5678"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Athlete Specific Fields */}
                    {profile.role === 'athlete' && (
                        <div className="cv-card h-fit">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="font-semibold text-cv-text-primary flex items-center gap-2">
                                    <Dumbbell size={18} />
                                    Datos Deportivos
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-cv-text-secondary mb-1">Fecha Nacimiento</label>
                                        <input
                                            type="date"
                                            value={profile.birth_date || ''}
                                            onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
                                            className="cv-input py-2"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium text-cv-text-secondary mb-1">Altura (cm)</label>
                                            <input
                                                type="number"
                                                value={profile.height || ''}
                                                onChange={(e) => setProfile({ ...profile, height: e.target.value ? parseInt(e.target.value) : null })}
                                                className="cv-input py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-cv-text-secondary mb-1">Peso (kg)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={profile.weight || ''}
                                                onChange={(e) => setProfile({ ...profile, weight: e.target.value ? parseFloat(e.target.value) : null })}
                                                className="cv-input py-2"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-cv-text-secondary mb-1">Lugar Entrenamiento</label>
                                        <select
                                            value={profile.training_place || 'gym'}
                                            onChange={(e) => setProfile({ ...profile, training_place: e.target.value })}
                                            className="cv-input py-2"
                                        >
                                            <option value="gym">Gimnasio</option>
                                            <option value="crossfit">Box CrossFit</option>
                                            <option value="home">Casa</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-cv-text-secondary mb-1">Objetivo</label>
                                        <select
                                            value={profile.main_goal || 'hypertrophy'}
                                            onChange={(e) => setProfile({ ...profile, main_goal: e.target.value })}
                                            className="cv-input py-2"
                                        >
                                            <option value="hypertrophy">Hipertrofia</option>
                                            <option value="fat_loss">Pérdida de Grasa</option>
                                            <option value="performance">Rendimiento</option>
                                            <option value="maintenance">Mantenimiento</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-cv-text-secondary mb-1">Días por semana</label>
                                        <input
                                            type="number"
                                            value={profile.days_per_week || ''}
                                            onChange={(e) => setProfile({ ...profile, days_per_week: parseInt(e.target.value) })}
                                            className="cv-input py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-cv-text-secondary mb-1">Mins por sesión</label>
                                        <input
                                            type="number"
                                            value={profile.minutes_per_session || ''}
                                            onChange={(e) => setProfile({ ...profile, minutes_per_session: parseInt(e.target.value) })}
                                            className="cv-input py-2"
                                        />
                                    </div>
                                </div>

                                {profile.training_place === 'home' && (
                                    <div>
                                        <label className="block text-xs font-medium text-cv-text-secondary mb-1">Equipo Disponible (Items separados por coma)</label>
                                        <textarea
                                            value={Array.isArray(profile.equipment_list) ? profile.equipment_list.join(', ') : (profile.equipment_list || '')}
                                            onChange={(e) => setProfile({ ...profile, equipment_list: e.target.value.split(',').map((s: string) => s.trim()) })}
                                            className="cv-input py-2 min-h-[60px]"
                                            placeholder="Mancuernas, Barra, Banco..."
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-medium text-cv-text-secondary mb-1">Lesiones</label>
                                    <textarea
                                        value={profile.injuries || ''}
                                        onChange={(e) => setProfile({ ...profile, injuries: e.target.value })}
                                        className="cv-input py-2 min-h-[60px]"
                                        placeholder="Describe tus lesiones si tienes..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-1">
                        <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="cv-btn-primary flex items-center gap-2 px-4 py-2 text-sm w-full justify-center md:w-auto"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Guardar Cambios
                        </button>
                    </div>
                </div>

                {/* Right Column - Other Settings */}
                <div className="space-y-4">
                    {/* Appearance */}
                    <div className="cv-card">
                        <h2 className="font-semibold text-cv-text-primary mb-3 flex items-center gap-2">
                            <Palette size={18} />
                            Apariencia
                        </h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-cv-text-primary text-sm">Modo Oscuro</p>
                                <p className="text-xs text-cv-text-tertiary">Usar tema oscuro</p>
                            </div>
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`w-11 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-cv-accent' : 'bg-cv-bg-tertiary'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${darkMode ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="cv-card">
                        <h2 className="font-semibold text-cv-text-primary mb-3 flex items-center gap-2">
                            <Bell size={18} />
                            Notificaciones
                        </h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-cv-text-primary text-sm">Notificaciones por Correo</p>
                                <p className="text-xs text-cv-text-tertiary">Recibir actualizaciones por correo</p>
                            </div>
                            <button
                                onClick={() => setNotifications(!notifications)}
                                className={`w-11 h-6 rounded-full transition-colors relative ${notifications ? 'bg-cv-accent' : 'bg-cv-bg-tertiary'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Database */}
                    <div className="cv-card">
                        <h2 className="font-semibold text-cv-text-primary mb-3 flex items-center gap-2">
                            <Database size={18} />
                            Datos
                        </h2>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 bg-cv-bg-tertiary rounded-lg">
                                <span className="text-cv-text-primary text-sm">Conexión Supabase</span>
                                <span className="cv-badge-success flex items-center gap-1 text-xs">
                                    <Check size={10} />
                                    Conectado
                                </span>
                            </div>
                            {profile.role && (
                                <div className="flex items-center justify-between p-2 bg-cv-bg-tertiary rounded-lg">
                                    <span className="text-cv-text-primary text-sm">Rol de Usuario</span>
                                    <span className="text-xs font-mono px-2 py-0.5 bg-cv-bg-secondary rounded border border-cv-border capitalize">
                                        {profile.role}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Logout Button */}
                    <div className="cv-card border-red-500/20">
                        <h2 className="font-semibold text-cv-text-primary mb-3 flex items-center gap-2">
                            <LogOut size={18} />
                            Sesión
                        </h2>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors text-sm font-medium"
                        >
                            <LogOut size={16} />
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
