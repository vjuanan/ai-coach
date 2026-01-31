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
import { assignClientToCoach } from '@/lib/actions';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

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

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-xl font-bold">Listado de Clientes</CardTitle>
                <span className="text-sm text-cv-text-secondary">
                    {clients.length} clientes totales
                </span>
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
                                <TableHead>Nombre</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Coach Asignado</TableHead>
                                <TableHead>Inicio Servicio</TableHead>
                                <TableHead>Vencimiento</TableHead>
                                <TableHead>Estado Pago</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                        No se encontraron clientes.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                clients.map((client) => (
                                    <TableRow key={client.id}>
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
