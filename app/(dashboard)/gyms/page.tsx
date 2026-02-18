'use client';

import { Topbar } from '@/components/app-shell/Topbar';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { useState, useEffect } from 'react';
import { useEscapeKey } from '@/hooks/use-escape-key';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    getClients,
    createClient,
    deleteClient,
    getCoaches,
    assignClientToCoach
} from '@/lib/actions';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Plus,
    Building2,
    Trash2,
    Loader2,
    AlertTriangle,
    X,
    CheckCircle2,
    MapPin,
    User,
    Mail
} from 'lucide-react';

interface Coach {
    id: string;
    full_name: string;
    business_name: string | null;
}

interface Gym {
    id: string;
    name: string;
    logo_url: string | null;
    type: 'gym';
    details: any;
    created_at: string;
    coach_id: string;
    contract_date?: string;
    service_start_date?: string;
    service_end_date?: string;
    payment_status?: string;
    coach?: {
        full_name: string;
        business_name: string;
    };
}

export default function GymsPage() {
    const [gyms, setGyms] = useState<Gym[]>([]);
    const [coaches, setCoaches] = useState<Coach[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q') || '';

    const [showAddModal, setShowAddModal] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    // Enhanced Gym Form State
    const [formData, setFormData] = useState({
        name: '',
        ownerName: '',
        location: '',
        memberCount: '',
        equipment: {
            rig: false,
            sleds: false,
            skiErgs: false,
            assaultBikes: false,
            rowers: false,
            pool: false
        }
    });

    // Alert Modal State
    const [gymToDelete, setGymToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Multi-select State
    const [selectedGyms, setSelectedGyms] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [bulkDeleteMessage, setBulkDeleteMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEscapeKey(() => setShowAddModal(false), showAddModal);
    useEscapeKey(() => !isDeleting && setGymToDelete(null), !!gymToDelete);

    const router = useRouter();

    useEffect(() => {
        fetchGyms();
    }, []);

    async function fetchGyms() {
        setIsLoading(true);
        try {
            const [gymsData, coachesData] = await Promise.all([
                getClients('gym'),
                getCoaches()
            ]);
            if (gymsData) setGyms(gymsData as Gym[]);
            if (coachesData) setCoaches(coachesData);
        } catch (error) {
            console.error('Error fetching gyms:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function addGym() {
        if (!formData.name.trim()) return;
        setIsAdding(true);

        try {
            await createClient({
                type: 'gym',
                name: formData.name,
                details: {
                    ownerName: formData.ownerName,
                    location: formData.location,
                    memberCount: formData.memberCount ? parseInt(formData.memberCount) : null,
                    equipment: formData.equipment
                }
            });

            setFormData({
                name: '',
                ownerName: '',
                location: '',
                memberCount: '',
                equipment: {
                    rig: false,
                    sleds: false,
                    skiErgs: false,
                    assaultBikes: false,
                    rowers: false,
                    pool: false
                }
            });
            setShowAddModal(false);
            fetchGyms();
        } catch (e) {
            alert('Error al añadir gimnasio');
        }
        setIsAdding(false);
    }

    function promptDelete(e: React.MouseEvent, id: string) {
        e.preventDefault();
        e.stopPropagation();
        setGymToDelete(id);
    }

    async function confirmDelete() {
        if (!gymToDelete) return;
        setIsDeleting(true);
        try {
            await deleteClient(gymToDelete);
            await fetchGyms();
        } catch (e) {
            console.error(e);
            alert('Error al eliminar gimnasio');
        } finally {
            setIsDeleting(false);
            setGymToDelete(null);
        }
    }

    const filteredGyms = gyms.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.details?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g as any).email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSelectAll = () => {
        if (selectedGyms.size === filteredGyms.length) {
            setSelectedGyms(new Set());
        } else {
            setSelectedGyms(new Set(filteredGyms.map(g => g.id)));
        }
    };

    const toggleSelectGym = (id: string) => {
        const newSelected = new Set(selectedGyms);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedGyms(newSelected);
    };

    async function handleBulkDelete() {
        if (selectedGyms.size === 0) return;
        if (!confirm(`¿ESTÁS SEGURO? Se eliminarán ${selectedGyms.size} gimnasios permanentemente. Esta acción no se puede deshacer.`)) return;

        setIsBulkDeleting(true);
        setBulkDeleteMessage(null);

        try {
            const deletePromises = Array.from(selectedGyms).map(id => deleteClient(id));
            const results = await Promise.allSettled(deletePromises);

            const failures = results.filter(r => r.status === 'rejected');
            const successes = results.filter(r => r.status === 'fulfilled');

            if (failures.length > 0) {
                setBulkDeleteMessage({
                    text: `Se eliminaron ${successes.length} gimnasios. Error al eliminar ${failures.length} gimnasios.`,
                    type: 'error'
                });
            } else {
                setBulkDeleteMessage({ text: `${successes.length} gimnasios eliminados correctamente`, type: 'success' });
            }

            setSelectedGyms(new Set());
            fetchGyms();
        } catch (err: any) {
            console.error(err);
            setBulkDeleteMessage({ text: 'Error crítico en eliminación masiva', type: 'error' });
        } finally {
            setIsBulkDeleting(false);
        }

        const getStatusColor = (status?: string) => {
            switch (status) {
                case 'current':
                case 'paid':
                    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
                case 'overdue':
                case 'unpaid':
                    return 'bg-rose-50 text-rose-700 border-rose-100';
                case 'pending':
                    return 'bg-amber-50 text-amber-700 border-amber-100';
                default:
                    return 'bg-slate-50 text-slate-700 border-slate-100';
            }
        };

        const getStatusLabel = (status?: string) => {
            switch (status) {
                case 'current': return 'Al Día';
                case 'paid': return 'Pagado';
                case 'overdue': return 'Vencido';
                case 'unpaid': return 'Impago';
                case 'pending': return 'Pendiente';
                default: return 'Desconocido';
            }
        };

        const formatDate = (dateString?: string) => {
            if (!dateString) return '-';
            return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
        };

        const handleCoachChange = async (clientId: string, newCoachId: string) => {
            setUpdatingId(clientId);
            try {
                await assignClientToCoach(clientId, newCoachId);
                await fetchGyms();
            } catch (error) {
                console.error('Error assigning coach:', error);
                alert('Error al asignar coach');
            } finally {
                setUpdatingId(null);
            }
        };

        return (
            <>

                <Topbar />
                <div className="max-w-6xl mx-auto">
                    <PageHeader
                        title="Gimnasios"
                        actions={
                            <>
                                {selectedGyms.size > 0 && (
                                    <button
                                        onClick={handleBulkDelete}
                                        disabled={isBulkDeleting}
                                        className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors mr-2"
                                    >
                                        {isBulkDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                        Eliminar ({selectedGyms.size})
                                    </button>
                                )}
                                <div className="bg-slate-100 px-3 py-1.5 rounded-md flex items-center gap-2">
                                    <Building2 className="text-cv-text-secondary" size={16} />
                                    <span className="font-mono font-bold text-cv-text-primary text-sm">{filteredGyms.length}</span>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all duration-200"
                                    title="Añadir Gimnasio"
                                >
                                    <Plus size={20} />
                                </button>
                            </>
                        }
                    />

                    {bulkDeleteMessage && (
                        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${bulkDeleteMessage.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                            {bulkDeleteMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                            {bulkDeleteMessage.text}
                        </div>
                    )}

                    {/* Content */}
                    <div className="bg-cv-bg-secondary rounded-xl overflow-hidden shadow-sm border border-cv-border-subtle">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="animate-spin text-cv-accent" size={32} />
                            </div>
                        ) : filteredGyms.length === 0 ? (
                            <div className="text-center py-12">
                                <Building2 size={48} className="mx-auto text-cv-text-tertiary mb-4" />
                                <p className="text-cv-text-secondary">No hay gimnasios aún</p>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="cv-btn-primary mt-4"
                                >
                                    <Plus size={18} />
                                    Añade tu primer gimnasio
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-cv-bg-tertiary border-b border-cv-border-subtle">
                                        <tr>
                                            <th className="p-4 w-10">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-cv-border-subtle text-cv-accent focus:ring-cv-accent bg-cv-bg-primary"
                                                    checked={filteredGyms.length > 0 && selectedGyms.size === filteredGyms.length}
                                                    onChange={toggleSelectAll}
                                                />
                                            </th>
                                            <th className="p-4 text-xs uppercase tracking-wider text-cv-text-tertiary font-semibold">Gimnasio</th>
                                            <th className="p-4 text-xs uppercase tracking-wider text-cv-text-tertiary font-semibold">Gimnasio</th>
                                            <th className="p-4 text-xs uppercase tracking-wider text-cv-text-tertiary font-semibold">Account Manager</th>
                                            <th className="p-4 text-xs uppercase tracking-wider text-cv-text-tertiary font-semibold">Detalles</th>
                                            <th className="p-4 text-xs uppercase tracking-wider text-cv-text-tertiary font-semibold">Propietario / Contacto</th>
                                            <th className="p-4 text-xs uppercase tracking-wider text-cv-text-tertiary font-semibold">Servicio</th>
                                            <th className="p-4 text-xs uppercase tracking-wider text-cv-text-tertiary font-semibold">Estado</th>
                                            <th className="p-4 text-xs uppercase tracking-wider text-cv-text-tertiary font-semibold text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cv-border-subtle">
                                        {filteredGyms
                                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                            .map((gym) => (
                                                <tr
                                                    key={gym.id}
                                                    className="hover:bg-cv-bg-tertiary/50 transition-colors group cursor-pointer"
                                                    onClick={() => router.push(`/gyms/${gym.id}`)}
                                                >
                                                    <td className="p-4">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded border-cv-border-subtle text-cv-accent focus:ring-cv-accent bg-cv-bg-primary pointer-events-auto"
                                                            checked={selectedGyms.has(gym.id)}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                toggleSelectGym(gym.id);
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold">
                                                                <Building2 size={20} />
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-cv-text-primary block">{gym.name}</span>
                                                                {(gym as any).email && (
                                                                    <span className="text-xs text-cv-text-tertiary flex items-center gap-1 mt-0.5">
                                                                        <Mail size={10} />
                                                                        {(gym as any).email}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                value={gym.coach_id || ''}
                                                                onChange={(e) => handleCoachChange(gym.id, e.target.value)}
                                                                disabled={updatingId === gym.id}
                                                                className="w-full max-w-[150px] px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:opacity-50 transition-all cursor-pointer hover:border-slate-300"
                                                            >
                                                                <option value="" disabled>Seleccionar AM</option>
                                                                {coaches.map((coach) => (
                                                                    <option key={coach.id} value={coach.id}>
                                                                        {coach.business_name || coach.full_name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {updatingId === gym.id && (
                                                                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-cv-text-secondary text-sm">
                                                        <div className="space-y-1">
                                                            {gym.details?.location && (
                                                                <div className="flex items-center gap-1.5 text-cv-text-tertiary">
                                                                    <MapPin size={14} className="shrink-0" />
                                                                    <span>{gym.details.location}</span>
                                                                </div>
                                                            )}
                                                            {gym.details?.memberCount && (
                                                                <div className="text-xs bg-cv-bg-tertiary px-1.5 py-0.5 rounded inline-block border border-cv-border-subtle">
                                                                    {gym.details.memberCount} miembros
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-cv-text-secondary text-sm">
                                                        {gym.details?.ownerName ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <User size={14} className="text-cv-text-tertiary" />
                                                                {gym.details.ownerName}
                                                            </div>
                                                        ) : (
                                                            <span className="text-cv-text-tertiary italic">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-1 text-xs text-cv-text-secondary">
                                                            <span title="Inicio Servicio">
                                                                <span className="font-medium">Inicio:</span> {formatDate(gym.service_start_date)}
                                                            </span>
                                                            <span title="Fin Servicio">
                                                                <span className="font-medium">Fin:</span> {formatDate(gym.service_end_date)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge variant="outline" className={`font-normal border ${getStatusColor(gym.payment_status)}`}>
                                                            {getStatusLabel(gym.payment_status)}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                            <Link
                                                                href={`/gyms/${gym.id}`}
                                                                className="p-2 hover:bg-cv-bg-elevated rounded-lg text-cv-text-tertiary hover:text-cv-text-primary transition-colors"
                                                                title="Ver Gimnasio"
                                                            >
                                                                <Building2 size={18} />
                                                            </Link>
                                                            <button
                                                                onClick={(e) => promptDelete(e, gym.id)}
                                                                className="p-2 hover:bg-red-500/10 rounded-lg text-cv-text-tertiary hover:text-red-500 transition-colors"
                                                                title="Eliminar Gimnasio"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Add Modal */}
                    {showAddModal && (
                        <>
                            <div className="cv-overlay" onClick={() => setShowAddModal(false)} />
                            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-cv-bg-secondary border border-cv-border rounded-lg p-6 z-50 max-h-[90vh] overflow-y-auto">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-cv-text-primary">Nuevo Gimnasio / Cliente B2B</h2>
                                    <button onClick={() => setShowAddModal(false)} className="cv-btn-ghost p-1">
                                        <X size={18} className="text-cv-text-tertiary" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Gym Info */}
                                    <div>
                                        <label className="block text-sm font-medium text-cv-text-secondary mb-2">Nombre del Gimnasio *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="CrossFit Downtown"
                                            className="cv-input"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-cv-text-secondary mb-2">Ubicación</label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                            placeholder="Madrid, España"
                                            className="cv-input"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-cv-text-secondary mb-2">Propietario / Contacto</label>
                                            <input
                                                type="text"
                                                value={formData.ownerName}
                                                onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                                                placeholder="Juan Pérez"
                                                className="cv-input"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-cv-text-secondary mb-2">Miembros (aprox)</label>
                                            <input
                                                type="number"
                                                value={formData.memberCount}
                                                onChange={(e) => setFormData(prev => ({ ...prev, memberCount: e.target.value }))}
                                                placeholder="150"
                                                className="cv-input"
                                            />
                                        </div>
                                    </div>

                                    {/* Equipment Config */}
                                    <div className="border-t border-cv-border pt-4 mt-4">
                                        <label className="block text-sm font-medium text-cv-text-primary mb-3">Equipamiento Disponible</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { key: 'rig', label: 'Rack / Estructura' },
                                                { key: 'sleds', label: 'Trineos / Prowlers' },
                                                { key: 'skiErgs', label: 'SkiErgs' },
                                                { key: 'assaultBikes', label: 'Assault Bikes / Echo' },
                                                { key: 'rowers', label: 'Remos (C2)' },
                                                { key: 'pool', label: 'Piscina' }
                                            ].map((item) => (
                                                <label key={item.key} className="flex items-center gap-2 p-2 rounded-md bg-cv-bg-tertiary border border-cv-border cursor-pointer hover:bg-slate-700/50 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.equipment[item.key as keyof typeof formData.equipment]}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            equipment: { ...prev.equipment, [item.key]: e.target.checked }
                                                        }))}
                                                        className="w-4 h-4 rounded border-cv-border text-cv-accent focus:ring-cv-accent bg-transparent"
                                                    />
                                                    <span className="text-sm text-cv-text-secondary">{item.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="cv-btn-secondary flex-1"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={addGym}
                                        disabled={!formData.name.trim() || isAdding}
                                        className="cv-btn-primary flex-1"
                                    >
                                        {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                        Guardar Gimnasio
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Delete Confirmation Modal */}
                    {gymToDelete && (
                        <>
                            <div className="cv-overlay" onClick={() => !isDeleting && setGymToDelete(null)} />
                            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-cv-bg-secondary border border-cv-border rounded-xl p-6 z-50 shadow-cv-lg">
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-cv-text-primary">¿Eliminar gimnasio?</h3>
                                        <p className="text-sm text-cv-text-secondary mt-1">
                                            Se eliminará el gimnasio y todos sus datos.
                                        </p>
                                    </div>
                                    <div className="flex gap-3 w-full mt-2">
                                        <button
                                            onClick={() => setGymToDelete(null)}
                                            disabled={isDeleting}
                                            className="cv-btn-secondary flex-1"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={confirmDelete}
                                            disabled={isDeleting}
                                            className="cv-btn bg-red-500 hover:bg-red-600 text-white flex-1 transition-colors"
                                        >
                                            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Sí, Eliminar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </>
        )
    }
}
