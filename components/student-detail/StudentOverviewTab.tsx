import React from 'react';
import { Student, Test, Assignment, Flashcard, SpacedRepetitionSchedule, QuestionBankAssignment, QuestionBank, PrivateLesson, LessonStats, PaymentSummary, StudentPaymentConfig, WeeklyProgram } from '../../types';
import { PDFTest, PDFTestSubmission } from '../../services/pdfTestService';
import OverallAnalytics from '../OverallAnalytics';
import EditableWeeklySchedule from '../EditableWeeklySchedule';
import StudentPaymentSettings from '../StudentPaymentSettings';

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
    onUpdatePaymentConfig
}) => {
    return (
        <div className="space-y-6 md:space-y-8">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-lg p-4 md:p-6 border-l-4 border-green-500">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                    <h3 className="text-xl md:text-2xl font-bold font-poppins text-text-primary flex items-center">
                        <span className="text-2xl md:text-3xl mr-2 md:mr-3">📊</span>
                        Genel Performans Analizi
                    </h3>
                    <button
                        onClick={onExportAnalysisToPDF}
                        className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center justify-center space-x-2 transition-colors text-sm md:text-base"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        <span className="whitespace-nowrap">PDF Rapor</span>
                    </button>
                </div>
                <OverallAnalytics
                    tests={assignedTests}
                    assignments={assignments}
                    flashcards={flashcards}
                    spacedRepetitionSchedules={spacedRepetitionSchedules}
                    questionBankAssignments={questionBankAssignments}
                    studentName={student.name}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <div className="bg-card-background p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-bold font-poppins text-text-primary mb-4">Atanmış Testler</h3>
                        {(assignedTests.length > 0 || questionBankAssignments.length > 0 || pdfTestSubmissions.length > 0) ? (
                            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {assignedTests.map(test => (
                                    <li key={test.id} className="p-3 hover:bg-gray-50 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold">{test.title}</p>
                                                <p className={`text-sm font-medium ${test.completed ? 'text-success' : 'text-warning'}`}>{test.completed ? `Tamamlandı (Puan: ${test.score}%)` : 'Beklemede'}</p>
                                            </div>
                                            {test.completed && <button onClick={() => onShowAnalysis(test)} className="bg-primary text-white px-4 py-1 rounded-xl hover:bg-primary-dark">Raporu Gör</button>}
                                        </div>
                                    </li>
                                ))}
                                {questionBankAssignments.map(qbAssignment => (
                                    <li key={qbAssignment.id} className="p-3 hover:bg-gray-50 rounded-lg border-l-4 border-purple-400">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold flex items-center">
                                                    <span className="text-purple-600 mr-2">📝</span>
                                                    {qbAssignment.questionBank?.title || 'Soru Bankası Testi'}
                                                </p>
                                                <p className={`text-sm font-medium ${qbAssignment.status === 'Tamamlandı' ? 'text-success' : 'text-warning'}`}>
                                                    {qbAssignment.status === 'Tamamlandı' ? `Tamamlandı (${qbAssignment.score}/100 puan)` : qbAssignment.status}
                                                </p>
                                            </div>
                                            {qbAssignment.status === 'Tamamlandı' && (
                                                <button
                                                    onClick={() => onViewQBAssignment(qbAssignment)}
                                                    className="bg-purple-600 text-white px-4 py-1 rounded-xl hover:bg-purple-700"
                                                >
                                                    Sonuçları Gör
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                                {pdfTestSubmissions.map(submission => {
                                    const pdfTest = pdfTests.find(t => t.id === submission.pdfTestId);
                                    if (!pdfTest) return null;
                                    return (
                                        <li key={submission.id} className="p-3 hover:bg-gray-50 rounded-lg border-l-4 border-blue-400">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600 mr-2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                                        </svg>
                                                        {pdfTest.title}
                                                    </p>
                                                    <p className={`text-sm font-medium ${submission.status === 'completed' || submission.status === 'time_expired' ? 'text-success' : 'text-warning'}`}>
                                                        {submission.status === 'completed' || submission.status === 'time_expired' ? `Tamamlandı (${submission.scorePercentage?.toFixed(1)}%)` : 'Devam Ediyor'}
                                                    </p>
                                                </div>
                                                {(submission.status === 'completed' || submission.status === 'time_expired') && (
                                                    <button
                                                        onClick={() => onViewPDFTestResult(pdfTest, submission)}
                                                        className="bg-blue-600 text-white px-4 py-1 rounded-xl hover:bg-blue-700"
                                                    >
                                                        Sonuçları Gör
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : <p className="text-gray-500 text-center py-4">Bu öğrenciye henüz bir test atanmamış.</p>}
                    </div>

                    <div className="bg-card-background p-6 rounded-xl shadow-md border-l-4 border-indigo-500">
                        <h3 className="text-xl font-bold font-poppins text-text-primary mb-4 flex items-center">
                            <span className="text-2xl mr-2">📚</span>
                            Yapılan Dersler
                        </h3>
                        {completedLessons.length > 0 ? (
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                {completedLessons.map((lesson) => (
                                    <div
                                        key={lesson.id}
                                        onClick={() => onViewLesson(lesson)}
                                        className="bg-white p-4 rounded-lg border border-indigo-100 hover:shadow-md transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-indigo-700">{lesson.subject}</span>
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                        {new Date(lesson.startTime).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                                    </span>
                                                </div>
                                                <p className="text-gray-800 font-medium line-clamp-1">
                                                    {lesson.topic || 'Konu belirtilmemiş'}
                                                </p>
                                            </div>
                                            <div className="text-indigo-400 group-hover:text-indigo-600 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                        {lesson.homework && (
                                            <div className="mt-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded inline-block">
                                                ✏️ Ödev verildi
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">Henüz tamamlanmış ve kayıtlı bir ders bulunmuyor.</p>
                        )}
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                        <h3 className="text-xl font-bold font-poppins text-text-primary mb-4 flex items-center">
                            <span className="text-2xl mr-2">🔄</span>
                            Flashcard'lar ({flashcards.length})
                        </h3>
                        {Object.keys(groupedFlashcards).length > 0 ? (
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                {Object.entries(groupedFlashcards).map(([topic, cards]) => (
                                    <div key={topic} className="bg-white rounded-lg shadow-sm border border-purple-100 overflow-hidden">
                                        <div className="flex items-center justify-between p-4 hover:bg-purple-50 transition-colors">
                                            <button
                                                onClick={() => onToggleTopic(topic)}
                                                className="flex-1 flex items-center space-x-3 text-left"
                                            >
                                                <span className="text-lg">
                                                    {expandedTopics.has(topic) ? '📖' : '📕'}
                                                </span>
                                                <div>
                                                    <h4 className="font-semibold text-gray-800">{topic}</h4>
                                                    <p className="text-xs text-gray-500">{(cards as any[]).length} kart</p>
                                                </div>
                                            </button>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteTopicFlashcards(topic);
                                                    }}
                                                    className="px-3 py-1 text-xs font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded transition-colors"
                                                    title="Tümünü Sil"
                                                >
                                                    🗑️ Tümünü Sil
                                                </button>
                                                <button
                                                    onClick={() => onToggleTopic(topic)}
                                                    className="p-1"
                                                >
                                                    <svg
                                                        className={`w-5 h-5 text-gray-500 transition-transform ${expandedTopics.has(topic) ? 'rotate-180' : ''}`}
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
                                            <div className="border-t border-purple-100 bg-gray-50 p-3 space-y-2">
                                                {(cards as any[]).map((flashcard: any, index: number) => (
                                                    <div key={flashcard.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <div className="flex items-center space-x-2 mb-2">
                                                                    <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                                                        Soru {index + 1}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">Seviye: {flashcard.difficulty_level}</span>
                                                                </div>
                                                                <p className="font-medium text-gray-800 text-sm mb-1">
                                                                    <span className="text-xs text-gray-500 mr-1">Ön:</span>
                                                                    {flashcard.front_content}
                                                                </p>
                                                                <p className="text-gray-600 text-xs">
                                                                    <span className="text-xs text-gray-500 mr-1">Arka:</span>
                                                                    {flashcard.back_content}
                                                                </p>
                                                            </div>
                                                            <div className="flex space-x-1 ml-2">
                                                                <button
                                                                    onClick={() => onEditFlashcard(flashcard)}
                                                                    className="text-blue-500 hover:text-blue-700 p-1"
                                                                    title="Düzenle"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => onDeleteFlashcard(flashcard.id!, flashcard.scheduleId)}
                                                                    className="text-red-500 hover:text-red-700 p-1"
                                                                    title="Sil"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
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
                            <p className="text-gray-500 text-center py-4">Bu öğrenciye henüz flashcard atanmamış.</p>
                        )}
                    </div>
                </div>
                <div>
                    {weeklyProgram ? (
                        <EditableWeeklySchedule
                            program={weeklyProgram}
                            onProgramUpdate={onUpdateWeeklyProgram}
                        />
                    ) : (
                        <div className="bg-card-background p-6 rounded-xl shadow-md text-center">
                            <h2 className="text-2xl font-bold font-poppins text-text-primary mb-4">Haftalık Program Takibi</h2>
                            <p className="text-gray-500 mb-4">Öğrenciye henüz bir haftalık program atanmamış.</p>
                            <button
                                onClick={onEditProgram}
                                className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                            >
                                + Manuel Haftalık Plan Oluştur
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Lesson Tracking and Payment Section */}
            {(lessonStats || paymentSummary || completedLessons.length > 0) && (
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
            )}
        </div>
    );
};

export default StudentOverviewTab;
