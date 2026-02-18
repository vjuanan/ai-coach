'use client';

import { Topbar } from '@/components/app-shell/Topbar';

import { useState, useEffect } from 'react';
import { useEscapeKey } from '@/hooks/use-escape-key';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    getClients,
    createClient,
    deleteClient,
    assignClientToCoach
} from '@/lib/actions';
import { getCoachesNew } from '@/lib/actions-coach';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Plus,
    Search,
    MoreHorizontal,
    Mail,
    Phone,
    Edit2,
    Trash2,
    User,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    X
} from 'lucide-react';
import { diagnoseUserVisibility } from '@/lib/actions';

function DebugPanel() {
    const [logs, setLogs] = useState<string>('Loading debug info...');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        diagnoseUserVisibility().then(setLogs);
    }, []);

    if (!isOpen) return <button onClick={() => setIsOpen(true)} className="text-xs text-blue-500 underline mt-2">Ver Diagnóstico</button>;

    return (
        <div className="mt-4 p-4 bg-gray-900 text-green-400 font-mono text-xs text-left rounded w-full max-w-2xl overflow-x-auto whitespace-pre">
            {logs}
            <button onClick={() => setIsOpen(false)} className="block mt-2 text-gray-500 hover:text-white">Cerrar</button>
        </div>
    );
}

interface PageCoach {
    id: string;
    full_name: string;
    business_name: string | null;
}

interface Athlete {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    type: 'athlete';
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

function getInitials(name: string) {
    if (!name) return '';
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export default function AthletesPage() {
    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [coaches, setCoaches] = useState<PageCoach[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const router = useRouter();

    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q') || '';

    const [showAddModal, setShowAddModal] = useState(false);

    // Enhanced Form State with Full Athlete Profile
    const [formData, setFormData] = useState({
        type: 'athlete' as 'athlete' | 'gym',
        name: '',
        email: '',
        dob: '',
        height: '',
        weight: '',
        gender: 'male' as 'male' | 'female' | 'other',
        level: 'RX',
        goal: '',
        injuries: '',
        // Benchmarks (1RM in kg)
        snatch: '',
        cnj: '',
        backSquat: '',
        deadlift: '',
        frontSquat: '',
        cleanPull: '',
        strictPress: '',
        benchPress: '',
        // Time-based benchmarks (seconds)
        franTime: '',
        run1km: '',
        run5km: ''
    });
    const [isAdding, setIsAdding] = useState(false);

    // Alert Modal State
    const [athleteToDelete, setAthleteToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Multi-select State
    const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [bulkDeleteMessage, setBulkDeleteMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEscapeKey(() => setShowAddModal(false), showAddModal);
    useEscapeKey(() => !isDeleting && setAthleteToDelete(null), !!athleteToDelete);

    useEffect(() => {
        fetchAthletes();
    }, []);

    async function fetchAthletes() {
        setIsLoading(true);
        const [athletesData, coachesData] = await Promise.all([
            getClients('athlete'),
            getCoachesNew()
        ]);
        if (athletesData) setAthletes(athletesData as Athlete[]);
        if (coachesData) setCoaches(coachesData as PageCoach[]);
        setIsLoading(false);
    }

    function resetForm() {
        setFormData({
            type: 'athlete',
            name: '',
            email: '',
            dob: '',
            height: '',
            weight: '',
            gender: 'male',
            level: 'RX',
            goal: '',
            injuries: '',
            snatch: '',
            cnj: '',
            backSquat: '',
            deadlift: '',
            frontSquat: '',
            cleanPull: '',
            strictPress: '',
            benchPress: '',
            franTime: '',
            run1km: '',
            run5km: ''
        });
    }

    async function addAthlete() {
        if (!formData.name.trim()) return;
        setIsAdding(true);

        try {
            const details = {
                // Physical Profile
                dob: formData.dob || null,
                height: formData.height ? parseInt(formData.height) : null,
                weight: formData.weight ? parseInt(formData.weight) : null,
                gender: formData.gender,
                // Training
                level: formData.level,
                goal: formData.goal,
                injuries: formData.injuries,
                // Benchmarks (1RM in kg)
                oneRmStats: {
                    snatch: formData.snatch ? parseInt(formData.snatch) : null,
                    cnj: formData.cnj ? parseInt(formData.cnj) : null,
                    backSquat: formData.backSquat ? parseInt(formData.backSquat) : null,
                    deadlift: formData.deadlift ? parseInt(formData.deadlift) : null,
                    frontSquat: formData.frontSquat ? parseInt(formData.frontSquat) : null,
                    cleanPull: formData.cleanPull ? parseInt(formData.cleanPull) : null,
                    strictPress: formData.strictPress ? parseInt(formData.strictPress) : null,
                    benchPress: formData.benchPress ? parseInt(formData.benchPress) : null
                },
                // Time-based Benchmarks (seconds)
                franTime: formData.franTime ? parseInt(formData.franTime) : null,
                run1km: formData.run1km ? parseInt(formData.run1km) : null,
                run5km: formData.run5km ? parseInt(formData.run5km) : null
            };

            await createClient({
                type: formData.type,
                name: formData.name,
                email: formData.email || undefined,
                details
            });

            resetForm();
            setShowAddModal(false);
            fetchAthletes();
        } catch (e) {
            console.error('Error adding athlete:', e);
            alert('Error al añadir atleta. Verifica tu conexión.');
        }
        setIsAdding(false);
    }

    function promptDelete(e: React.MouseEvent, id: string) {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();
        setAthleteToDelete(id);
    }

    async function confirmDelete() {
        if (!athleteToDelete) return;
        setIsDeleting(true);
        try {
            await deleteClient(athleteToDelete);
            await fetchAthletes();
        } catch (e) {
            console.error(e);
            alert('Error al eliminar atleta');
        } finally {
            setIsDeleting(false);
            setAthleteToDelete(null);
        }
    }

    const filteredAthletes = athletes.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSelectAll = () => {
        if (selectedAthletes.size === filteredAthletes.length) {
            setSelectedAthletes(new Set());
        } else {
            setSelectedAthletes(new Set(filteredAthletes.map(a => a.id)));
        }
    };

    const toggleSelectAthlete = (id: string) => {
        const newSelected = new Set(selectedAthletes);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedAthletes(newSelected);
    };

    async function handleBulkDelete() {
        if (selectedAthletes.size === 0) return;
        if (!confirm(`¿ESTÁS SEGURO? Se eliminarán ${selectedAthletes.size} atletas permanentemente. Esta acción no se puede deshacer.`)) return;

        setIsBulkDeleting(true);
        setBulkDeleteMessage(null);

        try {
            const deletePromises = Array.from(selectedAthletes).map(id => deleteClient(id));
            const results = await Promise.allSettled(deletePromises);

            const failures = results.filter(r => r.status === 'rejected');
            const successes = results.filter(r => r.status === 'fulfilled');

            if (failures.length > 0) {
                setBulkDeleteMessage({
                    text: `Se eliminaron ${successes.length} atletas. Error al eliminar ${failures.length} atletas.`,
                    type: 'error'
                });
            } else {
                setBulkDeleteMessage({ text: `${successes.length} atletas eliminados correctamente`, type: 'success' });
            }

            setSelectedAthletes(new Set());
            fetchAthletes();
        } catch (err: any) {
            console.error(err);
            setBulkDeleteMessage({ text: 'Error crítico en eliminación masiva', type: 'error' });
        } finally {
        }
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
            await fetchAthletes(); // Refresh to show updated data
        } catch (error) {
            console.error('Error assigning coach:', error);
            alert('Error al asignar coach');
        } finally {
            setUpdatingId(null);
        }
    };

    return (

        <>
            <Topbar
                title=""
                actions={
                    actions = {
                    < div className="flex items-center gap-1.5">
                {selectedAthletes.size > 0 && (
                    <button
                        onClick={handleBulkDelete}
                        disabled={isBulkDeleting}
                        className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors mr-2"
                    >
                        {isBulkDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                        Eliminar ({selectedAthletes.size})
                    </button>
                )}
                <div className="flex items-center gap-2 px-2 text-slate-500">
                    <User size={20} />
                    <span className="font-medium text-sm">{filteredAthletes.length}</span>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all duration-200"
                    title="Añadir Atleta"
                >
                    <Plus size={20} />
                </button>
            </div>
                }
                }
            />
            <div className="w-full px-6 pt-2">
                {/* Search removed - using global Topbar search */}

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
                    ) : filteredAthletes.length === 0 ? (
                        <div className="text-center py-12">
                            <User size={48} className="mx-auto text-cv-text-tertiary mb-4" />
                            <p className="text-cv-text-secondary">No hay atletas aún</p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="cv-btn-primary mt-4"
                            >
                                <Plus size={18} />
                                Añade tu primer atleta
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-200 backdrop-blur-sm">
                                        <th className="py-3 px-4 w-10">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-gray-300 text-cv-accent focus:ring-cv-accent focus:ring-offset-0 bg-white cursor-pointer"
                                                    checked={filteredAthletes.length > 0 && selectedAthletes.size === filteredAthletes.length}
                                                    onChange={toggleSelectAll}
                                                />
                                            </div>
                                        </th>
                                        <th className="py-3 px-4 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Atleta</th>
                                        <th className="py-3 px-4 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Coach</th>
                                        <th className="py-3 px-4 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Estado</th>
                                        <th className="py-3 px-4 text-[11px] uppercase tracking-wider text-gray-500 font-semibold text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredAthletes
                                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                        .map((athlete) => (
                                            <tr
                                                key={athlete.id}
                                                className={`group hover:bg-gray-50/80 transition-all duration-200 cursor-pointer ${selectedAthletes.has(athlete.id) ? 'bg-blue-50/50' : ''}`}
                                                onClick={() => router.push(`/athletes/${athlete.id}`)}
                                            >
                                                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded border-gray-300 text-cv-accent focus:ring-cv-accent focus:ring-offset-0 bg-white cursor-pointer"
                                                            checked={selectedAthletes.has(athlete.id)}
                                                            onChange={() => toggleSelectAthlete(athlete.id)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-white shadow-sm flex items-center justify-center text-gray-600 font-bold text-xs shrink-0 tracking-tight">
                                                            {getInitials(athlete.name)}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-gray-900 text-sm block truncate">{athlete.name}</span>
                                                                {athlete.details?.level && (
                                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${athlete.details.level === 'Elite' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                                        athlete.details.level === 'RX' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                                            'bg-gray-100 text-gray-600 border-gray-200'
                                                                        }`}>
                                                                        {athlete.details.level}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-500 truncate mt-0.5 font-normal">{athlete.email || 'Sin email'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                                    <div className="max-w-[160px]">
                                                        <select
                                                            value={athlete.coach_id || ''}
                                                            onChange={(e) => handleCoachChange(athlete.id, e.target.value)}
                                                            className="w-full bg-transparent text-sm text-gray-600 border-none focus:ring-0 cursor-pointer hover:text-gray-900 transition-colors py-1 pl-0 pr-8 truncate font-medium"
                                                        >
                                                            <option value="" className="text-gray-400">Sin Asignar</option>
                                                            {coaches.map((coach) => (
                                                                <option key={coach.id} value={coach.id}>
                                                                    {coach.business_name || coach.full_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${athlete.payment_status === 'active'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                                            }`}>
                                                            {getStatusLabel(athlete.payment_status)}
                                                        </span>
                                                        <div className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                                                            <span>{formatDate(athlete.service_start_date)}</span>
                                                            <span className="text-gray-300">→</span>
                                                            <span>{formatDate(athlete.service_end_date)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
                                                        <Link
                                                            href={`/athletes/${athlete.id}`}
                                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            title="Ver perfil"
                                                        >
                                                            <User size={16} />
                                                        </Link>
                                                        <button
                                                            onClick={(e) => promptDelete(e, athlete.id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    {filteredAthletes.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-12 text-center text-gray-400 text-sm">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span>No se encontraron atletas</span>
                                                    <DebugPanel />
                                                </div>
                                            </td>
                                        </tr>
                                    )}
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
                                <h2 className="text-xl font-semibold text-cv-text-primary">Nuevo Atleta / Cliente</h2>
                                <button onClick={() => setShowAddModal(false)} className="cv-btn-ghost p-1">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Type Toggle */}
                                <div>
                                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">Tipo</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, type: 'athlete' }))}
                                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${formData.type === 'athlete' ? 'bg-cv-accent text-slate-900' : 'bg-cv-bg-tertiary text-cv-text-secondary'}`}
                                        >
                                            Atleta Individual
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, type: 'gym' }))}
                                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${formData.type === 'gym' ? 'bg-cv-accent text-slate-900' : 'bg-cv-bg-tertiary text-cv-text-secondary'}`}
                                        >
                                            Gimnasio / Box
                                        </button>
                                    </div>
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">Nombre *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="John Doe"
                                        className="cv-input"
                                        autoFocus
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">Correo</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="john@example.com"
                                        className="cv-input"
                                    />
                                </div>

                                {/* Physical Profile Section */}
                                <div className="border-t border-cv-border pt-4 mt-4">
                                    <label className="block text-sm font-medium text-cv-text-primary mb-3">Perfil Físico</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-cv-text-tertiary mb-1">Fecha Nac.</label>
                                            <input
                                                type="date"
                                                value={formData.dob}
                                                onChange={(e) => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                                                className="cv-input"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-cv-text-tertiary mb-1">Género</label>
                                            <select
                                                value={formData.gender}
                                                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                                                className="cv-input"
                                            >
                                                <option value="male">Masculino</option>
                                                <option value="female">Femenino</option>
                                                <option value="other">Otro</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-cv-text-tertiary mb-1">Altura (cm)</label>
                                            <input
                                                type="number"
                                                value={formData.height}
                                                onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                                                placeholder="175"
                                                className="cv-input"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-cv-text-tertiary mb-1">Peso (kg)</label>
                                            <input
                                                type="number"
                                                value={formData.weight}
                                                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                                                placeholder="75"
                                                className="cv-input"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Level Dropdown */}
                                <div>
                                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">Nivel</label>
                                    <select
                                        value={formData.level}
                                        onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                                        className="cv-input"
                                    >
                                        <option value="Scaled">Scaled</option>
                                        <option value="RX">RX</option>
                                        <option value="Elite">Elite</option>
                                        <option value="Master">Master</option>
                                    </select>
                                </div>

                                {/* Goal */}
                                <div>
                                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">Objetivo Principal</label>
                                    <input
                                        type="text"
                                        value={formData.goal}
                                        onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                                        placeholder="Ej: Competition Prep, Strength Bias..."
                                        className="cv-input"
                                    />
                                </div>

                                {/* Injuries/Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">Lesiones / Limitaciones</label>
                                    <textarea
                                        value={formData.injuries}
                                        onChange={(e) => setFormData(prev => ({ ...prev, injuries: e.target.value }))}
                                        placeholder="Ej: Shoulder impingement, bajo movilidad de tobillo..."
                                        rows={2}
                                        className="cv-input resize-none"
                                    />
                                </div>

                                {/* Benchmarks Section */}
                                <div className="border-t border-cv-border pt-4 mt-4">
                                    <label className="block text-sm font-medium text-cv-text-primary mb-3">Benchmarks (1RM en kg)</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input
                                            type="number"
                                            value={formData.snatch}
                                            onChange={(e) => setFormData(prev => ({ ...prev, snatch: e.target.value }))}
                                            placeholder="Snatch"
                                            className="cv-input text-sm"
                                        />
                                        <input
                                            type="number"
                                            value={formData.cnj}
                                            onChange={(e) => setFormData(prev => ({ ...prev, cnj: e.target.value }))}
                                            placeholder="C&J"
                                            className="cv-input text-sm"
                                        />
                                        <input
                                            type="number"
                                            value={formData.backSquat}
                                            onChange={(e) => setFormData(prev => ({ ...prev, backSquat: e.target.value }))}
                                            placeholder="Back Squat"
                                            className="cv-input text-sm"
                                        />
                                        <input
                                            type="number"
                                            value={formData.frontSquat}
                                            onChange={(e) => setFormData(prev => ({ ...prev, frontSquat: e.target.value }))}
                                            placeholder="Front Squat"
                                            className="cv-input text-sm"
                                        />
                                        <input
                                            type="number"
                                            value={formData.deadlift}
                                            onChange={(e) => setFormData(prev => ({ ...prev, deadlift: e.target.value }))}
                                            placeholder="Deadlift"
                                            className="cv-input text-sm"
                                        />
                                        <input
                                            type="number"
                                            value={formData.cleanPull}
                                            onChange={(e) => setFormData(prev => ({ ...prev, cleanPull: e.target.value }))}
                                            placeholder="Clean Pull"
                                            className="cv-input text-sm"
                                        />
                                        <input
                                            type="number"
                                            value={formData.strictPress}
                                            onChange={(e) => setFormData(prev => ({ ...prev, strictPress: e.target.value }))}
                                            placeholder="Strict Press"
                                            className="cv-input text-sm"
                                        />
                                        <input
                                            type="number"
                                            value={formData.benchPress}
                                            onChange={(e) => setFormData(prev => ({ ...prev, benchPress: e.target.value }))}
                                            placeholder="Bench Press"
                                            className="cv-input text-sm"
                                        />
                                    </div>
                                    <label className="block text-sm font-medium text-cv-text-primary mt-4 mb-3">Tiempos</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-xs text-cv-text-tertiary mb-1">Fran (seg)</label>
                                            <input
                                                type="number"
                                                value={formData.franTime}
                                                onChange={(e) => setFormData(prev => ({ ...prev, franTime: e.target.value }))}
                                                placeholder="180"
                                                className="cv-input text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-cv-text-tertiary mb-1">1KM (seg)</label>
                                            <input
                                                type="number"
                                                value={formData.run1km}
                                                onChange={(e) => setFormData(prev => ({ ...prev, run1km: e.target.value }))}
                                                placeholder="240"
                                                className="cv-input text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-cv-text-tertiary mb-1">5KM (seg)</label>
                                            <input
                                                type="number"
                                                value={formData.run5km}
                                                onChange={(e) => setFormData(prev => ({ ...prev, run5km: e.target.value }))}
                                                placeholder="1500"
                                                className="cv-input text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => { resetForm(); setShowAddModal(false); }}
                                    className="cv-btn-secondary flex-1"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={addAthlete}
                                    disabled={!formData.name.trim() || isAdding}
                                    className="cv-btn-primary flex-1"
                                >
                                    {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Delete Confirmation Modal */}
                {athleteToDelete && (
                    <>
                        <div className="cv-overlay" onClick={() => !isDeleting && setAthleteToDelete(null)} />
                        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-cv-bg-secondary border border-cv-border rounded-xl p-6 z-50 shadow-cv-lg">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-cv-text-primary">¿Eliminar atleta?</h3>
                                    <p className="text-sm text-cv-text-secondary mt-1">
                                        Se eliminará al atleta y todo su historial de asignaciones.
                                    </p>
                                </div>
                                <div className="flex gap-3 w-full mt-2">
                                    <button
                                        onClick={() => setAthleteToDelete(null)}
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
    );
}
