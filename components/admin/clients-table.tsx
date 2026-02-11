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
                return 'bg-green-100 text-green-800 hover:bg-green-200';
            case 'overdue':
            case 'unpaid':
                return 'bg-red-100 text-red-800 hover:bg-red-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
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
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-cv-border-subtle bg-cv-bg-tertiary/20">
                <div className="flex bg-cv-bg-secondary p-1 rounded-lg border border-cv-border-subtle">
                    <button
                        onClick={() => { setFilterType('athlete'); setSelectedClients(new Set()); }}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${filterType === 'athlete'
                            ? 'bg-cv-bg-primary text-cv-text-primary shadow-sm'
                            : 'text-cv-text-secondary hover:text-cv-text-primary'
                            }`}
                    >
                        Atletas
                        {filterType === 'athlete' && (
                            <span className="bg-cv-accent/10 text-cv-accent px-1.5 rounded-md text-xs">
                                {filteredClients.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => { setFilterType('gym'); setSelectedClients(new Set()); }}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${filterType === 'gym'
                            ? 'bg-cv-bg-primary text-cv-text-primary shadow-sm'
                            : 'text-cv-text-secondary hover:text-cv-text-primary'
                            }`}
                    >
                        Gimnasios
                        {filterType === 'gym' && (
                            <span className="bg-cv-accent/10 text-cv-accent px-1.5 rounded-md text-xs">
                                {filteredClients.length}
                            </span>
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {selectedClients.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                            className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors animate-in fade-in"
                        >
                            {isBulkDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                            Eliminar ({selectedClients.size})
                        </button>
                    )}
                </div>
            </CardHeader>

            {message && (
                <div className={`mx-6 mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {message.text}
                </div>
            )}

            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-cv-border-subtle text-cv-accent focus:ring-cv-accent bg-cv-bg-primary"
                                        checked={filteredClients.length > 0 && selectedClients.size === filteredClients.length}
                                        onChange={toggleSelectAll}
                                    />
                                </TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Coach Asignado</TableHead>
                                <TableHead>Inicio Servicio</TableHead>
                                <TableHead>Vencimiento</TableHead>
                                <TableHead>Estado Pago</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                                        No se encontraron {filterType === 'athlete' ? 'atletas' : 'gimnasios'}.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredClients.map((client) => (
                                    <TableRow key={client.id} className={selectedClients.has(client.id) ? 'bg-cv-accent/5' : ''}>
                                        <TableCell className="p-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-cv-border-subtle text-cv-accent focus:ring-cv-accent bg-cv-bg-primary"
                                                checked={selectedClients.has(client.id)}
                                                onChange={() => toggleSelectClient(client.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{client.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={client.type === 'athlete' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-purple-200 bg-purple-50 text-purple-700'}>
                                                {client.type === 'athlete' ? 'Atleta' : 'Box'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={client.coach_id}
                                                    onChange={(e) => handleCoachChange(client.id, e.target.value)}
                                                    disabled={updatingId === client.id}
                                                    className="w-full px-2 py-1 text-sm rounded-md border border-cv-border bg-cv-bg-secondary text-cv-text-primary focus:outline-none focus:ring-1 focus:ring-cv-accent disabled:opacity-50"
                                                >
                                                    {coaches.map((coach) => (
                                                        <option key={coach.id} value={coach.id}>
                                                            {coach.business_name || coach.full_name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {updatingId === client.id && (
                                                    <Loader2 className="h-4 w-4 animate-spin text-cv-accent" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatDate(client.service_start_date)}</TableCell>
                                        <TableCell>{formatDate(client.service_end_date)}</TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(client.payment_status)}>
                                                {getStatusLabel(client.payment_status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <button
                                                onClick={() => handleDeleteClient(client.id)}
                                                disabled={updatingId === client.id}
                                                className="p-2 hover:bg-red-500/10 rounded-lg text-cv-text-tertiary hover:text-red-500 transition-colors"
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
            </CardContent>
        </Card>
    );
}
