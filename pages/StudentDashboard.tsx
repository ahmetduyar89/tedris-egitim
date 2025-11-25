import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Test, WeeklyProgram, Task, TaskStatus, ReviewPackage, Student, DailyMessage, Assignment, AssignmentStatus, Submission, AIHomeworkAnalysis, ContentLibraryItem, ContentAssignment, ContentType, Notification, Subject } from '../types';
import Header from '../components/Header';
import WeeklySchedule from '../components/WeeklySchedule';
import TestTakingPage from './TestTakingPage';
import ReviewPackagePage from './ReviewPackagePage';
import StudentTestReport from '../components/StudentTestReport';
import QuestionBankTestPage from './QuestionBankTestPage';
import ProfileCard from '../components/ProfileCard';
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
import { getNotificationsForUser, markNotificationsAsRead } from '../services/notificationService';
import { db, supabase } from '../services/dbAdapter';
import MasteryMapVisualization from '../components/MasteryMapVisualization';
import AdaptivePlanDashboard from '../components/AdaptivePlanDashboard';
import DiagnosisTestModal from '../components/DiagnosisTestModal';
import PDFTestTakingPage from './PDFTestTakingPage';
import { getPDFTestsForStudent, getSubmissionsForStudent, PDFTest, PDFTestSubmission } from '../services/pdfTestService';


type View = 'dashboard' | 'takingTest' | 'reviewPackage' | 'aiAssistant' | 'submitHomework' | 'viewReport' | 'takingPDFTest';
type Tab = 'dashboard' | 'report' | 'homework' | 'library' | 'map' | 'flashcards';

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
    <div className="bg-card-background p-6 rounded-2xl shadow-lg border-l-4 border-secondary">
      <h2 className="text-2xl font-bold font-poppins text-secondary mb-4">Tedris Test</h2>

      <div className="space-y-6">
        {hasPendingTests && (
          <div>
            <h3 className="font-semibold text-lg mb-3 text-text-secondary">Atanan Testler</h3>
            <ul className="space-y-3">
              {pendingTests.map(test => (
                <li key={test.id} className="border border-border p-4 rounded-xl bg-background hover:shadow-md transition-shadow">
                  <h4 className="font-semibold text-text-primary">{test.title}</h4>
                  <p className="text-sm text-text-secondary">{test.questions.length} Soru &middot; {test.duration} dakika</p>
                  <button
                    onClick={() => onStartTest(test)}
                    className="mt-3 w-full bg-secondary text-white py-2 rounded-xl hover:bg-red-600 transition-colors font-semibold shadow-secondary"
                  >
                    Teste Başla
                  </button>
                </li>
              ))}
              {pendingPDFTests.map(test => (
                <li key={test.id} className="border-2 border-blue-300 p-4 rounded-xl bg-blue-50 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <span className="text-xs font-bold text-blue-600 bg-blue-200 px-2 py-0.5 rounded-full">PDF TEST</span>
                  </div>
                  <h4 className="font-semibold text-text-primary">{test.title}</h4>
                  <p className="text-sm text-text-secondary">{test.totalQuestions} Soru &middot; {test.durationMinutes} dakika</p>
                  <button
                    onClick={() => onStartPDFTest(test)}
                    className="mt-3 w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-2 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-colors font-semibold shadow-lg"
                  >
                    PDF Teste Başla
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasCompletedTests && (
          <div>
            <h3 className="font-semibold text-lg mb-3 text-text-secondary">Tamamlanan Testler</h3>
            <ul className="space-y-3">
              {completedTests.map(test => (
                <li key={test.id} className="border border-border p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => test.analysis && onViewReport(test)}>
                  <h4 className="font-semibold text-gray-700">{test.title}</h4>
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="font-bold text-primary">Puan: {test.score ?? 0}%</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${test.analysis ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {test.analysis ? 'Raporu Görüntüle' : 'Rapor Bekleniyor'}
                    </span>
                  </div>
                </li>
              ))}
              {completedPDFTests.map(submission => (
                <li key={submission.id} className="border-2 border-blue-200 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <span className="text-xs font-bold text-blue-600">PDF TEST</span>
                  </div>
                  <h4 className="font-semibold text-gray-700">{submission.pdfTest?.title || 'PDF Testi'}</h4>
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="font-bold text-blue-600">Puan: {submission.scorePercentage?.toFixed(1)}%</span>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      Tamamlandı
                    </span>
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
    <div className="bg-card-background p-6 rounded-2xl shadow-lg border-l-4 border-accent">
      <h2 className="text-xl font-bold font-poppins text-accent mb-4">Tedris Ödev</h2>
      <div className="space-y-3">
        {displayAssignments.map(assignment => {
          const isNew = !assignment.viewedByStudent;

          return (
            <div
              key={assignment.id}
              onClick={() => onOpenAssignment(assignment)}
              className="border border-border p-4 rounded-xl bg-background hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                      {assignment.title}
                    </h4>
                    {isNew && (
                      <span className="bg-accent text-white text-xs px-2 py-0.5 rounded-full font-semibold animate-pulse">
                        YENİ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary">
                    {assignment.subject} · Son: {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 text-gray-400 group-hover:text-accent group-hover:translate-x-1 transition-all"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
      {unviewedOrIncomplete.length > 3 && (
        <p className="text-xs text-text-secondary text-center mt-3">
          +{unviewedOrIncomplete.length - 3} ödev daha
        </p>
      )}
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
  const [weeklyProgram, setWeeklyProgram] = useState<WeeklyProgram | null>(null);
  const [programId, setProgramId] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<View>('dashboard');
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activePackage, setActivePackage] = useState<ReviewPackage | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' } | null>(null);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);

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


  const loadStudentData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch student data
      const studentDoc = await db.collection('students').doc(user.id).get();
      if (studentDoc.exists) {
        const data = studentDoc.data() as Student;
        setStudentData({ ...data, badges: data.badges || [] });
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
            questionBankAssignmentId: doc.id
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
  }, [user.id, loadStudentData]);

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

  useEffect(() => {
    if (studentData) {
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

  const handleHomeworkSubmit = (submission: Submission) => {
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

  const handleTestComplete = () => {
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

  const handlePDFTestComplete = () => {
    loadStudentData();
    setToast({ message: '🎉 PDF Test tamamlandı!', type: 'success' });
    setTimeout(() => {
      setActiveView('dashboard');
      setActivePDFTestId(null);
    }, 1500);
  };

  if (activeView === 'takingPDFTest' && activePDFTestId) {
    return <PDFTestTakingPage user={user} testId={activePDFTestId} onBack={() => { setActiveView('dashboard'); setActivePDFTestId(null); }} onComplete={handlePDFTestComplete} />;
  }

  if (activeView === 'takingTest') {
    const qbAssignmentId = activeTask?.metadata?.questionBankAssignmentId ||
      activeTask?.metadata?.question_bank_assignment_id ||
      activeTest?.questionBankAssignmentId;

    if (qbAssignmentId) {
      return <QuestionBankTestPage user={user} assignmentId={qbAssignmentId} onBack={() => setActiveView('dashboard')} onComplete={handleTestComplete} />;
    } else if (activeTest) {
      return <TestTakingPage test={activeTest} onComplete={handleTestComplete} />;
    }
  }
  if (activeView === 'viewReport' && activeTest) {
    return <StudentTestReport test={activeTest} allCompletedTests={completedTests} onBack={() => setActiveView('dashboard')} />;
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

  const renderDashboard = () => {
    return (
      <div className="p-4 md:p-8 space-y-8 animate-fade-in">
        {studentData && <MotivationCard message={dailyMessage} isLoading={isMessageLoading} />}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {weeklyProgram ? <WeeklySchedule program={weeklyProgram} onTaskClick={handleTaskClick} isInteractive={true} /> : <div className="bg-card-background p-6 rounded-2xl shadow-lg h-full flex items-center justify-center"><p>Henüz bir haftalık programın yok.</p></div>}
          </div>
          <div className="space-y-8">
            {studentData && <ProfileCard student={studentData} />}
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
        </div>
      </div>
    );
  };

  const renderHomework = () => (
    <div className="p-4 md:p-8 animate-fade-in">
      <h2 className="text-3xl font-bold mb-6">Ödevlerim</h2>
      {assignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {assignments.map(assignment => <AssignmentCard key={assignment.id} assignment={assignment} onOpen={handleOpenAssignment} />)}
        </div>
      ) : <p className="text-text-secondary">Henüz ödevin yok.</p>}
    </div>
  );

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

  return (
    <>
      {newItemsPopupNotifications && (
        <NewItemPopup notifications={newItemsPopupNotifications} onClose={handleClosePopup} />
      )}
      <div className="flex flex-col h-screen bg-background">
        <Header user={user} onLogout={onLogout} />

        <div className="border-b border-border bg-card-background">
          <div className="overflow-x-auto whitespace-nowrap">
            <nav className="-mb-px flex space-x-4 max-w-7xl mx-auto px-4 sm:px-8" aria-label="Tabs">
              <button onClick={() => setActiveTab('dashboard')} className={tabClass('dashboard')}>Anasayfa</button>
              <button onClick={() => setActiveTab('homework')} className={tabClass('homework')}>
                Ödevlerim {newHomeworkCount > 0 && <span className="absolute -top-1 -right-2 w-5 h-5 bg-secondary text-white text-xs rounded-full flex items-center justify-center">{newHomeworkCount}</span>}
              </button>
              <button onClick={() => setActiveTab('library')} className={tabClass('library')}>
                Kütüphane {newContentCount > 0 && <span className="absolute -top-1 -right-2 w-5 h-5 bg-secondary text-white text-xs rounded-full flex items-center justify-center">{newContentCount}</span>}
              </button>
              <button onClick={() => setActiveTab('map')} className={tabClass('map')}>Öğrenme Haritası</button>
              <button onClick={() => setActiveTab('flashcards')} className={tabClass('flashcards')}>Aralıklı Tekrar</button>
              {weeklyProgram && <button onClick={() => setActiveTab('report')} className={tabClass('report')}>Rapor</button>}
            </nav>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'homework' && renderHomework()}
            {activeTab === 'library' && renderLibrary()}
            {activeTab === 'map' && renderMap()}
            {activeTab === 'flashcards' && <div className="p-4 md:p-8"><SpacedRepetitionDashboard studentId={user.id} /></div>}
            {activeTab === 'report' && weeklyProgram && <div className="p-4 md:p-8"><WeeklyReport student={studentData!} weeklyProgram={weeklyProgram} completedTests={completedTests} onExport={handleExportReport} /></div>}
          </div>
        </main>

        <button onClick={() => setActiveView('aiAssistant')} className="fixed bottom-8 right-8 bg-accent p-4 rounded-full shadow-lg hover:scale-110 transition-transform z-20" title="AI Asistan">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
        </button>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <button
          onClick={() => setShowDiagnosisModal(true)}
          className="fixed bottom-24 right-8 bg-gradient-to-r from-accent to-primary p-4 rounded-full shadow-lg hover:scale-110 transition-transform z-20"
          title="Tanı Testi"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
        </button>
      </div>
    </>
  );
};

export default StudentDashboard;