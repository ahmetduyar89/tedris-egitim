import { supabase } from './dbAdapter';
import { CoachingGoal, CoachingMilestone, GoalType, GoalStatus } from '../types';

// ==================== Mapping ====================

function mapGoalFromDB(data: any): CoachingGoal {
  return {
    id: data.id,
    studentId: data.student_id,
    tutorId: data.tutor_id,
    title: data.title,
    description: data.description,
    goalType: data.goal_type,
    category: data.category,
    targetValue: data.target_value,
    currentValue: data.current_value || 0,
    unit: data.unit,
    deadline: data.deadline,
    status: data.status,
    priority: data.priority,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    milestones: data.coaching_milestones?.map(mapMilestoneFromDB),
  };
}

function mapMilestoneFromDB(data: any): CoachingMilestone {
  return {
    id: data.id,
    goalId: data.goal_id,
    title: data.title,
    targetDate: data.target_date,
    completed: data.completed,
    completedAt: data.completed_at,
    notes: data.notes,
  };
}

// ==================== Goal CRUD ====================

export async function getGoalsByStudent(studentId: string, status?: GoalStatus): Promise<CoachingGoal[]> {
  let query = supabase
    .from('coaching_goals')
    .select('*, coaching_milestones(*)')
    .eq('student_id', studentId)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapGoalFromDB);
}

export async function getGoalsByTutor(tutorId: string, status?: GoalStatus): Promise<CoachingGoal[]> {
  let query = supabase
    .from('coaching_goals')
    .select('*, coaching_milestones(*)')
    .eq('tutor_id', tutorId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapGoalFromDB);
}

export async function getGoalById(goalId: string): Promise<CoachingGoal | null> {
  const { data, error } = await supabase
    .from('coaching_goals')
    .select('*, coaching_milestones(*)')
    .eq('id', goalId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  return mapGoalFromDB(data);
}

export async function createGoal(goal: {
  studentId: string;
  tutorId: string;
  title: string;
  description?: string;
  goalType: GoalType;
  category?: string;
  targetValue?: number;
  unit?: string;
  deadline?: string;
  priority?: number;
}): Promise<CoachingGoal> {
  const { data, error } = await supabase
    .from('coaching_goals')
    .insert([{
      student_id: goal.studentId,
      tutor_id: goal.tutorId,
      title: goal.title,
      description: goal.description,
      goal_type: goal.goalType,
      category: goal.category,
      target_value: goal.targetValue,
      unit: goal.unit,
      deadline: goal.deadline,
      priority: goal.priority || 3,
    }])
    .select('*, coaching_milestones(*)')
    .single();

  if (error) throw error;
  return mapGoalFromDB(data);
}

export async function updateGoal(goalId: string, updates: Partial<{
  title: string;
  description: string;
  goalType: GoalType;
  category: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  status: GoalStatus;
  priority: number;
}>): Promise<CoachingGoal> {
  const dbUpdates: any = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.goalType !== undefined) dbUpdates.goal_type = updates.goalType;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.targetValue !== undefined) dbUpdates.target_value = updates.targetValue;
  if (updates.currentValue !== undefined) dbUpdates.current_value = updates.currentValue;
  if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
  if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;

  const { data, error } = await supabase
    .from('coaching_goals')
    .update(dbUpdates)
    .eq('id', goalId)
    .select('*, coaching_milestones(*)')
    .single();

  if (error) throw error;
  return mapGoalFromDB(data);
}

export async function deleteGoal(goalId: string): Promise<void> {
  const { error } = await supabase
    .from('coaching_goals')
    .delete()
    .eq('id', goalId);

  if (error) throw error;
}

// ==================== Milestone CRUD ====================

export async function createMilestone(milestone: {
  goalId: string;
  title: string;
  targetDate?: string;
  notes?: string;
}): Promise<CoachingMilestone> {
  const { data, error } = await supabase
    .from('coaching_milestones')
    .insert([{
      goal_id: milestone.goalId,
      title: milestone.title,
      target_date: milestone.targetDate,
      notes: milestone.notes,
    }])
    .select()
    .single();

  if (error) throw error;
  return mapMilestoneFromDB(data);
}

export async function toggleMilestone(milestoneId: string, completed: boolean): Promise<CoachingMilestone> {
  const { data, error } = await supabase
    .from('coaching_milestones')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', milestoneId)
    .select()
    .single();

  if (error) throw error;
  return mapMilestoneFromDB(data);
}

export async function deleteMilestone(milestoneId: string): Promise<void> {
  const { error } = await supabase
    .from('coaching_milestones')
    .delete()
    .eq('id', milestoneId);

  if (error) throw error;
}

// ==================== Helpers ====================

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  short_term: 'Kısa Vadeli (1-2 Hafta)',
  mid_term: 'Orta Vadeli (1-3 Ay)',
  long_term: 'Uzun Vadeli (6-12 Ay)',
};

export const GOAL_CATEGORY_LABELS: Record<string, string> = {
  academic: 'Akademik',
  behavioral: 'Davranışsal',
  motivational: 'Motivasyonel',
  organizational: 'Organizasyonel',
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  active: 'Aktif',
  completed: 'Tamamlandı',
  paused: 'Duraklatıldı',
  abandoned: 'İptal Edildi',
};

export function getGoalProgress(goal: CoachingGoal): number {
  if (!goal.targetValue || goal.targetValue === 0) return 0;
  return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
}
