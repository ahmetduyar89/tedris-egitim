import { supabase } from './dbAdapter';
import { DailyStudyLog, StudyLogEntry } from '../types';

// ==================== Mapping ====================

function mapFromDB(data: any): DailyStudyLog {
  return {
    id: data.id,
    studentId: data.student_id,
    logDate: data.log_date,
    entries: data.entries || [],
    totalMinutes: data.total_minutes || 0,
    mood: data.mood,
    energyLevel: data.energy_level,
    reflection: data.reflection,
    tutorComment: data.tutor_comment,
    createdAt: data.created_at,
  };
}

// ==================== CRUD ====================

export async function getStudyLog(studentId: string, date: string): Promise<DailyStudyLog | null> {
  const { data, error } = await supabase
    .from('daily_study_logs')
    .select('*')
    .eq('student_id', studentId)
    .eq('log_date', date)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  return mapFromDB(data);
}

export async function getStudyLogs(studentId: string, startDate: string, endDate: string): Promise<DailyStudyLog[]> {
  const { data, error } = await supabase
    .from('daily_study_logs')
    .select('*')
    .eq('student_id', studentId)
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapFromDB);
}

export async function upsertStudyLog(log: {
  studentId: string;
  logDate: string;
  entries: StudyLogEntry[];
  mood?: number;
  energyLevel?: number;
  reflection?: string;
}): Promise<DailyStudyLog> {
  const totalMinutes = log.entries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);

  const { data, error } = await supabase
    .from('daily_study_logs')
    .upsert([{
      student_id: log.studentId,
      log_date: log.logDate,
      entries: log.entries,
      total_minutes: totalMinutes,
      mood: log.mood,
      energy_level: log.energyLevel,
      reflection: log.reflection,
    }], { onConflict: 'student_id,log_date' })
    .select()
    .single();

  if (error) throw error;
  return mapFromDB(data);
}

export async function addTutorComment(studentId: string, date: string, comment: string): Promise<DailyStudyLog> {
  const { data, error } = await supabase
    .from('daily_study_logs')
    .update({ tutor_comment: comment })
    .eq('student_id', studentId)
    .eq('log_date', date)
    .select()
    .single();

  if (error) throw error;
  return mapFromDB(data);
}

export async function deleteStudyLog(studentId: string, date: string): Promise<void> {
  const { error } = await supabase
    .from('daily_study_logs')
    .delete()
    .eq('student_id', studentId)
    .eq('log_date', date);

  if (error) throw error;
}

// ==================== Statistics ====================

export function calculateWeeklyStats(logs: DailyStudyLog[]): {
  totalMinutes: number;
  avgMinutesPerDay: number;
  daysStudied: number;
  avgMood: number | null;
  avgEnergy: number | null;
  subjectBreakdown: Record<string, number>;
} {
  const daysStudied = logs.filter(l => l.totalMinutes > 0).length;
  const totalMinutes = logs.reduce((sum, l) => sum + l.totalMinutes, 0);
  const moods = logs.filter(l => l.mood).map(l => l.mood!);
  const energies = logs.filter(l => l.energyLevel).map(l => l.energyLevel!);

  const subjectBreakdown: Record<string, number> = {};
  for (const log of logs) {
    for (const entry of log.entries) {
      subjectBreakdown[entry.subject] = (subjectBreakdown[entry.subject] || 0) + entry.durationMinutes;
    }
  }

  return {
    totalMinutes,
    avgMinutesPerDay: daysStudied > 0 ? Math.round(totalMinutes / daysStudied) : 0,
    daysStudied,
    avgMood: moods.length > 0 ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : null,
    avgEnergy: energies.length > 0 ? Math.round((energies.reduce((a, b) => a + b, 0) / energies.length) * 10) / 10 : null,
    subjectBreakdown,
  };
}

export async function getStudyLogsByTutor(tutorId: string, startDate: string, endDate: string): Promise<DailyStudyLog[]> {
  const { data, error } = await supabase
    .from('daily_study_logs')
    .select('*')
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapFromDB);
}
