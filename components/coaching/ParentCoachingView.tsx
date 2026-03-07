import React, { useState, useEffect } from 'react';
import { UserCheck, Target, BookOpen, Flame, Calendar, Loader2 } from 'lucide-react';
import { CoachingGoal, CoachingProfile, DailyStudyLog } from '../../types';
import { getCoachingProfile, LEARNING_STYLE_LABELS } from '../../services/coachingProfileService';
import { getGoalsByStudent, getGoalProgress, GOAL_TYPE_LABELS } from '../../services/coachingGoalService';
import { getStudyLogs, calculateWeeklyStats } from '../../services/studyLogService';
import { getSessionsByStudent, MOOD_EMOJIS } from '../../services/coachingSessionService';
import { CoachingSession } from '../../types';

interface ParentCoachingViewProps {
  studentId: string;
  studentName: string;
}

const ParentCoachingView: React.FC<ParentCoachingViewProps> = ({ studentId, studentName }) => {
  const [profile, setProfile] = useState<CoachingProfile | null>(null);
  const [goals, setGoals] = useState<CoachingGoal[]>([]);
  const [weeklyLogs, setWeeklyLogs] = useState<DailyStudyLog[]>([]);
  const [recentSessions, setRecentSessions] = useState<CoachingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [profileData, goalsData, logsData, sessionsData] = await Promise.all([
        getCoachingProfile(studentId),
        getGoalsByStudent(studentId, 'active'),
        getStudyLogs(studentId, weekAgo.toISOString().split('T')[0], now.toISOString().split('T')[0]),
        getSessionsByStudent(studentId, 5),
      ]);

      setProfile(profileData);
      setGoals(goalsData);
      setWeeklyLogs(logsData);
      setRecentSessions(sessionsData);
    } catch (err) {
      console.error('Veli koçluk verileri yüklenirken hata:', err);
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

  const weeklyStats = calculateWeeklyStats(weeklyLogs);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <UserCheck className="w-6 h-6" />
          {studentName} - Koçluk Raporu
        </h2>
        <p className="text-indigo-100 mt-1">Çocuğunuzun koçluk sürecindeki gelişimi</p>
      </div>

      {/* Weekly Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">
            {Math.floor(weeklyStats.totalMinutes / 60)}sa {weeklyStats.totalMinutes % 60}dk
          </div>
          <div className="text-sm text-gray-500">Haftalık Çalışma</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{weeklyStats.daysStudied}/7</div>
          <div className="text-sm text-gray-500">Çalışılan Gün</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{goals.length}</div>
          <div className="text-sm text-gray-500">Aktif Hedef</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {weeklyStats.avgMood ? `${weeklyStats.avgMood}/5` : '-'}
          </div>
          <div className="text-sm text-gray-500">Ort. Ruh Hali</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-500" />
            Aktif Hedefler
          </h3>
          {goals.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Henüz hedef belirlenmemiş.</p>
          ) : (
            <div className="space-y-3">
              {goals.map(goal => {
                const progress = getGoalProgress(goal);
                return (
                  <div key={goal.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-800 text-sm">{goal.title}</h4>
                      <span className="text-xs text-gray-400">{GOAL_TYPE_LABELS[goal.goalType]}</span>
                    </div>
                    {goal.targetValue ? (
                      <>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">{goal.description}</p>
                    )}
                    {goal.deadline && (
                      <div className="text-xs text-gray-400 mt-1">
                        Son tarih: {new Date(goal.deadline).toLocaleDateString('tr-TR')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Subject Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-emerald-500" />
            Haftalık Ders Dağılımı
          </h3>
          {Object.keys(weeklyStats.subjectBreakdown).length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Bu hafta çalışma kaydı yok.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(weeklyStats.subjectBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([subject, minutes]) => (
                  <div key={subject}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{subject}</span>
                      <span className="text-gray-500">{Math.floor(minutes / 60)}sa {minutes % 60}dk</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-emerald-500 rounded-full"
                        style={{ width: `${(minutes / weeklyStats.totalMinutes) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:col-span-2">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-500" />
            Son Koçluk Seansları
          </h3>
          {recentSessions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Henüz koçluk seansı yapılmamış.</p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map(session => (
                <div key={session.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-700 font-medium">
                        {new Date(session.sessionDate).toLocaleDateString('tr-TR', {
                          day: 'numeric', month: 'long',
                        })}
                      </span>
                      <span className="text-gray-400">| {session.durationMinutes} dk</span>
                    </div>
                    {session.studentMood && (
                      <span className="text-lg">{MOOD_EMOJIS[session.studentMood - 1]}</span>
                    )}
                  </div>
                  {session.coachNotes && (
                    <p className="text-sm text-gray-600">{session.coachNotes}</p>
                  )}
                  {session.topicsDiscussed.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {session.topicsDiscussed.map((topic, i) => (
                        <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">{topic}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile Summary */}
      {profile && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Öğrenci Profili</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {profile.learningStyle && (
              <div className="bg-indigo-50 rounded-lg p-3">
                <div className="text-xs text-indigo-600">Öğrenme Stili</div>
                <div className="font-semibold text-indigo-800">{LEARNING_STYLE_LABELS[profile.learningStyle]}</div>
              </div>
            )}
            {profile.motivationLevel && (
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-xs text-red-600">Motivasyon</div>
                <div className="font-semibold text-red-800">{profile.motivationLevel}/10</div>
              </div>
            )}
            {profile.strengths.length > 0 && (
              <div className="bg-green-50 rounded-lg p-3 col-span-2">
                <div className="text-xs text-green-600">Güçlü Yönler</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.strengths.map((s, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-green-200 text-green-800 rounded text-xs">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentCoachingView;
