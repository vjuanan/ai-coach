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
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Client {
    id: string;
    created_at: string;
    name: string;
    type: 'athlete' | 'gym';
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
}

export function ClientsTable({ clients }: ClientsTableProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.coach?.full_name && client.coach.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-xl font-bold">Listado de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Coach</TableHead>
                                <TableHead>Inicio Servicio</TableHead>
                                <TableHead>Vencimiento</TableHead>
                                <TableHead>Estado Pago</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                        No se encontraron clientes.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredClients.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell className="font-medium">{client.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={client.type === 'athlete' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-purple-200 bg-purple-50 text-purple-700'}>
                                                {client.type === 'athlete' ? 'Atleta' : 'Box'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{client.coach?.business_name || client.coach?.full_name || '-'}</TableCell>
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
