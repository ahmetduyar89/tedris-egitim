import { supabase } from './supabase';
import {
    Difficulty,
    Question,
    QuestionType,
    Subject,
    AIAnalysisReport,
    ReviewPackageItem,
    WeeklyProgram,
    Task,
    TaskStatus,
    AssignmentType,
    ContentRecommendation
} from '../types';
import { cacheService } from './cacheService';

// Helper to invoke Supabase Edge Function
async function invokeAIFunction<T>(action: string, payload: any): Promise<T> {
    const { data, error } = await supabase.functions.invoke('ai-generate', {
        body: { action, payload }
    });

    if (error) {
        console.error(`Error invoking AI function (${action}):`, error);
        throw new Error(`AI service error: ${error.message}`);
    }

    if (!data.success) {
        throw new Error(data.error || 'AI generation failed');
    }

    return data.data as T;
}

export const generateTestQuestions = async (
    grade: number,
    topics: { subject: Subject; unit: string; count: number }[],
    questionType: QuestionType,
    difficulty: Difficulty,
): Promise<Question[]> => {
    const totalCount = topics.reduce((sum, t) => sum + t.count, 0);
    // Assuming single subject/unit for simplicity in payload, or we need to adjust the edge function to handle multiple topics better.
    // The current edge function seems to expect single subject/unit based on `buildTestGenerationPrompt`.
    // Let's use the first topic's subject/unit as primary context if multiple.
    const primaryTopic = topics[0];

    const response = await invokeAIFunction<{ questions: any[] }>('generateTest', {
        grade,
        subject: primaryTopic.subject,
        unit: primaryTopic.unit,
        questionCount: totalCount,
        difficulty,
        questionType,
        topics // Passing full topics list just in case we update edge function later
    });

    return response.questions.map((q: any, index: number) => ({
        id: `gen-${index}-${Date.now()}`,
        ...q,
    }));
};

export const generateTestAnalysis = async (
    subject: Subject,
    unit: string,
    questions: Question[]
): Promise<AIAnalysisReport> => {
    return invokeAIFunction<AIAnalysisReport>('analyzeTest', {
        subject,
        unit,
        questions
    });
};

export const generateWeeklyProgram = async (
    grade: number,
    subject: Subject,
    report: AIAnalysisReport
): Promise<Omit<WeeklyProgram, 'id' | 'studentId' | 'week'>> => {
    const response = await invokeAIFunction<{ days: any[] }>('generateWeeklyPlan', {
        grade,
        subject,
        analysis: report
    });

    return {
        days: response.days.map((day: any) => ({
            day: day.day,
            tasks: day.tasks.map((task: any) => ({
                id: `task-${Date.now()}-${Math.random()}`,
                description: task.description || `${task.activity_type}: '${task.topic}'`,
                status: TaskStatus.Assigned,
                duration: task.duration || task.duration_mins,
                subject: subject,
            }))
        }))
    };
};

export const generateReviewPackage = async (topic: string, grade: number): Promise<ReviewPackageItem[]> => {
    const response = await invokeAIFunction<{ items: any[] }>('generateReviewPackage', {
        topic,
        grade
    });

    // Ensure IDs are unique
    return response.items.map((item, index) => ({
        ...item,
        id: item.id || `review-item-${index}-${Date.now()}`
    }));
};

export const explainTopic = async (topic: string, grade: number): Promise<{ topic: string; explanation: string; example: string; hint: string; }> => {
    const cacheKey = `explain-topic-${topic}-${grade}`;
    return cacheService.remember(cacheKey, async () => {
        return invokeAIFunction('explainTopic', { topic, grade });
    }, 86400);
};

export const recommendContentForTopic = async (topic: string, grade: number): Promise<ContentRecommendation[]> => {
    const cacheKey = `recommend-content-${topic}-${grade}`;
    return cacheService.remember(cacheKey, async () => {
        const response = await invokeAIFunction<{ recommendations: ContentRecommendation[] }>('recommendContent', { topic, grade });
        return response.recommendations;
    }, 86400);
};

export const evaluateHomework = async (assignmentTitle: string, submissionText: string): Promise<{ scorePercent: number, feedback: string, weakTopics: string[] }> => {
    return invokeAIFunction('analyzeHomework', {
        assignment: { description: assignmentTitle },
        submission: { submissionText }
    });
};

export const generateFlashcards = async (topic: string, grade: number, subject: Subject, count: number = 10): Promise<any> => {
    return invokeAIFunction('generateFlashcards', { topic, grade, subject, count });
};

export const generateCompletionTasks = async (topic: string, subject?: Subject): Promise<Task[]> => {
    const response = await invokeAIFunction<{ tasks: any[] }>('generateCompletionTasks', { topic, subject });
    return response.tasks.map((task: any) => ({
        id: `completion-task-${Date.now()}-${Math.random()}`,
        description: task.description,
        duration: task.duration,
        status: TaskStatus.Assigned,
        isCompletionTask: true,
        topic: topic,
        subject: subject,
        ai_recommended: true,
    }));
};

export const generateProgressReport = async (lastReport: AIAnalysisReport, currentReport: AIAnalysisReport): Promise<{ ai_comment: string, focus_topics: string[] }> => {
    return invokeAIFunction('generateProgressReport', { lastReport, currentReport });
};

export const suggestHomework = async (grade: number, subject: Subject, weakTopics: string[]): Promise<{ title: string, description: string, type: AssignmentType }[]> => {
    const response = await invokeAIFunction<{ suggestions: any[] }>('suggestHomework', { grade, subject, weakTopics });
    return response.suggestions;
};

export const checkAnswer = async (question: string, studentAnswerText: string, studentImageBase64?: string): Promise<{ isCorrect: boolean; feedback: string; }> => {
    return invokeAIFunction('checkAnswer', { question, studentAnswerText, studentImageBase64 });
};

export const generateContent = async (prompt: string): Promise<string> => {
    const response = await invokeAIFunction<any>('generateContent', { prompt });
    return JSON.stringify(response);
};

export const generateInteractiveComponent = async (
    contextText: string,
    grade: number,
    subject: Subject,
    componentType: 'mcq' | 'fill-in-the-blank' | 'true-false'
): Promise<any> => {
    let prompt = `
        You are an expert curriculum developer for Turkish middle schools (grade ${grade}).
        Based on the following text context from a "${subject}" lesson, generate a single, relevant interactive component of the specified type.
        The output MUST be a JSON object that conforms to the provided schema. The language MUST be Turkish and the generated content must be different from previous requests.

        Context Text:
        ---
        ${contextText}
        ---
    `;

    let responseSchema: any;

    switch (componentType) {
        case 'fill-in-the-blank':
            prompt += `\nComponent Type to Generate: 'fill-in-the-blank'. Create a sentence and identify the key word to be the answer. Use '___' for the blank.`;
            responseSchema = {
                type: "OBJECT",
                properties: {
                    sentence: { type: "STRING", description: "The sentence with a '___' placeholder." },
                    answer: { type: "STRING", description: "The word that fills the blank." }
                },
                required: ['sentence', 'answer']
            };
            break;
        case 'true-false':
            prompt += `\nComponent Type to Generate: 'true-false'. Create a statement that is either true or false based on the context.`;
            responseSchema = {
                type: "OBJECT",
                properties: {
                    statement: { type: "STRING", description: "The statement to be evaluated." },
                    answer: { type: "BOOLEAN", description: "The correct boolean answer (true or false)." }
                },
                required: ['statement', 'answer']
            };
            break;
        case 'mcq':
        default:
            prompt += `\nComponent Type to Generate: 'multiple-choice'. Provide exactly 4 options and indicate the correct answer.`;
            responseSchema = {
                type: "OBJECT",
                properties: {
                    question: { type: "STRING", description: "The question text." },
                    options: { type: "ARRAY", items: { type: "STRING" }, description: "An array of 4 options." },
                    answer: { type: "STRING", description: "The text of the correct option." }
                },
                required: ['question', 'options', 'answer']
            };
    }

    const response = await invokeAIFunction<any>('generateContent', { prompt, responseSchema });
    return response;
};

// Tanı Testi: Soru Üretimi
export const generateDiagnosisQuestions = async (
    subject: string,
    grade: number,
    modules: { id: string; name: string; code?: string }[],
    questionsPerModule: number = 3,
    difficulty: number = 3
): Promise<any> => {
    const responseSchema = {
        type: "OBJECT",
        properties: {
            questions: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        module_id: { type: "STRING" },
                        module_name: { type: "STRING" },
                        question_text: { type: "STRING" },
                        options: {
                            type: "ARRAY",
                            items: { type: "STRING" }
                        },
                        correct_answer: { type: "STRING" },
                        difficulty: { type: "NUMBER" },
                        explanation: { type: "STRING" }
                    },
                    required: ["module_id", "module_name", "question_text", "options", "correct_answer", "difficulty"]
                }
            }
        },
        required: ["questions"]
    };

    const response = await invokeAIFunction<{ questions: any[] }>('generateDiagnosisQuestions', {
        subject,
        grade,
        modules,
        questionsPerModule,
        difficulty,
        responseSchema
    });

    return response.questions;
};

// Tanı Testi: AI Analizi
export const analyzeDiagnosisTest = async (
    subject: string,
    grade: number,
    totalQuestions: number,
    correctAnswers: number,
    moduleResults: { moduleName: string; correct: number; total: number }[]
): Promise<any> => {
    const response = await invokeAIFunction<any>('analyzeDiagnosisTest', {
        subject,
        grade,
        totalQuestions,
        correctAnswers,
        moduleResults
    });

    return response;
};


// ============================================================================
// COMPOSITION EVALUATION
// ============================================================================

/**
 * Evaluate a composition with AI
 * Provides comprehensive feedback on grammar, spelling, content, organization, and vocabulary
 */
export const evaluateComposition = async (
    prompt: string,
    studentText: string,
    minWords: number,
    maxWords: number
): Promise<any> => {
    const evaluationPrompt = `
Sen bir Türkçe öğretmenisin. Aşağıdaki öğrenci kompozisyonunu değerlendir.

KONU: ${prompt}

ÖĞRENCİ METNİ:
${studentText}

DEĞERLENDİRME KRİTERLERİ:
- Kelime sayısı: ${minWords}-${maxWords} arası olmalı (mevcut: ${studentText.trim().split(/\s+/).length} kelime)
- İçerik (0-100): Konuya uygunluk, fikir zenginliği, yaratıcılık
- Organizasyon (0-100): Giriş-gelişme-sonuç, paragraf düzeni, akıcılık
- Gramer (0-100): Dilbilgisi kurallarına uygunluk, cümle yapısı
- Kelime Dağarcığı (0-100): Kelime seçimi, çeşitlilik, uygunluk

Lütfen JSON formatında değerlendir:
{
  "overall": "Genel değerlendirme (2-3 cümle)",
  "strengths": ["Güçlü yön 1", "Güçlü yön 2", "Güçlü yön 3"],
  "improvements": ["Geliştirilmesi gereken alan 1", "Geliştirilmesi gereken alan 2"],
  "grammarIssues": [
    {
      "issue": "Hata açıklaması",
      "suggestion": "Düzeltme önerisi",
      "position": 123
    }
  ],
  "spellingIssues": [
    {
      "word": "yanlış kelime",
      "suggestion": "doğru yazım",
      "position": 45
    }
  ],
  "vocabularyScore": 85,
  "grammarScore": 78,
  "organizationScore": 90,
  "contentScore": 88
}

SADECE JSON döndür, başka açıklama ekleme!
`;

    try {
        const response = await invokeAIFunction<any>('generateContent', { 
            prompt: evaluationPrompt 
        });
        
        // Parse the response if it's a string
        if (typeof response === 'string') {
            // Clean up markdown code blocks if present
            let cleanedResponse = response.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
            }
            return JSON.parse(cleanedResponse);
        }
        
        return response;
    } catch (error) {
        console.error('Error evaluating composition:', error);
        // Return a fallback evaluation
        return {
            overall: "Değerlendirme yapılamadı. Lütfen tekrar deneyin.",
            strengths: ["Metin gönderildi"],
            improvements: ["Teknik bir sorun oluştu"],
            grammarIssues: [],
            spellingIssues: [],
            vocabularyScore: 0,
            grammarScore: 0,
            organizationScore: 0,
            contentScore: 0
        };
    }
};

