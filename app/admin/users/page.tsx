'use client';

import { AppShell } from '@/components/app-shell';
import { getProfiles, updateUserRole, resetUserPassword } from '@/lib/actions';
import { useState, useEffect } from 'react';
import {
    Users,
    Shield,
    Lock,
    Search,
    Loader2,
    CheckCircle2,
    AlertCircle,
    MoreVertical
} from 'lucide-react';

interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: 'coach' | 'athlete' | 'admin' | null;
    created_at: string;
    updated_at: string;
}

export default function AdminUsersPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        loadProfiles();
    }, []);

    async function loadProfiles() {
        try {
            const data = await getProfiles();
            setProfiles(data as Profile[]);
        } catch (err) {
            console.error(err);
            setMessage({ text: 'Error al cargar usuarios', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }

    async function handleRoleUpdate(userId: string, newRole: 'coach' | 'athlete' | 'admin') {
        if (!confirm(`¿Estás seguro de cambiar el rol a ${newRole}?`)) return;

        setUpdatingId(userId);
        try {
            await updateUserRole(userId, newRole);
            setMessage({ text: 'Rol actualizado correctamente', type: 'success' });
            loadProfiles(); // Reload to confirm
        } catch (err: any) {
            setMessage({ text: err.message || 'Error al actualizar rol', type: 'error' });
        } finally {
            setUpdatingId(null);
        }
    }

    async function handlePasswordReset(userId: string) {
        if (!confirm('¿Enviar correo de restablecimiento de contraseña a este usuario?')) return;

        setUpdatingId(userId);
        try {
            const res = await resetUserPassword(userId);
            setMessage({ text: res.message || 'Correo enviado', type: 'success' });
        } catch (err: any) {
            setMessage({ text: err.message || 'Error al enviar correo', type: 'error' });
        } finally {
            setUpdatingId(null);
        }
    }

    const filteredProfiles = profiles.filter(p =>
        (p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (p.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    );

    return (
        <AppShell title="Administración de Usuarios">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header & Feedback */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-cv-text-primary">Usuarios y Roles</h1>
                            <p className="text-cv-text-secondary">Gestiona el acceso y roles de todos los usuarios de la plataforma.</p>
                        </div>
                        <div className="bg-cv-bg-tertiary p-2 rounded-lg border border-cv-border-subtle flex items-center gap-2">
                            <Users className="text-cv-text-secondary" size={20} />
                            <span className="font-mono font-bold text-cv-text-primary">{profiles.length}</span>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            {message.text}
                        </div>
                    )}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cv-text-tertiary" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-cv-bg-tertiary border border-cv-border-subtle rounded-lg text-cv-text-primary focus:outline-none focus:border-cv-accent transition-colors"
                    />
                </div>

                {/* Table */}
                <div className="bg-cv-bg-secondary rounded-xl overflow-hidden shadow-sm border border-cv-border-subtle">
                    {isLoading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="animate-spin text-cv-accent" size={32} />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-cv-bg-tertiary border-b border-cv-border-subtle">
                                        <th className="p-4 text-xs uppercase tracking-wider text-cv-text-tertiary font-semibold">Usuario</th>
                                        <th className="p-4 text-xs uppercase tracking-wider text-cv-text-tertiary font-semibold">Email</th>
                                        <th className="p-4 text-xs uppercase tracking-wider text-cv-text-tertiary font-semibold">Rol Actual</th>
                                        <th className="p-4 text-xs uppercase tracking-wider text-cv-text-tertiary font-semibold text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-cv-border-subtle">
                                    {filteredProfiles.map((user) => (
                                        <tr key={user.id} className="hover:bg-cv-bg-tertiary/50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-cv-accent-muted flex items-center justify-center text-cv-accent font-bold">
                                                        {user.full_name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <span className="font-medium text-cv-text-primary">
                                                        {user.full_name || 'Sin nombre'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-cv-text-secondary font-mono text-sm">
                                                {user.email || 'N/A'}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={user.role || ''}
                                                        onChange={(e) => handleRoleUpdate(user.id, e.target.value as any)}
                                                        className={`bg-transparent text-sm font-medium border-none focus:ring-0 cursor-pointer py-1 px-2 rounded ${user.role === 'admin' ? 'text-purple-400 bg-purple-500/10' :
                                                                user.role === 'coach' ? 'text-blue-400 bg-blue-500/10' :
                                                                    user.role === 'athlete' ? 'text-green-400 bg-green-500/10' :
                                                                        'text-yellow-400 bg-yellow-500/10'
                                                            }`}
                                                        disabled={updatingId === user.id}
                                                    >
                                                        <option value="" className="bg-cv-bg-primary">Sin Rol</option>
                                                        <option value="athlete" className="bg-cv-bg-primary">Atleta</option>
                                                        <option value="coach" className="bg-cv-bg-primary">Entrenador</option>
                                                        <option value="admin" className="bg-cv-bg-primary">Administrador</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handlePasswordReset(user.id)}
                                                    disabled={updatingId === user.id}
                                                    className="p-2 hover:bg-cv-bg-elevated rounded-lg text-cv-text-tertiary hover:text-cv-text-primary transition-colors"
                                                    title="Resetear Contraseña"
                                                >
                                                    {updatingId === user.id ? (
                                                        <Loader2 size={18} className="animate-spin" />
                                                    ) : (
                                                        <Lock size={18} />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredProfiles.length === 0 && (
                                <div className="p-8 text-center text-cv-text-tertiary">
                                    No se encontraron usuarios.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
