'use client';

import { AppShell } from '@/components/app-shell';
import { useState } from 'react';
import {
    User,
    Palette,
    Bell,
    Database,
    Moon,
    Sun,
    Check
} from 'lucide-react';

export default function SettingsPage() {
    const [darkMode, setDarkMode] = useState(true);
    const [notifications, setNotifications] = useState(true);

    return (
        <AppShell title="Configuración">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-cv-text-primary">Configuración</h1>
                    <p className="text-cv-text-secondary">Gestiona tu cuenta y preferencias</p>
                </div>

                {/* Settings Sections */}
                <div className="space-y-6">
                    {/* Profile */}
                    <div className="cv-card">
                        <h2 className="font-semibold text-cv-text-primary mb-4 flex items-center gap-2">
                            <User size={18} />
                            Perfil
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-cv-text-secondary mb-2">Nombre para mostrar</label>
                                <input
                                    type="text"
                                    defaultValue="Coach"
                                    className="cv-input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-cv-text-secondary mb-2">Correo</label>
                                <input
                                    type="email"
                                    defaultValue="coach@example.com"
                                    className="cv-input"
                                    disabled
                                />
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
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
