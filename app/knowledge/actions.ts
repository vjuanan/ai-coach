'use server';

import { createClient } from '@/lib/supabase/server';
import type { TrainingPrinciple } from '@/lib/supabase/types';

export async function getTrainingPrinciples(): Promise<{
    data: TrainingPrinciple[] | null;
    error: string | null;
}> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('training_principles')
        .select('*')
        .order('objective')
        .order('category')
        .order('created_at');

    if (error) {
        console.error('Error fetching training principles:', error);
        return { data: null, error: error.message };
    }

    return { data: data as TrainingPrinciple[], error: null };
}

export async function addTrainingPrinciple(principle: Omit<TrainingPrinciple, 'id' | 'created_at'>): Promise<{
    data: TrainingPrinciple | null;
    error: string | null;
}> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('training_principles')
        .insert(principle)
        .select()
        .single();

    if (error) {
        console.error('Error adding training principle:', error);
        return { data: null, error: error.message };
    }

    return { data: data as TrainingPrinciple, error: null };
}
