import React, { useState, useEffect } from 'react';
import { UserCheck, Target, BookOpen, Flame, Loader2 } from 'lucide-react';
import { CoachingGoal, CoachingProfile } from '../../types';
import { getCoachingProfile, LEARNING_STYLE_LABELS } from '../../services/coachingProfileService';
import { getGoalsByStudent, getGoalProgress, GOAL_TYPE_LABELS, GOAL_STATUS_LABELS } from '../../services/coachingGoalService';
import DailyStudyLogForm from './DailyStudyLogForm';
import HabitTracker from './HabitTracker';
import CoachingSessionHistory from './CoachingSessionHistory';

interface StudentCoachingTabProps {
  studentId: string;
  studentName: string;
}

type SubView = 'overview' | 'study_log' | 'sessions';

const StudentCoachingTab: React.FC<StudentCoachingTabProps> = ({ studentId, studentName }) => {
  const [profile, setProfile] = useState<CoachingProfile | null>(null);
  const [goals, setGoals] = useState<CoachingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [subView, setSubView] = useState<SubView>('overview');

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileData, goalsData] = await Promise.all([
        getCoachingProfile(studentId),
        getGoalsByStudent(studentId, 'active'),
      ]);
      setProfile(profileData);
      setGoals(goalsData);
    } catch (err) {
      console.error('Koçluk verileri yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (subView === 'study_log') {
    return (
      <div className="space-y-4">
        <button onClick={() => setSubView('overview')} className="text-gray-500 hover:text-gray-700">
          &larr; Koçluk Özeti
        </button>
        <DailyStudyLogForm studentId={studentId} />
      </div>
    );
  }

  if (subView === 'sessions') {
    return (
      <div className="space-y-4">
        <button onClick={() => setSubView('overview')} className="text-gray-500 hover:text-gray-700">
          &larr; Koçluk Özeti
        </button>
        <CoachingSessionHistory studentId={studentId} studentName={studentName} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <UserCheck className="w-6 h-6" />
          Koçluk Merkezi
        </h2>
        <p className="text-indigo-100 mt-1">Hedeflerini takip et, alışkanlıklarını geliştir.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile & Goals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Summary */}
          {profile && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Profilim</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {profile.learningStyle && (
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <div className="text-xs text-indigo-600 font-medium">Öğrenme Stili</div>
                    <div className="text-indigo-800 font-semibold">{LEARNING_STYLE_LABELS[profile.learningStyle]}</div>
                  </div>
                )}
                {profile.motivationLevel && (
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="text-xs text-red-600 font-medium">Motivasyon</div>
                    <div className="text-red-800 font-semibold">{profile.motivationLevel}/10</div>
                  </div>
                )}
                {profile.studyHabits?.avgHours && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-xs text-green-600 font-medium">Günlük Çalışma</div>
                    <div className="text-green-800 font-semibold">{profile.studyHabits.avgHours} saat</div>
                  </div>
                )}
              </div>
              {profile.strengths.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {profile.strengths.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">{s}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Active Goals */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-blue-500" />
              Aktif Hedeflerim ({goals.length})
            </h3>
            {goals.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">Henüz aktif hedef yok.</p>
            ) : (
              <div className="space-y-3">
                {goals.map(goal => {
                  const progress = getGoalProgress(goal);
                  return (
                    <div key={goal.id} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800 text-sm">{goal.title}</h4>
                          <span className="text-xs text-gray-400">{GOAL_TYPE_LABELS[goal.goalType]}</span>
                        </div>
                        {goal.targetValue && (
                          <span className="text-sm font-medium text-blue-600">
                            {goal.currentValue}/{goal.targetValue} {goal.unit}
                          </span>
                        )}
                      </div>
                      {goal.targetValue && (
                        <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                          <div
                            className="h-2 bg-blue-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                      {/* Milestones */}
                      {(goal.milestones || []).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {goal.milestones!.map(ms => (
                            <div key={ms.id} className="flex items-center gap-2 text-xs">
                              <span className={ms.completed ? 'text-green-500' : 'text-gray-300'}>
                                {ms.completed ? '✓' : '○'}
                              </span>
                              <span className={ms.completed ? 'line-through text-gray-400' : 'text-gray-600'}>
                                {ms.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSubView('study_log')}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
            >
              <BookOpen className="w-5 h-5 text-emerald-500" />
              <div className="text-left">
                <div className="font-medium text-gray-800 text-sm">Çalışma Logu</div>
                <div className="text-xs text-gray-500">Bugünkü çalışmalarını kaydet</div>
              </div>
            </button>
            <button
              onClick={() => setSubView('sessions')}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
            >
              <Flame className="w-5 h-5 text-purple-500" />
              <div className="text-left">
                <div className="font-medium text-gray-800 text-sm">Seans Notları</div>
                <div className="text-xs text-gray-500">Koçluk görüşme kayıtları</div>
              </div>
            </button>
          </div>
        </div>

        {/* Right Column: Habits */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <HabitTracker studentId={studentId} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCoachingTab;
