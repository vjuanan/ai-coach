import { Topbar } from '@/components/app-shell/Topbar';
import { getExercises } from '@/lib/actions';
import { ExerciseList } from '@/components/exercises/ExerciseList';

export default async function ExercisesPage({
    searchParams
}: {
    searchParams: { q?: string; category?: string; page?: string }
}) {
    const query = searchParams.q || '';
    const category = searchParams.category || 'all';
    const page = Number(searchParams.page) || 1;
    const limit = 50;

    const { data: exercises, count } = await getExercises({
        query,
        category,
        page,
        limit
    });

    return (
        <>
            <Topbar title="Ejercicios" />
            <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 pt-6">

                <ExerciseList
                    initialExercises={exercises || []}
                    totalCount={count}
                    initialCategory={category}
                    initialQuery={query}
                />
            </div>
        </>
    );
}
