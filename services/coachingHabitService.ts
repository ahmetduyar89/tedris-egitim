import { supabase } from './dbAdapter';
import { CoachingHabit, CoachingHabitLog, HabitFrequency } from '../types';

// ==================== Mapping ====================

function mapHabitFromDB(data: any): CoachingHabit {
  return {
    id: data.id,
    studentId: data.student_id,
    tutorId: data.tutor_id,
    habitName: data.habit_name,
    description: data.description,
    frequency: data.frequency,
    targetCount: data.target_count,
    isActive: data.is_active,
    createdAt: data.created_at,
  };
}

function mapLogFromDB(data: any): CoachingHabitLog {
  return {
    id: data.id,
    habitId: data.habit_id,
    logDate: data.log_date,
    completed: data.completed,
    count: data.count,
    notes: data.notes,
  };
}

// ==================== Habit CRUD ====================

export async function getHabitsByStudent(studentId: string, activeOnly = true): Promise<CoachingHabit[]> {
  let query = supabase
    .from('coaching_habits')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapHabitFromDB);
}

export async function getHabitsByTutor(tutorId: string): Promise<CoachingHabit[]> {
  const { data, error } = await supabase
    .from('coaching_habits')
    .select('*')
    .eq('tutor_id', tutorId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapHabitFromDB);
}

export async function createHabit(habit: {
  studentId: string;
  tutorId: string;
  habitName: string;
  description?: string;
  frequency?: HabitFrequency;
  targetCount?: number;
}): Promise<CoachingHabit> {
  const { data, error } = await supabase
    .from('coaching_habits')
    .insert([{
      student_id: habit.studentId,
      tutor_id: habit.tutorId,
      habit_name: habit.habitName,
      description: habit.description,
      frequency: habit.frequency || 'daily',
      target_count: habit.targetCount || 1,
    }])
    .select()
    .single();

  if (error) throw error;
  return mapHabitFromDB(data);
}

export async function updateHabit(habitId: string, updates: Partial<{
  habitName: string;
  description: string;
  frequency: HabitFrequency;
  targetCount: number;
  isActive: boolean;
}>): Promise<CoachingHabit> {
  const dbUpdates: any = {};
  if (updates.habitName !== undefined) dbUpdates.habit_name = updates.habitName;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
  if (updates.targetCount !== undefined) dbUpdates.target_count = updates.targetCount;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

  const { data, error } = await supabase
    .from('coaching_habits')
    .update(dbUpdates)
    .eq('id', habitId)
    .select()
    .single();

  if (error) throw error;
  return mapHabitFromDB(data);
}

export async function deleteHabit(habitId: string): Promise<void> {
  const { error } = await supabase
    .from('coaching_habits')
    .delete()
    .eq('id', habitId);

  if (error) throw error;
}

// ==================== Habit Log CRUD ====================

export async function getHabitLogs(habitId: string, startDate: string, endDate: string): Promise<CoachingHabitLog[]> {
  const { data, error } = await supabase
    .from('coaching_habit_logs')
    .select('*')
    .eq('habit_id', habitId)
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapLogFromDB);
}

export async function getHabitLogsForDate(studentId: string, date: string): Promise<(CoachingHabitLog & { habit: CoachingHabit })[]> {
  const habits = await getHabitsByStudent(studentId);
  if (habits.length === 0) return [];

  const habitIds = habits.map(h => h.id);
  const { data, error } = await supabase
    .from('coaching_habit_logs')
    .select('*')
    .in('habit_id', habitIds)
    .eq('log_date', date);

  if (error) throw error;

  const logsMap = new Map((data || []).map(l => [l.habit_id, mapLogFromDB(l)]));

  return habits.map(habit => {
    const log = logsMap.get(habit.id);
    return {
      id: log?.id || '',
      habitId: habit.id,
      logDate: date,
      completed: log?.completed || false,
      count: log?.count || 0,
      notes: log?.notes,
      habit,
    };
  });
}

export async function toggleHabitLog(habitId: string, date: string, completed: boolean, notes?: string): Promise<CoachingHabitLog> {
  const { data, error } = await supabase
    .from('coaching_habit_logs')
    .upsert([{
      habit_id: habitId,
      log_date: date,
      completed,
      count: completed ? 1 : 0,
      notes,
    }], { onConflict: 'habit_id,log_date' })
    .select()
    .single();

  if (error) throw error;
  return mapLogFromDB(data);
}

// ==================== Streak & Stats ====================

export async function getHabitStreak(habitId: string): Promise<number> {
  const { data, error } = await supabase
    .from('coaching_habit_logs')
    .select('log_date, completed')
    .eq('habit_id', habitId)
    .eq('completed', true)
    .order('log_date', { ascending: false })
    .limit(365);

  if (error) throw error;
  if (!data || data.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    const found = data.find(d => d.log_date === dateStr);
    if (found) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}

export function calculateCompletionRate(logs: CoachingHabitLog[], totalDays: number): number {
  if (totalDays === 0) return 0;
  const completedDays = logs.filter(l => l.completed).length;
  return Math.round((completedDays / totalDays) * 100);
}
