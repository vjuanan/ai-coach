import { AppShell } from '@/components/app-shell';
import { getAdminClients } from '@/lib/actions';
import { ClientsTable } from '@/components/admin/clients-table';

export const dynamic = 'force-dynamic';

export default async function AdminClientsPage() {
    const clients = await getAdminClients();

    return (
        <AppShell title="Administración de Clientes">
            <div className="space-y-6">
                <div>
                    <p className="text-cv-text-secondary">
                        Vista administrativa global de todos los atletas y gimnasios suscritos.
                    </p>
                </div>

                <ClientsTable clients={clients} />
            </div>
        </AppShell>
    );
}
