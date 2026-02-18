
import { Topbar } from '@/components/app-shell/Topbar';

import { getTemplates, getClients } from '@/lib/actions';
import { TemplateGrid } from './template-grid';

export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
    const templates = await getTemplates();
    const [athletes, gyms] = await Promise.all([
        getClients('athlete'),
        getClients('gym')
    ]);


    return (
        <>
            <Topbar title="Plantillas" />
            <div className="max-w-6xl mx-auto pt-6">

                {/* Templates Grid */}
                <TemplateGrid templates={templates} athletes={athletes as any} gyms={gyms as any} />

                <div className="mt-8 text-center text-cv-text-tertiary">
                    <p>Más plantillas próximamente...</p>
                </div>
            </div>
        </>
    );
}
