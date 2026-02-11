import { Topbar } from '@/components/app-shell/Topbar';
import { getAdminClients, getCoaches } from '@/lib/actions';
import { ClientsTable } from '@/components/admin/clients-table';

export const dynamic = 'force-dynamic';

export default async function AdminClientsPage() {
    const [clients, coaches] = await Promise.all([
        getAdminClients(),
        getCoaches()
    ]);

    return (
        <>
            <Topbar title="Administración de Clientes" />
            <div className="space-y-6">

                <ClientsTable clients={clients} coaches={coaches} />
            </div>
        </>
    );
}
