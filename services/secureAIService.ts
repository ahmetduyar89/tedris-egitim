// Secure AI Service - Uses Supabase Edge Functions
// API key is stored securely on the backend
import { supabase } from './dbAdapter';

interface AIServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Call the secure AI generate edge function
 * This keeps the Gemini API key on the backend
 */
async function callAIFunction<T>(action: string, payload: any): Promise<T> {
    try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            throw new Error('User not authenticated');
        }

        // Call the edge function
        const { data, error } = await supabase.functions.invoke('ai-generate', {
            body: {
                action,
                payload
            },
            headers: {
                Authorization: `Bearer ${session.access_token}`
            }
        });

        if (error) {
            console.error('Edge function error:', error);
            throw new Error(error.message || 'AI service error');
        }

        const response = data as AIServiceResponse<T>;

        if (!response.success || !response.data) {
            throw new Error(response.error || 'AI service returned no data');
        }

        return response.data;
    } catch (error) {
        console.error(`AI Service Error (${action}):`, error);
        throw error;
    }
}

/**
 * Generate test questions using AI (secure backend call)
 */
export async function generateTestQuestions(
    subject: string,
    unit: string,
    grade: number,
    questionCount: number,
    difficulty: string,
    questionType: string
): Promise<any> {
    return callAIFunction('generateTest', {
        subject,
        unit,
        grade,
        questionCount,
        difficulty,
        questionType
    });
}

/**
 * Analyze test results using AI (secure backend call)
 */
export async function analyzeTest(
    subject: string,
    unit: string,
    questions: any[]
): Promise<any> {
    return callAIFunction('analyzeTest', {
        subject,
        unit,
        questions
    });
}

/**
 * Generate weekly study plan using AI (secure backend call)
 */
export async function generateWeeklyPlan(
    grade: number,
    subject: string,
    analysis: any
): Promise<any> {
    return callAIFunction('generateWeeklyPlan', {
        grade,
        subject,
        analysis
    });
}

/**
 * Generate review package using AI (secure backend call)
 */
export async function generateReviewPackage(
    topic: string,
    grade: number
): Promise<any> {
    return callAIFunction('generateReviewPackage', {
        topic,
        grade
    });
}

/**
 * Explain a topic using AI (secure backend call)
 */
export async function explainTopic(
    topic: string,
    grade: number
): Promise<any> {
    return callAIFunction('explainTopic', {
        topic,
        grade
    });
}

/**
 * Recommend content using AI (secure backend call)
 */
export async function recommendContent(
    topic: string,
    grade: number
): Promise<any> {
    return callAIFunction('recommendContent', {
        topic,
        grade
    });
}

/**
 * Analyze homework using AI (secure backend call)
 */
export async function analyzeHomework(
    assignment: any,
    submission: any
): Promise<any> {
    return callAIFunction('analyzeHomework', {
        assignment,
        submission
    });
}

/**
 * Generate flashcards using AI (secure backend call)
 */
export async function generateFlashcards(
    topic: string,
    grade: number,
    count: number
): Promise<any> {
    return callAIFunction('generateFlashcards', {
        topic,
        grade,
        count
    });
}

// Export a flag to check if AI is configured
export const isAIConfigured = true; // Always true now since backend handles it
