import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Test, WeeklyProgram, Task, TaskStatus, ReviewPackage, Student, DailyMessage, Assignment, AssignmentStatus, Submission, AIHomeworkAnalysis, ContentLibraryItem, ContentAssignment, ContentType, Notification, Subject } from '../types';
import Header from '../components/Header';
import WeeklySchedule from '../components/WeeklySchedule';
import TestTakingPage from './TestTakingPage';
import ReviewPackagePage from './ReviewPackagePage';
import StudentTestReport from '../components/StudentTestReport';
import QuestionBankTestPage from './QuestionBankTestPage';
import ProfileCard from '../components/ProfileCard';
import StudentProfileSection from '../components/StudentProfileSection';
import { awardXpForTask, checkAndAwardBadges, getDailyMotivationMessage, calculateLevel } from '../services/motivationService';
import WeeklyReport from '../components/WeeklyReport';
import AIAssistantPage from './AIAssistantPage';
import AssignmentCard from '../components/AssignmentCard';
import SubmitHomeworkPage from './SubmitHomeworkPage';
import LearningMap from '../components/LearningMap';
import MotivationCard from '../components/MotivationCard';
import ContentCard from '../components/ContentCard';
import NewItemPopup from '../components/NewItemPopup';
import SpacedRepetitionDashboard from '../components/SpacedRepetitionDashboard';
import FlashcardWidget from '../components/FlashcardWidget';
import StreakWidget from '../components/StreakWidget';
import DailyGoalsCard from '../components/DailyGoalsCard';
import CompactAchievementCard from '../components/CompactAchievementCard';
import CompactDailyGoalsCard from '../components/CompactDailyGoalsCard';
import AchievementNotification from '../components/AchievementNotification';
import { logActivity } from '../services/streakService';
import { getNotificationsForUser, markNotificationsAsRead } from '../services/notificationService';
import { db, supabase } from '../services/dbAdapter';
import MasteryMapVisualization from '../components/MasteryMapVisualization';
import AdaptivePlanDashboard from '../components/AdaptivePlanDashboard';
import DiagnosisTestModal from '../components/DiagnosisTestModal';
import PDFTestTakingPage from './PDFTestTakingPage';
import AssignedDiagnosisTestsModal from '../components/AssignedDiagnosisTestsModal';
import { getPDFTestsForStudent, getSubmissionsForStudent, PDFTest, PDFTestSubmission } from '../services/pdfTestService';
import { diagnosisTestManagementService } from '../services/diagnosisTestManagementService';
import { DiagnosisTestAssignment } from '../types/diagnosisTestTypes';
import StudentDiagnosisTestPage from './StudentDiagnosisTestPage';
import * as privateLessonService from '../services/privateLessonService';
import StudentTurkishLearningPage from './StudentTurkishLearningPage';
const OnlineLessonRoom = React.lazy(() => import('../components/OnlineLessonRoom'));

// ... (inside StudentDashboard component)



type View = 'dashboard' | 'takingTest' | 'reviewPackage' | 'aiAssistant' | 'submitHomework' | 'viewReport' | 'takingPDFTest' | 'takingDiagnosisTest';
type Tab = 'dashboard' | 'report' | 'homework' | 'library' | 'map' | 'flashcards' | 'turkish';

interface ToastProps {
  message: string;
  type: 'success' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const baseClasses = "fixed top-20 right-8 p-4 rounded-xl shadow-lg text-white font-semibold animate-fade-in-down z-50 flex items-center space-x-3";
  const typeClasses = {
    success: 'bg-success',
    info: 'bg-primary/80'
  };

  const icon = {
    success: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    info: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      {icon[type]}
      <span>{message}</span>
    </div>
  );
};

interface TestAreaProps {
  pendingTests: Test[];
  completedTests: Test[];
  onStartTest: (test: Test) => void;
  onViewReport: (test: Test) => void;
  pendingPDFTests: PDFTest[];
  completedPDFTests: PDFTestSubmission[];
  onStartPDFTest: (test: PDFTest) => void;
}

const TestArea: React.FC<TestAreaProps> = ({ pendingTests, completedTests, onStartTest, onViewReport, pendingPDFTests, completedPDFTests, onStartPDFTest }) => {
  const hasPendingTests = pendingTests.length > 0 || pendingPDFTests.length > 0;
  const hasCompletedTests = completedTests.length > 0 || completedPDFTests.length > 0;

  if (!hasPendingTests && !hasCompletedTests) {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">Testler</h2>

      <div className="space-y-3">
        {hasPendingTests && (
          <div>
            <h3 className="text-xs font-medium text-gray-500 mb-2">Atanan</h3>
            <ul className="space-y-2">
              {pendingTests.map(test => (
                <li key={test.id} className="p-2.5 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">{test.title}</h4>
                  <p className="text-xs text-gray-500 mb-2">{test.questions.length} soru · {test.duration} dk</p>
                  <button
                    onClick={() => onStartTest(test)}
                    className="w-full bg-blue-600 text-white py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    Başla
                  </button>
                </li>
              ))}
              {pendingPDFTests.map(test => (
                <li key={test.id} className="p-2.5 rounded-md bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-1 mb-1">
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] font-medium text-blue-600">PDF</span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">{test.title}</h4>
                  <p className="text-xs text-gray-500 mb-2">{test.totalQuestions} soru · {test.durationMinutes} dk</p>
                  <button
                    onClick={() => onStartPDFTest(test)}
                    className="w-full bg-blue-600 text-white py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    Başla
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasCompletedTests && (
          <div>
            <h3 className="text-xs font-medium text-gray-500 mb-2">Tamamlanan</h3>
            <ul className="space-y-2">
              {completedTests.map(test => (
                <li key={test.id} className="p-2.5 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => test.analysis && onViewReport(test)}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{test.title}</h4>
                      <p className="text-xs text-gray-500">Puan: {test.score ?? 0}%</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${test.analysis ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {test.analysis ? 'Rapor' : 'Bekliyor'}
                    </span>
                  </div>
                </li>
              ))}
              {completedPDFTests.map(submission => (
                <li key={submission.id} className="p-2.5 rounded-md bg-blue-50 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <h4 className="text-sm font-medium text-gray-900 truncate">{submission.pdfTest?.title || 'PDF Testi'}</h4>
                      </div>
                      <p className="text-xs text-gray-500">Puan: {submission.scorePercentage?.toFixed(1)}%</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">✓</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

interface HomeworkWidgetProps {
  assignments: Assignment[];
  onOpenAssignment: (assignment: Assignment) => void;
}

const HomeworkWidget: React.FC<HomeworkWidgetProps> = ({ assignments, onOpenAssignment }) => {
  const unviewedOrIncomplete = assignments.filter(a => !a.viewedByStudent || !a.submission);
  const displayAssignments = unviewedOrIncomplete.slice(0, 3);

  if (displayAssignments.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">Ödevler</h2>
      <div className="space-y-3">
        {displayAssignments.map(assignment => {
          const isNew = !assignment.viewedByStudent;

          return (
            <div
              key={assignment.id}
              onClick={() => onOpenAssignment(assignment)}
              className="p-2.5 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {assignment.title}
                    </h4>
                    {isNew && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                        YENİ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {assignment.subject} · {new Date(assignment.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
      {unviewedOrIncomplete.length > 3 && (
        <p className="text-xs text-gray-400 text-center mt-2">
          +{unviewedOrIncomplete.length - 3} daha
        </p>
      )}
    </div>
  );
};

interface UpcomingLessonsWidgetProps {
  studentId: string;
  onJoinLesson: (lesson: any) => void;
}

const UpcomingLessonsWidget: React.FC<UpcomingLessonsWidgetProps> = ({ studentId, onJoinLesson }) => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const data = await privateLessonService.getStudentLessons(studentId);
        setLessons(data);
      } catch (error) {
        console.error('Error fetching lessons:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();

    // Refresh every minute to update "Join" button status
    const interval = setInterval(fetchLessons, 60000);
    return () => clearInterval(interval);
  }, [studentId]);

  if (loading || lessons.length === 0) return null;

  const isLessonJoinable = (lesson: any) => {
    return lesson.status === 'started' && lesson.type === 'online';
  };

  const handleJoinClick = (lesson: any) => {
    onJoinLesson(lesson);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="bg-red-100 p-2 rounded-lg text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </span>
          Yaklaşan Dersler
        </h3>
      </div>

      <div className="space-y-3">
        {lessons.map((lesson) => {
          const startTime = new Date(lesson.start_time);
          const isToday = new Date().toDateString() === startTime.toDateString();
          const joinable = isLessonJoinable(lesson);

          return (
            <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center justify-center bg-white w-12 h-12 rounded-lg border border-gray-200 shadow-sm">
                  <span className="text-xs font-bold text-gray-500 uppercase">{startTime.toLocaleDateString('tr-TR', { month: 'short' })}</span>
                  <span className="text-lg font-bold text-gray-800">{startTime.getDate()}</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">{lesson.subject}</h4>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    {startTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {joinable ? (
                <button
                  onClick={() => handleJoinClick(lesson)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-md animate-pulse flex items-center gap-2"
                >
                  Derse Katıl
                </button>
              ) : (
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                  {lesson.status === 'completed' ? 'Tamamlandı' : 'Bekleniyor'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
  onNavigateToContent: (contentId: string) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onLogout, onNavigateToContent }) => {
  const [pendingTests, setPendingTests] = useState<Test[]>([]);
  const [completedTests, setCompletedTests] = useState<Test[]>([]);
  const [pendingDiagnosisTests, setPendingDiagnosisTests] = useState<DiagnosisTestAssignment[]>([]);
  const [activeDiagnosisTestId, setActiveDiagnosisTestId] = useState<string | null>(null);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);

  useEffect(() => {
    loadDiagnosisTests();
  }, [user.id]);

  const loadDiagnosisTests = async () => {
    try {
      const assignments = await diagnosisTestManagementService.getStudentAssignments(user.id);
      const pending = assignments.filter(a => a.status === 'pending' || a.status === 'in_progress');
      setPendingDiagnosisTests(pending);

      // Eğer zorunlu ve beklemede olan test varsa modal göster
      const mandatoryPending = pending.find(a => a.isMandatory && a.status === 'pending');
      if (mandatoryPending) {
        setShowDiagnosisModal(true);
      }
    } catch (error) {
      console.error('Error loading diagnosis tests:', error);
    }
  };

  const handleStartDiagnosisTest = (assignmentId: string) => {
    setActiveDiagnosisTestId(assignmentId);
    setActiveView('takingDiagnosisTest');
    setShowDiagnosisModal(false);
  };
  const [weeklyProgram, setWeeklyProgram] = useState<WeeklyProgram | null>(null);
  const [programId, setProgramId] = useState<string | null>(null);



  const [activeView, setActiveView] = useState<View>('dashboard');
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activePackage, setActivePackage] = useState<ReviewPackage | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' } | null>(null);
  // showDiagnosisModal removed from here

  const [studentData, setStudentData] = useState<Student | null>(null);
  const [dailyMessage, setDailyMessage] = useState<DailyMessage | null>(null);
  const [isMessageLoading, setIsMessageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [latestAiFeedback, setLatestAiFeedback] = useState<AIHomeworkAnalysis | null>(null);

  const [assignedContent, setAssignedContent] = useState<ContentLibraryItem[]>([]);
  const [contentAssignments, setContentAssignments] = useState<ContentAssignment[]>([]);

  const [newItemsPopupNotifications, setNewItemsPopupNotifications] = useState<Notification[] | null>(null);

  const [pdfTests, setPdfTests] = useState<PDFTest[]>([]);
  const [pdfTestSubmissions, setPdfTestSubmissions] = useState<PDFTestSubmission[]>([]);
  const [activePDFTestId, setActivePDFTestId] = useState<string | null>(null);

  const newHomeworkCount = useMemo(() => assignments.filter(a => !a.viewedByStudent).length, [assignments]);
  const newContentCount = useMemo(() => contentAssignments.filter(c => !c.viewed).length, [contentAssignments]);

  const pendingPDFTests = useMemo(() => {
    const submittedIds = new Set(pdfTestSubmissions.map(s => s.pdfTestId));
    return pdfTests.filter(t => !submittedIds.has(t.id));
  }, [pdfTests, pdfTestSubmissions]);

  const completedPDFTests = useMemo(() => {
    return pdfTestSubmissions.filter(s => s.status === 'completed' || s.status === 'time_expired');
  }, [pdfTestSubmissions]);

  const mergedWeeklyProgram = useMemo(() => {
    if (!weeklyProgram) return null;

    // Deep clone the program to avoid mutating state
    const programWithAssignments = {
      ...weeklyProgram,
      days: weeklyProgram.days.map(day => ({
        ...day,
        tasks: [...day.tasks]
      }))
    };

    assignments.forEach(assignment => {
      if (!assignment.dueDate) return;

      const date = new Date(assignment.dueDate);
      const dayName = date.toLocaleDateString('tr-TR', { weekday: 'long' });

      // Find the day in the program (case-insensitive)
      const dayIndex = programWithAssignments.days.findIndex(d => d.day.toLowerCase() === dayName.toLowerCase());

      if (dayIndex !== -1) {
        // Check if this assignment is already added to avoid duplicates
        const existingTask = programWithAssignments.days[dayIndex].tasks.find(t => t.id === `assignment_${assignment.id}`);

        if (!existingTask) {
          const assignmentTask: Task = {
            id: `assignment_${assignment.id}`,
            title: assignment.title,
            description: assignment.description,
            type: 'Ödev',
            subject: assignment.subject,
            status: assignment.submission ? TaskStatus.Completed : TaskStatus.Assigned,
            duration: 30, // Default duration for homework
            metadata: { assignmentId: assignment.id }
          };

          programWithAssignments.days[dayIndex].tasks.push(assignmentTask);
        }
      }
    });

    return programWithAssignments;
  }, [weeklyProgram, assignments]);


  const loadStudentData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch student data
      const studentDoc = await db.collection('students').doc(user.id).get();
      if (studentDoc.exists) {
        const data = studentDoc.data() as any;
        setStudentData({
          ...data,
          badges: data.badges || [],
          isAiAssistantEnabled: data.is_ai_assistant_enabled ?? data.isAiAssistantEnabled ?? true
        });
      }

      // Fetch tests
      const testsSnapshot = await db.collection('tests').where('studentId', '==', user.id).get();
      const studentTests = testsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Test[];

      // Fetch question bank assignments and convert to Test format
      const qbAssignmentsSnapshot = await db.collection('question_bank_assignments').where('student_id', '==', user.id).get();

      const qbTests: Test[] = await Promise.all(qbAssignmentsSnapshot.docs.map(async (doc: any) => {
        const data = doc.data();

        try {
          // Get question bank details
          const qbDoc = await db.collection('question_banks').doc(data.question_bank_id || data.questionBankId).get();

          if (!qbDoc.exists) {
            console.warn('⚠️ Soru bankası bulunamadı (assignment ID:', doc.id, ', qb ID:', data.question_bank_id || data.questionBankId, ')');
            return {
              id: doc.id,
              title: 'Soru Bankası Testi (Yüklenemedi)',
              subject: Subject.Mathematics,
              unit: '',
              questions: [],
              studentId: user.id,
              tutorId: data.teacher_id || data.teacherId,
              completed: data.status === 'Tamamlandı',
              score: data.score || 0,
              duration: data.time_limit_minutes || data.timeLimitMinutes || 60,
              dueDate: data.application_date || data.applicationDate || new Date().toISOString(),
              submissionDate: data.completed_at || data.completedAt,
              isQuestionBankTest: true,
              questionBankAssignmentId: doc.id
            } as Test;
          }

          const qbData = qbDoc.data();

          if (!qbData.questions || !Array.isArray(qbData.questions) || qbData.questions.length === 0) {
            console.warn('⚠️ Soru bankasında soru bulunamadı:', {
              assignmentId: doc.id,
              qbId: qbDoc.id,
              title: qbData.title,
              hasQuestions: !!qbData.questions,
              isArray: Array.isArray(qbData.questions),
              length: qbData.questions?.length
            });
          }

          // Map AI feedback to Test analysis format if it exists
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
              // Create synthetic question evaluations so report charts show correct counts
              questionEvaluations: Array.from({ length: (data.total_questions || data.totalQuestions || 0) }).map((_, i) => ({
                id: `synthetic_${i}`,
                text: `Soru ${i + 1}`,
                type: 'Çoktan Seçmeli', // Default type
                correctAnswer: '',
                studentAnswer: '',
                isCorrect: i < (data.total_correct || data.totalCorrect || 0)
              })) as any[]
            };
          }

          return {
            id: doc.id,
            title: qbData?.title || 'Soru Bankası Testi',
            subject: qbData?.subject || '',
            unit: qbData?.unit || '',
            questions: qbData?.questions || [],
            studentId: user.id,
            tutorId: data.teacher_id || data.teacherId,
            completed: data.status === 'Tamamlandı',
            score: data.score || 0,
            duration: data.time_limit_minutes || data.timeLimitMinutes || 60,
            dueDate: data.application_date || data.applicationDate || new Date().toISOString(),
            submissionDate: data.completed_at || data.completedAt,
            isQuestionBankTest: true,
            questionBankAssignmentId: doc.id,
            analysis: analysis
          } as Test;
        } catch (error) {
          console.error('❌ Soru bankası yüklenirken hata (assignment:', doc.id, '):', error);
          return {
            id: doc.id,
            title: 'Soru Bankası Testi (Hata)',
            subject: Subject.Mathematics,
            unit: '',
            questions: [],
            studentId: user.id,
            tutorId: data.teacher_id || data.teacherId,
            completed: data.status === 'Tamamlandı',
            score: data.score || 0,
            duration: data.time_limit_minutes || data.timeLimitMinutes || 60,
            dueDate: data.application_date || data.applicationDate || new Date().toISOString(),
            submissionDate: data.completed_at || data.completedAt,
            isQuestionBankTest: true,
            questionBankAssignmentId: doc.id
          } as Test;
        }
      }));

      const allTests = [...studentTests, ...qbTests];
      const allPendingTests = allTests.filter(t => !t.completed);
      setPendingTests(allPendingTests);
      setCompletedTests(allTests.filter(t => t.completed).sort((a, b) => new Date(b.submissionDate!).getTime() - new Date(a.submissionDate!).getTime()));

      // Fetch weekly program
      const programSnapshot = await db.collection('weeklyPrograms').where('studentId', '==', user.id).limit(1).get();
      if (!programSnapshot.empty) {
        const doc = programSnapshot.docs[0];
        const program = { id: doc.id, ...doc.data() } as WeeklyProgram;
        setWeeklyProgram(program);
        setProgramId(doc.id);
      } else {
        setWeeklyProgram(null);
        setProgramId(null);
      }

      // Fetch assignments and submissions using direct Supabase queries (avoid dbAdapter conversion issues)
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('student_id', user.id);

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        throw assignmentsError;
      }

      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', user.id);

      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
        throw submissionsError;
      }

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

      const assignmentsList = (assignmentsData || []).map((data: any) => {
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
          htmlContent: data.html_content
        };
        const submission = submissionsMap.get(data.id);
        if (submission) {
          assignment.submission = submission;
        }
        return assignment;
      });
      setAssignments(assignmentsList);

      // Fetch content assignments and then content items (optimized to fetch only needed content)
      const contentAssignmentsSnapshot = await db.collection('contentAssignments').where('studentId', '==', user.id).get();
      const studentContentAssignments = contentAssignmentsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }) as ContentAssignment);
      setContentAssignments(studentContentAssignments);

      if (studentContentAssignments.length > 0) {
        const contentIds = studentContentAssignments.map(ca => ca.contentId);
        if (contentIds.length > 0) {
          const contentPromises = contentIds.map(id => db.collection('contentLibrary').doc(id).get());
          const contentDocs = await Promise.all(contentPromises);
          const studentContentItems = contentDocs
            .filter((doc: any) => doc.exists)
            .map((doc: any) => ({ id: doc.id, ...doc.data() }) as ContentLibraryItem);
          setAssignedContent(studentContentItems);
        }
      } else {
        setAssignedContent([]);
      }

      // Fetch PDF tests and submissions
      const studentPDFTests = await getPDFTestsForStudent(user.id);
      setPdfTests(studentPDFTests);

      const studentPDFSubmissions = await getSubmissionsForStudent(user.id);
      setPdfTestSubmissions(studentPDFSubmissions);

    } catch (error) {
      console.error("Error loading student data:", error);
    }
  }, [user]);

  useEffect(() => {
    const fetchInitialData = async () => {
      await loadStudentData();
      const unreadNotifications = (await getNotificationsForUser(user.id)).filter(n => !n.read);
      if (unreadNotifications.length > 0) {
        setNewItemsPopupNotifications(unreadNotifications);
      }
    };
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]); // Only depend on user.id, not loadStudentData

  useEffect(() => {
    if (!programId) return;

    const unsubscribe = db.collection('weeklyPrograms').doc(programId).onSnapshot((doc: any) => {
      if (doc.exists) {
        const updatedProgram = { id: doc.id, ...doc.data() } as WeeklyProgram;
        setWeeklyProgram(updatedProgram);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [programId]);

  useEffect(() => {
    if (!user.id) return;

    const submissionsChannel = supabase
      .channel('submissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `student_id=eq.${user.id}`
        },
        async (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updatedSubmission = payload.new;
            console.log('Submission updated:', updatedSubmission);
            setAssignments(prev => {
              const updated = prev.map(a => {
                if (a.id === updatedSubmission.assignment_id) {
                  return {
                    ...a,
                    submission: {
                      id: updatedSubmission.id,
                      assignmentId: updatedSubmission.assignment_id,
                      studentId: updatedSubmission.student_id,
                      submissionText: updatedSubmission.submission_text,
                      fileUrl: updatedSubmission.file_url,
                      submittedAt: updatedSubmission.submitted_at,
                      status: updatedSubmission.status,
                      aiScore: updatedSubmission.ai_score ? Number(updatedSubmission.ai_score) : undefined,
                      aiAnalysis: updatedSubmission.ai_analysis,
                      teacherScore: updatedSubmission.teacher_score ? Number(updatedSubmission.teacher_score) : undefined,
                      teacherFeedback: updatedSubmission.teacher_feedback
                    }
                  };
                }
                return a;
              });
              console.log('Updated assignments:', updated);
              return updated;
            });
          }
        }
      )
      .subscribe();

    const assignmentsChannel = supabase
      .channel('assignments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments',
          filter: `student_id=eq.${user.id}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newAssignment = payload.new;
            console.log('New assignment received:', newAssignment);
            const assignmentWithSubmission: Assignment = {
              id: newAssignment.id,
              teacherId: newAssignment.teacher_id,
              studentId: newAssignment.student_id,
              subject: newAssignment.subject,
              title: newAssignment.title,
              description: newAssignment.description,
              dueDate: newAssignment.due_date,
              aiSuggested: newAssignment.ai_suggested || false,
              createdAt: newAssignment.created_at,
              viewedByStudent: newAssignment.viewed_by_student || false,
            };
            setAssignments(prev => [assignmentWithSubmission, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedAssignment = payload.new;
            console.log('Assignment updated:', updatedAssignment);
            setAssignments(prev => prev.map(a => {
              if (a.id === updatedAssignment.id) {
                return {
                  ...a,
                  title: updatedAssignment.title,
                  description: updatedAssignment.description,
                  subject: updatedAssignment.subject,
                  dueDate: updatedAssignment.due_date,
                  viewedByStudent: updatedAssignment.viewed_by_student || false,
                };
              }
              return a;
            }));
          } else if (payload.eventType === 'DELETE') {
            const deletedAssignment = payload.old;
            console.log('Assignment deleted:', deletedAssignment);
            setAssignments(prev => prev.filter(a => a.id !== deletedAssignment.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(submissionsChannel);
      supabase.removeChannel(assignmentsChannel);
    };
  }, [user.id]);

  const messageLoadedRef = React.useRef(false);

  useEffect(() => {
    if (studentData && !messageLoadedRef.current) {
      messageLoadedRef.current = true;
      setIsMessageLoading(true);
      getDailyMotivationMessage(studentData)
        .then(message => setDailyMessage({ message, timestamp: new Date().toISOString() }))
        .finally(() => setIsMessageLoading(false));
    }
  }, [studentData]);

  const handleStartTest = (test: Test) => {
    setActiveTest(test);
    setActiveView('takingTest');
  };

  const handleViewReport = (test: Test) => {
    setActiveTest(test);
    setActiveView('viewReport');
  };

  const handleTaskClick = async (task: Task) => {
    if (task.reviewPackageId) {
      const pkgDoc = await db.collection('reviewPackages').doc(task.reviewPackageId).get();
      if (pkgDoc.exists) {
        setActiveTask(task);
        setActivePackage({ id: pkgDoc.id, ...pkgDoc.data() } as ReviewPackage);
        setActiveView('reviewPackage');
      }
    } else if (task.contentId) {
      const item = assignedContent.find(c => c.id === task.contentId);
      if (item) {
        handleContentViewed(item);
      }
    } else if (task.type === 'Test' && (task.metadata?.questionBankAssignmentId || task.metadata?.question_bank_assignment_id)) {
      setActiveTask(task);
      setActiveView('takingTest');
    } else {
      // Regular task, mark as complete/incomplete
      await handleTaskStatusChange(task);
    }
  };

  const handleTaskStatusChange = async (taskToUpdate: Task) => {
    if (!weeklyProgram || !studentData) return;

    let studentToUpdate = { ...studentData };
    let newLevel = false;

    const newStatus = taskToUpdate.status === TaskStatus.Completed ? TaskStatus.Assigned : TaskStatus.Completed;
    if (newStatus === TaskStatus.Completed) {
      const { updatedStudent, newLevel: levelUp } = awardXpForTask(studentData);
      studentToUpdate = updatedStudent;
      newLevel = levelUp;
    }

    const updatedProgram = {
      ...weeklyProgram,
      days: weeklyProgram.days.map(day => ({
        ...day,
        tasks: day.tasks.map(task => task.id === taskToUpdate.id ? { ...task, status: newStatus } : task)
      }))
    };

    const { updatedStudent: studentWithBadges, newBadges } = checkAndAwardBadges(studentToUpdate, updatedProgram, completedTests);

    try {
      await db.collection('students').doc(user.id).update({
        xp: studentWithBadges.xp,
        level: studentWithBadges.level,
        learningLoopStatus: studentWithBadges.learningLoopStatus
      });

      await db.collection('weeklyPrograms').doc(weeklyProgram.id).update({
        days: updatedProgram.days
      });

      for (const badge of newBadges) {
        await db.collection('badges').add({
          studentId: user.id,
          title: badge.title,
          icon: badge.icon,
          description: badge.description,
          earnedAt: new Date().toISOString()
        });
      }

      setStudentData(studentWithBadges);
      setWeeklyProgram(updatedProgram);

      if (newLevel) {
        setToast({ message: `Tebrikler! Seviye ${calculateLevel(studentWithBadges.xp).level} oldun!`, type: 'success' });
      }
      if (newBadges.length > 0) {
        setToast({ message: `Yeni rozet kazandın: ${newBadges.map(b => b.title).join(', ')}!`, type: 'info' });
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handlePackageComplete = () => {
    if (activeTask) {
      handleTaskStatusChange(activeTask);
    }
    setActiveView('dashboard');
    setActivePackage(null);
    setActiveTask(null);
  };

  const handleOpenAssignment = async (assignment: Assignment) => {
    if (!assignment.viewedByStudent) {
      try {
        await db.collection('assignments').doc(assignment.id).update({ viewedByStudent: true });
        setAssignments(prev => prev.map(a => a.id === assignment.id ? { ...a, viewedByStudent: true } : a));
      } catch (error) {
        console.error("Error marking assignment as viewed:", error);
      }
    }
    setActiveAssignment(assignment);
    setActiveView('submitHomework');
  };

  const handleHomeworkSubmit = async (submission: Submission) => {
    try {
      // Log activity for streak and daily goals
      await logActivity(user.id, 'assignment_submitted', {
        assignmentId: submission.assignmentId,
        submissionId: submission.id
      }, 15); // 15 XP for submitting homework

      console.log('✅ Homework submission activity logged successfully');
    } catch (error) {
      console.error('❌ Error logging homework activity:', error);
    }

    loadStudentData(); // Reload all data
    setActiveView('dashboard');
    setActiveAssignment(null);
  };

  const handleExportReport = () => {
    const content = document.getElementById('weekly-report-content');
    if (content) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`<html><head><title>Haftalık Rapor</title><script src="https://cdn.tailwindcss.com"></script></head><body>${content.innerHTML}</body></html>`);
      printWindow?.document.close();
      printWindow?.print();
    }
  };

  const handleContentViewed = async (item: ContentLibraryItem) => {
    const assignment = contentAssignments.find(a => a.studentId === user.id && a.contentId === item.id);
    if (assignment && !assignment.viewed) {
      try {
        await db.collection('contentAssignments').doc(assignment.id).update({ viewed: true });
        setContentAssignments(prev => prev.map(a => a.id === assignment.id ? { ...a, viewed: true } : a));
      } catch (error) {
        console.error("Error marking content as viewed:", error);
      }
    }
    onNavigateToContent(item.id);
  };

  const handleClosePopup = async () => {
    if (newItemsPopupNotifications) {
      const idsToMarkAsRead = newItemsPopupNotifications.map(n => n.id);
      await markNotificationsAsRead(idsToMarkAsRead);
      setNewItemsPopupNotifications(null);
    }
  };

  const handleTestComplete = async () => {
    try {
      // Log activity for streak and daily goals
      await logActivity(user.id, 'test_completed', {
        testId: activeTest?.id,
        testTitle: activeTest?.title
      }, 20); // 20 XP for completing a test

      console.log('✅ Test activity logged successfully');
    } catch (error) {
      console.error('❌ Error logging test activity:', error);
    }

    loadStudentData();
    setToast({ message: '🎉 Test tamamlandı! Öğrenme Haritası güncellendi.', type: 'success' });
    setTimeout(() => {
      setActiveView('dashboard');
      setActiveTab('map');
    }, 1500);
  };

  const handleStartPDFTest = (test: PDFTest) => {
    setActivePDFTestId(test.id);
    setActiveView('takingPDFTest');
  };

  const handlePDFTestComplete = async () => {
    try {
      // Log activity for streak and daily goals
      await logActivity(user.id, 'test_completed', {
        testId: activePDFTestId,
        testType: 'PDF'
      }, 20); // 20 XP for completing a PDF test

      console.log('✅ PDF Test activity logged successfully');
    } catch (error) {
      console.error('❌ Error logging PDF test activity:', error);
    }

    loadStudentData();
    setToast({ message: '🎉 PDF Test tamamlandı!', type: 'success' });
    setTimeout(() => {
      setActiveView('dashboard');
      setActivePDFTestId(null);
    }, 1500);
  };

  const renderDashboard = () => {
    const hasWeeklyProgram = mergedWeeklyProgram !== null;
    const isLoading = !studentData;

    // Skeleton Loader
    if (isLoading) {
      return (
        <div className="p-4 md:p-8 space-y-8">
          {/* Motivation Card Skeleton */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 animate-pulse">
            <div className="h-6 bg-white/20 rounded w-48 mb-2"></div>
            <div className="h-4 bg-white/20 rounded w-full max-w-md"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Skeleton */}
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

            {/* Sidebar Skeleton */}
            <div className="space-y-4">
              {/* Achievement Card Skeleton */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
                <div className="h-20 bg-gray-100 rounded"></div>
              </div>

              {/* Daily Goals Skeleton */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </div>

              {/* Streak Widget Skeleton */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-24 mb-3"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 md:p-8 space-y-8 animate-fade-in">
        {/* Achievement Notifications */}
        <AchievementNotification studentId={user.id} />

        {studentData && <MotivationCard message={dailyMessage} isLoading={isMessageLoading} />}

        <div className={`grid grid-cols-1 ${hasWeeklyProgram ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
          {/* Main Content - Weekly Program (Focus Area) */}
          {hasWeeklyProgram && (
            <div className="lg:col-span-2 space-y-6">
              <WeeklySchedule
                program={mergedWeeklyProgram}
                onTaskClick={handleTaskClick}
                isInteractive={true}
              />
            </div>
          )}

          {/* Compact Sidebar (Right) - Only show if weekly program exists */}
          {hasWeeklyProgram && studentData && (
            <div className="space-y-4">
              {/* Compact Tedris Başarı */}
              <CompactAchievementCard student={studentData} />

              {/* Compact Daily Goals */}
              <CompactDailyGoalsCard studentId={user.id} />

              {/* Streak Widget */}
              <StreakWidget studentId={user.id} />

              {/* Other widgets */}
              <UpcomingLessonsWidget studentId={user.id} onJoinLesson={handleJoinOnlineLesson} />
              <FlashcardWidget studentId={user.id} onOpenFlashcards={() => setActiveTab('flashcards')} />
              <HomeworkWidget assignments={assignments} onOpenAssignment={handleOpenAssignment} />
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
          )}

          {/* If no weekly program, show full-width widgets */}
          {!hasWeeklyProgram && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-card-background p-8 rounded-2xl shadow-lg text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Haftalık Programın Hazırlanıyor</h3>
                <p className="text-gray-600">Öğretmenin yakında senin için bir haftalık program oluşturacak.</p>
              </div>

              {/* Show widgets in grid when no program */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {studentData && (
                  <>
                    <CompactAchievementCard student={studentData} />
                    <CompactDailyGoalsCard studentId={user.id} />
                  </>
                )}
                <StreakWidget studentId={user.id} />
                <UpcomingLessonsWidget studentId={user.id} onJoinLesson={handleJoinOnlineLesson} />
                <FlashcardWidget studentId={user.id} onOpenFlashcards={() => setActiveTab('flashcards')} />
                <HomeworkWidget assignments={assignments} onOpenAssignment={handleOpenAssignment} />
              </div>

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
          )}
        </div>
      </div>
    );
  };

  const renderHomework = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const groups = {
      overdue: [] as Assignment[],
      today: [] as Assignment[],
      thisWeek: [] as Assignment[],
      upcoming: [] as Assignment[],
      completed: [] as Assignment[]
    };

    assignments.forEach(assignment => {
      // Check if completed (submitted or graded)
      if (assignment.submission && (assignment.submission.status === AssignmentStatus.Submitted || assignment.submission.status === AssignmentStatus.Graded)) {
        groups.completed.push(assignment);
        return;
      }

      const dueDate = new Date(assignment.dueDate);
      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

      if (dueDate < now) {
        groups.overdue.push(assignment);
      } else if (dueDateOnly.getTime() === today.getTime()) {
        groups.today.push(assignment);
      } else if (dueDateOnly > today && dueDateOnly <= nextWeek) {
        groups.thisWeek.push(assignment);
      } else {
        groups.upcoming.push(assignment);
      }
    });

    // Sort groups
    groups.overdue.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    groups.today.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    groups.thisWeek.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    groups.upcoming.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    groups.completed.sort((a, b) => new Date(b.submission!.submittedAt).getTime() - new Date(a.submission!.submittedAt).getTime());

    const hasAnyHomework = Object.values(groups).some(g => g.length > 0);

    if (!hasAnyHomework) {
      return (
        <div className="p-8 flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Harika!</h3>
          <p className="text-gray-500 mt-2">Şu an için yapman gereken bir ödev bulunmuyor.</p>
        </div>
      );
    }

    return (
      <div className="p-4 md:p-8 animate-fade-in space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-800">Ödevlerim</h2>
          <div className="text-sm text-gray-500">
            Toplam: <span className="font-bold text-primary">{assignments.length}</span>
          </div>
        </div>

        {groups.overdue.length > 0 && (
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-2 h-8 bg-red-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-red-600">Gecikmiş Ödevler</h3>
              <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">{groups.overdue.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {groups.overdue.map(assignment => (
                <AssignmentCard key={assignment.id} assignment={assignment} onOpen={handleOpenAssignment} />
              ))}
            </div>
          </section>
        )}

        {groups.today.length > 0 && (
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-2 h-8 bg-amber-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-amber-600">Bugün Son Gün</h3>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-xs font-bold">{groups.today.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {groups.today.map(assignment => (
                <AssignmentCard key={assignment.id} assignment={assignment} onOpen={handleOpenAssignment} />
              ))}
            </div>
          </section>
        )}

        {groups.thisWeek.length > 0 && (
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-blue-600">Bu Hafta</h3>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">{groups.thisWeek.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {groups.thisWeek.map(assignment => (
                <AssignmentCard key={assignment.id} assignment={assignment} onOpen={handleOpenAssignment} />
              ))}
            </div>
          </section>
        )}

        {groups.upcoming.length > 0 && (
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-indigo-600">Gelecek Ödevler</h3>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-xs font-bold">{groups.upcoming.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {groups.upcoming.map(assignment => (
                <AssignmentCard key={assignment.id} assignment={assignment} onOpen={handleOpenAssignment} />
              ))}
            </div>
          </section>
        )}

        {groups.completed.length > 0 && (
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-2 h-8 bg-green-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-green-600">Tamamlananlar</h3>
              <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs font-bold">{groups.completed.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-75 hover:opacity-100 transition-opacity">
              {groups.completed.map(assignment => (
                <AssignmentCard key={assignment.id} assignment={assignment} onOpen={handleOpenAssignment} />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  };

  const [activeOnlineLesson, setActiveOnlineLesson] = useState<{
    roomName: string;
    studentName: string;
  } | null>(null);

  const handleJoinOnlineLesson = (lesson: any) => {
    // Create a unique room name: Tedris-Lesson-[LessonID]
    // Sanitize ID to ensure it's URL safe
    const safeId = lesson.id.replace(/[^a-zA-Z0-9]/g, '');
    const roomName = `Tedris-Ders-${safeId}`;

    setActiveOnlineLesson({
      roomName,
      studentName: user.name || 'Öğrenci'
    });
  };

  const renderLibrary = () => (
    <div className="p-4 md:p-8 animate-fade-in">
      <h2 className="text-3xl font-bold mb-6">Kütüphanem</h2>
      {assignedContent.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {assignedContent.map(item => <ContentCard key={item.id} item={item} onView={handleContentViewed} />)}
        </div>
      ) : <p className="text-text-secondary">Henüz sana atanmış bir materyal yok.</p>}
    </div>
  );

  const renderMap = () => (
    <div className="p-4 md:p-8 animate-fade-in space-y-8">
      <MasteryMapVisualization studentId={user.id} />
      <AdaptivePlanDashboard studentId={user.id} />
      {studentData && <LearningMap student={studentData} />}
      {showDiagnosisModal && studentData && (
        <DiagnosisTestModal
          isOpen={showDiagnosisModal}
          onClose={() => setShowDiagnosisModal(false)}
          studentId={user.id}
          subject="Matematik"
          grade={studentData.grade}
        />
      )}
    </div>
  );

  const tabClass = (tabName: Tab) => `px-4 py-2 font-semibold rounded-t-lg border-b-2 transition-colors relative ${activeTab === tabName ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-secondary/80 hover:border-gray-300'}`;

  const handleDiagnosisTestComplete = () => {
    setActiveView('dashboard');
    loadDiagnosisTests(); // Refresh list
    alert('Test tamamlandı! Sonuçların analiz ediliyor.');
  };

  const handleHomeworkSubmitSuccess = (submission: Submission) => {
    setActiveView('dashboard');
    loadStudentData(); // Reload assignments
    setToast({ message: 'Ödev başarıyla teslim edildi!', type: 'success' });
  };

  const renderContent = () => {
    if (activeView === 'takingTest') {
      // Extract the actual ID string from metadata
      const qbAssignmentId =
        (typeof activeTask?.metadata?.questionBankAssignmentId === 'string'
          ? activeTask.metadata.questionBankAssignmentId
          : (activeTask?.metadata?.questionBankAssignmentId && typeof activeTask.metadata.questionBankAssignmentId === 'object' && 'id' in activeTask.metadata.questionBankAssignmentId)
            ? (activeTask.metadata.questionBankAssignmentId as any).id
            : undefined) ||
        (typeof activeTask?.metadata?.question_bank_assignment_id === 'string'
          ? activeTask.metadata.question_bank_assignment_id
          : (activeTask?.metadata?.question_bank_assignment_id && typeof activeTask.metadata.question_bank_assignment_id === 'object' && 'id' in activeTask.metadata.question_bank_assignment_id)
            ? (activeTask.metadata.question_bank_assignment_id as any).id
            : undefined) ||
        (typeof activeTest?.questionBankAssignmentId === 'string'
          ? activeTest.questionBankAssignmentId
          : (activeTest?.questionBankAssignmentId && typeof activeTest.questionBankAssignmentId === 'object' && 'id' in activeTest.questionBankAssignmentId)
            ? (activeTest.questionBankAssignmentId as any).id
            : undefined);

      if (qbAssignmentId) {
        console.log('🎯 QB Assignment ID:', qbAssignmentId);
        return <QuestionBankTestPage user={user} assignmentId={qbAssignmentId} onBack={() => setActiveView('dashboard')} onComplete={handleTestComplete} />;
      } else if (activeTest) {
        return <TestTakingPage test={activeTest} onComplete={handleTestComplete} />;
      }
    }

    if (activeView === 'takingPDFTest' && activePDFTestId) {
      return <PDFTestTakingPage user={user} testId={activePDFTestId} onBack={() => setActiveView('dashboard')} onComplete={() => { setActiveView('dashboard'); loadStudentData(); }} />;
    }

    if (activeView === 'takingDiagnosisTest' && activeDiagnosisTestId) {
      return (
        <StudentDiagnosisTestPage
          user={user}
          assignmentId={activeDiagnosisTestId}
          onBack={() => setActiveView('dashboard')}
          onComplete={handleDiagnosisTestComplete}
        />
      );
    }

    if (activeView === 'reviewPackage' && activePackage && activeTask) {
      return <ReviewPackagePage reviewPackage={activePackage} task={activeTask} onComplete={handlePackageComplete} />;
    }

    if (activeView === 'aiAssistant' && studentData) {
      return <AIAssistantPage student={studentData} onBack={() => setActiveView('dashboard')} />;
    }

    if (activeView === 'submitHomework' && activeAssignment) {
      return <SubmitHomeworkPage assignment={activeAssignment} onBack={() => setActiveView('dashboard')} onSubmit={handleHomeworkSubmit} />;
    }

    if (activeView === 'viewReport' && activeTest) {
      return <StudentTestReport test={activeTest} allCompletedTests={completedTests} onBack={() => setActiveView('dashboard')} />;
    }

    // Dashboard View
    return (
      <div className="flex flex-col h-screen bg-background">
        <Header user={user} onLogout={onLogout} />

        <div className="sticky top-0 z-10 bg-card-background/95 backdrop-blur-sm border-b border-border shadow-sm">
          <div className="overflow-x-auto scrollbar-hide">
            <nav className="flex space-x-2 p-2 max-w-7xl mx-auto min-w-max" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-primary text-white shadow-md transform scale-105' : 'text-text-secondary hover:bg-gray-100'}`}
              >
                Anasayfa
              </button>
              <button
                onClick={() => setActiveTab('homework')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap relative ${activeTab === 'homework' ? 'bg-primary text-white shadow-md transform scale-105' : 'text-text-secondary hover:bg-gray-100'}`}
              >
                Ödevlerim
                {newHomeworkCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center animate-pulse">
                    {newHomeworkCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap relative ${activeTab === 'library' ? 'bg-primary text-white shadow-md transform scale-105' : 'text-text-secondary hover:bg-gray-100'}`}
              >
                Kütüphane
                {newContentCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center animate-pulse">
                    {newContentCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === 'map' ? 'bg-primary text-white shadow-md transform scale-105' : 'text-text-secondary hover:bg-gray-100'}`}
              >
                Öğrenme Haritası
              </button>
              <button
                onClick={() => setActiveTab('flashcards')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === 'flashcards' ? 'bg-primary text-white shadow-md transform scale-105' : 'text-text-secondary hover:bg-gray-100'}`}
              >
                Aralıklı Tekrar
              </button>
              <button
                onClick={() => setActiveTab('turkish')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === 'turkish' ? 'bg-primary text-white shadow-md transform scale-105' : 'text-text-secondary hover:bg-gray-100'}`}
              >
                📚 Branş Çalışmaları
              </button>
              {weeklyProgram && (
                <button
                  onClick={() => setActiveTab('report')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === 'report' ? 'bg-primary text-white shadow-md transform scale-105' : 'text-text-secondary hover:bg-gray-100'}`}
                >
                  Rapor
                </button>
              )}
            </nav>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-gray-50/50">
          <div className="max-w-7xl mx-auto pb-20 md:pb-8">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'homework' && renderHomework()}
            {activeTab === 'library' && renderLibrary()}
            {activeTab === 'map' && renderMap()}
            {activeTab === 'flashcards' && <div className="p-4 md:p-8"><SpacedRepetitionDashboard studentId={user.id} /></div>}
            {activeTab === 'turkish' && <div className="p-4 md:p-8"><StudentTurkishLearningPage user={user} /></div>}
            {activeTab === 'report' && weeklyProgram && <div className="p-4 md:p-8"><WeeklyReport student={studentData!} weeklyProgram={weeklyProgram} completedTests={completedTests} onExport={handleExportReport} /></div>}
          </div>
        </main>

        {studentData?.isAiAssistantEnabled && (
          <button onClick={() => setActiveView('aiAssistant')} className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-accent p-3 md:p-4 rounded-full shadow-lg hover:scale-110 transition-transform z-20" title="AI Asistan">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 md:w-8 md:h-8 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
          </button>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <button
          onClick={() => setShowDiagnosisModal(true)}
          className="fixed bottom-20 right-6 md:bottom-24 md:right-8 bg-gradient-to-r from-accent to-primary p-3 md:p-4 rounded-full shadow-lg hover:scale-110 transition-transform z-20"
          title="Tanı Testi"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 md:w-8 md:h-8 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <>
      {activeOnlineLesson && (
        <React.Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 text-white">Yükleniyor...</div>}>
          <OnlineLessonRoom
            roomName={activeOnlineLesson.roomName}
            userName={user.name || 'Öğrenci'}
            userEmail={user.email}
            isTeacher={false}
            onClose={() => setActiveOnlineLesson(null)}
          />
        </React.Suspense>
      )}
      {newItemsPopupNotifications && (
        <NewItemPopup notifications={newItemsPopupNotifications} onClose={handleClosePopup} />
      )}

      {renderContent()}

      <AssignedDiagnosisTestsModal
        isOpen={showDiagnosisModal}
        onClose={() => setShowDiagnosisModal(false)}
        assignments={pendingDiagnosisTests}
        onStartTest={handleStartDiagnosisTest}
      />
    </>
  );
};

export default StudentDashboard;