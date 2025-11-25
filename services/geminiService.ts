import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty, Question, QuestionType, Subject, AIAnalysisReport, ReviewPackageItem, ReviewPackageItemType, WeeklyProgram, Task, TaskStatus, Assignment, AssignmentType, ContentRecommendation } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

const isConfigured = API_KEY && !API_KEY.includes('YOUR_');

if (isConfigured) {
    try {
        ai = new GoogleGenAI({ apiKey: API_KEY });
    } catch (e) {
        console.error("GoogleGenAI başlatılırken bir hata oluştu. API anahtarınızı kontrol edin.", e);
    }
} else {
    console.warn("Gemini API anahtarı eksik. Lütfen services/geminiService.ts dosyasını güncelleyin. AI özellikleri devre dışı bırakıldı.");
}


/**
 * A helper function to ensure the AI service is initialized before use.
 */
const ensureAiInitialized = () => {
    if (!ai) {
        throw new Error("AI servisi yapılandırılmamış veya başlatılamamış.");
    }
};

/**
 * General purpose text generation function
 */
export async function generateContent(prompt: string): Promise<string> {
    ensureAiInitialized();
    const response = await ai!.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
    });
    return response.text;
}

const testGenerationSchema = {
    type: Type.OBJECT,
    properties: {
        questions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING, description: 'The question text.' },
                    topic: { type: Type.STRING, description: 'The specific curriculum topic for this question (e.g., "Isı ve Sıcaklık").' },
                    type: { type: Type.STRING, enum: [QuestionType.MultipleChoice, QuestionType.OpenEnded], description: 'The type of question.'},
                    options: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'An array of 4 options for multiple choice questions.'},
                    correctAnswer: { type: Type.STRING, description: 'The correct answer. For multiple choice, it is the text of the correct option.'}
                },
                required: ['text', 'topic', 'type', 'correctAnswer']
            }
        }
    }
};

const analysisGenerationSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.OBJECT,
            properties: {
                correct: { type: Type.NUMBER, description: "Total number of correct answers." },
                wrong: { type: Type.NUMBER, description: "Total number of wrong or unanswered questions." },
                score_percent: { type: Type.NUMBER, description: "Overall success percentage (0-100)." }
            },
            required: ['correct', 'wrong', 'score_percent']
        },
        analysis: {
            type: Type.OBJECT,
            properties: {
                weak_topics: { type: Type.ARRAY, description: "An array of 1-3 specific sub-topics where the student is weak.", items: { type: Type.STRING }},
                strong_topics: { type: Type.ARRAY, description: "An array of 1-3 specific sub-topics where the student is strong.", items: { type: Type.STRING }},
                recommendations: { type: Type.ARRAY, description: "A concrete, 3-point action plan for the student.", items: { type: Type.STRING }},
                overall_comment: { type: Type.STRING, description: "A concise pedagogical comment on the student's performance."}
            },
            required: ['weak_topics', 'strong_topics', 'recommendations', 'overall_comment']
        },
        evaluation_tag: { type: Type.STRING, description: "A short, encouraging evaluation tag in Turkish (e.g., 'İlerleme gösteriyor', 'Harika Başarı', 'Tekrar Gerekli')."},
        topic_breakdown: {
            type: Type.ARRAY,
            description: "An array breaking down performance by topic. Include all topics from the test.",
            items: {
                type: Type.OBJECT,
                properties: {
                    topic: { type: Type.STRING },
                    correct: { type: Type.NUMBER },
                    wrong: { type: Type.NUMBER }
                },
                required: ['topic', 'correct', 'wrong']
            }
        },
        question_evaluations: {
            type: Type.ARRAY,
            description: "An array containing an evaluation for each question from the original test.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    isCorrect: { type: Type.BOOLEAN },
                    aiEvaluation: {
                        type: Type.OBJECT,
                        description: "AI evaluation for open-ended questions. Null for multiple choice.",
                        properties: {
                            score: { type: Type.NUMBER, description: "AI-assigned score (0-100) for the open-ended answer's quality." },
                            feedback: { type: Type.STRING, description: "Brief, constructive feedback on the answer." }
                        }
                    }
                },
                required: ['id', 'isCorrect']
            }
        }
    },
    required: ['summary', 'analysis', 'evaluation_tag', 'topic_breakdown', 'question_evaluations']
};


const reviewPackageGenerationSchema = {
    type: Type.OBJECT,
    properties: {
        introduction: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "An engaging title for the micro-lesson about the topic." },
                analogy: { type: Type.STRING, description: "A simple, relatable analogy to explain the core idea of the topic." }
            },
            required: ['title', 'analogy']
        },
        key_concepts: {
            type: Type.ARRAY,
            description: "An array of 2-3 core concepts related to the topic.",
            items: {
                type: Type.OBJECT,
                properties: {
                    concept: { type: Type.STRING, description: "The name of the key concept." },
                    explanation: { type: Type.STRING, description: "A brief, easy-to-understand explanation of the concept." }
                },
                required: ['concept', 'explanation']
            }
        },
        interactive_quiz: {
            type: Type.ARRAY,
            description: "An array of 2-3 multiple-choice questions to check understanding.",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, description: "Exactly 4 options.", items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING, description: "The text of the correct option." },
                    explanation: { type: Type.STRING, description: "A short explanation for why the correct answer is right."}
                },
                required: ['question', 'options', 'correctAnswer', 'explanation']
            }
        },
        summary: {
            type: Type.OBJECT,
            properties: {
                summary_text: { type: Type.STRING, description: "A concise summary of the most important takeaways." },
                encouragement: { type: Type.STRING, description: "A short, encouraging closing message for the student." }
            },
            required: ['summary_text', 'encouragement']
        }
    },
    required: ['introduction', 'key_concepts', 'interactive_quiz', 'summary']
};


const weeklyProgramGenerationSchema = {
    type: Type.OBJECT,
    properties: {
        days: {
            type: Type.ARRAY,
            description: "An array of 7 objects, one for each day from Pazartesi to Pazar.",
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.STRING, description: "Name of the day in Turkish (e.g., 'Pazartesi')." },
                    tasks: {
                        type: Type.ARRAY,
                        description: "A list of tasks for the day. Can be an empty array.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                activity_type: { type: Type.STRING, description: "Type of activity, e.g., 'Konu Tekrarı', 'Soru Çözümü', 'Video İzleme'." },
                                topic: { type: Type.STRING, description: "The specific topic for the task, e.g., 'Hal Değişimleri'." },
                                duration_mins: { type: Type.NUMBER, description: "Estimated duration in minutes, e.g., 30." }
                            },
                            required: ['activity_type', 'topic', 'duration_mins']
                        }
                    }
                },
                required: ['day', 'tasks']
            }
        }
    },
    required: ['days']
};

const explanationSchema = {
    type: Type.OBJECT,
    properties: {
        topic: { type: Type.STRING },
        explanation: { type: Type.STRING, description: "A simple, age-appropriate explanation in Turkish." },
        example: { type: Type.STRING, description: "A simple example question in Turkish." },
        hint: { type: Type.STRING, description: "A short hint for the example question in Turkish." }
    },
    required: ['topic', 'explanation', 'example', 'hint']
};

const answerCheckSchema = {
    type: Type.OBJECT,
    properties: {
        is_correct: { type: Type.BOOLEAN, description: "Is the student's solution fundamentally correct?" },
        feedback: { type: Type.STRING, description: "A short, encouraging, and constructive feedback in Turkish. If wrong, explain the mistake simply." }
    },
    required: ['is_correct', 'feedback']
};

const homeworkSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            description: "An array of 3 homework suggestions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING, enum: Object.values(AssignmentType) }
                },
                required: ['title', 'description', 'type']
            }
        }
    },
    required: ['suggestions']
};

const homeworkEvaluationSchema = {
    type: Type.OBJECT,
    properties: {
        score_percent: { type: Type.NUMBER, description: "A suggested score from 0 to 100 based on the submission's quality." },
        feedback: { type: Type.STRING, description: "A short, constructive feedback comment in Turkish highlighting strengths and areas for improvement." },
        weak_topics: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 1-2 specific topics the student struggled with in this homework." }
    },
    required: ['score_percent', 'feedback', 'weak_topics']
};

const completionTasksGenerationSchema = {
  type: Type.OBJECT,
  properties: {
    tasks: {
      type: Type.ARRAY,
      description: "An array of 2-3 short, completion micro-tasks.",
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING, description: "A short, actionable task description for the student in Turkish." },
          duration: { type: Type.NUMBER, description: "Estimated duration in minutes." }
        },
        required: ['description', 'duration']
      }
    }
  },
  required: ['tasks']
};

const progressReportGenerationSchema = {
  type: Type.OBJECT,
  properties: {
    ai_comment: { type: Type.STRING, description: "A short, insightful comment in Turkish comparing the two performances. Highlight progress and remaining weak areas." },
    focus_topics: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 1-2 topics the student should focus on next, based on the most recent report." }
  },
  required: ['ai_comment', 'focus_topics']
};

const contentRecommendationSchema = {
    type: Type.OBJECT,
    properties: {
        recommendations: {
            type: Type.ARRAY,
            description: "An array of 2-3 content recommendations.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['Video', 'Test', 'Okuma', 'Etkinlik'] },
                    description: { type: Type.STRING, description: "A short description of why this is recommended." },
                    source: { type: Type.STRING, enum: ['Kütüphane', 'Web'], description: "Where to find this content." }
                },
                required: ['title', 'type', 'description', 'source']
            }
        }
    },
    required: ['recommendations']
};

interface TestTopic {
    subject: Subject;
    unit: string;
    count: number;
}

export const generateTestQuestions = async (
    grade: number,
    topics: TestTopic[],
    questionType: QuestionType,
    difficulty: Difficulty,
): Promise<Question[]> => {
    ensureAiInitialized();
    try {
        const topicDescriptions = topics.map(t => 
            `- Ders: ${t.subject}, Ünite: "${t.unit}", Soru Sayısı: ${t.count}`
        ).join('\n');

        const totalCount = topics.reduce((sum, t) => sum + t.count, 0);

        const prompt = `
            You are an expert curriculum developer for Turkish middle schools (grades 5-8).
            Generate a single, cohesive test based on the following list of topics and question counts. The output MUST be a JSON object that conforms to the provided schema.

            Topic List:
            ${topicDescriptions}

            Overall Parameters:
            - Grade Level: ${grade}. Sınıf
            - Soru Tipi: ${questionType} (If 'Mixed', generate a mix of multiple-choice and open-ended questions).
            - Zorluk Seviyesi: ${difficulty}
            - Toplam Soru Sayısı: ${totalCount}

            Instructions:
            - For '${QuestionType.MultipleChoice}' questions, provide exactly 4 options and indicate the correct answer.
            - For '${QuestionType.OpenEnded}' questions, provide a sample correct answer.
            - Questions should be appropriate for the specified grade level and curriculum.
            - **Crucially, each question MUST be tagged with the specific 'topic' from the curriculum unit it belongs to.** This is vital for analysis.
        `;
        
        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: testGenerationSchema
            }
        });

        const jsonStr = response.text.trim();
        const data = JSON.parse(jsonStr);

        if (!data.questions || !Array.isArray(data.questions)) {
            throw new Error("AI returned an invalid format for questions.");
        }

        return data.questions.map((q: any, index: number) => ({
            id: `gen-${index}-${Date.now()}`,
            ...q,
        }));
    } catch (error) {
        console.error("Error generating test questions:", error);
        throw new Error("AI test generation failed. Please check your API key and network connection.");
    }
};

export const generateTestAnalysis = async (
    subject: Subject,
    unit: string,
    questions: Question[]
): Promise<AIAnalysisReport> => {
    ensureAiInitialized();
    try {
        const resultsData = questions.map(q => ({
            id: q.id,
            question: q.text,
            type: q.type,
            topic: q.topic,
            isCorrect: q.isCorrect,
            correctAnswer: q.correctAnswer,
            studentAnswer: q.studentAnswer || "Cevaplanmadı"
        }));

        const prompt = `
            You are an expert educational psychologist specializing in the Mastery Learning Model.
            Analyze the following student's test results. Your output MUST be a JSON object that conforms to the provided schema. The analysis MUST be in Turkish.

            Based on the provided questions (with topics and types), correct answers, and the student's answers:
            1.  Calculate the summary: total correct, wrong, and score percentage.
            2.  Create a 'topic_breakdown' by calculating correct/wrong answers for each unique topic.
            3.  Provide a short, encouraging 'evaluation_tag' (e.g., 'İlerleme gösteriyor').
            4.  Perform a detailed analysis: identify 'weak_topics', 'strong_topics', give an 'overall_comment', and suggest 3 'recommendations'.
            5.  **Crucially, create the 'question_evaluations' array.** For each question provided:
                - Return its original 'id' and the 'isCorrect' status.
                - If the question type is '${QuestionType.OpenEnded}', provide an 'aiEvaluation' object containing:
                    - 'score': An estimated score from 0 to 100 based on the quality, accuracy, and completeness of the student's answer.
                    - 'feedback': A single, concise sentence of constructive feedback.
                - If the question type is '${QuestionType.MultipleChoice}', the 'aiEvaluation' field should be null.

            Test Details:
            - Ders: ${subject}
            - Ünite: ${unit}

            Student's Results:
            ${JSON.stringify(resultsData, null, 2)}
        `;

        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisGenerationSchema
            }
        });
        
        const jsonStr = response.text.trim();
        const data = JSON.parse(jsonStr);

        // Merge AI evaluations back into the original questions array
        const finalQuestions = questions.map(q => {
            const evaluation = data.question_evaluations.find((e: any) => e.id === q.id);
            if (evaluation) {
                return {
                    ...q,
                    isCorrect: evaluation.isCorrect || evaluation.is_correct,
                    aiEvaluation: evaluation.aiEvaluation || evaluation.ai_evaluation || undefined
                };
            }
            return q;
        });

        // Convert snake_case to camelCase
        return {
            summary: {
                correct: data.summary.correct,
                wrong: data.summary.wrong,
                scorePercent: data.summary.score_percent
            },
            analysis: {
                weakTopics: data.analysis.weak_topics,
                strongTopics: data.analysis.strong_topics,
                recommendations: data.analysis.recommendations,
                overallComment: data.analysis.overall_comment
            },
            evaluationTag: data.evaluation_tag,
            topicBreakdown: data.topic_breakdown,
            questionEvaluations: finalQuestions
        };

    } catch (error) {
        console.error("Error analyzing student performance:", error);
        throw new Error("AI performance analysis failed. Please check your API key and network connection.");
    }
};

export const generateReviewPackage = async (topic: string, grade: number): Promise<ReviewPackageItem[]> => {
    ensureAiInitialized();
    try {
        const prompt = `
            You are an expert instructional designer for Turkish middle school students (grade ${grade}).
            Create a "micro-learning" remediation package for the topic: "${topic}".
            The package must be a complete, self-contained lesson to help a student master this concept.
            The output MUST be a JSON object that conforms to the provided schema.
            The language MUST be Turkish.

            The package must contain these 4 sections:
            1.  'introduction': An engaging title and a simple analogy.
            2.  'key_concepts': 2-3 essential concepts with brief explanations.
            3.  'interactive_quiz': 2-3 multiple-choice questions with 4 options each, the correct answer, and a short explanation for why it's correct.
            4.  'summary': A concise summary and an encouraging closing message.
        `;
        
        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: reviewPackageGenerationSchema
            }
        });

        const jsonStr = response.text.trim();
        const data = JSON.parse(jsonStr);

        const items: ReviewPackageItem[] = [
            { id: `item-intro-${Date.now()}`, type: ReviewPackageItemType.Introduction, content: data.introduction },
            { id: `item-concepts-${Date.now()}`, type: ReviewPackageItemType.KeyConcepts, content: { concepts: data.key_concepts } },
            { id: `item-quiz-${Date.now()}`, type: ReviewPackageItemType.InteractiveQuiz, content: { questions: data.interactive_quiz } },
            { id: `item-summary-${Date.now()}`, type: ReviewPackageItemType.Summary, content: data.summary },
        ];
        
        return items;

    } catch (error) {
        console.error("Error generating review package:", error);
        throw new Error("AI review package generation failed.");
    }
};


export const generateWeeklyProgram = async (
    grade: number,
    subject: Subject,
    report: AIAnalysisReport
): Promise<Omit<WeeklyProgram, 'id' | 'studentId' | 'week'>> => {
    ensureAiInitialized();
     try {
        const prompt = `
            You are an expert Learning Planning Specialist AI for Turkish middle school students.
            Based on the provided student test report, create a balanced, 1-week study plan.
            The output MUST be a JSON object conforming to the provided schema, containing a plan for 7 days (Pazartesi to Pazar).
            For each task, provide a specific 'activity_type', 'topic', and 'duration_mins'.

            Student and Report Details:
            - Grade Level: ${grade}. Sınıf
            - Subject: ${subject}
            - Strong Topics: ${report.analysis.strongTopics.join(', ') || 'None'}
            - Weak Topics: ${report.analysis.weakTopics.join(', ')}
            - Recommendations from previous report: ${report.analysis.recommendations.join('; ')}

            Generate a 7-day plan. Some days can be rest days. The plan should be encouraging and not overwhelming.
        `;

        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: weeklyProgramGenerationSchema
            }
        });

        const jsonStr = response.text.trim();
        const data = JSON.parse(jsonStr);
        
        const structuredProgram = {
            days: data.days.map((day: any) => ({
                day: day.day,
                tasks: day.tasks.map((task: any): Task => ({
                    id: `task-${Date.now()}-${Math.random()}`,
                    description: `${task.activity_type}: '${task.topic}'`,
                    status: TaskStatus.Assigned,
                    duration: task.duration_mins,
                    subject: subject,
                }))
            }))
        };
        
        return structuredProgram;

     } catch (error) {
        console.error("Error generating weekly program:", error);
        throw new Error("AI weekly program generation failed.");
     }
};


export const explainTopic = async (topic: string, grade: number): Promise<{ topic: string; explanation: string; example: string; hint: string; }> => {
    ensureAiInitialized();
    try {
        const prompt = `Explain the topic "${topic}" for a ${grade}th-grade student in Turkish using simple language. Your output MUST be a JSON object that conforms to the provided schema. Include one example question and a tip.`;
        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: explanationSchema }
        });
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error explaining topic:", error);
        throw new Error("AI failed to explain the topic.");
    }
};

export const checkAnswer = async (question: string, studentAnswerText: string, studentImageBase64?: string): Promise<{ isCorrect: boolean; feedback: string; }> => {
    ensureAiInitialized();
    try {
        const promptParts: any[] = [
            { text: `You are a helpful and encouraging AI Tutor for Turkish students.
            A student has submitted an answer to the following question: "${question}"
            Their submitted answer is: "${studentAnswerText}"
            Analyze their submitted answer (text and/or image).
            Your output MUST be a JSON object that conforms to the provided schema.
            - Determine if the answer is correct.
            - Provide short, positive, and constructive feedback in Turkish.
            - If the answer is wrong, gently explain the mistake without just giving the correct answer.
            - If an image is provided, analyze the steps shown in the image.` }
        ];

        if (studentImageBase64) {
            promptParts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: studentImageBase64
                }
            });
        }
        
        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: promptParts },
            config: { responseMimeType: "application/json", responseSchema: answerCheckSchema }
        });

        const jsonStr = response.text.trim();
        const data = JSON.parse(jsonStr);
        return { isCorrect: data.is_correct, feedback: data.feedback };

    } catch (error) {
        console.error("Error checking answer:", error);
        throw new Error("AI failed to check the answer.");
    }
};


export const suggestHomework = async (grade: number, subject: Subject, weakTopics: string[]): Promise<{title: string, description: string, type: AssignmentType}[]> => {
    ensureAiInitialized();
    try {
        const prompt = `Generate 3 diverse and relevant homework assignments in Turkish for a ${grade}th-grade ${subject} student. The assignments should target these weak topics: ${weakTopics.join(', ')}. The output MUST be a JSON object that conforms to the provided schema. Provide a mix of assignment types.`;

        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: homeworkSuggestionSchema
            }
        });

        const jsonStr = response.text.trim();
        const data = JSON.parse(jsonStr);
        return data.suggestions;
    } catch (error) {
        console.error("Error suggesting homework:", error);
        throw new Error("AI failed to suggest homework.");
    }
};

export const evaluateHomework = async (assignmentTitle: string, submissionText: string): Promise<{ scorePercent: number, feedback: string, weakTopics: string[] }> => {
    ensureAiInitialized();
    try {
        const prompt = `As an expert teacher, evaluate this student's homework submission in Turkish. The assignment was: "${assignmentTitle}". The student's submission is: "${submissionText}". Your output MUST be a JSON object that conforms to the provided schema. Provide a score from 0 to 100, constructive feedback, and identify 1-2 specific weak topics based on the submission.`;

        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: homeworkEvaluationSchema
            }
        });

        const jsonStr = response.text.trim();
        const data = JSON.parse(jsonStr);
        return {
            scorePercent: data.score_percent,
            feedback: data.feedback,
            weakTopics: data.weak_topics
        };
    } catch (error) {
        console.error("Error evaluating homework:", error);
        throw new Error("AI failed to evaluate the homework.");
    }
};

export const generateCompletionTasks = async (topic: string, subject?: Subject): Promise<Task[]> => {
    ensureAiInitialized();
    try {
        const prompt = `Generate 2-3 short, completion micro-tasks in Turkish for a student who is weak in the following topic: "${topic}". The output MUST be a JSON object that conforms to the provided schema. The tasks should be simple and actionable (e.g., 'Watch a video about X', 'Solve 5 practice questions on Y').`;
        
        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: completionTasksGenerationSchema
            }
        });
        
        const jsonStr = response.text.trim();
        const data = JSON.parse(jsonStr);
        
        return data.tasks.map((task: any): Task => ({
            id: `completion-task-${Date.now()}-${Math.random()}`,
            description: task.description,
            duration: task.duration,
            status: TaskStatus.Assigned,
            isCompletionTask: true,
            topic: topic,
            subject: subject,
            ai_recommended: true,
        }));

    } catch (error) {
        console.error("Error generating completion tasks:", error);
        throw new Error("AI failed to generate completion tasks.");
    }
};

export const generateProgressReport = async (lastReport: AIAnalysisReport, currentReport: AIAnalysisReport): Promise<{ ai_comment: string, focus_topics: string[] }> => {
    ensureAiInitialized();
    try {
        const prompt = `You are an expert educational analyst. Compare these two consecutive test reports for the same student and generate a progress analysis. Your output MUST be a JSON object that conforms to the provided schema. The language MUST be Turkish.

        Previous Report Summary:
        - Score: ${lastReport.summary.scorePercent}%
        - Weak Topics: ${lastReport.analysis.weakTopics.join(', ')}

        Current Report Summary:
        - Score: ${currentReport.summary.scorePercent}%
        - Weak Topics: ${currentReport.analysis.weakTopics.join(', ')}

        Based on this comparison:
        1. Write a short 'ai_comment' that is encouraging, highlights the progress (or lack thereof), and mentions if old weak topics were overcome or if new ones appeared.
        2. Identify 1-2 'focus_topics' for the student's next learning cycle based on the current report's weak topics.
        `;

        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: progressReportGenerationSchema
            }
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("Error generating progress report:", error);
        throw new Error("AI failed to generate the progress report.");
    }
};

export const recommendContentForTopic = async (topic: string, grade: number): Promise<ContentRecommendation[]> => {
    ensureAiInitialized();
    try {
        const prompt = `
            You are an AI Learning Assistant. A ${grade}th-grade student is struggling with the topic: "${topic}".
            Suggest 2-3 relevant learning materials in Turkish to help them.
            Your output MUST be a JSON object conforming to the provided schema.
            For 'source', prioritize 'Kütüphane' if the content could exist in a local library, otherwise use 'Web'.
            Keep descriptions short and encouraging.
        `;
        
        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: contentRecommendationSchema
            }
        });
        
        const jsonStr = response.text.trim();
        const data = JSON.parse(jsonStr);
        return data.recommendations;

    } catch (error) {
        console.error("Error recommending content:", error);
        throw new Error("AI failed to recommend content for the topic.");
    }
};

export const generateInteractiveComponent = async (
    contextText: string,
    grade: number,
    subject: Subject,
    componentType: 'mcq' | 'fill-in-the-blank' | 'true-false'
): Promise<any> => {
    ensureAiInitialized();
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
    
    switch(componentType) {
        case 'fill-in-the-blank':
            prompt += `\nComponent Type to Generate: 'fill-in-the-blank'. Create a sentence and identify the key word to be the answer. Use '___' for the blank.`;
            responseSchema = {
                type: Type.OBJECT,
                properties: {
                    sentence: { type: Type.STRING, description: "The sentence with a '___' placeholder." },
                    answer: { type: Type.STRING, description: "The word that fills the blank." }
                },
                required: ['sentence', 'answer']
            };
            break;
        case 'true-false':
            prompt += `\nComponent Type to Generate: 'true-false'. Create a statement that is either true or false based on the context.`;
            responseSchema = {
                type: Type.OBJECT,
                properties: {
                    statement: { type: Type.STRING, description: "The statement to be evaluated." },
                    answer: { type: Type.BOOLEAN, description: "The correct boolean answer (true or false)." }
                },
                required: ['statement', 'answer']
            };
            break;
        case 'mcq':
        default:
            prompt += `\nComponent Type to Generate: 'multiple-choice'. Provide exactly 4 options and indicate the correct answer.`;
            responseSchema = {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING, description: "The question text." },
                    options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 4 options." },
                    answer: { type: Type.STRING, description: "The text of the correct option." }
                },
                required: ['question', 'options', 'answer']
            };
    }

    try {
        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error(`Error generating interactive ${componentType}:`, error);
        throw new Error(`AI failed to generate a ${componentType} component.`);
    }
};

const flashcardGenerationSchema = {
    type: Type.OBJECT,
    properties: {
        flashcards: {
            type: Type.ARRAY,
            description: "An array of flashcards for the given topic.",
            items: {
                type: Type.OBJECT,
                properties: {
                    front_content: { type: Type.STRING, description: "The question or concept on the front of the card." },
                    back_content: { type: Type.STRING, description: "The answer or explanation on the back of the card." },
                    difficulty_level: { type: Type.NUMBER, description: "Difficulty level from 1 (easy) to 5 (hard)." }
                },
                required: ['front_content', 'back_content', 'difficulty_level']
            }
        }
    },
    required: ['flashcards']
};

export const generateFlashcards = async (
    topic: string,
    grade: number,
    subject: Subject,
    count: number = 10
): Promise<{ frontContent: string; backContent: string; difficultyLevel: number }[]> => {
    ensureAiInitialized();
    try {
        const prompt = `
            You are an expert curriculum developer for Turkish middle schools (grade ${grade}).
            Generate ${count} high-quality flashcards for the topic: "${topic}" in the subject "${subject}".
            The output MUST be a JSON object that conforms to the provided schema. The language MUST be Turkish.

            Flashcard Design Principles:
            1. Front: Clear, concise question or key concept
            2. Back: Complete, easy-to-understand answer or explanation
            3. Use simple language appropriate for grade ${grade}
            4. Mix different difficulty levels (1-5)
            5. Include both factual recall and conceptual understanding cards
            6. Make connections to real-world examples where possible

            Generate exactly ${count} flashcards.
        `;

        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: flashcardGenerationSchema
            }
        });

        const jsonStr = response.text.trim();
        const data = JSON.parse(jsonStr);

        return data.flashcards.map((card: any) => ({
            frontContent: card.front_content,
            backContent: card.back_content,
            difficultyLevel: card.difficulty_level
        }));

    } catch (error) {
        console.error("Error generating flashcards:", error);
        throw new Error("AI failed to generate flashcards.");
    }
};