import React, { useState } from 'react';
import { Student, Test, Assignment, Flashcard, SpacedRepetitionSchedule, QuestionBankAssignment, QuestionBank, PrivateLesson, LessonStats, PaymentSummary, StudentPaymentConfig, WeeklyProgram } from '../../types';
import { PDFTest, PDFTestSubmission } from '../../services/pdfTestService';
import { DiagnosisTestAssignment } from '../../types/diagnosisTestTypes';
import { sendWhatsAppToRecipient } from '../../services/multiChannelNotificationService';
import OverallAnalytics from '../OverallAnalytics';
import EditableWeeklySchedule from '../EditableWeeklySchedule';
import StudentPaymentSettings from '../StudentPaymentSettings';
import StreakWidget from '../StreakWidget';
import DailyGoalsCard from '../DailyGoalsCard';

interface StudentOverviewTabProps {
    student: Student;
    user: any; // Using any for User to avoid complex type imports if not strictly needed, or import User
    assignedTests: Test[];
    assignments: Assignment[];
    flashcards: (Flashcard & { scheduleId?: string })[];
    spacedRepetitionSchedules: SpacedRepetitionSchedule[];
    questionBankAssignments: (QuestionBankAssignment & { questionBank?: QuestionBank })[];
    pdfTestSubmissions: PDFTestSubmission[];
    pdfTests: PDFTest[];
    completedLessons: PrivateLesson[];
    groupedFlashcards: { [topic: string]: (Flashcard & { scheduleId?: string })[] };
    expandedTopics: Set<string>;
    weeklyProgram: WeeklyProgram | null;
    lessonStats: LessonStats | null;
    paymentSummary: PaymentSummary | null;
    paymentConfig: StudentPaymentConfig | null;

    // Handlers
    onExportAnalysisToPDF: () => void;
    onShowAnalysis: (test: Test) => void;
    onViewQBAssignment: (assignment: QuestionBankAssignment & { questionBank?: QuestionBank }) => void;
    onViewPDFTestResult: (test: PDFTest, submission: PDFTestSubmission) => void;
    onViewLesson: (lesson: PrivateLesson) => void;
    onToggleTopic: (topic: string) => void;
    onDeleteTopicFlashcards: (topic: string) => void;
    onEditFlashcard: (flashcard: Flashcard) => void;
    onDeleteFlashcard: (flashcardId: string, scheduleId?: string) => void;
    onUpdateWeeklyProgram: (program: WeeklyProgram) => void;
    onEditProgram: () => void;
    onUpdatePaymentConfig: (config: StudentPaymentConfig) => void;
    onDeleteTest: (testId: string) => void;
    onDeleteQBAssignment: (assignmentId: string) => void;
    onDeletePDFTest: (testId: string) => void;
    diagnosisTestAssignments: DiagnosisTestAssignment[];
    onDeleteDiagnosisTestAssignment: (assignmentId: string) => void;
    studentId: string;
}

const StudentOverviewTab: React.FC<StudentOverviewTabProps> = ({
    student,
    user,
    assignedTests,
    assignments,
    flashcards,
    spacedRepetitionSchedules,
    questionBankAssignments,
    pdfTestSubmissions,
    pdfTests,
    completedLessons,
    groupedFlashcards,
    expandedTopics,
    weeklyProgram,
    lessonStats,
    paymentSummary,
    paymentConfig,
    onExportAnalysisToPDF,
    onShowAnalysis,
    onViewQBAssignment,
    onViewPDFTestResult,
    onViewLesson,
    onToggleTopic,
    onDeleteTopicFlashcards,
    onEditFlashcard,
    onDeleteFlashcard,
    onUpdateWeeklyProgram,
    onEditProgram,
    onUpdatePaymentConfig,
    onDeleteTest,
    onDeleteQBAssignment,
    onDeletePDFTest,
    diagnosisTestAssignments,
    onDeleteDiagnosisTestAssignment,
    studentId
}) => {
    const [waModal, setWaModal] = useState<{
        isOpen: boolean;
        studentId: string;
        title: string;
        entityId: string;
        type: 'diagnosis' | 'question_bank' | 'pdf' | 'test';
    } | null>(null);

    const handleSendWhatsApp = (
        studentId: string,
        title: string,
        entityId: string,
        type: 'diagnosis' | 'question_bank' | 'pdf' | 'test'
    ) => {
        setWaModal({
            isOpen: true,
            studentId,
            title,
            entityId,
            type
        });
    };

    const handleConfirmSendWhatsApp = async (recipient: 'student' | 'parent') => {
        if (!waModal) return;

        try {
            const waWindow = window.open('', '_blank');
            if (waWindow) {
                waWindow.document.write('WhatsApp hazırlanıyor...');
            }

            let message = '';
            if (recipient === 'parent') {
                const parentName = student.parentName ? `Sayın ${student.parentName}` : 'Sayın Veli';
                message = `${parentName},\n\nÖğrencinize "${waModal.title}" başlıklı yeni bir test atanmıştır.\n\nLütfen kontrol ediniz.`;
            } else {
                message = `Sevgili Öğrenci,\n\n"${waModal.title}" başlıklı yeni bir testin var.\n\nBaşarılar dileriz.`;
            }

            await sendWhatsAppToRecipient(
                waModal.studentId,
                recipient,
                'Yeni Test Atandı',
                message,
                waWindow
            );

            setWaModal(null);
        } catch (error) {
            console.error('WhatsApp notification error:', error);
            alert('WhatsApp bildirimi gönderilemedi.');
        }
    };

    return (
        <div className="space-y-4">
            {/* Compact Performance Analytics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <span className="text-xl">📊</span>
                        Performans Özeti
                    </h3>
                    <button
                        onClick={onExportAnalysisToPDF}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        <span>PDF</span>
                    </button>
                </div>
                <OverallAnalytics
                    tests={assignedTests}
                    assignments={assignments}
                    flashcards={flashcards}
                    spacedRepetitionSchedules={spacedRepetitionSchedules}
                    questionBankAssignments={questionBankAssignments}
                    pdfTestSubmissions={pdfTestSubmissions}
                    studentName={student.name}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column - Tests & Lessons */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Compact Tests List */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">Atanmış Testler</h3>
                        {(assignedTests.length > 0 || questionBankAssignments.length > 0 || pdfTests.length > 0 || diagnosisTestAssignments.length > 0) ? (
                            <ul className="space-y-1.5 max-h-60 overflow-y-auto pr-2">
                                {diagnosisTestAssignments.map(assignment => (
                                    <li key={assignment.id} className="p-2.5 hover:bg-gray-50 rounded-md group flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-1.5">
                                                <span className="text-orange-500">🩺</span>
                                                {assignment.test?.title || 'Tanı Testi'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {assignment.status === 'completed' ? `✓ ${assignment.score}% ` : 'Devam ediyor'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">

                                            <button
                                                onClick={() => onDeleteDiagnosisTestAssignment(assignment.id)}
                                                className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                                {assignedTests.map(test => (
                                    <li key={test.id} className="p-2.5 hover:bg-gray-50 rounded-md group flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{test.title}</p>
                                            <p className="text-xs text-gray-500">
                                                {test.completed ? `✓ ${test.score}% ` : 'Beklemede'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">

                                            {test.completed && (
                                                <button
                                                    onClick={() => onShowAnalysis(test)}
                                                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                                                >
                                                    Rapor
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onDeleteTest(test.id)}
                                                className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                                {questionBankAssignments.map(qbAssignment => (
                                    <li key={qbAssignment.id} className="p-2.5 hover:bg-gray-50 rounded-md group flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-1.5">
                                                <span className="text-purple-500">📝</span>
                                                {qbAssignment.questionBank?.title || 'Soru Bankası'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {qbAssignment.status === 'Tamamlandı' ? `✓ ${qbAssignment.score}/100` : qbAssignment.status}
                                            </p >
                                        </div >
                                        <div className="flex items-center gap-1">

                                            {qbAssignment.status === 'Tamamlandı' && (
                                                <button
                                                    onClick={() => onViewQBAssignment(qbAssignment)}
                                                    className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded hover:bg-purple-100"
                                                >
                                                    Sonuç
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onDeleteQBAssignment(qbAssignment.id)}
                                                className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </li >
                                ))}
                                {
                                    pdfTests.map(pdfTest => {
                                        const submission = pdfTestSubmissions.find(s => s.pdfTestId === pdfTest.id);
                                        const isCompleted = submission && (submission.status === 'completed' || submission.status === 'time_expired');
                                        return (
                                            <li key={pdfTest.id} className="p-2.5 hover:bg-gray-50 rounded-md group flex items-center justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-1.5">
                                                        <span className="text-blue-500">📄</span>
                                                        {pdfTest.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {isCompleted ? `✓ ${submission.scorePercentage?.toFixed(1)}%` : (submission ? 'Devam ediyor' : 'Başlanmadı')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">

                                                    {isCompleted && submission && (
                                                        <button
                                                            onClick={() => onViewPDFTestResult(pdfTest, submission)}
                                                            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                                                        >
                                                            Sonuç
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => onDeletePDFTest(pdfTest.id)}
                                                        className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })
                                }
                            </ul >
                        ) : <p className="text-sm text-gray-500 text-center py-6">Henüz test atanmamış</p>}
                    </div >

                    {/* Compact Lessons */}
                    < div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4" >
                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="text-xl">📚</span>
                            Yapılan Dersler
                        </h3>
                        {
                            completedLessons.length > 0 ? (
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {completedLessons.map((lesson) => (
                                        <div
                                            key={lesson.id}
                                            onClick={() => onViewLesson(lesson)}
                                            className="p-2.5 hover:bg-gray-50 rounded-md cursor-pointer group flex items-center justify-between"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{lesson.subject}</p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {lesson.topic || 'Konu belirtilmemiş'} • {new Date(lesson.startTime).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                </p>
                                            </div>
                                            {lesson.homework && (
                                                <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">✏️</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-6">Henüz ders kaydı yok</p>
                            )
                        }
                    </div >

                    {/* Compact Flashcards */}
                    < div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4" >
                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="text-xl">🔄</span>
                            Flashcard'lar ({flashcards.length})
                        </h3>
                        {
                            Object.keys(groupedFlashcards).length > 0 ? (
                                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-2">
                                    {Object.entries(groupedFlashcards).map(([topic, cards]) => (
                                        <div key={topic} className="bg-gray-50 rounded-md overflow-hidden">
                                            <div className="flex items-center justify-between p-2.5 hover:bg-gray-100 transition-colors">
                                                <button
                                                    onClick={() => onToggleTopic(topic)}
                                                    className="flex-1 flex items-center gap-2 text-left"
                                                >
                                                    <span className="text-sm">{expandedTopics.has(topic) ? '📖' : '📕'}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{topic}</p>
                                                        <p className="text-xs text-gray-500">{(cards as any[]).length} kart</p>
                                                    </div>
                                                </button>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteTopicFlashcards(topic);
                                                        }}
                                                        className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                                                    >
                                                        Sil
                                                    </button>
                                                    <button onClick={() => onToggleTopic(topic)} className="p-1">
                                                        <svg
                                                            className={`w-4 h-4 text-gray-500 transition-transform ${expandedTopics.has(topic) ? 'rotate-180' : ''}`}
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>

                                            {expandedTopics.has(topic) && (
                                                <div className="border-t border-gray-200 bg-white p-2 space-y-1.5">
                                                    {(cards as any[]).map((flashcard: any, index: number) => (
                                                        <div key={flashcard.id} className="bg-gray-50 p-2 rounded text-xs">
                                                            <div className="flex justify-between items-start gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium text-gray-900 mb-0.5">
                                                                        #{index + 1} • Seviye {flashcard.difficulty_level}
                                                                    </p>
                                                                    <p className="text-gray-600 truncate">Ön: {flashcard.front_content}</p>
                                                                    <p className="text-gray-500 truncate">Arka: {flashcard.back_content}</p>
                                                                </div>
                                                                <div className="flex gap-0.5">
                                                                    <button
                                                                        onClick={() => onEditFlashcard(flashcard)}
                                                                        className="text-blue-500 hover:text-blue-700 p-0.5"
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                        </svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => onDeleteFlashcard(flashcard.id!, flashcard.scheduleId)}
                                                                        className="text-red-500 hover:text-red-700 p-0.5"
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-6">Henüz flashcard yok</p>
                            )
                        }
                    </div >
                </div >
                {/* Right Column - Weekly Program & Motivation */}
                <div className="space-y-4">
                    {
                        weeklyProgram ? (
                            <EditableWeeklySchedule
                                program={weeklyProgram}
                                onProgramUpdate={onUpdateWeeklyProgram}
                            />
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                                <h3 className="text-base font-semibold text-gray-900 mb-2">Haftalık Program</h3>
                                <p className="text-sm text-gray-500 mb-4">Henüz program atanmamış</p>
                                <button
                                    onClick={onEditProgram}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                                >
                                    + Plan Oluştur
                                </button>
                            </div >
                        )}

                    {/* Motivasyon Bilgileri */}
                    <StreakWidget studentId={studentId} />
                    <DailyGoalsCard studentId={studentId} />
                </div >
            </div >

            {/* Lesson Tracking and Payment Section */}
            {
                (lessonStats || paymentSummary || completedLessons.length > 0) && (
                    <div className="mt-8 space-y-6">
                        <h3 className="text-2xl font-bold font-poppins text-text-primary flex items-center">
                            <span className="text-3xl mr-3">📚</span>
                            Özel Ders Takibi
                        </h3>

                        {/* Stats and Payment Summary Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Lesson Statistics */}
                            {lessonStats && (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-md border border-blue-200">
                                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                        <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        Ders İstatistikleri
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Toplam Planlanan:</span>
                                            <span className="font-bold text-gray-900">{lessonStats.totalScheduled} ders</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Tamamlanan:</span>
                                            <span className="font-bold text-green-600">{lessonStats.totalCompleted} ders</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Kaçırılan:</span>
                                            <span className="font-bold text-red-600">{lessonStats.totalMissed} ders</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">İptal:</span>
                                            <span className="font-bold text-orange-600">{lessonStats.totalCancelled} ders</span>
                                        </div>
                                        <div className="pt-3 border-t border-blue-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-700 font-medium">Tamamlanma Oranı:</span>
                                                <span className="font-bold text-blue-600">{lessonStats.completionRate}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div
                                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                                                    style={{ width: `${lessonStats.completionRate}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payment Summary */}
                            {paymentSummary && (
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl shadow-md border border-green-200">
                                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                        <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Ödeme Özeti
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Toplam Kazanılan:</span>
                                            <span className="font-bold text-green-600">{paymentSummary.totalEarned.toFixed(2)} {paymentSummary.currency}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Bekleyen Ödemeler:</span>
                                            <span className="font-bold text-orange-600">{paymentSummary.totalPending.toFixed(2)} {paymentSummary.currency}</span>
                                        </div>
                                        <div className="pt-3 border-t border-green-200 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-700">Ödenen Dersler:</span>
                                                <span className="font-bold text-gray-900">{paymentSummary.paidLessons}/{paymentSummary.totalLessons}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-700">Ödenmemiş:</span>
                                                <span className="font-bold text-red-600">{paymentSummary.unpaidLessons} ders</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Completed Lessons History */}
                        {completedLessons.length > 0 && (
                            <div className="bg-card-background p-6 rounded-xl shadow-md">
                                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    Yapılan Dersler
                                </h4>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {completedLessons.map(lesson => (
                                        <div key={lesson.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2 flex-wrap gap-2">
                                                        <span className="font-semibold text-gray-900">{lesson.subject}</span>
                                                        <span className="text-sm text-gray-500">
                                                            {new Date(lesson.startTime).toLocaleDateString('tr-TR', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })}
                                                        </span>

                                                        {/* Attendance Status Badge */}
                                                        {lesson.attendance && (
                                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${lesson.attendance.attendanceStatus === 'completed'
                                                                ? 'bg-green-100 text-green-700'
                                                                : lesson.attendance.attendanceStatus === 'missed'
                                                                    ? 'bg-red-100 text-red-700'
                                                                    : 'bg-orange-100 text-orange-700'
                                                                }`}>
                                                                {lesson.attendance.attendanceStatus === 'completed'
                                                                    ? '✓ Yapıldı'
                                                                    : lesson.attendance.attendanceStatus === 'missed'
                                                                        ? '✗ Yapılmadı'
                                                                        : '⊘ İptal'}
                                                            </span>
                                                        )}

                                                        {/* Payment Status Badge */}
                                                        {lesson.attendance?.attendanceStatus === 'completed' && lesson.attendance.paymentStatus && (
                                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${lesson.attendance.paymentStatus === 'paid'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : lesson.attendance.paymentStatus === 'partial'
                                                                    ? 'bg-yellow-100 text-yellow-700'
                                                                    : 'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                {lesson.attendance.paymentStatus === 'paid'
                                                                    ? `💰 ${lesson.attendance.paymentAmount || 0} TL`
                                                                    : lesson.attendance.paymentStatus === 'partial'
                                                                        ? `◐ ${lesson.attendance.paymentAmount || 0} TL (Kısmi)`
                                                                        : 'Ödenmedi'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {lesson.topic && (
                                                        <p className="text-sm text-gray-700 mb-1">
                                                            <span className="font-medium">Konu:</span> {lesson.topic}
                                                        </p>
                                                    )}
                                                    {lesson.lessonNotes && (
                                                        <p className="text-sm text-gray-600 line-clamp-2">{lesson.lessonNotes}</p>
                                                    )}
                                                    {lesson.attendance?.paymentNotes && (
                                                        <p className="text-xs text-gray-500 mt-1 italic">
                                                            💬 {lesson.attendance.paymentNotes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment Configuration */}
                        <StudentPaymentSettings
                            studentId={student.id}
                            teacherId={user.id}
                            initialConfig={paymentConfig}
                            onUpdate={onUpdatePaymentConfig}
                        />
                    </div>
                )
            }

            {/* WhatsApp Selection Modal */}
            {waModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-green-500 p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold flex items-center gap-2">
                                <span className="text-xl">📱</span>
                                WhatsApp Bildirimi
                            </h3>
                            <button onClick={() => setWaModal(null)} className="hover:bg-green-600 rounded-full p-1 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-900 font-medium mb-1 line-clamp-2">{waModal.title}</p>
                            <p className="text-gray-500 text-sm mb-6">Bu bildirimi kime göndermek istersiniz?</p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => handleConfirmSendWhatsApp('parent')}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-green-500 text-green-700 rounded-xl hover:bg-green-50 transition-all font-semibold group shadow-sm hover:shadow-md"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl group-hover:scale-110 transition-transform">👩‍👦</span>
                                        <div className="text-left">
                                            <div className="text-sm">Veli'ye Gönder</div>
                                            <div className="text-xs text-green-600 font-normal">Anne/Baba için</div>
                                        </div>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>

                                <button
                                    onClick={() => handleConfirmSendWhatsApp('student')}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🎓</span>
                                        <div className="text-left">
                                            <div className="text-sm">Öğrenciye Gönder</div>
                                            <div className="text-xs text-white/80 font-normal">Doğrudan öğrenciye</div>
                                        </div>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default StudentOverviewTab;
