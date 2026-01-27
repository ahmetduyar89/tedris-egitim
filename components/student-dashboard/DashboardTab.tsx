import React from 'react';
import { User, Student, DailyMessage, Test, WeeklyProgram, Assignment } from '../../types';
import { DiagnosisTestAssignment, DiagnosisTestQuestion } from '../../types/diagnosisTestTypes';
import { PDFTest, PDFTestSubmission } from '../../services/pdfTestService';
import AchievementNotification from '../AchievementNotification';
import MotivationCard from '../MotivationCard';
import WeeklySchedule from '../WeeklySchedule';
import AssessmentWidget from './AssessmentWidget';
import TestArea from './TestArea';

import StreakWidget from '../StreakWidget';
import UpcomingLessonsWidget from './UpcomingLessonsWidget';
import FlashcardWidget from '../FlashcardWidget';
import HomeworkWidget from './HomeworkWidget';

interface DashboardTabProps {
    user: User;
    studentData: Student | null;
    dailyMessage: DailyMessage | null;
    isMessageLoading: boolean;
    mergedWeeklyProgram: WeeklyProgram | null;
    pendingTests: Test[];
    completedTests: Test[];
    handleStartTest: (test: Test) => void;
    handleViewReport: (test: Test) => void;
    pendingPDFTests: PDFTest[];
    completedPDFTests: PDFTestSubmission[];
    handleStartPDFTest: (test: PDFTest) => void;
    handleTaskClick: (task: any) => void;
    handleTaskToggle: (task: any) => void;
    handleJoinOnlineLesson: (lesson: any) => void;
    setActiveTab: (tab: any) => void;
    assignments: Assignment[];
    handleOpenAssignment: (assignment: Assignment) => void;
    setActiveView: (view: any) => void;
    pendingDiagnosisTests: DiagnosisTestAssignment[];
    handleStartDiagnosisTest: (id: string) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
    user,
    studentData,
    dailyMessage,
    isMessageLoading,
    mergedWeeklyProgram,
    pendingTests,
    completedTests,
    handleStartTest,
    handleViewReport,
    pendingPDFTests,
    completedPDFTests,
    handleStartPDFTest,
    handleTaskClick,
    handleTaskToggle,
    handleJoinOnlineLesson,
    setActiveTab,
    assignments,
    handleOpenAssignment,
    setActiveView,
    pendingDiagnosisTests,
    handleStartDiagnosisTest
}) => {
    const hasWeeklyProgram = mergedWeeklyProgram !== null;
    const isLoading = !studentData;

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 space-y-8">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 animate-pulse">
                    <div className="h-6 bg-white/20 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-white/20 rounded w-full max-w-md"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
                            <div className="h-20 bg-gray-100 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-fade-in">
            <AchievementNotification studentId={user.id} />
            {studentData && <MotivationCard message={dailyMessage} isLoading={isMessageLoading} student={studentData} />}

            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6`}>
                <div className="lg:col-span-2 space-y-6">
                    {!hasWeeklyProgram ? (
                        <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center min-h-[300px]">
                            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-primary">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Haftalık Programın Hazırlanıyor</h3>
                            <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                                Öğretmenin senin için en uygun çalışma planını hazırlıyor. Programın hazır olduğunda burada gün gün hedeflerini görebileceksin.
                            </p>
                            <div className="mt-8 flex gap-3">
                                <div className="h-1.5 w-12 bg-primary/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-1/3 animate-ping"></div>
                                </div>
                                <div className="h-1.5 w-12 bg-primary/20 rounded-full"></div>
                                <div className="h-1.5 w-12 bg-primary/20 rounded-full"></div>
                            </div>
                        </div>
                    ) : (
                        <WeeklySchedule
                            program={mergedWeeklyProgram}
                            onTaskClick={handleTaskClick}
                            onTaskToggle={handleTaskToggle}
                            isInteractive={true}
                        />
                    )}

                    <TestArea
                        pendingTests={pendingTests}
                        completedTests={completedTests}
                        onStartTest={handleStartTest}
                        onViewReport={handleViewReport}
                        pendingPDFTests={pendingPDFTests}
                        completedPDFTests={completedPDFTests}
                        onStartPDFTest={handleStartPDFTest}
                    />
                </div>

                <div className="space-y-4">
                    {pendingDiagnosisTests.length > 0 && studentData && (
                        <AssessmentWidget onStart={() => handleStartDiagnosisTest(pendingDiagnosisTests[0].id)} />
                    )}


                    <StreakWidget studentId={user.id} />
                    <UpcomingLessonsWidget studentId={user.id} onJoinLesson={handleJoinOnlineLesson} />
                    <FlashcardWidget studentId={user.id} onOpenFlashcards={() => setActiveTab('flashcards')} />
                    <HomeworkWidget assignments={assignments} onOpenAssignment={handleOpenAssignment} />
                </div>
            </div>
        </div>
    );
};

export default DashboardTab;
