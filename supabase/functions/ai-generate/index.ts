// Supabase Edge Function - AI Generate
// Bu function Gemini API key'ini güvenli bir şekilde backend'de tutar
// Client-side'dan sadece prompt gönderilir, API key asla expose olmaz

// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface AIRequest {
    action: 'generateTest' | 'analyzeTest' | 'generateWeeklyPlan' | 'generateReviewPackage' | 'explainTopic' | 'recommendContent' | 'analyzeHomework' | 'generateFlashcards' | 'generateCompletionTasks' | 'generateProgressReport' | 'checkAnswer' | 'suggestHomework' | 'generateContent' | 'generateDiagnosisQuestions' | 'analyzeDiagnosisTest'
    payload: any
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    try {
        // Verify authentication
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing authorization header')
        }

        // Initialize Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: authHeader },
                },
            }
        )

        // Verify user is authenticated
        const {
            data: { user },
            error: userError,
        } = await supabaseClient.auth.getUser()

        if (userError || !user) {
            throw new Error('Unauthorized')
        }

        // Parse request body
        let body;
        try {
            body = await req.json();
        } catch (e) {
            throw new Error('Invalid JSON body');
        }

        const { action, payload } = body as AIRequest;

        if (!payload) {
            throw new Error('Missing payload');
        }

        // Get Gemini API key from environment (server-side only)
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
        if (!GEMINI_API_KEY) {
            throw new Error('Gemini API key not configured')
        }

        let prompt = ''

        // Build prompt based on action
        switch (action) {
            case 'generateTest':
                prompt = buildTestGenerationPrompt(payload)
                break
            case 'analyzeTest':
                prompt = buildTestAnalysisPrompt(payload)
                break
            case 'generateWeeklyPlan':
                prompt = buildWeeklyPlanPrompt(payload)
                break
            case 'generateReviewPackage':
                prompt = buildReviewPackagePrompt(payload)
                break
            case 'explainTopic':
                prompt = buildExplainTopicPrompt(payload)
                break
            case 'recommendContent':
                prompt = buildRecommendContentPrompt(payload)
                break
            case 'analyzeHomework':
                prompt = buildHomeworkAnalysisPrompt(payload)
                break
            case 'generateFlashcards':
                prompt = buildFlashcardsPrompt(payload)
                break
            case 'generateCompletionTasks':
                prompt = buildCompletionTasksPrompt(payload)
                break
            case 'generateProgressReport':
                prompt = buildProgressReportPrompt(payload)
                break
            case 'checkAnswer':
                prompt = buildCheckAnswerPrompt(payload)
                break
            case 'suggestHomework':
                prompt = buildSuggestHomeworkPrompt(payload)
                break
            case 'generateContent':
                prompt = payload.prompt
                break
            case 'generateDiagnosisQuestions':
                prompt = buildDiagnosisQuestionsPrompt(payload)
                break
            case 'analyzeDiagnosisTest':
                prompt = buildDiagnosisAnalysisPrompt(payload)
                break
            default:
                throw new Error(`Invalid action: ${action}`)
        }

        // Make request to Gemini API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`

        const requestBody: any = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
                responseMimeType: payload.responseSchema ? "application/json" : undefined,
                responseSchema: payload.responseSchema
            }
        };

        // Handle image for checkAnswer
        if (action === 'checkAnswer' && payload.studentImageBase64) {
            requestBody.contents[0].parts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: payload.studentImageBase64
                }
            });
        }

        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        })

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text()
            console.error('Gemini API error:', errorText)
            throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`)
        }

        const geminiData = await geminiResponse.json()
        const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

        if (!responseText) {
            throw new Error('No response from Gemini API')
        }

        // Parse JSON response
        let result
        try {
            // Extract JSON from markdown code blocks if present
            const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                responseText.match(/```\n([\s\S]*?)\n```/)
            const jsonText = jsonMatch ? jsonMatch[1] : responseText
            result = JSON.parse(jsonText)
        } catch (parseError) {
            console.error('JSON parse error:', parseError)
            console.error('Response text:', responseText)
            // If it's not JSON, return as text if no schema was requested, otherwise error
            if (!payload.responseSchema) {
                result = { text: responseText }
            } else {
                throw new Error('Failed to parse AI response as JSON')
            }
        }

        return new Response(
            JSON.stringify({ success: true, data: result }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Edge function error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Internal server error'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200, // Return 200 to allow client to read the error message
            }
        )
    }
})

// Helper functions to build prompts
function buildTestGenerationPrompt(payload: any): string {
    const { subject, unit, grade, questionCount, difficulty, questionType } = payload
    return `Generate a test with ${questionCount} ${questionType} questions for ${subject} - ${unit} (Grade ${grade}, Difficulty: ${difficulty}). Return as JSON with structure: { questions: [{ id, text, type, options?, correctAnswer, topic }] }`
}

function buildTestAnalysisPrompt(payload: any): string {
    const { subject, unit, questions } = payload
    return `Analyze this test for ${subject} - ${unit}. Questions: ${JSON.stringify(questions)}. Return JSON: { summary: { correct, wrong, scorePercent }, analysis: { weakTopics: [], strongTopics: [], recommendations: [], overallComment: "" }, questionEvaluations: [] }`
}

function buildWeeklyPlanPrompt(payload: any): string {
    const { grade, subject, analysis } = payload
    return `Generate a weekly study plan for Grade ${grade} ${subject} based on this analysis: ${JSON.stringify(analysis)}. Return JSON: { days: [{ day: "", tasks: [{ description, duration, subject, type }] }] }`
}

function buildReviewPackagePrompt(payload: any): string {
    const { topic, grade } = payload
    return `Create a review package for "${topic}" (Grade ${grade}). Return JSON: { items: [{ type: "introduction|key-concepts|interactive-quiz|summary", content: {} }] }`
}

function buildExplainTopicPrompt(payload: any): string {
    const { topic, grade } = payload
    return `Explain "${topic}" for Grade ${grade} students. Return JSON: { topic: "", explanation: "", example: "", hint: "" }`
}

function buildRecommendContentPrompt(payload: any): string {
    const { topic, grade } = payload
    return `Recommend learning content for "${topic}" (Grade ${grade}). Return JSON: { recommendations: [{ title: "", type: "", description: "", source: "" }] }`
}

function buildHomeworkAnalysisPrompt(payload: any): string {
    const { assignment, submission } = payload
    return `Analyze this homework submission. Assignment: ${assignment.description}. Submission: ${submission.submissionText}. Return JSON: { score: 0-100, feedback: "", weakTopics: [], strongTopics: [] }`
}

function buildFlashcardsPrompt(payload: any): string {
    const { topic, grade, count } = payload
    return `Generate ${count} flashcards for "${topic}" (Grade ${grade}). Return JSON: { flashcards: [{ front_content: "", back_content: "", difficulty_level: 1-5 }] }`
}

function buildCompletionTasksPrompt(payload: any): string {
    const { topic } = payload
    return `Generate 2-3 short, completion micro-tasks in Turkish for a student who is weak in: "${topic}". Return JSON: { tasks: [{ description: "", duration: number }] }`
}

function buildProgressReportPrompt(payload: any): string {
    const { lastReport, currentReport } = payload
    return `Compare these two reports. Last: ${JSON.stringify(lastReport)}. Current: ${JSON.stringify(currentReport)}. Return JSON: { ai_comment: "", focus_topics: [] }`
}

function buildCheckAnswerPrompt(payload: any): string {
    const { question, studentAnswerText } = payload
    return `Check this answer. Question: "${question}". Answer: "${studentAnswerText}". Return JSON: { is_correct: boolean, feedback: "" }`
}

function buildSuggestHomeworkPrompt(payload: any): string {
    const { grade, subject, weakTopics } = payload
    return `Suggest 3 homework assignments for Grade ${grade} ${subject} focusing on: ${weakTopics.join(', ')}. Return JSON: { suggestions: [{ title: "", description: "", type: "" }] }`
}

function buildDiagnosisQuestionsPrompt(payload: any): string {
    const { subject, grade, modules, questionsPerModule, difficulty } = payload

    const moduleList = modules.map((m: any) => `- ${m.name} (Kod: ${m.code || 'N/A'})`).join('\n')

    return `Sen bir ${subject} öğretmenisin. ${grade}. sınıf seviyesinde tanı testi soruları oluştur.

MODÜLLER:
${moduleList}

GEREKSİNİMLER:
- Her modül için ${questionsPerModule} adet soru
- Zorluk seviyesi: ${difficulty}/5
- Her soru öğrencinin o kazanımdaki yeterliliğini ölçmeli
- 4 şıklı çoktan seçmeli sorular
- Şıklar dengeli ve yanıltıcı olmalı
- Türkçe ve net ifadeler
- MEB müfredatına uygun
- Her soru bağımsız olmalı (önceki soruya bağımlı olmamalı)

JSON FORMATI:
{
  "questions": [
    {
      "module_id": "modül_kodu",
      "module_name": "Modül Adı",
      "question_text": "Soru metni burada",
      "options": ["A) Şık 1", "B) Şık 2", "C) Şık 3", "D) Şık 4"],
      "correct_answer": "A",
      "difficulty": ${difficulty},
      "explanation": "Doğru cevap neden A olduğunun kısa açıklaması"
    }
  ]
}

SADECE JSON döndür, başka metin ekleme!`
}

function buildDiagnosisAnalysisPrompt(payload: any): string {
    const { subject, grade, totalQuestions, correctAnswers, moduleResults } = payload

    const moduleResultsText = moduleResults.map((m: any) =>
        `- ${m.moduleName}: ${m.correct}/${m.total} doğru (${Math.round(m.correct / m.total * 100)}%)`
    ).join('\n')

    const score = Math.round((correctAnswers / totalQuestions) * 100)

    return `Sen bir eğitim danışmanısın. Öğrencinin tanı testi sonuçlarını detaylı analiz et.

ÖĞRENCİ BİLGİLERİ:
- Sınıf: ${grade}
- Ders: ${subject}
- Toplam Soru: ${totalQuestions}
- Doğru Cevap: ${correctAnswers}
- Genel Başarı: ${score}%

MODÜL BAZINDA SONUÇLAR:
${moduleResultsText}

ANALİZ GEREKSİNİMLERİ:
1. Genel Değerlendirme: Objektif, yapıcı, motive edici
2. Yeterlilik Seviyesi: beginner/intermediate/advanced
3. Güçlü Alanlar: En az 2, en fazla 3 alan (mastery score yüksek olanlar)
4. Zayıf Alanlar: En az 2, en fazla 3 alan (öncelik sırasına göre)
5. Her zayıf alan için gap analizi (neden zayıf, ne eksik)
6. Somut öneriler (çalışma planı, kaynak, strateji)
7. Öğrenme stili hakkında gözlemler (varsa)
8. Motive edici kapanış mesajı

JSON FORMATI:
{
  "overall_assessment": "Genel değerlendirme metni (3-4 cümle)",
  "proficiency_level": "beginner|intermediate|advanced",
  "strong_areas": [
    {
      "module_name": "Modül Adı",
      "module_code": "kod",
      "mastery_score": 0.85,
      "comment": "Bu alanda neden güçlü olduğu"
    }
  ],
  "weak_areas": [
    {
      "module_name": "Modül Adı",
      "module_code": "kod",
      "mastery_score": 0.45,
      "gap_analysis": "Eksiklik analizi: Ne bilmiyor, neden zorlanıyor",
      "priority": "high|medium|low"
    }
  ],
  "recommendations": [
    {
      "type": "study_plan|practice|review|advanced",
      "description": "Somut öneri açıklaması",
      "modules": ["modül1", "modül2"],
      "estimated_duration": "2 hafta"
    }
  ],
  "learning_style_insights": "Öğrenme stili hakkında gözlemler (opsiyonel)",
  "motivation_message": "Motive edici, pozitif kapanış mesajı"
}

SADECE JSON döndür, başka metin ekleme!`
}
