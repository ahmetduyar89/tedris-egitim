import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Student, Test, AIAnalysisReport, WeeklyProgram, ReviewPackage, ReviewPackageItem, Task, TaskStatus, ContentLibraryItem, ContentType, Assignment, Submission, AssignmentStatus, AIHomeworkAnalysis, LearningLoopStatus, ProgressReport, Flashcard, SpacedRepetitionSchedule, QuestionBankAssignment, QuestionBank, PrivateLesson, LessonStats, PaymentSummary, StudentPaymentConfig } from '../types';
import TestCreationModal from '../components/TestCreationModal';
import AIReportPage from './AIReportPage';
import ReviewPackageEditorModal from '../components/ReviewPackageEditorModal';
import WeeklySchedule from '../components/WeeklySchedule';
import EditableWeeklySchedule from '../components/EditableWeeklySchedule';
import WeeklyProgramEditorModal from '../components/WeeklyProgramEditorModal';
import { generateReviewPackage, generateWeeklyProgram, generateCompletionTasks, generateProgressReport } from '../services/optimizedAIService';
import AiRecommendationModal from '../components/AiRecommendationModal';
import CreateAssignmentModal from '../components/CreateAssignmentModal';
import EditAssignmentModal from '../components/EditAssignmentModal';
import GradeSubmissionModal from '../components/GradeSubmissionModal';
import AssignmentCard from '../components/AssignmentCard';
import LearningMap from '../components/LearningMap';
import CreateFlashcardModal from '../components/CreateFlashcardModal';
import EditFlashcardModal from '../components/EditFlashcardModal';
import OverallAnalytics from '../components/OverallAnalytics';
import QuestionBankResultModal from '../components/QuestionBankResultModal';

import { createNotification } from '../services/notificationService';
import { db, supabase } from '../services/dbAdapter';
import CreatePDFTestModal from '../components/CreatePDFTestModal';
import PDFTestResultModal from '../components/PDFTestResultModal';
import { getPDFTestsForStudent, getSubmissionsForStudent, PDFTest, PDFTestSubmission } from '../services/pdfTestService';
import StudentPaymentSettings from '../components/StudentPaymentSettings';
import { diagnosisTestManagementService } from '../services/diagnosisTestManagementService';
import { DiagnosisTestAssignment } from '../types/diagnosisTestTypes';
import * as privateLessonService from '../services/privateLessonService';
import StreakWidget from '../components/StreakWidget';
import DailyGoalsCard from '../components/DailyGoalsCard';


import StudentOverviewTab from '../components/student-detail/StudentOverviewTab';
import StudentHomeworkTab from '../components/student-detail/StudentHomeworkTab';
import StudentAnalyticsTab from '../components/student-detail/StudentAnalyticsTab';
interface StudentDetailPageProps {
    user: User;
    student: Student;
    onBack: () => void;
    onLogout: () => void;
    onStudentUpdate: (student: Student) => void;
}

const StudentDetailPage: React.FC<StudentDetailPageProps> = ({ user, student, onBack, onLogout, onStudentUpdate }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'homework' | 'analytics' | 'mistakes'>('overview');
    const [isCreatingTest, setIsCreatingTest] = useState(false);
    const [assignedTests, setAssignedTests] = useState<Test[]>([]);
    const [diagnosisTestAssignments, setDiagnosisTestAssignments] = useState<DiagnosisTestAssignment[]>([]);
    const [weeklyProgram, setWeeklyProgram] = useState<WeeklyProgram | null>(null);
    const [viewingReport, setViewingReport] = useState<Test | null>(null);

    const [isCreatingReviewPackage, setIsCreatingReviewPackage] = useState(false);
    const [isGeneratingPackage, setIsGeneratingPackage] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [generatedPackageItems, setGeneratedPackageItems] = useState<ReviewPackageItem[] | null>(null);

    const [isGeneratingProgram, setIsGeneratingProgram] = useState(false);
    const [isEditingProgram, setIsEditingProgram] = useState(false);
    const [programToEdit, setProgramToEdit] = useState<Omit<WeeklyProgram, 'id' | 'studentId' | 'week'> | null>(null);

    const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
    const [recommendations, setRecommendations] = useState<ContentLibraryItem[]>([]);

    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
    const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
    const [isCreatingFlashcard, setIsCreatingFlashcard] = useState(false);
    const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
    const [flashcards, setFlashcards] = useState<(Flashcard & { scheduleId?: string })[]>([]);
    const [spacedRepetitionSchedules, setSpacedRepetitionSchedules] = useState<SpacedRepetitionSchedule[]>([]);
    const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);

    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [libraryContent, setLibraryContent] = useState<ContentLibraryItem[]>([]);
    const [questionBankAssignments, setQuestionBankAssignments] = useState<(QuestionBankAssignment & { questionBank?: QuestionBank })[]>([]);
    const [viewingQBAssignment, setViewingQBAssignment] = useState<(QuestionBankAssignment & { questionBank?: QuestionBank }) | null>(null);
    const [isCreatingPDFTest, setIsCreatingPDFTest] = useState(false);
    const [pdfTests, setPdfTests] = useState<PDFTest[]>([]);
    const [pdfTestSubmissions, setPdfTestSubmissions] = useState<PDFTestSubmission[]>([]);


    const [viewingPDFTestResult, setViewingPDFTestResult] = useState<{ test: PDFTest; submission: PDFTestSubmission } | null>(null);
    const [completedLessons, setCompletedLessons] = useState<PrivateLesson[]>([]);
    const [viewingLesson, setViewingLesson] = useState<PrivateLesson | null>(null);

    // Lesson tracking and payment states
    const [lessonStats, setLessonStats] = useState<LessonStats | null>(null);
    const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
    const [paymentConfig, setPaymentConfig] = useState<StudentPaymentConfig | null>(null);



    const loadData = useCallback(async () => {
        if (!student?.id) return;
        try {
            // Tests
            const testsSnapshot = await db.collection('tests').where('studentId', '==', student.id).get();
            const tests = testsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }) as Test);
            // Sort client-side to avoid index requirement
            tests.sort((a, b) => {
                if (a.submissionDate && !b.submissionDate) return -1;
                if (!a.submissionDate && b.submissionDate) return 1;
                if (!a.submissionDate && !b.submissionDate) return 0;
                return new Date(b.submissionDate!).getTime() - new Date(a.submissionDate!).getTime();
            });

            setAssignedTests(tests);

            // Diagnosis Tests
            try {
                const diagnosisAssignments = await diagnosisTestManagementService.getStudentAssignments(student.id);
                setDiagnosisTestAssignments(diagnosisAssignments);
            } catch (error) {
                console.error('Error fetching diagnosis test assignments:', error);
            }

            // Program
            const programSnapshot = await db.collection('weeklyPrograms').where('studentId', '==', student.id).limit(1).get();
            if (!programSnapshot.empty) {
                const doc = programSnapshot.docs[0];
                setWeeklyProgram({ id: doc.id, ...doc.data() } as WeeklyProgram);
            } else {
                setWeeklyProgram(null);
            }

            // Assignments with Submissions
            const assignmentsSnapshot = await db.collection('assignments').where('studentId', '==', student.id).get();
            console.log('[StudentDetailPage] Found assignments:', assignmentsSnapshot.docs.length);

            const assignmentsList = await Promise.all(
                assignmentsSnapshot.docs.map(async (doc: any) => {
                    const assignment = { id: doc.id, ...doc.data() } as Assignment;
                    console.log('[StudentDetailPage] Checking submissions for assignment:', doc.id);

                    try {
                        // Use direct Supabase query instead of dbAdapter to avoid conversion issues
                        const { data: submissionsData, error: submissionsError } = await supabase
                            .from('submissions')
                            .select('*')
                            .eq('assignment_id', doc.id)
                            .order('submitted_at', { ascending: false })
                            .limit(1);

                        if (submissionsError) {
                            console.error('[StudentDetailPage] Error fetching submissions:', submissionsError);
                            throw submissionsError;
                        }

                        console.log('[StudentDetailPage] Submissions found:', submissionsData?.length || 0);

                        if (submissionsData && submissionsData.length > 0) {
                            const submissionData = submissionsData[0];
                            console.log('[StudentDetailPage] Submission data:', submissionData);

                            // Map the data correctly from snake_case
                            assignment.submission = {
                                id: submissionData.id,
                                assignmentId: doc.id,
                                studentId: submissionData.student_id,
                                submissionText: submissionData.submission_text,
                                fileUrl: submissionData.file_url,
                                submittedAt: submissionData.submitted_at,
                                status: submissionData.status,
                                aiScore: submissionData.ai_score ? Number(submissionData.ai_score) : undefined,
                                aiAnalysis: submissionData.ai_analysis,
                                teacherScore: submissionData.teacher_score ? Number(submissionData.teacher_score) : undefined,
                                teacherFeedback: submissionData.teacher_feedback
                            };
                        }
                    } catch (error) {
                        console.error('[StudentDetailPage] Error fetching submissions for assignment', doc.id, error);
                    }

                    return assignment;
                })
            );
            assignmentsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setAssignments(assignmentsList);

            // Content Library for Recommendations
            const librarySnapshot = await db.collection('contentLibrary').where('teacherId', '==', user.id).get();
            setLibraryContent(librarySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }) as ContentLibraryItem));

            // Flashcards and Spaced Repetition Schedules
            const schedulesSnapshot = await db.collection('spaced_repetition_schedule').where('student_id', '==', student.id).get();
            const schedules = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SpacedRepetitionSchedule[];
            setSpacedRepetitionSchedules(schedules);

            const flashcardsWithSchedule = await Promise.all(
                schedules.map(async (schedule) => {
                    const flashcardDoc = await db.collection('flashcards').doc(schedule.flashcardId).get();
                    if (flashcardDoc.exists) {
                        const flashcardData = flashcardDoc.data();
                        return {
                            id: flashcardDoc.id,
                            teacherId: flashcardData.teacherId,
                            subject: flashcardData.subject,
                            grade: flashcardData.grade,
                            topic: flashcardData.topic,
                            front_content: flashcardData.frontContent,
                            back_content: flashcardData.backContent,
                            difficulty_level: flashcardData.difficultyLevel,
                            createdAt: flashcardData.createdAt,
                            isAiGenerated: flashcardData.isAiGenerated,
                            scheduleId: schedule.id
                        };
                    }
                    return null;
                })
            );
            setFlashcards(flashcardsWithSchedule.filter(Boolean) as any[]);

            // Question Bank Assignments
            const qbAssignmentsSnapshot = await db.collection('question_bank_assignments').where('student_id', '==', student.id).get();
            const qbAssignments = await Promise.all(
                qbAssignmentsSnapshot.docs.map(async (doc: any) => {
                    const data = doc.data();
                    const assignment: QuestionBankAssignment & { questionBank?: QuestionBank } = {
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

                    // Fetch question bank details
                    const qbDoc = await db.collection('question_banks').doc(assignment.questionBankId).get();
                    if (qbDoc.exists) {
                        const qbData = qbDoc.data();
                        assignment.questionBank = {
                            id: qbDoc.id,
                            teacherId: qbData.teacher_id || qbData.teacherId,
                            title: qbData.title,
                            subject: qbData.subject,
                            grade: qbData.grade,
                            unit: qbData.unit,
                            questions: qbData.questions || [],
                            totalQuestions: qbData.total_questions || qbData.totalQuestions,
                            difficultyLevel: qbData.difficulty_level || qbData.difficultyLevel || 1,
                            source: qbData.source || 'manual',
                            createdAt: qbData.created_at || qbData.createdAt,
                            updatedAt: qbData.updated_at || qbData.updatedAt || qbData.created_at || qbData.createdAt
                        };
                    }

                    return assignment;
                })
            );
            setQuestionBankAssignments(qbAssignments);

            // PDF Tests and Submissions
            const studentPDFTests = await getPDFTestsForStudent(student.id);
            setPdfTests(studentPDFTests);

            const studentPDFSubmissions = await getSubmissionsForStudent(student.id);
            setPdfTestSubmissions(studentPDFSubmissions);



            // Private Lessons
            const { data: lessonsData, error: lessonsError } = await supabase
                .from('private_lessons')
                .select('*')
                .eq('student_id', student.id)
                .lt('start_time', new Date().toISOString()) // Only past lessons
                .order('start_time', { ascending: false });

            if (lessonsError) {
                console.error('Error fetching private lessons:', lessonsError);
            } else {
                const mappedLessons = await Promise.all((lessonsData || []).map(async row => {
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

                    // Fetch attendance data for this lesson
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

                // Filter for lessons that have topic or homework
                setCompletedLessons(mappedLessons.filter(l => l.topic || l.homework));
            }


            // Lesson Stats and Payment Data
            try {
                const stats = await privateLessonService.getStudentLessonStats(student.id, user.id);
                setLessonStats(stats);

                const summary = await privateLessonService.getPaymentSummary(student.id, user.id);
                setPaymentSummary(summary);

                const config = await privateLessonService.getStudentPaymentConfig(student.id, user.id);
                setPaymentConfig(config);
                if (config) {

                }
            } catch (error) {
                console.error('Error loading lesson stats/payment data:', error);
            }

        } catch (error) {
            console.error("Error loading student details:", error);
        }
    }, [student.id, user.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const updateStudentInFirestore = async (updatedStudent: Student) => {
        try {
            await db.collection('students').doc(updatedStudent.id).update({
                name: updatedStudent.name,
                xp: updatedStudent.xp,
                level: updatedStudent.level,
                learningLoopStatus: updatedStudent.learningLoopStatus
            });
            onStudentUpdate(updatedStudent);
        } catch (error) {
            console.error("Error updating student:", error);
        }
    };

    const handleTestCreated = async (newTest: Test) => {
        setAssignedTests(prev => [newTest, ...prev]);
        const updatedStudent = { ...student, learningLoopStatus: LearningLoopStatus.TestAssigned };
        await updateStudentInFirestore(updatedStudent);
        await createNotification(student.id, `'${newTest.title}' başlıklı yeni bir testin var.`, 'test', newTest.id);
    };

    const handleReportUpdated = async (updatedTest: Test) => {
        try {
            await db.collection('tests').doc(updatedTest.id).update(updatedTest);
            setAssignedTests(prev => prev.map(t => t.id === updatedTest.id ? updatedTest : t));
            setViewingReport(updatedTest);
        } catch (error) {
            console.error("Error updating test report:", error);
        }
    };

    const handleShowAnalysis = async (test: Test) => {
        if (!test.analysis) {
            if (!test.questions || test.questions.length === 0) {
                setToastMessage("Test soruları bulunamadı. Rapor oluşturulamıyor.");
                return;
            }

            setToastMessage("AI analizi oluşturuluyor, lütfen bekleyin...");
            try {
                const { generateTestAnalysis } = await import('../services/optimizedAIService');
                const analysisReport = await generateTestAnalysis(test.subject, test.unit, test.questions);

                const updatedTest = {
                    ...test,
                    analysis: analysisReport,
                    questions: analysisReport.questionEvaluations
                };

                await db.collection('tests').doc(test.id).update({
                    analysis: analysisReport,
                    questions: analysisReport.questionEvaluations
                });

                setAssignedTests(prev => prev.map(t => t.id === test.id ? updatedTest : t));
                setViewingReport(updatedTest);
                setToastMessage("AI analizi başarıyla oluşturuldu!");
            } catch (error) {
                console.error("Error generating analysis:", error);
                setToastMessage("AI analizi oluşturulamadı. Lütfen tekrar deneyin.");
                return;
            }
        } else {
            setViewingReport(test);
        }

        if (student.learningLoopStatus === LearningLoopStatus.TestAssigned) {
            const updatedStudent = { ...student, learningLoopStatus: LearningLoopStatus.AnalysisReady };
            await updateStudentInFirestore(updatedStudent);
        }
    };

    const handleGenerateReviewPackage = async (topic: string) => {
        setSelectedTopic(topic);
        setIsGeneratingPackage(true);
        setIsCreatingReviewPackage(true);
        try {
            const items = await generateReviewPackage(topic, student.grade);
            setGeneratedPackageItems(items);
        } catch (error) {
            alert("Konu tekrar paketi oluşturulurken bir hata oluştu.");
            setIsCreatingReviewPackage(false);
        } finally {
            setIsGeneratingPackage(false);
        }
    };

    const handleAssignReviewPackage = async (pkg: ReviewPackage) => {
        try {
            const { id, ...pkgData } = pkg;
            const pkgRef = await db.collection('reviewPackages').add(pkgData);
            const newTask: Task = {
                id: `task-${Date.now()}`,
                description: `'${pkg.topic}' Konu Tekrarını Tamamla`,
                status: TaskStatus.Assigned,
                reviewPackageId: pkgRef.id,
                duration: 20,
            };

            let programToUpdate = weeklyProgram ? JSON.parse(JSON.stringify(weeklyProgram)) : {
                studentId: student.id, week: 1,
                days: Array.from({ length: 7 }, (_, i) => ({ day: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'][i], tasks: [] }))
            };

            programToUpdate.days[0].tasks.push(newTask);

            if (weeklyProgram?.id) {
                await db.collection('weeklyPrograms').doc(weeklyProgram.id).update({ days: programToUpdate.days });
            } else {
                const docRef = await db.collection('weeklyPrograms').add(programToUpdate);
                programToUpdate.id = docRef.id;
            }

            setWeeklyProgram(programToUpdate);
            setIsCreatingReviewPackage(false);
            setGeneratedPackageItems(null);
            alert("Konu tekrar paketi öğrencinin haftalık programına eklendi.");
        } catch (error) {
            console.error("Error assigning review package:", error);
            alert("Paket atanırken bir hata oluştu.");
        }
    };

    const handleGenerateWeeklyPlan = async (test: Test) => {
        if (!test.analysis) return;
        setIsGeneratingProgram(true);

        const allCompletedTests = assignedTests.filter(t => t.completed && t.analysis).sort((a, b) => new Date(b.submissionDate!).getTime() - new Date(a.submissionDate!).getTime());
        const lastTest = allCompletedTests.find(t => t.id !== test.id);

        if (lastTest && lastTest.analysis) {
            try {
                const progress = await generateProgressReport(lastTest.analysis, test.analysis);
                // FIX: `newReport` requires an `id` to match the `ProgressReport` type.
                const newReport: ProgressReport = {
                    id: `pr-${Date.now()}`,
                    weekStartDate: new Date().toISOString().split('T')[0],
                    lastScore: lastTest.score!,
                    currentScore: test.score!,
                    progress: test.score! - lastTest.score!,
                    aiComment: progress.ai_comment,
                    focusTopics: progress.focus_topics
                };
                const updatedStudent = { ...student, progressReports: [...(student.progressReports || []), newReport] };
                await updateStudentInFirestore(updatedStudent);
            } catch (error) {
                console.error("Failed to generate progress report:", error);
            }
        }

        try {
            const programData = await generateWeeklyProgram(student.grade, test.subject, test.analysis);
            setProgramToEdit(programData);
            setIsEditingProgram(true);
            const updatedStudent = { ...student, learningLoopStatus: LearningLoopStatus.PlanGenerated };
            await updateStudentInFirestore(updatedStudent);

        } catch (error) {
            alert("Haftalık plan oluşturulurken bir hata oluştu.");
        } finally {
            setIsGeneratingProgram(false);
        }
    };

    const handleSaveProgram = async (programData: Omit<WeeklyProgram, 'id' | 'studentId' | 'week'>) => {
        try {
            let programToSave: WeeklyProgram;
            if (weeklyProgram?.id) {
                programToSave = { ...weeklyProgram, ...programData };
                await db.collection('weeklyPrograms').doc(weeklyProgram.id).set(programToSave);
            } else {
                const newProgramData = { studentId: student.id, week: 1, ...programData };
                const docRef = await db.collection('weeklyPrograms').add(newProgramData);
                programToSave = { id: docRef.id, ...newProgramData };
            }
            setWeeklyProgram(programToSave);
            setIsEditingProgram(false);
            setProgramToEdit(null);
            setToastMessage('✅ Haftalık plan başarıyla kaydedildi ve öğrenciye atandı.');

            const updatedStudent = { ...student, learningLoopStatus: LearningLoopStatus.InProgress };
            await updateStudentInFirestore(updatedStudent);
        } catch (e) {
            console.error("Error saving program", e);
            alert("Program kaydedilirken hata oluştu.");
        }
    };

    const handleDeleteTest = async (testId: string) => {
        if (!confirm('Bu testi silmek istediğinize emin misiniz?')) return;
        try {
            await db.collection('tests').doc(testId).delete();
            setAssignedTests(prev => prev.filter(t => t.id !== testId));
            setToastMessage('Test başarıyla silindi.');
        } catch (error) {
            console.error('Error deleting test:', error);
            alert('Test silinirken bir hata oluştu.');
        }
    };

    const handleDeleteQBAssignment = async (assignmentId: string) => {
        if (!confirm('Bu soru bankası atamasını silmek istediğinize emin misiniz?')) return;
        try {
            await db.collection('question_bank_assignments').doc(assignmentId).delete();
            setQuestionBankAssignments(prev => prev.filter(a => a.id !== assignmentId));
            setToastMessage('Soru bankası ataması silindi.');
        } catch (error) {
            console.error('Error deleting QB assignment:', error);
            alert('Silme işlemi başarısız oldu.');
        }
    };

    const handleDeletePDFTest = async (testId: string) => {
        if (!confirm('Bu PDF testini silmek istediğinize emin misiniz?')) return;
        try {
            // Assuming pdfTestService has a delete function or we use db directly
            // Since PDF tests might have associated files, using service is better if available.
            // Checking imports... import { ... } from '../services/pdfTestService';
            // If deletePDFTest is not exported, I might need to add it or use db.
            // Let's assume for now we delete the assignment/test record.
            // Actually PDFTest is the test definition. If it's assigned to a student, it's usually the PDFTest record itself if created for student?
            // Or is there an assignment record?
            // getPDFTestsForStudent returns PDFTest[].
            // Let's check pdfTestService.ts to see how to delete.
            // For now, I will use a direct db delete if service not available, but let's try to use service or db.
            // I'll use db.collection('pdf_tests').doc(testId).delete() for now as it seems to be the pattern.
            // But wait, PDF tests are in Supabase usually?
            // Let's check pdfTestService.ts content again.
            // It uses supabase.from('pdf_tests')...
            const { error } = await supabase.from('pdf_tests').delete().eq('id', testId);
            if (error) throw error;

            setPdfTests(prev => prev.filter(t => t.id !== testId));
            setPdfTestSubmissions(prev => prev.filter(s => s.pdfTestId !== testId));
            setToastMessage('PDF testi başarıyla silindi.');
        } catch (error) {
            console.error('Error deleting PDF test:', error);
            alert('PDF testi silinirken bir hata oluştu.');
        }
    };

    const handleDeleteDiagnosisTestAssignment = async (assignmentId: string) => {
        if (!confirm('Bu tanı testi atamasını silmek istediğinize emin misiniz?')) return;
        try {
            await supabase.from('diagnosis_test_assignments').delete().eq('id', assignmentId);
            setDiagnosisTestAssignments(prev => prev.filter(a => a.id !== assignmentId));
            setToastMessage('Tanı testi ataması silindi.');
        } catch (error) {
            console.error('Error deleting diagnosis test assignment:', error);
            alert('Silme işlemi başarısız oldu.');
        }
    };

    const handleExportToPDF = () => {
        if (!weeklyProgram) return;
        const { days } = weeklyProgram;
        let htmlContent = `
            <!DOCTYPE html>
            <html><head>
                <title>${student.name} - Haftalık Plan</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .no-print { display: none; }
                    }
                    body { font-family: 'Inter', sans-serif; }
                </style>
            </head>
            <body class="p-8 font-sans">
                <h1 class="text-3xl font-bold mb-2">${student.name} - Haftalık Plan</h1>
                <p class="text-lg text-gray-600 mb-8">${student.grade}. Sınıf</p>
                <div class="space-y-6">`;

        days.forEach(day => {
            const dayTasks = day.tasks || [];
            let dayTotalDuration = dayTasks.reduce((sum, task) => sum + (task.duration || 0), 0);
            htmlContent += `
                <div class="p-4 border rounded-lg break-inside-avoid">
                    <div class="flex justify-between items-center mb-3">
                        <h2 class="text-xl font-bold text-indigo-600">${day.day}</h2>
                        <span class="font-semibold text-gray-700">Toplam: ${dayTotalDuration} dk</span>
                    </div>
                    <ul class="list-disc pl-5 space-y-2">`;
            if (dayTasks.length > 0) {
                dayTasks.forEach(task => {
                    const isCompleted = task.status === TaskStatus.Completed;
                    htmlContent += `<li class="${isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}">${isCompleted ? '✅' : '⬜️'} ${task.description} (${task.duration || 0} dk)</li>`;
                });
            } else {
                htmlContent += `<li class="text-gray-400 list-none">Dinlenme günü.</li>`;
            }
            htmlContent += `</ul></div>`;
        });

        htmlContent += `
                </div>
                <div class="no-print mt-8 text-center">
                    <button onclick="window.print()" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700">
                        Yazdır veya PDF Olarak Kaydet
                    </button>
                </div>
            </body>
            </html>`;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);

        iframe.onload = () => {
            setTimeout(() => {
                iframe.contentWindow?.print();
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(url);
                }, 100);
            }, 500);
        };
    };

    const handleExportAnalysisToPDF = () => {
        const completedTests = assignedTests.filter(t => t.completed && t.analysis);
        const completedAssignments = assignments.filter(a => a.submission?.status === 'Değerlendirildi');
        const completedQBTests = questionBankAssignments.filter(qb => qb.status === 'Tamamlandı');

        const totalTests = completedTests.length;
        const totalAssignments = completedAssignments.length;
        const totalQBTests = completedQBTests.length;

        const avgTestScore = totalTests > 0
            ? Math.round(completedTests.reduce((sum, t) => sum + (t.score || 0), 0) / totalTests)
            : 0;

        const avgAssignmentScore = completedAssignments.length > 0
            ? Math.round(completedAssignments.reduce((sum, a) => {
                const score = a.submission?.teacherScore ?? a.submission?.aiScore ?? 0;
                return sum + score;
            }, 0) / completedAssignments.length)
            : 0;

        const avgQBTestScore = totalQBTests > 0
            ? Math.round(completedQBTests.reduce((sum, qb) => sum + (qb.score || 0), 0) / totalQBTests)
            : 0;

        const invalidTopicPatterns = [
            /tespit edilememiştir/i,
            /bulunamadı/i,
            /yok/i,
            /bu sınavda/i,
            /henüz/i
        ];

        const isValidTopic = (topic: string) => {
            if (!topic || topic.trim().length < 3) return false;
            return !invalidTopicPatterns.some(pattern => pattern.test(topic));
        };

        const weakTopicsMap = new Map<string, number>();
        completedTests.forEach(test => {
            test.analysis?.analysis?.weakTopics?.forEach(topic => {
                if (isValidTopic(topic)) {
                    weakTopicsMap.set(topic, (weakTopicsMap.get(topic) || 0) + 1);
                }
            });
        });
        completedAssignments.forEach(assignment => {
            assignment.submission?.aiAnalysis?.weakTopics?.forEach(topic => {
                if (isValidTopic(topic)) {
                    weakTopicsMap.set(topic, (weakTopicsMap.get(topic) || 0) + 1);
                }
            });
        });
        completedQBTests.forEach(qbTest => {
            if (qbTest.aiFeedback?.weaknesses) {
                qbTest.aiFeedback.weaknesses.forEach(topic => {
                    if (isValidTopic(topic)) {
                        weakTopicsMap.set(topic, (weakTopicsMap.get(topic) || 0) + 1);
                    }
                });
            }
        });

        const strongTopicsMap = new Map<string, number>();
        completedTests.forEach(test => {
            test.analysis?.analysis?.strongTopics?.forEach(topic => {
                if (isValidTopic(topic)) {
                    strongTopicsMap.set(topic, (strongTopicsMap.get(topic) || 0) + 1);
                }
            });
        });
        completedAssignments.forEach(assignment => {
            assignment.submission?.aiAnalysis?.strongTopics?.forEach(topic => {
                if (isValidTopic(topic)) {
                    strongTopicsMap.set(topic, (strongTopicsMap.get(topic) || 0) + 1);
                }
            });
        });
        completedQBTests.forEach(qbTest => {
            if (qbTest.aiFeedback?.strengths) {
                qbTest.aiFeedback.strengths.forEach(topic => {
                    if (isValidTopic(topic)) {
                        strongTopicsMap.set(topic, (strongTopicsMap.get(topic) || 0) + 1);
                    }
                });
            }
        });

        const weakTopics = Array.from(weakTopicsMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const strongTopics = Array.from(strongTopicsMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${student.name} - Genel Performans Analizi</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .no-print { display: none; }
                        .page-break { page-break-before: always; }
                    }
                    body { font-family: 'Inter', sans-serif; }
                    .gradient-header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    }
                    .stat-card {
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    }
                </style>
            </head>
            <body class="bg-gray-50 p-8">
                <div class="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div class="gradient-header text-white p-8">
                        <h1 class="text-4xl font-bold mb-2">${student.name}</h1>
                        <p class="text-xl opacity-90">${student.grade}. Sınıf - Genel Performans Analizi</p>
                        <p class="text-sm opacity-75 mt-2">Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })}</p>
                    </div>

                    <div class="p-8 space-y-8">
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                <span class="text-3xl mr-2">📊</span>
                                Genel Özet
                            </h2>
                            <div class="grid grid-cols-4 gap-4">
                                <div class="stat-card bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500">
                                    <div class="text-sm text-gray-600 mb-1">Testler</div>
                                    <div class="text-3xl font-bold text-blue-600">${totalTests}</div>
                                    <div class="text-sm text-gray-500 mt-1">Ort: ${avgTestScore}%</div>
                                </div>
                                <div class="stat-card bg-cyan-50 p-4 rounded-xl border-l-4 border-cyan-500">
                                    <div class="text-sm text-gray-600 mb-1">Ödevler</div>
                                    <div class="text-3xl font-bold text-cyan-600">${totalAssignments}</div>
                                    <div class="text-sm text-gray-500 mt-1">Ort: ${avgAssignmentScore}%</div>
                                </div>
                                <div class="stat-card bg-purple-50 p-4 rounded-xl border-l-4 border-purple-500">
                                    <div class="text-sm text-gray-600 mb-1">Soru Bankası</div>
                                    <div class="text-3xl font-bold text-purple-600">${totalQBTests}</div>
                                    <div class="text-sm text-gray-500 mt-1">Ort: ${avgQBTestScore}/100</div>
                                </div>
                                <div class="stat-card bg-green-50 p-4 rounded-xl border-l-4 border-green-500">
                                    <div class="text-sm text-gray-600 mb-1">Genel Ortalama</div>
                                    <div class="text-3xl font-bold text-green-600">
                                        ${Math.round((avgTestScore + avgAssignmentScore + avgQBTestScore) / 3)}%
                                    </div>
                                    <div class="text-sm text-gray-500 mt-1">Tüm Aktiviteler</div>
                                </div>
                            </div>
                        </div>

                        ${weakTopics.length > 0 ? `
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                <span class="text-3xl mr-2">⚠️</span>
                                En Çok Zorlanan Konular
                            </h2>
                            <p class="text-sm text-gray-500 mb-3">Testler, soru bankası ve ödevlerden toplanan veriler</p>
                            <div class="space-y-3">
                                ${weakTopics.map(([topic, count], idx) => `
                                    <div class="flex items-center justify-between bg-red-50 p-4 rounded-lg border border-red-200">
                                        <div class="flex items-center space-x-3">
                                            <span class="text-2xl font-bold text-red-600">${idx + 1}</span>
                                            <span class="text-gray-800 font-medium">${topic}</span>
                                        </div>
                                        <span class="px-3 py-1 bg-red-200 text-red-800 rounded-full text-sm font-semibold">
                                            ${count} aktivitede
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}

                        <div>
                            <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                <span class="text-3xl mr-2">💪</span>
                                En Güçlü Konular
                            </h2>
                            <p class="text-sm text-gray-500 mb-3">Testler, soru bankası ve ödevlerden toplanan veriler</p>
                            ${strongTopics.length > 0 ? `
                                <div class="grid grid-cols-2 gap-3">
                                    ${strongTopics.map(([topic, count]) => `
                                        <div class="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                                            <div class="flex items-center space-x-2">
                                                <span class="text-xl">✓</span>
                                                <span class="text-gray-800 font-medium">${topic}</span>
                                            </div>
                                            <span class="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs font-semibold">
                                                ${count} aktivite
                                            </span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                                    <p class="text-gray-600 font-medium">
                                        Henüz güçlü olunan bir konu tespit edilememiştir.
                                    </p>
                                </div>
                            `}
                        </div>

                        <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                            <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                <span class="text-3xl mr-2">💡</span>
                                Genel Öneriler
                            </h2>
                            <ul class="space-y-3">
                                ${avgTestScore < 70 && totalTests > 0 ? `
                                    <li class="flex items-start bg-white p-3 rounded-lg">
                                        <span class="text-orange-600 mr-2 mt-1">→</span>
                                        <span class="text-gray-700">
                                            Test ortalaması ${avgTestScore}% seviyesinde. Konu anlatımı tekrarı ve düzenli örnek soru çalışması yapılması önerilir.
                                        </span>
                                    </li>
                                ` : ''}
                                ${avgAssignmentScore < 70 && totalAssignments > 0 ? `
                                    <li class="flex items-start bg-white p-3 rounded-lg">
                                        <span class="text-orange-600 mr-2 mt-1">→</span>
                                        <span class="text-gray-700">
                                            Ödev performansı ${avgAssignmentScore}% seviyesinde. Ödev yapım sürecinde daha dikkatli çalışma ve zaman yönetimi önerilir.
                                        </span>
                                    </li>
                                ` : ''}
                                ${avgQBTestScore < 70 && totalQBTests > 0 ? `
                                    <li class="flex items-start bg-white p-3 rounded-lg">
                                        <span class="text-orange-600 mr-2 mt-1">→</span>
                                        <span class="text-gray-700">
                                            Soru bankası testlerinde ${avgQBTestScore} puan ortalaması var. Soru çözüm tekniklerinin geliştirilmesi ve zaman yönetimi üzerine çalışılmalı.
                                        </span>
                                    </li>
                                ` : ''}
                                ${weakTopics.length > 0 ? `
                                    <li class="flex items-start bg-white p-3 rounded-lg">
                                        <span class="text-orange-600 mr-2 mt-1">→</span>
                                        <span class="text-gray-700">
                                            <strong>${weakTopics[0][0]}</strong> konusunda ${weakTopics[0][1]} farklı aktivitede zorluk yaşanmış. Bu konuda ek kaynak çalışması ve örnek soru çözümü yapılması önerilir.
                                        </span>
                                    </li>
                                ` : ''}
                                ${weakTopics.length >= 2 ? `
                                    <li class="flex items-start bg-white p-3 rounded-lg">
                                        <span class="text-orange-600 mr-2 mt-1">→</span>
                                        <span class="text-gray-700">
                                            <strong>${weakTopics[1][0]}</strong> konusunda da gelişim gerekiyor. Konu anlatımı tekrarı ve alıştırma soruları faydalı olacaktır.
                                        </span>
                                    </li>
                                ` : ''}
                                ${weakTopics.length >= 3 ? `
                                    <li class="flex items-start bg-white p-3 rounded-lg">
                                        <span class="text-orange-600 mr-2 mt-1">→</span>
                                        <span class="text-gray-700">
                                            <strong>${weakTopics[2][0]}</strong> konusuna da dikkat edilmeli. Temel kavramların pekiştirilmesi önerilir.
                                        </span>
                                    </li>
                                ` : ''}
                                ${strongTopics.length > 0 ? `
                                    <li class="flex items-start bg-white p-3 rounded-lg">
                                        <span class="text-green-600 mr-2 mt-1">✓</span>
                                        <span class="text-gray-700">
                                            <strong>${strongTopics[0][0]}</strong> konusunda başarılı performans gösterilmiş. Bu konudaki çalışma yöntemi diğer konulara da uygulanabilir.
                                        </span>
                                    </li>
                                ` : ''}
                                ${strongTopics.length >= 2 ? `
                                    <li class="flex items-start bg-white p-3 rounded-lg">
                                        <span class="text-green-600 mr-2 mt-1">✓</span>
                                        <span class="text-gray-700">
                                            <strong>${strongTopics[1][0]}</strong> konusundaki hakimiyet devam ettirilerek benzer konulara geçiş yapılabilir.
                                        </span>
                                    </li>
                                ` : ''}
                                ${avgTestScore >= 85 && avgAssignmentScore >= 85 && avgQBTestScore >= 85 ? `
                                    <li class="flex items-start bg-white p-3 rounded-lg">
                                        <span class="text-green-600 mr-2 mt-1">✓</span>
                                        <span class="text-gray-700">
                                            Tüm alanlarda yüksek başarı gösterilmektedir (%85+). Mevcut çalışma disiplini sürdürülmeli ve zorluk seviyesi artırılabilir.
                                        </span>
                                    </li>
                                ` : ''}
                                ${totalTests + totalAssignments + totalQBTests < 5 ? `
                                    <li class="flex items-start bg-white p-3 rounded-lg">
                                        <span class="text-blue-600 mr-2 mt-1">ℹ</span>
                                        <span class="text-gray-700">
                                            Daha detaylı analiz için daha fazla aktivite verisi gereklidir. Düzenli test ve ödev çalışması yapılması önerilir.
                                        </span>
                                    </li>
                                ` : ''}
                            </ul>
                        </div>

                        <div class="text-center text-gray-500 text-sm mt-8 pt-6 border-t">
                            <p>Bu rapor sistem tarafından otomatik olarak oluşturulmuştur.</p>
                            <p class="mt-1">© ${new Date().getFullYear()} Özel Ders Takip Sistemi</p>
                        </div>
                    </div>
                </div>

                <div class="no-print mt-8 text-center">
                    <button onclick="window.print()" class="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg">
                        📄 Yazdır veya PDF Olarak Kaydet
                    </button>
                </div>
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);

        iframe.onload = () => {
            setTimeout(() => {
                iframe.contentWindow?.print();
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(url);
                }, 100);
            }, 500);
        };
    };

    const handleGenerateQBAnalysis = async (assignmentId: string) => {
        try {
            const assignment = questionBankAssignments.find(a => a.id === assignmentId);
            if (!assignment || !assignment.questionBank) {
                alert('Test verisi bulunamadı.');
                return;
            }

            const { generateTestAnalysis } = await import('../services/optimizedAIService');

            const questionsForAnalysis = (assignment.answers || []).map((answer: any) => {
                const question = assignment.questionBank!.questions.find((q: any) => q.id === answer.questionId);

                let questionType: any = 'Çoktan Seçmeli';
                if (question?.type === 'open_ended') questionType = 'Açık Uçlu';
                else if (question?.type === 'multiple_choice') questionType = 'Çoktan Seçmeli';

                return {
                    id: answer.questionId,
                    text: answer.questionText || question?.question || '',
                    type: questionType,
                    topic: question?.topic || assignment.questionBank!.unit || '',
                    isCorrect: answer.isCorrect,
                    correctAnswer: answer.correctAnswer,
                    studentAnswer: answer.selectedAnswer,
                };
            });

            const analysis = await generateTestAnalysis(
                assignment.questionBank.subject as any,
                assignment.questionBank.unit,
                questionsForAnalysis
            );

            await db.collection('question_bank_assignments').doc(assignmentId).update({
                ai_feedback: {
                    overall: analysis.analysis.overallComment,
                    strengths: analysis.analysis.strongTopics,
                    weaknesses: analysis.analysis.weakTopics,
                    recommendations: analysis.analysis.recommendations,
                }
            });

            await loadData();
            setToastMessage('AI analizi başarıyla oluşturuldu!');
        } catch (error) {
            console.error('Error generating QB analysis:', error);
            throw error;
        }
    };

    const handleShowRecommendations = (test: Test) => {
        const weakTopics = test.analysis?.analysis.weakTopics || [];
        if (weakTopics.length === 0) {
            alert("Öğrencinin zayıf bir konusu bulunamadı, bu yüzden öneri yapılamıyor.");
            return;
        }
        const relevantContent = libraryContent.filter(item =>
            item.grade === student.grade &&
            weakTopics.some(topic => (item.tags || []).includes(topic) || item.unit === topic || item.title.includes(topic))
        );
        setRecommendations(relevantContent);
        setIsRecommendModalOpen(true);
    };

    const handleAddTaskFromLibrary = async (item: ContentLibraryItem) => {
        const newTask: Task = {
            id: `task-lib-${Date.now()}`,
            description: item.title,
            status: TaskStatus.Assigned,
            contentId: item.id,
            contentType: item.fileType,
            subject: item.subject,
            duration: 30,
            ai_recommended: true,
        };
        const updatedProgram = weeklyProgram ? JSON.parse(JSON.stringify(weeklyProgram)) : {
            studentId: student.id, week: 1,
            days: Array.from({ length: 7 }, (_, i) => ({ day: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'][i], tasks: [] }))
        };

        if (!updatedProgram.days[0].tasks) updatedProgram.days[0].tasks = [];
        updatedProgram.days[0].tasks.push(newTask);

        try {
            if (weeklyProgram?.id) {
                await db.collection('weeklyPrograms').doc(weeklyProgram.id).update({ days: updatedProgram.days });
            } else {
                const docRef = await db.collection('weeklyPrograms').add(updatedProgram);
                updatedProgram.id = docRef.id;
            }
            setWeeklyProgram(updatedProgram);
            alert(`'${item.title}' görevi öğrencinin planına eklendi.`);
        } catch (e) {
            console.error(e);
            alert("Görev eklenirken bir hata oluştu.");
        }
    };

    const handleAssignmentCreated = async (newAssignment: Assignment) => {
        try {
            const docRef = await db.collection('assignments').add(newAssignment);
            const assignmentWithId = { ...newAssignment, id: docRef.id };
            setAssignments(prev => [assignmentWithId, ...prev]);
            setIsCreatingAssignment(false);
            await createNotification(student.id, `'${assignmentWithId.title}' başlıklı yeni bir ödevin var.`, 'assignment', assignmentWithId.id);
        } catch (error) {
            console.error("Error creating assignment:", error);
            alert("Ödev oluşturulurken bir hata oluştu.");
        }
    };

    const handleAssignmentUpdated = async (updatedAssignment: Assignment) => {
        try {
            await db.collection('assignments').doc(updatedAssignment.id).update({
                title: updatedAssignment.title,
                description: updatedAssignment.description,
                subject: updatedAssignment.subject,
                due_date: updatedAssignment.dueDate,
            });
            setAssignments(prev => prev.map(a => a.id === updatedAssignment.id ? updatedAssignment : a));
            setEditingAssignment(null);
            await createNotification(student.id, `'${updatedAssignment.title}' ödevi güncellendi.`, 'assignment', updatedAssignment.id);
        } catch (error) {
            console.error("Error updating assignment:", error);
            alert("Ödev güncellenirken bir hata oluştu.");
        }
    };

    const handleAssignmentDeleted = async (assignmentId: string) => {
        try {
            const submissionsSnapshot = await db.collection('submissions')
                .where('assignment_id', '==', assignmentId)
                .get();

            for (const doc of submissionsSnapshot.docs) {
                await db.collection('submissions').doc(doc.id).delete();
            }

            await db.collection('assignments').doc(assignmentId).delete();
            setAssignments(prev => prev.filter(a => a.id !== assignmentId));
            setEditingAssignment(null);
        } catch (error) {
            console.error("Error deleting assignment:", error);
            alert("Ödev silinirken bir hata oluştu.");
        }
    };

    const handleGradeSubmission = async (updatedSubmission: Submission) => {
        try {
            await db.collection('submissions').doc(updatedSubmission.id).update({
                status: updatedSubmission.status,
                teacher_score: updatedSubmission.teacherScore,
                teacher_feedback: updatedSubmission.teacherFeedback,
                ai_score: updatedSubmission.aiScore,
                ai_analysis: updatedSubmission.aiAnalysis
            });
            setAssignments(prev => prev.map(a => a.id === updatedSubmission.assignmentId ? { ...a, submission: updatedSubmission } : a));
            setGradingSubmission(null);

            const weakTopics = updatedSubmission.aiAnalysis?.weakTopics;
            if (weakTopics && weakTopics.length > 0) {
                const currentAssignment = assignments.find(a => a.id === updatedSubmission.assignmentId);
                const remedialTasks = (await Promise.all(weakTopics.map(topic => generateCompletionTasks(topic, currentAssignment?.subject)))).flat();

                if (remedialTasks.length > 0) {
                    let programToUpdate = weeklyProgram ? JSON.parse(JSON.stringify(weeklyProgram)) : {
                        studentId: student.id, week: 1,
                        days: Array.from({ length: 7 }, (_, i) => ({ day: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'][i], tasks: [] }))
                    };

                    const todayIndex = new Date().getDay() - 1; // Monday is 0
                    remedialTasks.forEach((task, i) => {
                        const targetDayIndex = (todayIndex + i + 1) % 7;
                        if (!programToUpdate.days[targetDayIndex].tasks) programToUpdate.days[targetDayIndex].tasks = [];
                        programToUpdate.days[targetDayIndex].tasks.push(task);
                    });

                    if (weeklyProgram?.id) {
                        await db.collection('weeklyPrograms').doc(weeklyProgram.id).update({ days: programToUpdate.days });
                    } else {
                        const docRef = await db.collection('weeklyPrograms').add(programToUpdate);
                        programToUpdate.id = docRef.id;
                    }

                    setWeeklyProgram(programToUpdate);
                    setToastMessage("✅ Öğrencinin haftalık planı AI analiziyle otomatik olarak güncellendi!");
                }
            }
        } catch (error) {
            console.error("Failed to grade submission or add remedial tasks:", error);
            alert("Ödev değerlendirilirken veya telafi görevleri oluşturulurken bir hata oluştu.");
        }
    };

    const allCompletedTests = useMemo(() => assignedTests.filter(t => t.completed), [assignedTests]);
    const assignmentForGrading = gradingSubmission ? assignments.find(a => a.id === gradingSubmission.assignmentId) : null;

    const groupedFlashcards = useMemo(() => {
        const groups: { [topic: string]: (Flashcard & { scheduleId?: string })[] } = {};
        flashcards.forEach(flashcard => {
            if (!groups[flashcard.topic]) {
                groups[flashcard.topic] = [];
            }
            groups[flashcard.topic].push(flashcard);
        });
        return groups;
    }, [flashcards]);

    const toggleTopic = (topic: string) => {
        setExpandedTopics(prev => {
            const newSet = new Set(prev);
            if (newSet.has(topic)) {
                newSet.delete(topic);
            } else {
                newSet.add(topic);
            }
            return newSet;
        });
    };

    const renderModals = () => (
        <>
            {isCreatingTest && <TestCreationModal student={student} teacherId={user.id} onClose={() => setIsCreatingTest(false)} onTestCreated={handleTestCreated} />}
            {isCreatingReviewPackage && <ReviewPackageEditorModal studentId={student.id} topic={selectedTopic} isLoading={isGeneratingPackage} initialItems={generatedPackageItems} onClose={() => setIsCreatingReviewPackage(false)} onAssign={handleAssignReviewPackage} />}
            {isEditingProgram && programToEdit && <WeeklyProgramEditorModal program={programToEdit} onClose={() => setIsEditingProgram(false)} onSave={handleSaveProgram} />}
            <AiRecommendationModal isOpen={isRecommendModalOpen} onClose={() => setIsRecommendModalOpen(false)} recommendations={recommendations} onAddTask={handleAddTaskFromLibrary} />
            {isCreatingAssignment && <CreateAssignmentModal student={student} user={user} onClose={() => setIsCreatingAssignment(false)} onAssign={handleAssignmentCreated} />}
            {editingAssignment && <EditAssignmentModal assignment={editingAssignment} onClose={() => setEditingAssignment(null)} onSave={handleAssignmentUpdated} onDelete={handleAssignmentDeleted} />}
            {gradingSubmission && assignmentForGrading && <GradeSubmissionModal submission={gradingSubmission} assignment={assignmentForGrading} onClose={() => setGradingSubmission(null)} onGrade={handleGradeSubmission} />}
            {isCreatingFlashcard && <CreateFlashcardModal teacherId={user.id} studentId={student.id} onClose={() => setIsCreatingFlashcard(false)} onCreated={loadData} />}
            {editingFlashcard && <EditFlashcardModal flashcard={editingFlashcard} onClose={() => setEditingFlashcard(null)} onUpdate={handleUpdateFlashcard} />}
            {isCreatingPDFTest && <CreatePDFTestModal student={student} teacherId={user.id} onClose={() => setIsCreatingPDFTest(false)} onCreated={loadData} />}
            {viewingPDFTestResult && <PDFTestResultModal test={viewingPDFTestResult.test} submission={viewingPDFTestResult.submission} onClose={() => setViewingPDFTestResult(null)} />}
            {viewingLesson && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-2xl">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">{viewingLesson.subject} Dersi</h3>
                                <p className="text-sm text-gray-600">
                                    {new Date(viewingLesson.startTime).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <button onClick={() => setViewingLesson(null)} className="text-gray-500 hover:text-gray-700 bg-white p-2 rounded-full shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {viewingLesson.topic && (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <h4 className="font-bold text-blue-800 mb-2 flex items-center">
                                        <span className="text-xl mr-2">📖</span> İşlenen Konu
                                    </h4>
                                    <p className="text-gray-800 text-lg">{viewingLesson.topic}</p>
                                </div>
                            )}

                            {viewingLesson.lessonNotes && (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <h4 className="font-bold text-gray-800 mb-2 flex items-center">
                                        <span className="text-xl mr-2">📝</span> Ders Notları
                                    </h4>
                                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                                        {viewingLesson.lessonNotes}
                                    </div>
                                </div>
                            )}

                            {viewingLesson.homework && (
                                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                    <h4 className="font-bold text-purple-800 mb-3 flex items-center">
                                        <span className="text-xl mr-2">✏️</span> Verilen Ödevler
                                    </h4>
                                    <div className="space-y-3">
                                        {(() => {
                                            try {
                                                const hw = JSON.parse(viewingLesson.homework);
                                                const hasHomework = Object.values(hw).some((v: any) => v && v.trim() !== '');
                                                if (!hasHomework) return <p className="text-gray-500 italic">Ödev içeriği bulunamadı.</p>;

                                                return Object.entries(hw).map(([day, content]: [string, any]) => {
                                                    if (!content || content.trim() === '') return null;
                                                    return (
                                                        <div key={day} className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                                                            <span className="font-bold text-purple-600 block mb-1">{day}</span>
                                                            <p className="text-gray-700 whitespace-pre-wrap text-sm">{content}</p>
                                                        </div>
                                                    );
                                                });
                                            } catch (e) {
                                                return <p className="text-gray-700 whitespace-pre-wrap">{viewingLesson.homework}</p>;
                                            }
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
                            <button
                                onClick={() => setViewingLesson(null)}
                                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 font-medium transition-colors"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    const handleDeleteFlashcard = async (flashcardId: string, scheduleId?: string) => {
        if (!confirm('Bu flashcard\'ı silmek istediğinizden emin misiniz?')) return;

        try {
            if (scheduleId) {
                await db.collection('spaced_repetition_schedule').doc(scheduleId).delete();
            }
            await db.collection('flashcards').doc(flashcardId).delete();
            setFlashcards(prev => prev.filter(f => f.id !== flashcardId));
            setToastMessage('Flashcard silindi!');
            setTimeout(() => setToastMessage(null), 3000);
        } catch (error) {
            console.error('Error deleting flashcard:', error);
            alert('Flashcard silinirken bir hata oluştu.');
        }
    };

    const handleDeleteTopicFlashcards = async (topic: string) => {
        const cardsToDelete = groupedFlashcards[topic];
        if (!cardsToDelete || cardsToDelete.length === 0) return;

        if (!confirm(`"${topic}" konusundaki ${cardsToDelete.length} flashcard'ı silmek istediğinizden emin misiniz?`)) return;

        try {
            for (const flashcard of cardsToDelete) {
                if (flashcard.scheduleId) {
                    await db.collection('spaced_repetition_schedule').doc(flashcard.scheduleId).delete();
                }
                if (flashcard.id) {
                    await db.collection('flashcards').doc(flashcard.id).delete();
                }
            }

            const deletedIds = new Set(cardsToDelete.map(f => f.id));
            setFlashcards(prev => prev.filter(f => !deletedIds.has(f.id)));
            setExpandedTopics(prev => {
                const newSet = new Set(prev);
                newSet.delete(topic);
                return newSet;
            });
            setToastMessage(`"${topic}" konusundaki ${cardsToDelete.length} flashcard silindi!`);
            setTimeout(() => setToastMessage(null), 3000);
        } catch (error) {
            console.error('Error deleting topic flashcards:', error);
            alert('Flashcard\'lar silinirken bir hata oluştu.');
        }
    };

    const handleUpdateFlashcard = async (flashcardId: string, updates: Partial<Flashcard>) => {
        try {
            await db.collection('flashcards').doc(flashcardId).update(updates);
            setFlashcards(prev => prev.map(f => f.id === flashcardId ? { ...f, ...updates } : f));
            setEditingFlashcard(null);
            setToastMessage('Flashcard güncellendi!');
            setTimeout(() => setToastMessage(null), 3000);
        } catch (error) {
            console.error('Error updating flashcard:', error);
            alert('Flashcard güncellenirken bir hata oluştu.');
        }
    };

    const renderOverviewTab = () => (
        <StudentOverviewTab
            student={student}
            user={user}
            assignedTests={assignedTests}
            assignments={assignments}
            flashcards={flashcards}
            spacedRepetitionSchedules={spacedRepetitionSchedules}
            questionBankAssignments={questionBankAssignments}
            pdfTestSubmissions={pdfTestSubmissions}
            pdfTests={pdfTests}
            completedLessons={completedLessons}
            groupedFlashcards={groupedFlashcards}
            expandedTopics={expandedTopics}
            weeklyProgram={weeklyProgram}
            lessonStats={lessonStats}
            paymentSummary={paymentSummary}
            paymentConfig={paymentConfig}
            onExportAnalysisToPDF={handleExportAnalysisToPDF}
            onShowAnalysis={handleShowAnalysis}
            onViewQBAssignment={setViewingQBAssignment}
            onViewPDFTestResult={(test, submission) => setViewingPDFTestResult({ test, submission })}
            onViewLesson={setViewingLesson}
            onToggleTopic={toggleTopic}
            onDeleteTopicFlashcards={handleDeleteTopicFlashcards}
            onEditFlashcard={setEditingFlashcard}
            onDeleteFlashcard={handleDeleteFlashcard}
            onUpdateWeeklyProgram={setWeeklyProgram}
            onEditProgram={() => {
                const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
                setProgramToEdit({
                    days: dayNames.map(day => ({ day, tasks: [] }))
                });
                setIsEditingProgram(true);
            }}
            onUpdatePaymentConfig={setPaymentConfig}
            onDeleteTest={handleDeleteTest}
            onDeleteQBAssignment={handleDeleteQBAssignment}
            onDeletePDFTest={handleDeletePDFTest}
            diagnosisTestAssignments={diagnosisTestAssignments}
            onDeleteDiagnosisTestAssignment={handleDeleteDiagnosisTestAssignment}
            studentId={student.id}
        />
    );

    const renderHomeworkTab = () => (
        <StudentHomeworkTab
            assignments={assignments}
            onGrade={setGradingSubmission}
            onEdit={setEditingAssignment}
            onCreateAssignment={() => setIsCreatingAssignment(true)}
        />
    );

    const renderAnalyticsTab = () => (
        <StudentAnalyticsTab
            student={student}
            onGenerateReviewPackage={handleGenerateReviewPackage}
        />
    );

    const tabClass = (tabName: string) => `px-4 py-2 font-semibold rounded-t-lg border-b-2 transition-colors ${activeTab === tabName ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-secondary/80 hover:border-gray-300'}`;

    return (
        <>
            {viewingReport ? (
                <main className="p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <AIReportPage
                            user={user} student={student} test={viewingReport} allCompletedTests={allCompletedTests} onBack={() => setViewingReport(null)}
                            onLogout={onLogout} isGeneratingPlan={isGeneratingProgram} onGenerateReviewPackage={handleGenerateReviewPackage}
                            onGenerateWeeklyPlan={handleGenerateWeeklyPlan} onReportUpdate={handleReportUpdated}
                            onRecommendContent={() => handleShowRecommendations(viewingReport)}
                        />
                    </div>
                </main>
            ) : (
                <main className="p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <button onClick={onBack} className="flex items-center text-primary mb-4 md:mb-6 font-semibold hover:underline text-sm md:text-base">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                            Tüm Öğrencilere Geri Dön
                        </button>
                        <div className="bg-card-background p-4 md:p-6 rounded-xl shadow-md mb-6 md:mb-8">
                            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold font-poppins text-text-primary">{student.name}</h2>
                                    <p className="text-text-secondary">{student.grade === 4 ? 'İlkokul' : `${student.grade}. Sınıf`}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                    <button onClick={handleExportToPDF} disabled={!weeklyProgram} className="flex-1 sm:flex-none bg-gray-600 text-white px-3 md:px-4 py-2 rounded-xl hover:bg-gray-700 flex items-center justify-center space-x-2 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm md:text-base">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                        <span className="whitespace-nowrap">PDF</span>
                                    </button>
                                    <button onClick={() => setIsCreatingFlashcard(true)} className="flex-1 sm:flex-none bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 md:px-4 py-2 rounded-xl hover:from-purple-600 hover:to-blue-600 flex items-center justify-center space-x-2 text-sm md:text-base">
                                        <span className="text-lg">🔄</span>
                                        <span className="whitespace-nowrap">Flashcard</span>
                                    </button>
                                    <button onClick={() => setIsCreatingPDFTest(true)} className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-3 md:px-4 py-2 rounded-xl hover:from-blue-700 hover:to-cyan-700 flex items-center justify-center space-x-2 text-sm md:text-base">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                        </svg>
                                        <span className="whitespace-nowrap">PDF Test</span>
                                    </button>
                                    <button onClick={() => setIsCreatingTest(true)} className="flex-1 sm:flex-none bg-primary text-white px-3 md:px-4 py-2 rounded-xl hover:bg-primary-dark flex items-center justify-center space-x-2 text-sm md:text-base">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>
                                        <span className="whitespace-nowrap">AI Test</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="border-b border-border mb-6 overflow-x-auto scrollbar-hide">
                            <nav className="-mb-px flex space-x-4 min-w-max" aria-label="Tabs">
                                <button onClick={() => setActiveTab('overview')} className={tabClass('overview')}>Genel Bakış</button>
                                <button onClick={() => setActiveTab('homework')} className={tabClass('homework')}>Ödevler</button>
                                <button onClick={() => setActiveTab('analytics')} className={tabClass('analytics')}>Analizler</button>
                            </nav>
                        </div>

                        {activeTab === 'overview' && renderOverviewTab()}
                        {activeTab === 'homework' && renderHomeworkTab()}
                        {activeTab === 'analytics' && renderAnalyticsTab()}
                    </div>
                </main>
            )}

            {renderModals()}
            {viewingQBAssignment && (
                <QuestionBankResultModal
                    assignment={viewingQBAssignment}
                    onClose={() => setViewingQBAssignment(null)}
                    onGenerateAnalysis={handleGenerateQBAnalysis}
                />
            )}
            {toastMessage && (
                <div className="fixed bottom-8 right-8 bg-success text-white px-6 py-3 rounded-xl shadow-lg animate-fade-in-up z-50">
                    {toastMessage}
                </div>
            )}
        </>
    );
};

export default StudentDetailPage;