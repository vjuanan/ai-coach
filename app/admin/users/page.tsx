'use client';

import { AppShell } from '@/components/app-shell';
import { getProfiles, updateUserRole, resetUserPassword, createUser } from '@/lib/actions';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Users,
    Shield,
    Lock,
    Loader2,
    CheckCircle2,
    AlertCircle,
    MoreVertical,
    UserPlus,
    X,
    ChevronDown
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
    const searchParams = useSearchParams();
    const searchTerm = searchParams.get('q') || '';
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newUser, setNewUser] = useState({
        email: '',
        fullName: '',
        password: '',
        role: 'athlete' as 'coach' | 'athlete' | 'admin'
    });

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

    async function handleCreateUser(e: React.FormEvent) {
        e.preventDefault();
        setIsCreating(true);
        setMessage(null);

        try {
            const res = await createUser({
                email: newUser.email,
                password: newUser.password || undefined,
                fullName: newUser.fullName,
                role: newUser.role
            });

            if (res.success) {
                setMessage({ text: res.message || 'Usuario creado', type: 'success' });
                setIsCreateOpen(false);
                setNewUser({ email: '', fullName: '', password: '', role: 'athlete' }); // Reset form
                loadProfiles();
            } else {
                setMessage({ text: 'Error desconocido', type: 'error' });
            }
        } catch (err: any) {
            console.error(err);
            setMessage({ text: err.message || 'Error al crear usuario', type: 'error' });
        } finally {
            setIsCreating(false);
        }
    }

    const filteredProfiles = profiles.filter(p =>
        (p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (p.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    );

    return (
        <AppShell title="Administración de Usuarios">
            <div className="max-w-7xl mx-auto space-y-4">

                {/* Action Buttons & Feedback */}
                <div className="flex items-center justify-end gap-3">
                    <div className="bg-cv-bg-tertiary p-2 rounded-lg border border-cv-border-subtle flex items-center gap-2">
                        <Users className="text-cv-text-secondary" size={18} />
                        <span className="font-mono font-bold text-cv-text-primary text-sm">{filteredProfiles.length}</span>
                    </div>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="cv-btn-primary flex items-center gap-2"
                    >
                        <UserPlus size={18} />
                        Crear Usuario
                    </button>
                </div>

                {message && (
                    <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                        {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        {message.text}
                    </div>
                )}

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

                {/* Create User Modal */}
                {isCreateOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-cv-bg-secondary rounded-xl shadow-xl w-full max-w-md border border-cv-border-subtle animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-cv-border-subtle flex justify-between items-center">
                                <h2 className="text-xl font-bold text-cv-text-primary">Crear Nuevo Usuario</h2>
                                <button onClick={() => setIsCreateOpen(false)} className="text-cv-text-tertiary hover:text-cv-text-primary">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-cv-text-secondary">Nombre Completo</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-2 rounded-lg bg-cv-bg-tertiary border border-cv-border-subtle text-cv-text-primary focus:outline-none focus:border-cv-accent"
                                        value={newUser.fullName}
                                        onChange={e => setNewUser({ ...newUser, fullName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-cv-text-secondary">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full p-2 rounded-lg bg-cv-bg-tertiary border border-cv-border-subtle text-cv-text-primary focus:outline-none focus:border-cv-accent"
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-cv-text-secondary">Contraseña (Opcional)</label>
                                    <input
                                        type="password"
                                        placeholder="Por defecto: tempPass123!"
                                        className="w-full p-2 rounded-lg bg-cv-bg-tertiary border border-cv-border-subtle text-cv-text-primary focus:outline-none focus:border-cv-accent"
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-cv-text-secondary">Rol Inicial</label>
                                    <div className="relative">
                                        <select
                                            className="w-full p-2 rounded-lg bg-cv-bg-tertiary border border-cv-border-subtle text-cv-text-primary focus:outline-none focus:border-cv-accent appearance-none"
                                            value={newUser.role}
                                            onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}
                                        >
                                            <option value="athlete">Atleta</option>
                                            <option value="coach">Entrenador</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-cv-text-tertiary pointer-events-none" size={16} />
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateOpen(false)}
                                        className="cv-btn-secondary flex-1 justify-center"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="cv-btn-primary flex-1 justify-center"
                                    >
                                        {isCreating ? <Loader2 className="animate-spin" /> : 'Crear Usuario'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
