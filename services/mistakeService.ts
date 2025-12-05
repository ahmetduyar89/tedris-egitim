import { supabase } from './supabase';
import { Mistake } from '../types';

export const mistakeService = {
    async addMistake(mistake: Omit<Mistake, 'id' | 'createdAt' | 'updatedAt'>): Promise<Mistake | null> {
        const { data, error } = await supabase
            .from('mistakes')
            .insert([mistake])
            .select()
            .single();

        if (error) {
            console.error('Error adding mistake:', error);
            return null;
        }

        return data;
    },

    async getMistakes(studentId: string, status?: Mistake['status']): Promise<Mistake[]> {
        let query = supabase
            .from('mistakes')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching mistakes:', error);
            return [];
        }

        // Map snake_case to camelCase
        return data.map((item: any) => ({
            id: item.id,
            studentId: item.student_id,
            questionId: item.question_id,
            questionData: item.question_data,
            studentAnswer: item.student_answer,
            correctAnswer: item.correct_answer,
            aiAnalysis: item.ai_analysis,
            status: item.status,
            sourceType: item.source_type,
            sourceId: item.source_id,
            createdAt: item.created_at
        }));
    },

    async updateMistakeAnalysis(mistakeId: string, analysis: Mistake['aiAnalysis']): Promise<void> {
        const { error } = await supabase
            .from('mistakes')
            .update({
                ai_analysis: analysis,
                status: 'analyzed'
            })
            .eq('id', mistakeId);

        if (error) {
            console.error('Error updating mistake analysis:', error);
            throw error;
        }
    },

    async markAsMastered(mistakeId: string): Promise<void> {
        const { error } = await supabase
            .from('mistakes')
            .update({ status: 'mastered' })
            .eq('id', mistakeId);

        if (error) {
            console.error('Error marking mistake as mastered:', error);
            throw error;
        }
    }
};
