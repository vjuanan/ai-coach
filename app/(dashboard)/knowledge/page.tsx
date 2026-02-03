import { Topbar } from '@/components/app-shell/Topbar';
import { getTrainingPrinciples } from './actions';
import { getTrainingMethodologies } from '@/lib/actions';
import { KnowledgeContent } from './knowledge-content';

export default async function KnowledgePage() {
    const { data: principles, error } = await getTrainingPrinciples();
    const methodologies = await getTrainingMethodologies();

    return (

        <>
            <Topbar title="Conocimiento" />
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-4">
                    <p className="text-cv-text-secondary mt-1">
                        Base de conocimiento para la creación de programas de entrenamiento basados en evidencia científica.
                    </p>
                </div>

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
