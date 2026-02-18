
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
        <ExerciseList
            initialExercises={exercises || []}
            totalCount={count}
            initialCategory={category}
            initialQuery={query}
        />
    );
}
