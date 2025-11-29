import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTestQuestions } from '../services/secureAIService';
import { supabase } from '../services/supabase';
import { Difficulty, QuestionType, Subject } from '../types';

// Mock Supabase client
vi.mock('../services/supabase', () => ({
    supabase: {
        functions: {
            invoke: vi.fn()
        }
    }
}));

describe('secureAIService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('generateTestQuestions calls supabase function correctly', async () => {
        const mockQuestions = [
            { text: 'Q1', correctAnswer: 'A', topic: 'Topic 1', type: 'Multiple Choice' }
        ];

        (supabase.functions.invoke as any).mockResolvedValue({
            data: {
                success: true,
                data: {
                    questions: mockQuestions
                }
            },
            error: null
        });

        const questions = await generateTestQuestions(
            5,
            [{ subject: Subject.Mathematics, unit: 'Numbers', count: 10 }],
            QuestionType.MultipleChoice,
            Difficulty.Medium
        );

        expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-generate', {
            body: {
                action: 'generateTest',
                payload: {
                    grade: 5,
                    subject: 'Matematik',
                    unit: 'Numbers',
                    questionCount: 10,
                    difficulty: 'Orta',
                    questionType: 'Çoktan Seçmeli',
                    topics: [{ subject: 'Matematik', unit: 'Numbers', count: 10 }]
                }
            }
        });

        expect(questions).toHaveLength(1);
        expect(questions[0].text).toBe('Q1');
        expect(questions[0].id).toBeDefined();
    });

    it('handles errors from supabase', async () => {
        (supabase.functions.invoke as any).mockResolvedValue({
            data: null,
            error: { message: 'Network error' }
        });

        await expect(generateTestQuestions(
            5,
            [{ subject: Subject.Mathematics, unit: 'Numbers', count: 10 }],
            QuestionType.MultipleChoice,
            Difficulty.Medium
        )).rejects.toThrow('AI service error: Network error');
    });
});
