'use client';

import { AppShell } from '@/components/app-shell';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    User,
    Palette,
    Bell,
    Database,
    Moon,
    Sun,
    Check,
    Save,
    Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const [darkMode, setDarkMode] = useState(true);
    const [notifications, setNotifications] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>({});

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUser(user);

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setProfile(data);
                // Set initial preferences if they exist
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profile.full_name,
                    whatsapp_number: profile.whatsapp_number,
                    // Add other fields as needed
                })
                .eq('id', user.id);

            if (error) throw error;
            // Show success toast or feedback
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AppShell title="Configuración">
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="animate-spin text-cv-accent" size={32} />
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell title="Configuración">
            <div className="max-w-2xl mx-auto pb-12">
                {/* Header removed as per user request */}

                {/* Settings Sections */}
                <div className="space-y-6">
                    {/* Profile */}
                    <div className="cv-card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-cv-text-primary flex items-center gap-2">
                                <User size={18} />
                                Perfil
                            </h2>

                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-cv-text-secondary mb-2">Nombre completo</label>
                                <input
                                    type="text"
                                    value={profile.full_name || ''}
                                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                    className="cv-input"
                                    placeholder="Tu nombre"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-cv-text-secondary mb-2">Correo</label>
                                <input
                                    type="email"
                                    value={profile.email || user?.email || ''}
                                    className="cv-input opacity-60 cursor-not-allowed"
                                    disabled
                                />
                                <p className="text-xs text-cv-text-tertiary mt-1">El correo no se puede cambiar</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-cv-text-secondary mb-2">WhatsApp</label>
                                <input
                                    type="tel"
                                    value={profile.whatsapp_number || ''}
                                    onChange={(e) => setProfile({ ...profile, whatsapp_number: e.target.value })}
                                    className="cv-input"
                                    placeholder="+54 9 11 1234 5678"
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                    className="cv-btn-primary flex items-center gap-2 px-4 py-2"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Appearance */}
                    <div className="cv-card">
                        <h2 className="font-semibold text-cv-text-primary mb-4 flex items-center gap-2">
                            <Palette size={18} />
                            Apariencia
                        </h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-cv-text-primary">Modo Oscuro</p>
                                <p className="text-sm text-cv-text-tertiary">Usar tema oscuro</p>
                            </div>
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-cv-accent' : 'bg-cv-bg-tertiary'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${darkMode ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="cv-card">
                        <h2 className="font-semibold text-cv-text-primary mb-4 flex items-center gap-2">
                            <Bell size={18} />
                            Notificaciones
                        </h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-cv-text-primary">Notificaciones por Correo</p>
                                <p className="text-sm text-cv-text-tertiary">Recibir actualizaciones por correo</p>
                            </div>
                            <button
                                onClick={() => setNotifications(!notifications)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-cv-accent' : 'bg-cv-bg-tertiary'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Database */}
                    <div className="cv-card">
                        <h2 className="font-semibold text-cv-text-primary mb-4 flex items-center gap-2">
                            <Database size={18} />
                            Datos
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-cv-bg-tertiary rounded-lg">
                                <span className="text-cv-text-primary">Conexión Supabase</span>
                                <span className="cv-badge-success flex items-center gap-1">
                                    <Check size={12} />
                                    Conectado
                                </span>
                            </div>
                            {profile.role && (
                                <div className="flex items-center justify-between p-3 bg-cv-bg-tertiary rounded-lg">
                                    <span className="text-cv-text-primary">Rol de Usuario</span>
                                    <span className="text-sm font-mono px-2 py-1 bg-cv-bg-secondary rounded border border-cv-border capitalize">
                                        {profile.role}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
