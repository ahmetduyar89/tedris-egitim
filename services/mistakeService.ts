import { supabase } from './supabase';
import { Mistake } from '../types';

export const mistakeService = {
    async addMistake(mistake: Omit<Mistake, 'id' | 'createdAt' | 'updatedAt'>): Promise<Mistake | null> {
        // Map camelCase to snake_case for DB
        const dbMistake = {
            student_id: mistake.studentId,
            question_id: mistake.questionId,
            question_data: mistake.questionData,
            student_answer: mistake.studentAnswer,
            correct_answer: mistake.correctAnswer,
            ai_analysis: mistake.aiAnalysis,
            status: mistake.status,
            source_type: mistake.sourceType,
            source_id: mistake.sourceId,
            // created_at is handled by DB default
        };

        const { data, error } = await supabase
            .from('mistakes')
            .insert([dbMistake])
            .select()
            .single();

        if (error) {
            console.error('Error adding mistake:', error);
            // Log the error but don't crash, return null
            return null;
        }

        // Return the mapped data (we can reuse getMistakes mapping logic or just return input + id)
        // Since we need to match the return type Mistake, let's just return what we have combined with ID/Timestamp
        return {
            id: data.id,
            createdAt: data.created_at,
            ...mistake
        } as Mistake;
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
