// Force rebuild: solo MAS final - 2026-02-02-1125
'use client';

import { Topbar } from '@/components/app-shell/Topbar';

import { getProfiles, updateUserRole, resetUserPassword, createUser, deleteUser, deleteClient } from '@/lib/actions';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Plus,
    Users,
    Shield,
    Lock,
    Loader2,
    CheckCircle2,
    AlertCircle,
    MoreVertical,
    UserPlus,
    X,
    ChevronDown,
    Trash2,
    Database,
    Globe
} from 'lucide-react';

interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: 'coach' | 'athlete' | 'admin' | null;
    created_at: string;
    updated_at: string;
    source?: 'auth' | 'client_only';
}

export default function AdminUsersPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const searchParams = useSearchParams();
    const searchTerm = searchParams.get('q') || '';
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Multi-select State
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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
            console.log('AdminUsersPage loaded profiles:', data);
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


    async function handleDeleteUser(userId: string) {
        if (!confirm('¿ESTÁS SEGURO? Esta acción eliminará permanentemente al usuario y todos sus datos. No se puede deshacer.')) return;

        setUpdatingId(userId);
        try {
            const user = profiles.find(p => p.id === userId);

            if (user?.source === 'client_only') {
                await deleteClient(userId);
            } else {
                await deleteUser(userId);
            }

            setMessage({ text: 'Usuario eliminado correctamente', type: 'success' });
            loadProfiles();
        } catch (err: any) {
            setMessage({ text: err.message || 'Error al eliminar usuario', type: 'error' });
        } finally {
            setUpdatingId(null);
        }
    }

    // Multi-select Handlers
    const filteredProfiles = profiles.filter(p =>
        (p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (p.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    );

    const toggleSelectAll = () => {
        if (selectedUsers.size === filteredProfiles.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(filteredProfiles.map(p => p.id)));
        }
    };

    const toggleSelectUser = (userId: string) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    async function handleBulkDelete() {
        if (selectedUsers.size === 0) return;
        if (!confirm(`¿ESTÁS SEGURO? Se eliminarán ${selectedUsers.size} usuarios permanentemente. Esta acción no se puede deshacer.`)) return;

        setIsBulkDeleting(true);
        setMessage(null);

        try {
            const deletePromises = Array.from(selectedUsers).map(userId => {
                const user = profiles.find(p => p.id === userId);
                if (user?.source === 'client_only') {
                    return deleteClient(userId);
                } else {
                    return deleteUser(userId);
                }
            });
            const results = await Promise.allSettled(deletePromises);

            const failures = results.filter(r => r.status === 'rejected');
            const successes = results.filter(r => r.status === 'fulfilled');

            if (failures.length > 0) {
                setMessage({
                    text: `Se eliminaron ${successes.length} usuarios. Error al eliminar ${failures.length} usuarios.`,
                    type: 'error'
                });
            } else {
                setMessage({ text: `${successes.length} usuarios eliminados correctamente`, type: 'success' });
            }

            setSelectedUsers(new Set());
            loadProfiles();
        } catch (err: any) {
            setMessage({ text: 'Error crítico en eliminación masiva', type: 'error' });
            console.error(err);
        } finally {
            setIsBulkDeleting(false);
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

    return (

        <>
            <Topbar
                title=""
                actions={
                    <div className="flex items-center gap-4">
                        {selectedUsers.size > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                disabled={isBulkDeleting}
                                className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                            >
                                {isBulkDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                Eliminar ({selectedUsers.size})
                            </button>
                        )}
                        <div className="flex items-center gap-2 px-2 text-cv-text-secondary">
                            <Users size={18} strokeWidth={1.5} />
                            <span className="font-medium text-sm">{filteredProfiles.length}</span>
                        </div>
                        <span className="text-xs text-cv-text-tertiary font-mono">v1.3</span>
                        <div className="w-px h-6 bg-cv-border-subtle mx-1" />
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all duration-200"
                            title="Crear Usuario"
                        >
                            <Plus size={20} strokeWidth={1.5} />
                        </button>
                    </div>
                }
            />
            <div className="max-w-7xl mx-auto space-y-4 pt-6">

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
                                        <th className="p-4 w-10">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-cv-border-subtle text-cv-accent focus:ring-cv-accent bg-cv-bg-primary"
                                                checked={filteredProfiles.length > 0 && selectedUsers.size === filteredProfiles.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th className="p-4 text-xs uppercase tracking-wider text-cv-text-tertiary font-semibold">Usuario</th>
                                        <th className="p-4 text-xs uppercase tracking-wider text-cv-text-tertiary font-semibold">Email</th>
                                        <th className="p-4 text-xs uppercase tracking-wider text-cv-text-tertiary font-semibold">Rol Actual</th>
                                        <th className="p-4 text-xs uppercase tracking-wider text-cv-text-tertiary font-semibold text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-cv-border-subtle">
                                    {filteredProfiles.map((user) => (
                                        <tr key={user.id} className={`hover:bg-cv-bg-tertiary/50 transition-colors ${selectedUsers.has(user.id) ? 'bg-cv-accent/5' : ''}`}>
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-cv-border-subtle text-cv-accent focus:ring-cv-accent bg-cv-bg-primary"
                                                    checked={selectedUsers.has(user.id)}
                                                    onChange={() => toggleSelectUser(user.id)}
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-cv-accent-muted flex items-center justify-center text-cv-accent font-bold">
                                                        {user.full_name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <span className="font-medium text-cv-text-primary">
                                                        {user.full_name || 'Sin nombre'}
                                                    </span>
                                                    {user.source === 'client_only' && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                                                            <Database size={10} />
                                                            MANUAL
                                                        </span>
                                                    )}
                                                    {user.source === 'auth' && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center gap-1">
                                                            <Globe size={10} />
                                                            CUENTA
                                                        </span>
                                                    )}
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
                                                        disabled={updatingId === user.id || user.source === 'client_only'}
                                                        title={user.source === 'client_only' ? 'Usuarios manuales no tienen rol de sistema' : 'Cambiar rol'}
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
                                                    disabled={updatingId === user.id || user.source === 'client_only'}
                                                    className={`p-2 rounded-lg transition-colors ${user.source === 'client_only'
                                                        ? 'text-gray-300 cursor-not-allowed'
                                                        : 'hover:bg-cv-bg-elevated text-cv-text-tertiary hover:text-cv-text-primary'}`}
                                                    title={user.source === 'client_only' ? 'Sin cuenta de acceso (User Manual)' : 'Resetear Contraseña'}
                                                >
                                                    {updatingId === user.id ? (
                                                        <Loader2 size={18} className="animate-spin" />
                                                    ) : (
                                                        <Lock size={18} />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    disabled={updatingId === user.id}
                                                    className="p-2 rounded-lg transition-colors hover:bg-red-500/10 text-cv-text-tertiary hover:text-red-500"
                                                    title="Eliminar Usuario"
                                                >
                                                    {updatingId === user.id ? (
                                                        <Loader2 size={18} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={18} />
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
        </>
    );
}
