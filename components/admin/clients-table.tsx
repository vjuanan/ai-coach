'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { assignClientToCoach, deleteClient } from '@/lib/actions';
import { Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

interface Coach {
    id: string;
    full_name: string;
    business_name: string | null;
    user_id: string;
}

interface Client {
    id: string;
    created_at: string;
    name: string;
    type: 'athlete' | 'gym';
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

interface ClientsTableProps {
    clients: Client[];
    coaches: Coach[];
}

export function ClientsTable({ clients, coaches }: ClientsTableProps) {
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Filter State
    const [filterType, setFilterType] = useState<'athlete' | 'gym'>('athlete');

    // Multi-select State
    const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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
        setMessage(null);
        try {
            const result = await assignClientToCoach(clientId, newCoachId);
            setMessage({ text: result.message, type: 'success' });
        } catch (error) {
            setMessage({
                text: error instanceof Error ? error.message : 'Error al asignar coach',
                type: 'error'
            });
        } finally {
            setUpdatingId(null);
            // Clear message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        }
    };

    // Filter Clients
    const filteredClients = clients.filter(client => client.type === filterType);

    // Multi-select Handlers
    const toggleSelectAll = () => {
        if (selectedClients.size === filteredClients.length && filteredClients.length > 0) {
            setSelectedClients(new Set());
        } else {
            setSelectedClients(new Set(filteredClients.map(c => c.id)));
        }
    };

    const toggleSelectClient = (clientId: string) => {
        const newSelected = new Set(selectedClients);
        if (newSelected.has(clientId)) {
            newSelected.delete(clientId);
        } else {
            newSelected.add(clientId);
        }
        setSelectedClients(newSelected);
    };

    async function handleBulkDelete() {
        if (selectedClients.size === 0) return;
        if (!confirm(`¿ESTÁS SEGURO? Se eliminarán ${selectedClients.size} clientes permanentemente. Esta acción no se puede deshacer.`)) return;

        setIsBulkDeleting(true);
        setMessage(null);

        try {
            const deletePromises = Array.from(selectedClients).map(clientId => deleteClient(clientId));
            const results = await Promise.allSettled(deletePromises);

            const failures = results.filter(r => r.status === 'rejected');
            const successes = results.filter(r => r.status === 'fulfilled');

            if (failures.length > 0) {
                setMessage({
                    text: `Se eliminarán ${successes.length} clientes. Error al eliminar ${failures.length} clientes.`,
                    type: 'error'
                });
            } else {
                setMessage({ text: `${successes.length} clientes eliminados correctamente`, type: 'success' });
            }

            setSelectedClients(new Set());
        } catch (err: any) {
            setMessage({ text: 'Error crítico en eliminación masiva', type: 'error' });
            console.error(err);
        } finally {
            setIsBulkDeleting(false);
            // Clear message after 5 seconds for bulk actions
            setTimeout(() => setMessage(null), 5000);
        }
    }

    async function handleDeleteClient(clientId: string) {
        if (!confirm('¿ESTÁS SEGURO? Esta acción eliminará permanentemente al cliente y sus datos. No se puede deshacer.')) return;

        setUpdatingId(clientId);
        try {
            await deleteClient(clientId);
            setMessage({ text: 'Cliente eliminado correctamente', type: 'success' });
        } catch (err: any) {
            setMessage({ text: err.message || 'Error al eliminar cliente', type: 'error' });
        } finally {
            setUpdatingId(null);
            setTimeout(() => setMessage(null), 3000);
        }
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
                {/* Segmented Control Switch */}
                <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200/50 w-fit">
                    <button
                        onClick={() => { setFilterType('athlete'); setSelectedClients(new Set()); }}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${filterType === 'athlete'
                            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Atletas
                        {filterType === 'athlete' && (
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded textxs font-semibold ml-1">
                                {filteredClients.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => { setFilterType('gym'); setSelectedClients(new Set()); }}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${filterType === 'gym'
                            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Gimnasios
                        {filterType === 'gym' && (
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs font-semibold ml-1">
                                {filteredClients.length}
                            </span>
                        )}
                    </button>
                </div>

                {selectedClients.size > 0 && (
                    <button
                        onClick={handleBulkDelete}
                        disabled={isBulkDeleting}
                        className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors animate-in fade-in"
                    >
                        {isBulkDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                        Eliminar ({selectedClients.size})
                    </button>
                )}
            </div>

            {message && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm border ${message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {message.text}
                </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-100">
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-12 text-center py-4">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                    checked={filteredClients.length > 0 && selectedClients.size === filteredClients.length}
                                    onChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider py-4">Nombre</TableHead>
                            <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider py-4">Tipo</TableHead>
                            <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider py-4">Coach Asignado</TableHead>
                            <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider py-4">Inicio Servicio</TableHead>
                            <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider py-4">Vencimiento</TableHead>
                            <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider py-4">Estado Pago</TableHead>
                            <TableHead className="text-right font-semibold text-slate-500 uppercase text-xs tracking-wider py-4 pr-6">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                                    No se encontraron {filterType === 'athlete' ? 'atletas' : 'gimnasios'}.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredClients.map((client) => (
                                <TableRow key={client.id} className={`group transition-colors border-b border-slate-100 last:border-0 hover:bg-slate-50/50 ${selectedClients.has(client.id) ? 'bg-slate-50' : ''}`}>
                                    <TableCell className="p-4 text-center">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                            checked={selectedClients.has(client.id)}
                                            onChange={() => toggleSelectClient(client.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-900">{client.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`font-normal ${client.type === 'athlete'
                                            ? 'border-blue-100 bg-blue-50 text-blue-700'
                                            : 'border-purple-100 bg-purple-50 text-purple-700'}`}>
                                            {client.type === 'athlete' ? 'Atleta' : 'Box'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <select
                                                /* NOTE: This select styling is kept simple for now, but uses softer colors */
                                                value={client.coach_id}
                                                onChange={(e) => handleCoachChange(client.id, e.target.value)}
                                                disabled={updatingId === client.id}
                                                className="w-full px-2 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:opacity-50 transition-all cursor-pointer hover:border-slate-300"
                                            >
                                                {coaches.map((coach) => (
                                                    <option key={coach.id} value={coach.id}>
                                                        {coach.business_name || coach.full_name}
                                                    </option>
                                                ))}
                                            </select>
                                            {updatingId === client.id && (
                                                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600">{formatDate(client.service_start_date)}</TableCell>
                                    <TableCell className="text-slate-600">{formatDate(client.service_end_date)}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`font-normal border ${getStatusColor(client.payment_status)}`}>
                                            {getStatusLabel(client.payment_status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <button
                                            onClick={() => handleDeleteClient(client.id)}
                                            disabled={updatingId === client.id}
                                            className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title="Eliminar Cliente"
                                        >
                                            {updatingId === client.id ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
