import React, { useState, useEffect } from 'react';
import { Users, Target, MessageSquare, BookOpen, RotateCcw, ChevronRight, Loader2, UserCheck } from 'lucide-react';
import { Student, CoachingGoal } from '../../types';
import { supabase } from '../../services/dbAdapter';
import { getGoalsByTutor, GOAL_STATUS_LABELS } from '../../services/coachingGoalService';
import { getSessionsByTutor } from '../../services/coachingSessionService';
import { getCoachingProfilesByTutor } from '../../services/coachingProfileService';
import StudentCoachingProfile from './StudentCoachingProfile';
import CoachingGoalManager from './CoachingGoalManager';
import CoachingSessionForm from './CoachingSessionForm';
import CoachingSessionHistory from './CoachingSessionHistory';
import CoachingHabitManager from './CoachingHabitManager';

interface CoachingDashboardProps {
  tutorId: string;
}

type CoachingView = 'overview' | 'profile' | 'goals' | 'session' | 'session_history' | 'habits';

const CoachingDashboard: React.FC<CoachingDashboardProps> = ({ tutorId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [currentView, setCurrentView] = useState<CoachingView>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProfiles: 0,
    activeGoals: 0,
    totalSessions: 0,
  });

  useEffect(() => {
    loadData();
  }, [tutorId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load students
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('tutor_id', tutorId)
        .order('name');
      setStudents((studentData || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        grade: s.grade,
        tutorId: s.tutor_id,
        contact: s.contact,
        parentName: s.parent_name,
        parentPhone: s.parent_phone,
      })) as Student[]);

      // Load stats
      const [profiles, goals, sessions] = await Promise.all([
        getCoachingProfilesByTutor(tutorId),
        getGoalsByTutor(tutorId, 'active'),
        getSessionsByTutor(tutorId, 10),
      ]);
      setStats({
        totalProfiles: profiles.length,
        activeGoals: goals.length,
        totalSessions: sessions.length,
      });
    } catch (err) {
      console.error('Dashboard yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectStudentAndView = (student: Student, view: CoachingView) => {
    setSelectedStudent(student);
    setCurrentView(view);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="ml-3 text-gray-500">Koçluk paneli yükleniyor...</span>
      </div>
    );
  }

  // If a student is selected, show specific view
  if (selectedStudent && currentView !== 'overview') {
    return (
      <div className="space-y-4">
        {/* Back button */}
        <button
          onClick={() => { setSelectedStudent(null); setCurrentView('overview'); }}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          &larr; Koçluk Paneline Dön
        </button>

        {currentView === 'profile' && (
          <StudentCoachingProfile
            studentId={selectedStudent.id}
            tutorId={tutorId}
            studentName={selectedStudent.name}
          />
        )}
        {currentView === 'goals' && (
          <CoachingGoalManager
            studentId={selectedStudent.id}
            tutorId={tutorId}
            studentName={selectedStudent.name}
          />
        )}
        {currentView === 'session' && (
          <div className="space-y-6">
            <CoachingSessionForm
              studentId={selectedStudent.id}
              tutorId={tutorId}
              studentName={selectedStudent.name}
              onSaved={() => { setCurrentView('session_history'); }}
              onCancel={() => setCurrentView('session_history')}
            />
            <CoachingSessionHistory studentId={selectedStudent.id} studentName={selectedStudent.name} />
          </div>
        )}
        {currentView === 'session_history' && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentView('session')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              <MessageSquare className="w-4 h-4" /> Yeni Seans Ekle
            </button>
            <CoachingSessionHistory studentId={selectedStudent.id} studentName={selectedStudent.name} />
          </div>
        )}
        {currentView === 'habits' && (
          <CoachingHabitManager
            studentId={selectedStudent.id}
            tutorId={tutorId}
            studentName={selectedStudent.name}
          />
        )}
      </div>
    );
  }

  // Overview
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <UserCheck className="w-7 h-7 text-indigo-500" />
          Koçluk Paneli
        </h1>
        <p className="text-gray-500 mt-1">Öğrencilerinizin koçluk süreçlerini yönetin.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{stats.totalProfiles}</div>
              <div className="text-sm text-gray-500">Koçluk Profili</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{stats.activeGoals}</div>
              <div className="text-sm text-gray-500">Aktif Hedef</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{stats.totalSessions}</div>
              <div className="text-sm text-gray-500">Koçluk Seansı</div>
            </div>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Öğrenciler</h2>
          <p className="text-sm text-gray-500">Koçluk işlemleri için bir öğrenci seçin</p>
        </div>
        <div className="divide-y divide-gray-100">
          {students.map(student => (
            <div key={student.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">{student.name}</h3>
                  <p className="text-sm text-gray-500">{student.grade}. Sınıf</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => selectStudentAndView(student, 'profile')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
                  >
                    <Users className="w-3.5 h-3.5" /> Profil
                  </button>
                  <button
                    onClick={() => selectStudentAndView(student, 'goals')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                  >
                    <Target className="w-3.5 h-3.5" /> Hedefler
                  </button>
                  <button
                    onClick={() => selectStudentAndView(student, 'session_history')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Seanslar
                  </button>
                  <button
                    onClick={() => selectStudentAndView(student, 'habits')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Alışkanlıklar
                  </button>
                </div>
              </div>
            </div>
          ))}
          {students.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              Henüz öğrenci eklenmemiş.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachingDashboard;
