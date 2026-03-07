import { supabase } from './dbAdapter';
import { CoachingSession, CoachingActionItem, SessionType } from '../types';

// ==================== Mapping ====================

function mapFromDB(data: any): CoachingSession {
  return {
    id: data.id,
    studentId: data.student_id,
    tutorId: data.tutor_id,
    sessionDate: data.session_date,
    durationMinutes: data.duration_minutes,
    sessionType: data.session_type,
    topicsDiscussed: data.topics_discussed || [],
    actionItems: data.action_items || [],
    studentMood: data.student_mood,
    coachNotes: data.coach_notes,
    studentFeedback: data.student_feedback,
    nextSessionDate: data.next_session_date,
    createdAt: data.created_at,
    studentName: data.students?.name,
  };
}

// ==================== CRUD ====================

export async function getSessionsByStudent(studentId: string, limit = 20): Promise<CoachingSession[]> {
  const { data, error } = await supabase
    .from('coaching_sessions')
    .select('*')
    .eq('student_id', studentId)
    .order('session_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map(mapFromDB);
}

export async function getSessionsByTutor(tutorId: string, limit = 50): Promise<CoachingSession[]> {
  const { data, error } = await supabase
    .from('coaching_sessions')
    .select('*, students(name)')
    .eq('tutor_id', tutorId)
    .order('session_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map(mapFromDB);
}

export async function getSessionById(sessionId: string): Promise<CoachingSession | null> {
  const { data, error } = await supabase
    .from('coaching_sessions')
    .select('*, students(name)')
    .eq('id', sessionId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  return mapFromDB(data);
}

export async function createSession(session: {
  studentId: string;
  tutorId: string;
  sessionDate: string;
  durationMinutes?: number;
  sessionType?: SessionType;
  topicsDiscussed?: string[];
  actionItems?: CoachingActionItem[];
  studentMood?: number;
  coachNotes?: string;
  studentFeedback?: string;
  nextSessionDate?: string;
}): Promise<CoachingSession> {
  const { data, error } = await supabase
    .from('coaching_sessions')
    .insert([{
      student_id: session.studentId,
      tutor_id: session.tutorId,
      session_date: session.sessionDate,
      duration_minutes: session.durationMinutes,
      session_type: session.sessionType || 'regular',
      topics_discussed: session.topicsDiscussed || [],
      action_items: session.actionItems || [],
      student_mood: session.studentMood,
      coach_notes: session.coachNotes,
      student_feedback: session.studentFeedback,
      next_session_date: session.nextSessionDate,
    }])
    .select()
    .single();

  if (error) throw error;
  return mapFromDB(data);
}

export async function updateSession(sessionId: string, updates: Partial<{
  sessionDate: string;
  durationMinutes: number;
  sessionType: SessionType;
  topicsDiscussed: string[];
  actionItems: CoachingActionItem[];
  studentMood: number;
  coachNotes: string;
  studentFeedback: string;
  nextSessionDate: string;
}>): Promise<CoachingSession> {
  const dbUpdates: any = {};
  if (updates.sessionDate !== undefined) dbUpdates.session_date = updates.sessionDate;
  if (updates.durationMinutes !== undefined) dbUpdates.duration_minutes = updates.durationMinutes;
  if (updates.sessionType !== undefined) dbUpdates.session_type = updates.sessionType;
  if (updates.topicsDiscussed !== undefined) dbUpdates.topics_discussed = updates.topicsDiscussed;
  if (updates.actionItems !== undefined) dbUpdates.action_items = updates.actionItems;
  if (updates.studentMood !== undefined) dbUpdates.student_mood = updates.studentMood;
  if (updates.coachNotes !== undefined) dbUpdates.coach_notes = updates.coachNotes;
  if (updates.studentFeedback !== undefined) dbUpdates.student_feedback = updates.studentFeedback;
  if (updates.nextSessionDate !== undefined) dbUpdates.next_session_date = updates.nextSessionDate;

  const { data, error } = await supabase
    .from('coaching_sessions')
    .update(dbUpdates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return mapFromDB(data);
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('coaching_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
}

// ==================== Helpers ====================

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  regular: 'Düzenli Görüşme',
  emergency: 'Acil Görüşme',
  review: 'Gözden Geçirme',
  goal_setting: 'Hedef Belirleme',
};

export const MOOD_EMOJIS = ['😞', '😕', '😐', '🙂', '😊'];

export function getUpcomingSessions(sessions: CoachingSession[]): CoachingSession[] {
  const now = new Date();
  return sessions.filter(s => new Date(s.sessionDate) >= now)
    .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());
}

export function getPendingActionItems(sessions: CoachingSession[]): (CoachingActionItem & { sessionId: string; studentId: string })[] {
  const items: (CoachingActionItem & { sessionId: string; studentId: string })[] = [];
  for (const session of sessions) {
    for (const item of session.actionItems) {
      if (item.status === 'pending') {
        items.push({ ...item, sessionId: session.id, studentId: session.studentId });
      }
    }
  }
  return items;
}
