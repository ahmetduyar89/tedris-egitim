// Supabase Edge Function - AI Generate
// Bu function Gemini API key'ini güvenli bir şekilde backend'de tutar
// Client-side'dan sadece prompt gönderilir, API key asla expose olmaz

// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIRequest {
    action: 'generateTest' | 'analyzeTest' | 'generateWeeklyPlan' | 'generateReviewPackage' | 'explainTopic' | 'recommendContent' | 'analyzeHomework' | 'generateFlashcards'
    payload: any
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
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
        const { action, payload }: AIRequest = await req.json()

        // Get Gemini API key from environment (server-side only)
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
        if (!GEMINI_API_KEY) {
            throw new Error('Gemini API key not configured')
        }

        // Make request to Gemini API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`

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
            default:
                throw new Error('Invalid action')
        }

        // Call Gemini API
        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
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
                }
            })
        })

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text()
            console.error('Gemini API error:', errorText)
            throw new Error(`Gemini API error: ${geminiResponse.status}`)
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
            throw new Error('Failed to parse AI response')
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
                status: error.message === 'Unauthorized' ? 401 : 500,
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
