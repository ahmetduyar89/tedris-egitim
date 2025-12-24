/**
 * Optimized Student Detail Data Loading Service
 * Reduces load time by parallelizing queries and minimizing N+1 problems
 */

import { supabase, db } from './dbAdapter';
import {
    Test,
    Assignment,
    Flashcard,
    SpacedRepetitionSchedule,
    QuestionBankAssignment,
    QuestionBank,
    ContentLibraryItem,
    PrivateLesson,
    WeeklyProgram
} from '../types';
import { diagnosisTestManagementService } from './diagnosisTestManagementService';
import { getPDFTestsForStudent, getSubmissionsForStudent } from './pdfTestService';
import * as privateLessonService from './privateLessonService';

interface QuestionBankAssignmentWithBank extends QuestionBankAssignment {
    questionBank?: QuestionBank;
}

export interface StudentDetailData {
    tests: Test[];
    diagnosisTestAssignments: any[];
    weeklyProgram: WeeklyProgram | null;
    assignments: Assignment[];
    flashcards: (Flashcard & { scheduleId?: string })[];
    spacedRepetitionSchedules: SpacedRepetitionSchedule[];
    questionBankAssignments: QuestionBankAssignmentWithBank[];
    pdfTests: any[];
    pdfTestSubmissions: any[];
    completedLessons: PrivateLesson[];
    lessonStats: any;
    paymentSummary: any;
    paymentConfig: any;
    libraryContent: ContentLibraryItem[];
}

/**
 * Load all student detail data in parallel for maximum performance
 */
export async function loadStudentDetailData(
    studentId: string,
    teacherId: string
): Promise<StudentDetailData> {
    try {
        // Parallel data loading - all independent queries run simultaneously
        const [
            testsData,
            diagnosisData,
            programData,
            assignmentsData,
            schedulesData,
            qbAssignmentsData,
            pdfTestsData,
            pdfSubmissionsData,
            lessonsData,
            libraryData
        ] = await Promise.all([
            loadTests(studentId),
            loadDiagnosisTests(studentId),
            loadWeeklyProgram(studentId),
            loadAssignments(studentId),
            loadSpacedRepetitionSchedules(studentId),
            loadQuestionBankAssignments(studentId),
            getPDFTestsForStudent(studentId),
            getSubmissionsForStudent(studentId),
            loadPrivateLessons(studentId),
            loadLibraryContent(teacherId)
        ]);

        // Load flashcards based on schedules
        const flashcards = await loadFlashcards(schedulesData);

        // Load lesson stats in parallel
        const [lessonStats, paymentSummary, paymentConfig] = await Promise.all([
            privateLessonService.getStudentLessonStats(studentId, teacherId).catch(() => null),
            privateLessonService.getPaymentSummary(studentId, teacherId).catch(() => null),
            privateLessonService.getStudentPaymentConfig(studentId, teacherId).catch(() => null)
        ]);

        return {
            tests: testsData,
            diagnosisTestAssignments: diagnosisData,
            weeklyProgram: programData,
            assignments: assignmentsData,
            flashcards,
            spacedRepetitionSchedules: schedulesData,
            questionBankAssignments: qbAssignmentsData,
            pdfTests: pdfTestsData,
            pdfTestSubmissions: pdfSubmissionsData,
            completedLessons: lessonsData,
            lessonStats,
            paymentSummary,
            paymentConfig,
            libraryContent: libraryData
        };
    } catch (error) {
        console.error('Error loading student detail data:', error);
        throw error;
    }
}

async function loadTests(studentId: string): Promise<Test[]> {
    const testsSnapshot = await db.collection('tests').where('studentId', '==', studentId).get();
    const tests = testsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }) as Test);

    // Sort client-side
    tests.sort((a, b) => {
        if (a.submissionDate && !b.submissionDate) return -1;
        if (!a.submissionDate && b.submissionDate) return 1;
        if (!a.submissionDate && !b.submissionDate) return 0;
        return new Date(b.submissionDate!).getTime() - new Date(a.submissionDate!).getTime();
    });

    return tests;
}

async function loadDiagnosisTests(studentId: string) {
    try {
        return await diagnosisTestManagementService.getStudentAssignments(studentId);
    } catch (error) {
        console.error('Error fetching diagnosis test assignments:', error);
        return [];
    }
}

async function loadWeeklyProgram(studentId: string): Promise<WeeklyProgram | null> {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    const weekId = weekStart.toISOString().split('T')[0];

    const programSnapshot = await db.collection('weeklyPrograms')
        .where('studentId', '==', studentId)
        .where('weekId', '==', weekId)
        .limit(1)
        .get();

    if (!programSnapshot.empty) {
        const doc = programSnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as WeeklyProgram;
    }

    return null;
}

async function loadAssignments(studentId: string): Promise<Assignment[]> {
    const assignmentsSnapshot = await db.collection('assignments')
        .where('studentId', '==', studentId)
        .get();

    const assignmentIds = assignmentsSnapshot.docs.map(doc => doc.id);

    // Batch load all submissions at once instead of one by one
    let submissionsMap = new Map();
    if (assignmentIds.length > 0) {
        const { data: submissionsData } = await supabase
            .from('submissions')
            .select('*')
            .in('assignment_id', assignmentIds)
            .order('submitted_at', { ascending: false });

        if (submissionsData) {
            // Group by assignment_id, keep only the latest
            submissionsData.forEach(sub => {
                if (!submissionsMap.has(sub.assignment_id)) {
                    submissionsMap.set(sub.assignment_id, {
                        id: sub.id,
                        assignmentId: sub.assignment_id,
                        studentId: sub.student_id,
                        submissionText: sub.submission_text,
                        fileUrl: sub.file_url,
                        submittedAt: sub.submitted_at,
                        status: sub.status,
                        aiScore: sub.ai_score ? Number(sub.ai_score) : undefined,
                        aiAnalysis: sub.ai_analysis,
                        teacherScore: sub.teacher_score ? Number(sub.teacher_score) : undefined,
                        teacherFeedback: sub.teacher_feedback
                    });
                }
            });
        }
    }

    const assignments = assignmentsSnapshot.docs.map((doc: any) => {
        const assignment = { id: doc.id, ...doc.data() } as Assignment;
        const submission = submissionsMap.get(doc.id);
        if (submission) {
            assignment.submission = submission;
        }
        return assignment;
    });

    assignments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return assignments;
}

async function loadSpacedRepetitionSchedules(studentId: string): Promise<SpacedRepetitionSchedule[]> {
    const schedulesSnapshot = await db.collection('spaced_repetition_schedule')
        .where('student_id', '==', studentId)
        .get();

    return schedulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as SpacedRepetitionSchedule[];
}

async function loadFlashcards(schedules: SpacedRepetitionSchedule[]): Promise<(Flashcard & { scheduleId?: string })[]> {
    if (schedules.length === 0) return [];

    // Batch load all flashcards at once
    const flashcardIds = schedules.map(s => s.flashcardId);
    const flashcardDocs = await Promise.all(
        flashcardIds.map(id => db.collection('flashcards').doc(id).get())
    );

    const flashcards: (Flashcard & { scheduleId?: string })[] = [];

    flashcardDocs.forEach((doc, index) => {
        if (doc.exists) {
            const data = doc.data();
            flashcards.push({
                id: doc.id,
                teacherId: data.teacherId,
                subject: data.subject,
                grade: data.grade,
                topic: data.topic,
                frontContent: data.frontContent,
                backContent: data.backContent,
                difficultyLevel: data.difficultyLevel,
                createdAt: data.createdAt,
                isAiGenerated: data.isAiGenerated,
                scheduleId: schedules[index].id
            });
        }
    });

    return flashcards;
}

async function loadQuestionBankAssignments(studentId: string): Promise<QuestionBankAssignmentWithBank[]> {
    const qbAssignmentsSnapshot = await db.collection('question_bank_assignments')
        .where('student_id', '==', studentId)
        .get();

    const assignments: QuestionBankAssignmentWithBank[] = qbAssignmentsSnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
            id: doc.id,
            questionBankId: data.question_bank_id || data.questionBankId,
            studentId: data.student_id || data.studentId,
            teacherId: data.teacher_id || data.teacherId,
            assignedAt: data.assigned_at || data.assignedAt,
            applicationDate: data.application_date || data.applicationDate,
            timeLimitMinutes: data.time_limit_minutes || data.timeLimitMinutes,
            startedAt: data.started_at || data.startedAt,
            completedAt: data.completed_at || data.completedAt,
            answers: data.answers || {},
            score: data.score,
            totalCorrect: data.total_correct || data.totalCorrect || 0,
            totalQuestions: data.total_questions || data.totalQuestions || 0,
            status: data.status,
            aiFeedback: data.ai_feedback || data.aiFeedback
        };
    });

    // Batch load question banks
    const qbIds = assignments.map(a => a.questionBankId);
    if (qbIds.length > 0) {
        const qbDocs = await Promise.all(
            qbIds.map(id => db.collection('question_banks').doc(id).get())
        );

        qbDocs.forEach((doc, index) => {
            if (doc.exists) {
                const data = doc.data();
                assignments[index].questionBank = {
                    id: doc.id,
                    teacherId: data.teacher_id || data.teacherId,
                    title: data.title,
                    subject: data.subject,
                    grade: data.grade,
                    unit: data.unit,
                    questions: data.questions || [],
                    totalQuestions: data.total_questions || data.totalQuestions,
                    difficultyLevel: data.difficulty_level || data.difficultyLevel || 1,
                    source: data.source || 'manual',
                    createdAt: data.created_at || data.createdAt,
                    updatedAt: data.updated_at || data.updatedAt || data.created_at || data.createdAt
                };
            }
        });
    }

    return assignments;
}

async function loadPrivateLessons(studentId: string): Promise<PrivateLesson[]> {
    const { data: lessonsData, error } = await supabase
        .from('private_lessons')
        .select('*')
        .eq('student_id', studentId)
        .lt('start_time', new Date().toISOString())
        .order('start_time', { ascending: false });

    if (error) {
        console.error('Error fetching private lessons:', error);
        return [];
    }

    const lessons = await Promise.all((lessonsData || []).map(async row => {
        const lesson: PrivateLesson = {
            id: row.id,
            tutorId: row.tutor_id,
            studentId: row.student_id,
            studentName: row.student_name,
            startTime: row.start_time,
            endTime: row.end_time,
            subject: row.subject,
            topic: row.topic,
            status: row.status,
            notes: row.notes,
            duration: row.duration,
            color: row.color,
            contact: row.contact,
            grade: row.grade,
            lessonNotes: row.lesson_notes,
            homework: row.homework
        };

        try {
            const attendance = await privateLessonService.getLessonAttendance(row.id);
            if (attendance) {
                lesson.attendance = attendance;
            }
        } catch (error) {
            console.error(`Error fetching attendance for lesson ${row.id}:`, error);
        }

        return lesson;
    }));

    return lessons.filter(l => l.topic || l.homework);
}

async function loadLibraryContent(teacherId: string): Promise<ContentLibraryItem[]> {
    const librarySnapshot = await db.collection('contentLibrary')
        .where('teacherId', '==', teacherId)
        .get();

    return librarySnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
    }) as ContentLibraryItem);
}
