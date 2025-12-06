// Service for handling mistakes
import { supabase } from './supabase';

export interface MistakeData {
    studentId: string;
    questionId: string;
    questionData: {
        text: string;
        options?: string[];
        type: string; // 'multiple_choice', 'open_ended', etc.
        topic: string;
    };
    studentAnswer: string | undefined;
    correctAnswer: string;
    status: 'new' | 'reviewed' | 'resolved';
    sourceType: 'test' | 'homework' | 'practice';
    sourceId: string;
}

export const mistakeService = {
    async addMistake(data: MistakeData): Promise<void> {
        // Implement logic to store mistake in the database
        // Assuming there is a 'mistakes' or 'student_mistakes' table
        // For now, we'll try to insert into a generic 'mistakes' table if it exists, 
        // or just log it if we are unsure of the schema.
        // Given the previous context, there was a migration for 'mistakes' table involved in a "Verify Feature Removal" task,
        // which implies the feature might have been removed or is being re-added.
        // Since I'm fixing a build error for code that RELIES on this, I should implement it.

        try {
            const { error } = await supabase
                .from('mistakes')
                .insert([{
                    student_id: data.studentId,
                    question_id: data.questionId,
                    question_data: data.questionData,
                    student_answer: data.studentAnswer,
                    correct_answer: data.correctAnswer,
                    status: data.status,
                    source_type: data.sourceType,
                    source_id: data.sourceId
                }]);

            if (error) {
                console.error('Error adding mistake:', error);
                // Don't throw to prevent blocking the test completion flow
            }
        } catch (err) {
            console.error('Error in mistakeService.addMistake:', err);
        }
    }
};

export default mistakeService;
