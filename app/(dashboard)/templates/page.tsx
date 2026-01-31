
import { Topbar } from '@/components/app-shell/Topbar';
import { getTemplates } from '@/lib/actions';
import { TemplateGrid } from './template-grid';

export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
    const templates = await getTemplates();


    return (
        <>
            <Topbar title="Plantillas" />
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <p className="text-cv-text-secondary">
                        Programas diseñados por expertos (Mike Israetel, Andy Galpin) listos para usar.
                    </p>
                </div>

                {/* Templates Grid */}
                <TemplateGrid templates={templates} />

                <div className="mt-8 text-center text-cv-text-tertiary">
                    <p>Más plantillas próximamente...</p>
                </div>
            </div>
        </>
    );
}
