import { db, supabase } from './dbAdapter';
import { Test, WeeklyProgram, Student, Assignment, ContentAssignment, ContentLibraryItem, Subject, Notification } from '../types';
import { getPDFTestsForStudent, getSubmissionsForStudent, PDFTest, PDFTestSubmission } from './pdfTestService';

export interface StudentDashboardData {
    studentData: Student | null;
    pendingTests: Test[];
    completedTests: Test[];
    weeklyProgram: WeeklyProgram | null;
    programId: string | null;
    assignments: Assignment[];
    contentAssignments: ContentAssignment[];
    assignedContent: ContentLibraryItem[];
    pdfTests: PDFTest[];
    pdfTestSubmissions: PDFTestSubmission[];
}

/**
 * Service to load all necessary data for the Student Dashboard
 */
class StudentDashboardDataService {
    public async loadAllData(userId: string): Promise<StudentDashboardData> {
        try {
            // Load student profile
            const studentDoc = await db.collection('students').doc(userId).get();
            const studentData = studentDoc.exists ? {
                ...studentDoc.data(),
                id: userId,
                badges: studentDoc.data().badges || [],
                isAiAssistantEnabled: studentDoc.data().is_ai_assistant_enabled ?? studentDoc.data().isAiAssistantEnabled ?? true
            } as Student : null;

            // Load tests in parallel
            const [studentTests, qbTests, weeklyProgramData, pdfTests, pdfSubmissions] = await Promise.all([
                this.loadStudentTests(userId),
                this.loadQBTests(userId),
                this.loadCurrentWeeklyProgram(userId),
                getPDFTestsForStudent(userId),
                getSubmissionsForStudent(userId)
            ]);

            // Load assignments and their submissions
            const assignments = await this.loadAssignmentsWithSubmissions(userId);

            // Load content
            const { contentAssignments, assignedContent } = await this.loadContent(userId);

            const allTests = [...studentTests, ...qbTests];
            const pendingTests = allTests.filter(t => !t.completed);
            const completedTests = allTests.filter(t => t.completed).sort((a, b) =>
                new Date(b.submissionDate!).getTime() - new Date(a.submissionDate!).getTime()
            );

            return {
                studentData,
                pendingTests,
                completedTests,
                weeklyProgram: weeklyProgramData.program,
                programId: weeklyProgramData.programId,
                assignments,
                contentAssignments,
                assignedContent,
                pdfTests,
                pdfTestSubmissions: pdfSubmissions
            };
        } catch (error) {
            console.error("Error in studentDashboardDataService:", error);
            throw error;
        }
    }

    private async loadStudentTests(userId: string): Promise<Test[]> {
        const testsSnapshot = await db.collection('tests').where('studentId', '==', userId).get();
        return testsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Test[];
    }

    private async loadQBTests(userId: string): Promise<Test[]> {
        const qbAssignmentsSnapshot = await db.collection('question_bank_assignments').where('student_id', '==', userId).get();

        const qbTests = await Promise.all(qbAssignmentsSnapshot.docs.map(async (doc: any) => {
            const data = doc.data();
            const qbId = data.question_bank_id || data.questionBankId;

            try {
                const qbDoc = await db.collection('question_banks').doc(qbId).get();
                if (!qbDoc.exists) return this.createEmptyQBTest(doc.id, userId, data);

                const qbData = qbDoc.data();
                return this.mapQBToTest(doc.id, userId, data, qbData);
            } catch (error) {
                return this.createEmptyQBTest(doc.id, userId, data);
            }
        }));

        return qbTests;
    }

    private async loadCurrentWeeklyProgram(userId: string) {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(now.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);
        const weekId = weekStart.toISOString().split('T')[0];

        const programSnapshot = await db.collection('weeklyPrograms')
            .where('studentId', '==', userId)
            .where('weekId', '==', weekId)
            .limit(1)
            .get();

        if (!programSnapshot.empty) {
            const doc = programSnapshot.docs[0];
            return { program: { id: doc.id, ...doc.data() } as WeeklyProgram, programId: doc.id };
        }
        return { program: null, programId: null };
    }

    private async loadAssignmentsWithSubmissions(userId: string): Promise<Assignment[]> {
        const { data: assignmentsData } = await supabase.from('assignments').select('*').eq('student_id', userId);
        const { data: submissionsData } = await supabase.from('submissions').select('*').eq('student_id', userId);

        const submissionsMap = new Map();
        (submissionsData || []).forEach((data: any) => {
            submissionsMap.set(data.assignment_id, {
                id: data.id,
                assignmentId: data.assignment_id,
                studentId: data.student_id,
                submissionText: data.submission_text,
                fileUrl: data.file_url,
                submittedAt: data.submitted_at,
                status: data.status,
                aiScore: data.ai_score ? Number(data.ai_score) : undefined,
                aiAnalysis: data.ai_analysis,
                teacherScore: data.teacher_score ? Number(data.teacher_score) : undefined,
                teacherFeedback: data.teacher_feedback
            });
        });

        return (assignmentsData || []).map((data: any) => {
            const assignment: Assignment = {
                id: data.id,
                teacherId: data.teacher_id,
                studentId: data.student_id,
                subject: data.subject,
                title: data.title,
                description: data.description,
                dueDate: data.due_date,
                aiSuggested: data.ai_suggested || false,
                createdAt: data.created_at,
                viewedByStudent: data.viewed_by_student || false,
                contentType: data.content_type,
                fileUrl: data.file_url,
                htmlContent: data.html_content,
                submission: submissionsMap.get(data.id)
            };
            return assignment;
        });
    }

    private async loadContent(userId: string) {
        const snapshot = await db.collection('contentAssignments').where('studentId', '==', userId).get();
        const contentAssignments = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }) as ContentAssignment);

        if (contentAssignments.length === 0) return { contentAssignments: [], assignedContent: [] };

        const contentIds = contentAssignments.map(ca => ca.contentId);
        const contentDocs = await Promise.all(contentIds.map(id => db.collection('contentLibrary').doc(id).get()));
        const assignedContent = contentDocs
            .filter((doc: any) => doc.exists)
            .map((doc: any) => ({ id: doc.id, ...doc.data() }) as ContentLibraryItem);

        return { contentAssignments, assignedContent };
    }

    private createEmptyQBTest(docId: string, userId: string, data: any): Test {
        return {
            id: docId,
            title: 'Soru Bankası Testi',
            subject: Subject.Mathematics,
            unit: '',
            questions: [],
            studentId: userId,
            tutorId: data.teacher_id || data.teacherId,
            completed: data.status === 'Tamamlandı',
            score: data.score || 0,
            duration: data.time_limit_minutes || data.timeLimitMinutes || 60,
            dueDate: data.application_date || data.applicationDate || new Date().toISOString(),
            submissionDate: data.completed_at || data.completedAt,
            isQuestionBankTest: true,
            questionBankAssignmentId: docId
        } as Test;
    }

    private mapQBToTest(docId: string, userId: string, data: any, qbData: any): Test {
        let analysis;
        const feedback = data.ai_feedback || data.aiFeedback;

        if (feedback) {
            analysis = {
                summary: {
                    correct: data.total_correct || data.totalCorrect || 0,
                    wrong: (data.total_questions || data.totalQuestions || 0) - (data.total_correct || data.totalCorrect || 0),
                    scorePercent: data.score || 0
                },
                analysis: {
                    weakTopics: feedback.weaknesses || [],
                    strongTopics: feedback.strengths || [],
                    recommendations: feedback.recommendations || [],
                    overallComment: feedback.overall || ''
                },
                questionEvaluations: Array.from({ length: (data.total_questions || data.totalQuestions || 0) }).map((_, i) => ({
                    id: `synthetic_${i}`,
                    text: `Soru ${i + 1}`,
                    type: 'Çoktan Seçmeli',
                    correctAnswer: '',
                    studentAnswer: '',
                    isCorrect: i < (data.total_correct || data.totalCorrect || 0)
                })) as any[]
            };
        }

        return {
            id: docId,
            title: qbData?.title || 'Soru Bankası Testi',
            subject: qbData?.subject || '',
            unit: qbData?.unit || '',
            questions: qbData?.questions || [],
            studentId: userId,
            tutorId: data.teacher_id || data.teacherId,
            completed: data.status === 'Tamamlandı',
            score: data.score || 0,
            duration: data.time_limit_minutes || data.timeLimitMinutes || 60,
            dueDate: data.application_date || data.applicationDate || new Date().toISOString(),
            submissionDate: data.completed_at || data.completedAt,
            isQuestionBankTest: true,
            questionBankAssignmentId: docId,
            analysis: analysis
        } as Test;
    }
}

export const studentDashboardDataService = new StudentDashboardDataService();
