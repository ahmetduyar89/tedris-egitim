import React, { useState, useEffect } from 'react';
import { MessageSquare, Calendar, Clock, CheckCircle, Circle, Loader2 } from 'lucide-react';
import { CoachingSession } from '../../types';
import { getSessionsByStudent, SESSION_TYPE_LABELS, MOOD_EMOJIS } from '../../services/coachingSessionService';

interface CoachingSessionHistoryProps {
  studentId: string;
  studentName: string;
}

const CoachingSessionHistory: React.FC<CoachingSessionHistoryProps> = ({ studentId, studentName }) => {
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, [studentId]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await getSessionsByStudent(studentId);
      setSessions(data);
    } catch (err) {
      console.error('Seanslar yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p>Henüz koçluk seansı kaydı yok.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-purple-500" />
        Seans Geçmişi - {studentName}
      </h3>

      <div className="space-y-3">
        {sessions.map(session => (
          <div key={session.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {new Date(session.sessionDate).toLocaleDateString('tr-TR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  {session.durationMinutes} dk
                </div>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-xs">
                  {SESSION_TYPE_LABELS[session.sessionType]}
                </span>
              </div>
              {session.studentMood && (
                <span className="text-xl" title="Öğrenci ruh hali">
                  {MOOD_EMOJIS[session.studentMood - 1]}
                </span>
              )}
            </div>

            {/* Topics */}
            {session.topicsDiscussed.length > 0 && (
              <div className="mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase">Konular:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {session.topicsDiscussed.map((topic, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Coach Notes */}
            {session.coachNotes && (
              <div className="mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase">Notlar:</span>
                <p className="text-sm text-gray-700 mt-1">{session.coachNotes}</p>
              </div>
            )}

            {/* Action Items */}
            {session.actionItems.length > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Aksiyon Maddeleri:</span>
                <div className="space-y-1 mt-1">
                  {session.actionItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {item.status === 'done' ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      )}
                      <span className={item.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'}>
                        {item.task}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Session */}
            {session.nextSessionDate && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  Sonraki seans: {new Date(session.nextSessionDate).toLocaleDateString('tr-TR', {
                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoachingSessionHistory;
