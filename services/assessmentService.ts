import { supabase } from './dbAdapter';

export interface Question {
    id: string;
    subject: 'math' | 'science';
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    question_text: string;
    correct_answer: string;
}

export interface Answer {
    questionId: string;
    studentAnswer: string;
}

export const assessmentService = {
    /**
     * Fetches 10 math and 10 science questions randomly
     */
    async getDiagnosticQuestions(): Promise<Question[]> {
        const { data: mathQuestions, error: mathError } = await supabase
            .from('questions')
            .select('*')
            .eq('subject', 'math')
            .limit(10);

        const { data: scienceQuestions, error: scienceError } = await supabase
            .from('questions')
            .select('*')
            .eq('subject', 'science')
            .limit(10);

        if (mathError || scienceError) {
            console.error('Error fetching questions:', mathError || scienceError);
            throw new Error('Could not fetch questions');
        }

        return [...(mathQuestions || []), ...(scienceQuestions || [])];
    },

    /**
     * Starts a new test session
     */
    async startSession(studentId: string): Promise<string> {
        const { data, error } = await supabase
            .from('test_sessions')
            .insert([{ student_id: studentId }])
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    },

    /**
     * Submits test answers and calculates results
     */
    async submitTest(sessionId: string, studentId: string, userAnswers: Answer[]) {
        // 1. Fetch correct answers
        const questionIds = userAnswers.map(a => a.questionId);
        const { data: correctAnswersData, error: questionsError } = await supabase
            .from('questions')
            .select('id, correct_answer, subject, topic')
            .in('id', questionIds);

        if (questionsError) throw questionsError;

        const answersToInsert = userAnswers.map(ua => {
            const question = correctAnswersData.find(q => q.id === ua.questionId);
            const isCorrect = question?.correct_answer.toLowerCase().trim() === ua.studentAnswer.toLowerCase().trim();
            return {
                test_session_id: sessionId,
                question_id: ua.questionId,
                student_answer: ua.studentAnswer,
                is_correct: isCorrect
            };
        });

        // 2. Save answers
        const { error: answersError } = await supabase
            .from('answers')
            .insert(answersToInsert);

        if (answersError) throw answersError;

        // 3. Mark session as completed
        await supabase
            .from('test_sessions')
            .update({ completed_at: new Date().toISOString() })
            .eq('id', sessionId);

        // 4. Update topic scores
        const topicMap = new Map<string, { subject: string, total: number, correct: number }>();

        answersToInsert.forEach(ans => {
            const question = correctAnswersData.find(q => q.id === ans.question_id);
            if (question) {
                const key = `${question.subject}:${question.topic}`;
                const current = topicMap.get(key) || { subject: question.subject, total: 0, correct: 0 };
                current.total += 1;
                if (ans.is_correct) current.correct += 1;
                topicMap.set(key, current);
            }
        });

        for (const [key, stats] of topicMap.entries()) {
            const [subject, topic] = key.split(':');

            // Increment existing scores
            // Note: In a production app, we'd use a RPC or a more complex atomic update
            // Here we'll do a simple select-then-upsert for demonstration
            const { data: existing } = await supabase
                .from('topic_scores')
                .select('*')
                .eq('student_id', studentId)
                .eq('subject', subject)
                .eq('topic', topic)
                .maybeSingle();

            const totalQ = (existing?.total_questions || 0) + stats.total;
            const correctA = (existing?.correct_answers || 0) + stats.correct;

            await supabase
                .from('topic_scores')
                .upsert({
                    student_id: studentId,
                    subject,
                    topic,
                    total_questions: totalQ,
                    correct_answers: correctA,
                    updated_at: new Date().toISOString()
                });
        }

        return {
            total: userAnswers.length,
            correct: answersToInsert.filter(a => a.is_correct).length
        };
    },

    async getStudentScores(studentId: string) {
        const { data, error } = await supabase
            .from('topic_scores')
            .select('*')
            .eq('student_id', studentId)
            .order('accuracy', { ascending: true });

        if (error) throw error;
        return data;
    },

    async getTodayTasks(studentId: string) {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('study_plans')
            .select('*')
            .eq('student_id', studentId)
            .eq('date', today);

        if (error) throw error;
        return data;
    },

    async toggleTaskCompletion(taskId: string, completed: boolean) {
        const { error } = await supabase
            .from('study_plans')
            .update({ completed })
            .eq('id', taskId);

        if (error) throw error;
    },

    async getOverallProgress(studentId: string) {
        const { data, error } = await supabase
            .from('study_plans')
            .select('completed')
            .eq('student_id', studentId);

        if (error) throw error;
        if (!data || data.length === 0) return 0;

        const completed = data.filter(d => d.completed).length;
        return Math.floor((completed / data.length) * 100);
    },

    /**
     * Generates a adaptive weekly study plan based on assessment results
     */
    async generateWeeklyPlan(studentId: string) {
        // 1. Get weakest topics
        const scores = await this.getStudentScores(studentId);

        const mathWeakest = scores.filter(s => s.subject === 'math').slice(0, 2);
        const scienceWeakest = scores.filter(s => s.subject === 'science').slice(0, 2);

        if (mathWeakest.length === 0 && scienceWeakest.length === 0) {
            throw new Error('Önce tanı testini tamamlamalısın.');
        }

        // 2. Clear existing plan for the next 7 days (optional, based on preference)
        // Here we just add new tasks

        const tasks = [];
        const today = new Date();

        const planStructure = [
            { day: 0, subject: 'math', topic: mathWeakest[0]?.topic, desc: 'Konu anlatımı ve temel kavramlar çalışması.' },
            { day: 1, subject: 'math', topic: mathWeakest[0]?.topic, desc: 'Konu ile ilgili 50 soru çözümü ve yanlış analizi.' },
            { day: 2, subject: 'science', topic: scienceWeakest[0]?.topic, desc: 'Konu özeti çıkarma ve video izleme.' },
            { day: 3, subject: 'science', topic: scienceWeakest[0]?.topic, desc: 'Kavrama testleri ve deney videoları.' },
            { day: 4, subject: 'math', topic: mathWeakest[1]?.topic || mathWeakest[0]?.topic, desc: 'Hızlı tekrar ve orta seviye sorular.' },
            { day: 5, subject: 'science', topic: scienceWeakest[1]?.topic || scienceWeakest[0]?.topic, desc: 'Yeni konu çalışması ve özet okuma.' },
            { day: 6, subject: 'mixed', topic: 'Genel Tekrar', desc: 'Haftalık çalışılan tüm konuların karma testi.' }
        ];

        for (const item of planStructure) {
            const taskDate = new Date(today);
            taskDate.setDate(today.getDate() + item.day);

            tasks.push({
                student_id: studentId,
                date: taskDate.toISOString().split('T')[0],
                subject: item.subject,
                topic: item.topic || 'Genel Çalışma',
                task_description: item.desc,
                completed: false
            });
        }

        // 3. Save to Supabase
        const { error } = await supabase
            .from('study_plans')
            .insert(tasks);

        if (error) throw error;
        return tasks;
    }
};
