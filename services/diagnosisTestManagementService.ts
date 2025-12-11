import { supabase } from './supabase';
import {
    DiagnosisTest,
    DiagnosisTestQuestion,
    DiagnosisTestAssignment,
    DiagnosisTestAnswer,
    DiagnosisTestAction,
    DiagnosisAIAnalysis,
    CreateDiagnosisTestConfig,
    AssignDiagnosisTestConfig,
    DiagnosisModuleResult,
    DiagnosisDetailedResult,
    DiagnosisTestStatus
} from '../types/diagnosisTestTypes';
import mistakeService from './mistakesService';
import { notifyTestAssigned } from './multiChannelNotificationService';

export const diagnosisTestManagementService = {
    // ==================== ÖĞRETMEN: TEST OLUŞTURMA ====================

    async createTest(teacherId: string, config: CreateDiagnosisTestConfig): Promise<DiagnosisTest> {
        const { data, error } = await supabase
            .from('diagnosis_tests')
            .insert({
                teacher_id: teacherId,
                title: config.title,
                description: config.description,
                subject: config.subject,
                grade: config.grade,
                total_questions: config.totalQuestions,
                duration_minutes: config.durationMinutes || 60,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        // Soruları kaydet
        if (config.questions && config.questions.length > 0) {
            await this.saveQuestions(data.id, config.questions);
        }

        return {
            id: data.id,
            teacherId: data.teacher_id,
            title: data.title,
            description: data.description,
            subject: data.subject,
            grade: data.grade,
            totalQuestions: data.total_questions,
            durationMinutes: data.duration_minutes,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    },

    async saveQuestions(testId: string, questions: Omit<DiagnosisTestQuestion, 'id' | 'createdAt'>[]): Promise<void> {
        const questionsData = questions.map((q, index) => ({
            test_id: testId,
            module_id: q.moduleId,
            module_name: q.moduleName,
            question_text: q.questionText,
            options: q.options,
            correct_answer: q.correctAnswer,
            difficulty: q.difficulty,
            order_index: index
        }));

        const { error } = await supabase
            .from('diagnosis_test_questions')
            .insert(questionsData);

        if (error) throw error;
    },

    async getTeacherTests(teacherId: string): Promise<DiagnosisTest[]> {
        const { data, error } = await supabase
            .from('diagnosis_tests')
            .select('*')
            .eq('teacher_id', teacherId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map(d => ({
            id: d.id,
            teacherId: d.teacher_id,
            title: d.title,
            description: d.description,
            subject: d.subject,
            grade: d.grade,
            totalQuestions: d.total_questions,
            durationMinutes: d.duration_minutes,
            isActive: d.is_active,
            createdAt: d.created_at,
            updatedAt: d.updated_at
        }));
    },

    async getTestQuestions(testId: string): Promise<DiagnosisTestQuestion[]> {
        const { data, error } = await supabase
            .from('diagnosis_test_questions')
            .select('*')
            .eq('test_id', testId)
            .order('order_index');

        if (error) throw error;

        return data.map(d => ({
            id: d.id,
            testId: d.test_id,
            moduleId: d.module_id,
            moduleName: d.module_name,
            questionText: d.question_text,
            options: d.options,
            correctAnswer: d.correct_answer,
            difficulty: d.difficulty,
            orderIndex: d.order_index,
            createdAt: d.created_at
        }));
    },

    async deleteTest(testId: string): Promise<void> {
        const { error } = await supabase
            .from('diagnosis_tests')
            .delete()
            .eq('id', testId);

        if (error) throw error;
    },

    // ==================== ÖĞRETMEN: TEST ATAMA ====================

    async assignTest(config: AssignDiagnosisTestConfig, teacherId: string): Promise<DiagnosisTestAssignment[]> {
        const assignments = config.studentIds.map(studentId => ({
            test_id: config.testId,
            student_id: studentId,
            teacher_id: teacherId,
            due_date: config.dueDate,
            is_mandatory: config.isMandatory,
            status: 'pending' as DiagnosisTestStatus
        }));

        const { data, error } = await supabase
            .from('diagnosis_test_assignments')
            .insert(assignments)
            .select();

        if (error) throw error;

        // Get test details for notification
        const { data: testData } = await supabase
            .from('diagnosis_tests')
            .select('title')
            .eq('id', config.testId)
            .single();

        // Send notifications to all assigned students
        if (testData) {
            const notificationPromises = config.studentIds.map(studentId =>
                notifyTestAssigned(
                    studentId,
                    testData.title,
                    config.testId,
                    'diagnosis',
                    config.whatsappWindow
                ).catch(err => {
                    console.error('Failed to send notification to student:', studentId, err);
                })
            );

            // Don't wait for notifications to complete
            Promise.allSettled(notificationPromises);
        }

        return data.map(d => ({
            id: d.id,
            testId: d.test_id,
            studentId: d.student_id,
            teacherId: d.teacher_id,
            assignedAt: d.assigned_at,
            dueDate: d.due_date,
            isMandatory: d.is_mandatory,
            status: d.status,
            startedAt: d.started_at,
            completedAt: d.completed_at,
            score: d.score,
            totalCorrect: d.total_correct,
            totalQuestions: d.total_questions,
            aiAnalysis: d.ai_analysis,
            createdAt: d.created_at,
            updatedAt: d.updated_at
        }));
    },

    async getTestAssignments(testId: string): Promise<DiagnosisTestAssignment[]> {
        const { data, error } = await supabase
            .from('diagnosis_test_assignments')
            .select(`
                *,
                students (*)
            `)
            .eq('test_id', testId)
            .order('assigned_at', { ascending: false });

        if (error) throw error;

        return data.map(d => ({
            id: d.id,
            testId: d.test_id,
            studentId: d.student_id,
            teacherId: d.teacher_id,
            assignedAt: d.assigned_at,
            dueDate: d.due_date,
            isMandatory: d.is_mandatory,
            status: d.status,
            startedAt: d.started_at,
            completedAt: d.completed_at,
            score: d.score,
            totalCorrect: d.total_correct,
            totalQuestions: d.total_questions,
            aiAnalysis: d.ai_analysis,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
            student: d.students ? {
                ...d.students,
                // Manually map fields that might differ between DB (snake_case) and Type (camelCase)
                // if the automatic mapping isn't sufficient or if types.ts has camelCase definitions
                parentName: d.students.parent_name,
                parentPhone: d.students.parent_phone
            } : undefined
        }));
    },

    // ==================== ÖĞRENCİ: TEST ALMA ====================

    async getStudentAssignments(studentId: string): Promise<DiagnosisTestAssignment[]> {
        const { data, error } = await supabase
            .from('diagnosis_test_assignments')
            .select(`
        *,
        diagnosis_tests (*)
      `)
            .eq('student_id', studentId)
            .order('assigned_at', { ascending: false });

        if (error) throw error;

        return data.map(d => ({
            id: d.id,
            testId: d.test_id,
            studentId: d.student_id,
            teacherId: d.teacher_id,
            assignedAt: d.assigned_at,
            dueDate: d.due_date,
            isMandatory: d.is_mandatory,
            status: d.status,
            startedAt: d.started_at,
            completedAt: d.completed_at,
            score: d.score,
            totalCorrect: d.total_correct,
            totalQuestions: d.total_questions,
            aiAnalysis: d.ai_analysis,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
            test: d.diagnosis_tests ? {
                id: d.diagnosis_tests.id,
                teacherId: d.diagnosis_tests.teacher_id,
                title: d.diagnosis_tests.title,
                description: d.diagnosis_tests.description,
                subject: d.diagnosis_tests.subject,
                grade: d.diagnosis_tests.grade,
                totalQuestions: d.diagnosis_tests.total_questions,
                durationMinutes: d.diagnosis_tests.duration_minutes,
                isActive: d.diagnosis_tests.is_active,
                createdAt: d.diagnosis_tests.created_at,
                updatedAt: d.diagnosis_tests.updated_at
            } : undefined
        }));
    },

    async startTest(assignmentId: string): Promise<void> {
        const { error } = await supabase
            .from('diagnosis_test_assignments')
            .update({
                status: 'in_progress',
                started_at: new Date().toISOString()
            })
            .eq('id', assignmentId);

        if (error) throw error;
    },

    async saveAnswer(assignmentId: string, questionId: string, answer: string): Promise<void> {
        // Önce sorunun doğru cevabını ve seçeneklerini al
        const { data: questionData } = await supabase
            .from('diagnosis_test_questions')
            .select('correct_answer, options')
            .eq('id', questionId)
            .single();

        let isCorrect = false;

        if (questionData) {
            const cleanAnswer = answer.trim();
            const cleanCorrect = questionData.correct_answer.trim();

            // 1. Tam eşleşme kontrolü
            if (cleanAnswer === cleanCorrect) {
                isCorrect = true;
            }
            // 2. Harf indeksi kontrolü (Eğer doğru cevap 'A', 'B' gibi tek harf ise)
            else if (cleanCorrect.length === 1) {
                const options = questionData.options as string[];
                const answerIndex = options.indexOf(answer);

                if (answerIndex !== -1) {
                    // Seçilen şıkkın harf karşılığını bul (0->A, 1->B...)
                    const answerLetter = String.fromCharCode(65 + answerIndex);
                    if (answerLetter === cleanCorrect) {
                        isCorrect = true;
                    }
                }

                // Ayrıca prefix kontrolü de yapalım (Eğer cevap "A) ..." formatındaysa)
                if (!isCorrect && (
                    cleanAnswer.startsWith(`${cleanCorrect})`) ||
                    cleanAnswer.startsWith(`${cleanCorrect}.`)
                )) {
                    isCorrect = true;
                }
            }
        }

        // Cevabı kaydet veya güncelle
        const { error } = await supabase
            .from('diagnosis_test_answers')
            .upsert({
                assignment_id: assignmentId,
                question_id: questionId,
                student_answer: answer,
                is_correct: isCorrect,
                answered_at: new Date().toISOString()
            }, {
                onConflict: 'assignment_id,question_id'
            });

        if (error) throw error;
    },

    async getAssignmentAnswers(assignmentId: string): Promise<DiagnosisTestAnswer[]> {
        const { data, error } = await supabase
            .from('diagnosis_test_answers')
            .select('*')
            .eq('assignment_id', assignmentId);

        if (error) throw error;

        return data.map(d => ({
            id: d.id,
            assignmentId: d.assignment_id,
            questionId: d.question_id,
            studentAnswer: d.student_answer,
            isCorrect: d.is_correct,
            answeredAt: d.answered_at,
            createdAt: d.created_at
        }));
    },



    async completeTest(
        assignmentId: string,
        aiAnalysis: DiagnosisAIAnalysis,
        results?: {
            score: number;
            totalCorrect: number;
            totalQuestions: number;
        }
    ): Promise<void> {
        let score = 0;
        let totalCorrect = 0;
        let totalQuestions = 0;

        // 1. Fetch answers to check correctness
        const answers = await this.getAssignmentAnswers(assignmentId);

        if (results) {
            score = results.score;
            totalCorrect = results.totalCorrect;
            totalQuestions = results.totalQuestions;
        } else {
            // Fallback: Calculate statistics from DB
            totalCorrect = answers.filter(a => a.isCorrect).length;
            totalQuestions = answers.length;
            score = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
        }

        // 2. Fetch assignment to get studentId and testId
        const { data: assignmentData } = await supabase
            .from('diagnosis_test_assignments')
            .select('student_id, test_id')
            .eq('id', assignmentId)
            .single();

        if (assignmentData) {
            // 3. Fetch questions to get text and correct answer for the mistake log
            const questions = await this.getTestQuestions(assignmentData.test_id);

            // 4. Record mistakes
            const mistakesPromise = answers
                .filter(a => !a.isCorrect)
                .map(async (answer) => {
                    const question = questions.find(q => q.id === answer.questionId);
                    if (question) {
                        return mistakeService.addMistake({
                            studentId: assignmentData.student_id,
                            questionId: question.id,
                            questionData: {
                                text: question.questionText,
                                options: question.options,
                                type: 'multiple_choice', // Assuming mostly multiple choice for diagnosis
                                topic: question.moduleName
                            },
                            studentAnswer: answer.studentAnswer,
                            correctAnswer: question.correctAnswer,
                            status: 'new',
                            sourceType: 'test',
                            sourceId: assignmentId
                        });
                    }
                });

            await Promise.all(mistakesPromise);
        }

        const { error } = await supabase
            .from('diagnosis_test_assignments')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                total_correct: totalCorrect,
                total_questions: totalQuestions,
                score: score,
                ai_analysis: aiAnalysis
            })
            .eq('id', assignmentId);

        if (error) throw error;
    },

    // ==================== ÖĞRETMEN: SONUÇ GÖRÜNTÜLEME ====================

    async getDetailedResults(assignmentId: string): Promise<DiagnosisDetailedResult | null> {
        // Assignment ve ilişkili verileri çek
        const { data: assignmentData, error: assignmentError } = await supabase
            .from('diagnosis_test_assignments')
            .select(`
        *,
        diagnosis_tests (*),
        students (*)
      `)
            .eq('id', assignmentId)
            .single();

        if (assignmentError || !assignmentData) return null;

        // Soruları çek
        const questions = await this.getTestQuestions(assignmentData.test_id);

        // Cevapları çek
        const answers = await this.getAssignmentAnswers(assignmentId);

        // Aksiyonları çek
        const { data: actionsData } = await supabase
            .from('diagnosis_test_actions')
            .select('*')
            .eq('assignment_id', assignmentId);

        // Modül bazında sonuçları hesapla
        const moduleMap = new Map<string, DiagnosisModuleResult>();

        questions.forEach(q => {
            const answer = answers.find(a => a.questionId === q.id);
            const moduleKey = q.moduleId || q.moduleName;

            if (!moduleMap.has(moduleKey)) {
                moduleMap.set(moduleKey, {
                    moduleId: q.moduleId || '',
                    moduleName: q.moduleName,
                    totalQuestions: 0,
                    correctAnswers: 0,
                    masteryScore: 0,
                    questions: []
                });
            }

            const moduleResult = moduleMap.get(moduleKey)!;
            moduleResult.totalQuestions++;
            if (answer?.isCorrect) moduleResult.correctAnswers++;

            moduleResult.questions.push({
                questionId: q.id,
                questionText: q.questionText,
                studentAnswer: answer?.studentAnswer,
                correctAnswer: q.correctAnswer,
                isCorrect: answer?.isCorrect || false
            });
        });

        // Mastery score hesapla
        moduleMap.forEach(module => {
            module.masteryScore = module.totalQuestions > 0
                ? module.correctAnswers / module.totalQuestions
                : 0;
        });

        return {
            assignment: {
                id: assignmentData.id,
                testId: assignmentData.test_id,
                studentId: assignmentData.student_id,
                teacherId: assignmentData.teacher_id,
                assignedAt: assignmentData.assigned_at,
                dueDate: assignmentData.due_date,
                isMandatory: assignmentData.is_mandatory,
                status: assignmentData.status,
                startedAt: assignmentData.started_at,
                completedAt: assignmentData.completed_at,
                score: assignmentData.score,
                totalCorrect: assignmentData.total_correct,
                totalQuestions: assignmentData.total_questions,
                aiAnalysis: assignmentData.ai_analysis,
                createdAt: assignmentData.created_at,
                updatedAt: assignmentData.updated_at
            },
            student: assignmentData.students,
            test: {
                id: assignmentData.diagnosis_tests.id,
                teacherId: assignmentData.diagnosis_tests.teacher_id,
                title: assignmentData.diagnosis_tests.title,
                description: assignmentData.diagnosis_tests.description,
                subject: assignmentData.diagnosis_tests.subject,
                grade: assignmentData.diagnosis_tests.grade,
                totalQuestions: assignmentData.diagnosis_tests.total_questions,
                durationMinutes: assignmentData.diagnosis_tests.duration_minutes,
                isActive: assignmentData.diagnosis_tests.is_active,
                createdAt: assignmentData.diagnosis_tests.created_at,
                updatedAt: assignmentData.diagnosis_tests.updated_at
            },
            moduleResults: Array.from(moduleMap.values()),
            aiAnalysis: assignmentData.ai_analysis,
            answers,
            actions: actionsData?.map(d => ({
                id: d.id,
                assignmentId: d.assignment_id,
                teacherId: d.teacher_id,
                actionType: d.action_type,
                actionData: d.action_data,
                notes: d.notes,
                createdAt: d.created_at
            })) || []
        };
    },

    // ==================== ÖĞRETMEN: AKSİYON ALMA ====================

    async createAction(
        assignmentId: string,
        teacherId: string,
        actionType: string,
        actionData: any,
        notes?: string
    ): Promise<void> {
        const { error } = await supabase
            .from('diagnosis_test_actions')
            .insert({
                assignment_id: assignmentId,
                teacher_id: teacherId,
                action_type: actionType,
                action_data: actionData,
                notes
            });

        if (error) throw error;
    }
};
