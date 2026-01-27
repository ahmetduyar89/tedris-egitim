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
import DiagnosticTestPage from './DiagnosticTestPage';
import AdaptiveDashboard from './AdaptiveDashboard';
import * as privateLessonService from '../services/privateLessonService';
import StudentTurkishLearningPage from './StudentTurkishLearningPage';
import Toast from '../components/student-dashboard/Toast';
import TestArea from '../components/student-dashboard/TestArea';
import AdaptivePracticeSolver from '../components/AdaptivePracticeSolver';
import HomeworkWidget from '../components/student-dashboard/HomeworkWidget';
import UpcomingLessonsWidget from '../components/student-dashboard/UpcomingLessonsWidget';
import AssessmentWidget from '../components/student-dashboard/AssessmentWidget';
import DashboardTab from '../components/student-dashboard/DashboardTab';
import HomeworkTab from '../components/student-dashboard/HomeworkTab';
import LibraryTab from '../components/student-dashboard/LibraryTab';
import MapTab from '../components/student-dashboard/MapTab';
import { studentDashboardDataService } from '../services/studentDashboardDataService';
import { pdfExportService } from '../services/pdfExportService';


type View = 'dashboard' | 'takingTest' | 'reviewPackage' | 'aiAssistant' | 'submitHomework' | 'viewReport' | 'takingPDFTest' | 'takingDiagnosisTest' | 'takingAssessment' | 'adaptiveDashboard';
type Tab = 'dashboard' | 'adaptive' | 'report' | 'homework' | 'library' | 'map' | 'flashcards';

const OnlineLessonRoom = React.lazy(() => import('../components/OnlineLessonRoom'));

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
  const [activeOnlineLesson, setActiveOnlineLesson] = useState<any>(null);

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

      // Calculate day index (0=Monday, ..., 6=Sunday) to match weekly program structure
      // getDay(): 0=Sunday, 1=Monday...
      const dayIndex = (date.getDay() + 6) % 7;

      if (programWithAssignments.days[dayIndex]) {
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
      const data = await studentDashboardDataService.loadAllData(user.id);

      setStudentData(data.studentData);
      setPendingTests(data.pendingTests);
      setCompletedTests(data.completedTests);
      setWeeklyProgram(data.weeklyProgram);
      setProgramId(data.programId);
      setAssignments(data.assignments);
      setContentAssignments(data.contentAssignments);
      setAssignedContent(data.assignedContent);
      setPdfTests(data.pdfTests);
      setPdfTestSubmissions(data.pdfTestSubmissions);
    } catch (error) {
      console.error("Error loading student data from service:", error);
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

  const handleJoinOnlineLesson = (lesson: any) => {
    setActiveOnlineLesson(lesson);
  };

  const handleTaskToggle = async (task: Task) => {
    if (task.metadata?.assignmentId) {
      setToast({ message: "Ödevi tamamlamak için lütfen teslim ediniz.", type: "info" });
      const assignment = assignments.find(a => a.id === task.metadata.assignmentId);
      if (assignment) {
        handleOpenAssignment(assignment);
      }
      return;
    }
    await handleTaskStatusChange(task);
  };

  const handleTaskClick = async (task: Task) => {
    if (task.metadata?.assignmentId) {
      const assignment = assignments.find(a => a.id === task.metadata.assignmentId);
      if (assignment) {
        handleOpenAssignment(assignment);
      }
      return;
    }

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
    }
  };

  const handleTaskStatusChange = async (taskToUpdate: Task) => {
    if (!weeklyProgram || !studentData) return;

    console.log('Task status toggling:', taskToUpdate.id, taskToUpdate.title);

    // Optimistic Update Preparation
    let studentToUpdate = { ...studentData };
    let newLevel = false;

    const newStatus = taskToUpdate.status === TaskStatus.Completed ? TaskStatus.Assigned : TaskStatus.Completed;
    console.log('New Status:', newStatus);

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

    // OPTIMISTIC UPDATE: Update UI immediately
    setStudentData(studentWithBadges);
    setWeeklyProgram(updatedProgram);

    // Provide immediate feedback
    if (newLevel) {
      setToast({ message: `Tebrikler! Seviye ${calculateLevel(studentWithBadges.xp).level} oldun!`, type: 'success' });
    }
    if (newBadges.length > 0) {
      setToast({ message: `Yeni rozet kazandın: ${newBadges.map(b => b.title).join(', ')}!`, type: 'info' });
    }

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

      console.log('Task status updated in DB successfully');
    } catch (error) {
      console.error("Error updating task status:", error);
      // Revert in case of error (optional, for now we keep it simple)
      setToast({ message: 'Bir hata oluştu, değişiklikler kaydedilemedi.', type: 'info' });
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
    pdfExportService.exportElementToPDF('weekly-report-content', 'Haftalık Rapor');
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
        return <AdaptivePracticeSolver test={activeTest} onCancel={() => setActiveView('dashboard')} onComplete={handleTestComplete} />;
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
                onClick={() => setActiveTab('adaptive')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === 'adaptive' ? 'bg-primary text-white shadow-md transform scale-105' : 'text-text-secondary hover:bg-gray-100'}`}
              >
                🎯 Çalışma Planım
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

        <div className="flex-1 overflow-y-auto bg-background">
          <div className="max-w-7xl mx-auto pb-20">
            {activeTab === 'dashboard' && (
              <DashboardTab
                user={user}
                studentData={studentData}
                dailyMessage={dailyMessage}
                isMessageLoading={isMessageLoading}
                mergedWeeklyProgram={mergedWeeklyProgram}
                pendingTests={pendingTests}
                completedTests={completedTests}
                handleStartTest={handleStartTest}
                handleViewReport={handleViewReport}
                pendingPDFTests={pendingPDFTests}
                completedPDFTests={completedPDFTests}
                handleStartPDFTest={handleStartPDFTest}
                handleTaskClick={handleTaskClick}
                handleTaskToggle={handleTaskToggle}
                handleJoinOnlineLesson={handleJoinOnlineLesson}
                setActiveTab={setActiveTab}
                assignments={assignments}
                handleOpenAssignment={handleOpenAssignment}
                setActiveView={setActiveView}
                pendingDiagnosisTests={pendingDiagnosisTests}
                handleStartDiagnosisTest={handleStartDiagnosisTest}
              />
            )}

            {activeTab === 'adaptive' && studentData && (
              <div className="p-4 md:p-8 animate-fade-in">
                <AdaptiveDashboard student={studentData} user={user} onStartTest={() => setActiveTab('map')} />
              </div>
            )}

            {activeTab === 'report' && weeklyProgram && (
              <div className="p-4 md:p-8 animate-fade-in">
                <WeeklyReport student={studentData!} weeklyProgram={weeklyProgram} completedTests={completedTests} onExport={handleExportReport} />
              </div>
            )}

            {activeTab === 'homework' && (
              <HomeworkTab
                assignments={assignments}
                onOpenAssignment={handleOpenAssignment}
              />
            )}

            {activeTab === 'library' && (
              <LibraryTab
                assignedContent={assignedContent}
                onContentViewed={handleContentViewed}
              />
            )}

            {activeTab === 'map' && (
              <MapTab
                studentId={user.id}
                studentData={studentData}
                showDiagnosisModal={showDiagnosisModal}
                setShowDiagnosisModal={setShowDiagnosisModal}
              />
            )}

            {activeTab === 'flashcards' && (
              <div className="p-4 md:p-8 animate-fade-in">
                <SpacedRepetitionDashboard studentId={user.id} />
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Button for AI Assistant */}
        {studentData?.isAiAssistantEnabled && activeView === 'dashboard' && (
          <button
            onClick={() => setActiveView('aiAssistant')}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center group z-40"
            title="Yapay Zeka Asistanı"
          >
            <div className="absolute -top-12 right-0 bg-white text-gray-800 text-xs px-3 py-1.5 rounded-lg shadow-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-100">
              Yardıma mı ihtiyacın var?
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

      </div>
    );
  };

  return (
    <>      {activeView === 'takingAssessment' && (
      <DiagnosticTestPage
        user={user}
        onComplete={() => {
          setActiveView('dashboard');
          loadStudentData();
        }}
      />
    )}
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