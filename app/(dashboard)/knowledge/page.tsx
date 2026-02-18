import { Topbar } from '@/components/app-shell/Topbar';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { getTrainingPrinciples } from './actions';
import { getTrainingMethodologies } from '@/lib/actions';
import { KnowledgeContent } from './knowledge-content';

export default async function KnowledgePage() {
    const { data: principles, error } = await getTrainingPrinciples();
    const methodologies = await getTrainingMethodologies();

    return (

        <>
            <Topbar />
            <div className="max-w-7xl mx-auto">
                <PageHeader
                    title="Conocimiento"
                    description="Base de conocimiento para la creación de programas de entrenamiento basados en evidencia científica."
                />

                {error ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
                        <p className="font-medium">Error cargando los principios</p>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                ) : (
                    <KnowledgeContent
                        principles={principles || []}
                        methodologies={methodologies || []}
                    />
                )}
            </div>
        </>
    );
}
