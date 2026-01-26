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
import { sanitizePromptInput } from './promptSanitizer';

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
    const sanitizedTopics = topics.map(t => ({
        ...t,
        unit: sanitizePromptInput(t.unit, 100)
    }));
    const totalCount = sanitizedTopics.reduce((sum, t) => sum + t.count, 0);
    const primaryTopic = sanitizedTopics[0];

    const response = await invokeAIFunction<{ questions: any[] }>('generateTest', {
        grade,
        subject: primaryTopic.subject,
        unit: primaryTopic.unit,
        questionCount: totalCount,
        difficulty,
        questionType,
        topics: sanitizedTopics
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
        unit: sanitizePromptInput(unit, 100),
        questions
    });
};

export const generateWeeklyProgram = async (
    grade: number,
    subject: Subject,
    report: any // Allowing flexible input to handle both DiagnosisAIAnalysis and AIAnalysisReport
): Promise<Omit<WeeklyProgram, 'id' | 'studentId' | 'week'>> => {

    // 1. Normalize Analysis Data
    const weakTopics: string[] = [];
    const strongTopics: string[] = [];
    let overallComment = '';

    if (report.analysis && Array.isArray(report.analysis.weakTopics)) {
        // AIAnalysisReport format
        weakTopics.push(...report.analysis.weakTopics);
        strongTopics.push(...(report.analysis.strongTopics || []));
        overallComment = report.analysis.overallComment || '';
    } else if (Array.isArray(report.weakAreas)) {
        // DiagnosisAIAnalysis format
        weakTopics.push(...report.weakAreas.map((w: any) => typeof w === 'string' ? w : w.moduleName || w.name));
        strongTopics.push(...(report.strongAreas || []).map((s: any) => typeof s === 'string' ? s : s.moduleName || s.name));
        overallComment = report.overallAssessment || '';
    }

    // Prioritize weak topics for filling generic slots
    let weakTopicIndex = 0;

    const response = await invokeAIFunction<{ days: any[] }>('generateWeeklyPlan', {
        grade,
        subject,
        analysis: {
            weakTopics,
            strongTopics,
            overallComment: sanitizePromptInput(overallComment, 1000),
            // Pass original fields just in case
            ...report
        }
    });

    const dayMap: { [key: string]: string } = {
        'Monday': 'Pazartesi',
        'Tuesday': 'Salı',
        'Wednesday': 'Çarşamba',
        'Thursday': 'Perşembe',
        'Friday': 'Cuma',
        'Saturday': 'Cumartesi',
        'Sunday': 'Pazar',
        'monday': 'Pazartesi',
        'tuesday': 'Salı',
        'wednesday': 'Çarşamba',
        'thursday': 'Perşembe',
        'friday': 'Cuma',
        'saturday': 'Cumartesi',
        'sunday': 'Pazar'
    };

    return {
        days: response.days.map((day: any) => {
            // Normalize day name
            let dayName = day.day.trim();
            // Check if it's in the map (accounting for potential case differences)
            for (const [eng, tr] of Object.entries(dayMap)) {
                if (dayName.toLowerCase() === eng.toLowerCase()) {
                    dayName = tr;
                    break;
                }
            }

            // If it mimics "Day 1", "Day 2" etc, map them to standard days starting from Monday
            if (dayName.toLowerCase().startsWith('day') || dayName.toLowerCase().startsWith('gün')) {
                const dayNum = parseInt(dayName.replace(/\D/g, '')) || 1;
                const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
                dayName = days[(dayNum - 1) % 7];
            }

            return {
                day: dayName,
                tasks: day.tasks.map((task: any) => {
                    // Clean duration
                    let duration = 30; // Default
                    if (typeof task.duration === 'number') {
                        duration = task.duration;
                    } else if (typeof task.duration === 'string') {
                        const match = task.duration.match(/(\d+)/);
                        if (match) {
                            duration = parseInt(match[0]);
                        }
                    } else if (task.duration_mins) {
                        duration = parseInt(task.duration_mins) || 30;
                    }

                    // Determine subject
                    const taskSubject = task.subject || subject;

                    // Translate Activity Type
                    const rawType = (task.activity_type || task.type || '').toLowerCase();
                    const activityTypeMap: { [key: string]: string } = {
                        'study': 'Konu Anlatımı',
                        'learning': 'Konu Anlatımı',
                        'practice': 'Soru Çözümü',
                        'review': 'Tekrar',
                        'quiz': 'Test',
                        'test': 'Test',
                        'assessment': 'Değerlendirme',
                        'homework': 'Ödev',
                        'reading': 'Okuma',
                        'exercise': 'Alıştırma',
                        'project': 'Proje'
                    };

                    // Search for partial matches if direct match fails (e.g. "math practice" -> "Soru Çözümü")
                    let type = activityTypeMap[rawType] || 'Konu Çalışması';
                    if (rawType && !activityTypeMap[rawType]) {
                        for (const key in activityTypeMap) {
                            if (rawType.includes(key)) {
                                type = activityTypeMap[key];
                                break;
                            }
                        }
                    }

                    // Determine Title/Topic with Weak Topic Fallback
                    let topic = task.topic;

                    // Check if the current topic is generic 
                    const isGenericTopic = !topic || topic === 'Ders Çalışması' || topic === 'Study' ||
                        topic.includes('Çalışması') || topic.includes('Study');

                    let isWeakTopicFocus = false;

                    if (isGenericTopic && weakTopics.length > 0) {
                        // Use a weak topic and rotate index
                        topic = weakTopics[weakTopicIndex % weakTopics.length];
                        weakTopicIndex++; // Move to next weak topic for next generic task
                        isWeakTopicFocus = true;
                    } else if (isGenericTopic && !topic) {
                        if (task.description && task.description.length < 50) {
                            topic = task.description;
                        } else {
                            topic = `${taskSubject} Genel Çalışma`;
                        }
                    } else if (!topic) {
                        topic = 'Genel Tekrar';
                    }

                    // Final title cleanup
                    const title = topic;

                    // Improved Description Generator
                    let description = task.description;

                    // We overwrite description if it's missing, generic, OR if we injected a specific weak topic (to make it actionable)
                    const isGenericDescription = !description || description.length < 5 || description.includes('task') || description.includes('Activity');

                    if (isGenericDescription || isWeakTopicFocus) {
                        const actionMap: { [key: string]: string[] } = {
                            'Konu Anlatımı': ['konu anlatımını dikkatlice çalış', 'konu anlatım videosunu izle ve not al', 'konusunu kitabından detaylıca oku'],
                            'Soru Çözümü': ['ile ilgili en az 20 soru çöz', 'konusundaki alıştırmaları tamamla', 'örnek soru çözümleri yap'],
                            'Tekrar': ['konusunu baştan sona tekrar et', 'ile ilgili aldığın notları gözden geçir', 'kavram haritası çıkararak çalış'],
                            'Test': ['konusundan tarama testi çöz', 'seviye tespit testi uygula', 'konu kavrama testi çöz'],
                            'Ödev': ['verilen ödevleri eksikosiz tamamla', 'çalışma sorularını bitir'],
                            'Okuma': ['bölümünü oku ve özet çıkar', 'ilgili metinleri incele'],
                            'Alıştırma': ['pratik yap', 'alıştırmaları çöz']
                        };

                        const actions = actionMap[type] || ['üzerine yoğunlaş', 'çalışması yap'];
                        // Use a deterministic "random" based on title length to keep it stable but varied
                        const actionIndex = title.length % actions.length;
                        const selectedAction = actions[actionIndex];

                        if (isWeakTopicFocus) {
                            description = `❗ Eksik Giderme: ${title} ${selectedAction}.`;
                        } else {
                            description = `${title} ${selectedAction}.`;
                        }
                    }

                    return {
                        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        description: description,
                        title: title,
                        type: type,
                        status: TaskStatus.Assigned,
                        duration: duration,
                        subject: taskSubject,
                        ai_recommended: true,
                        topic: topic,
                        metadata: {
                            original_day: day.day,
                            original_type: rawType,
                            is_weak_topic_focus: isWeakTopicFocus
                        }
                    };
                })
            };
        })
    };
};

export const generateReviewPackage = async (topic: string, grade: number): Promise<ReviewPackageItem[]> => {
    const response = await invokeAIFunction<{ items: any[] }>('generateReviewPackage', {
        topic: sanitizePromptInput(topic, 200),
        grade
    });

    // Ensure IDs are unique
    return response.items.map((item, index) => ({
        ...item,
        id: item.id || `review-item-${index}-${Date.now()}`
    }));
};

export const explainTopic = async (topic: string, grade: number): Promise<{ topic: string; explanation: string; example: string; hint: string; }> => {
    const sanitizedTopic = sanitizePromptInput(topic, 200);
    const cacheKey = `explain-topic-${sanitizedTopic}-${grade}`;
    return cacheService.remember(cacheKey, async () => {
        return invokeAIFunction('explainTopic', { topic: sanitizedTopic, grade });
    }, 86400);
};

export const recommendContentForTopic = async (topic: string, grade: number): Promise<ContentRecommendation[]> => {
    const sanitizedTopic = sanitizePromptInput(topic, 200);
    const cacheKey = `recommend-content-${sanitizedTopic}-${grade}`;
    return cacheService.remember(cacheKey, async () => {
        const response = await invokeAIFunction<{ recommendations: ContentRecommendation[] }>('recommendContent', { topic: sanitizedTopic, grade });
        return response.recommendations;
    }, 86400);
};

export const evaluateHomework = async (assignmentTitle: string, submissionText: string): Promise<{ scorePercent: number, feedback: string, weakTopics: string[] }> => {
    return invokeAIFunction('analyzeHomework', {
        assignment: { description: sanitizePromptInput(assignmentTitle, 200) },
        submission: { submissionText: sanitizePromptInput(submissionText, 5000) }
    });
};

export const generateFlashcards = async (topic: string, grade: number, subject: Subject, count: number = 10): Promise<any> => {
    return invokeAIFunction('generateFlashcards', {
        topic: sanitizePromptInput(topic, 200),
        grade,
        subject,
        count
    });
};

export const generateCompletionTasks = async (topic: string, subject?: Subject): Promise<Task[]> => {
    const sanitizedTopic = sanitizePromptInput(topic, 200);
    const response = await invokeAIFunction<{ tasks: any[] }>('generateCompletionTasks', { topic: sanitizedTopic, subject });
    return response.tasks.map((task: any) => ({
        id: `completion-task-${Date.now()}-${Math.random()}`,
        description: task.description,
        duration: task.duration,
        status: TaskStatus.Assigned,
        isCompletionTask: true,
        topic: sanitizedTopic,
        subject: subject,
        ai_recommended: true,
    }));
};

export const generateProgressReport = async (lastReport: AIAnalysisReport, currentReport: AIAnalysisReport): Promise<{ ai_comment: string, focus_topics: string[] }> => {
    return invokeAIFunction('generateProgressReport', { lastReport, currentReport });
};

export const suggestHomework = async (grade: number, subject: Subject, weakTopics: string[]): Promise<{ title: string, description: string, type: AssignmentType }[]> => {
    const sanitizedWeakTopics = weakTopics.map(t => sanitizePromptInput(t, 100));
    const response = await invokeAIFunction<{ suggestions: any[] }>('suggestHomework', {
        grade,
        subject,
        weakTopics: sanitizedWeakTopics
    });
    return response.suggestions;
};

export const checkAnswer = async (question: string, studentAnswerText: string, studentImageBase64?: string): Promise<{ isCorrect: boolean; feedback: string; }> => {
    return invokeAIFunction('checkAnswer', {
        question: sanitizePromptInput(question, 1000),
        studentAnswerText: sanitizePromptInput(studentAnswerText, 2000),
        studentImageBase64
    });
};

export const explainWrongAnswer = async (
    question: string,
    options: string[],
    correctAnswer: string,
    studentAnswer: string,
    subject?: string,
    grade?: number
): Promise<string> => {
    const prompt = `
    Sen uzman bir öğretmensin. Bir öğrenci aşağıdaki soruyu yanlış cevapladı. 
    Lütfen öğrenciye neden yanlış yaptığını ve doğru mantığın ne olduğunu nazikçe açıkla.
    
    SORU: ${sanitizePromptInput(question, 1000)}
    SEÇENEKLER: ${options.join(', ')}
    DOĞRU CEVAP: ${correctAnswer}
    ÖĞRENCİNİN CEVABI: ${studentAnswer}
    ${subject ? `DERS: ${subject}` : ''}
    ${grade ? `SINIF: ${grade}` : ''}

    Açıklaman şunları içermeli:
    1. Öğrencinin muhtemel düşünme hatası.
    2. Doğru cevaba giden adım adım mantık.
    3. Konuyla ilgili kısa bir ipucu.
    
    Dil: Türkçe. Yanıtın kısa, öz ve öğrenciyi motive edici olsun. SADECE açıklamayı döndür.
    `;

    const response = await invokeAIFunction<any>('generateContent', {
        prompt: sanitizePromptInput(prompt, 5000)
    });

    // Handle different response formats from generateContent
    if (typeof response === 'string') return response;
    if (response.content) return response.content;
    if (response.text) return response.text;
    return JSON.stringify(response);
};

export const generateContent = async (prompt: string): Promise<string> => {
    const response = await invokeAIFunction<any>('generateContent', {
        prompt: sanitizePromptInput(prompt, 5000)
    });
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
        ${sanitizePromptInput(contextText, 5000)}
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
        subject: sanitizePromptInput(subject, 100),
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
        subject: sanitizePromptInput(subject, 100),
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
    const sanitizedTopic = sanitizePromptInput(prompt, 500);
    const sanitizedText = sanitizePromptInput(studentText, 5000);

    const evaluationPrompt = `
Sen bir Türkçe öğretmenisin. Aşağıdaki öğrenci kompozisyonunu değerlendir.

KONU: ${sanitizedTopic}

ÖĞRENCİ METNİ:
${sanitizedText}

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
