import { supabase } from './supabase';
import { knowledgeGraphService, TedrisPlanTask } from './knowledgeGraphService';

type TriggerReason = 'initial_diagnosis' | 'test_failed' | 'milestone_reached' | 'manual_trigger' | 'scheduled';

interface AdaptivePlanResult {
  success: boolean;
  planCreated: boolean;
  tasksCount: number;
  weakModulesCount: number;
  rootCausesCount: number;
  message: string;
}

export const adaptivePlanService = {
  async generateAdaptivePlan(
    studentId: string,
    triggerReason: TriggerReason,
    planDurationDays: number = 7
  ): Promise<AdaptivePlanResult> {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-adaptive-plan`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId,
            triggerReason,
            planDurationDays,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate adaptive plan');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error generating adaptive plan:', error);
      throw error;
    }
  },

  async getTodayTasks(studentId: string): Promise<TedrisPlanTask[]> {
    const today = new Date().toISOString().split('T')[0];
    return await knowledgeGraphService.getTedrisPlan(studentId, today, today);
  },

  async getUpcomingTasks(studentId: string, days: number = 7): Promise<TedrisPlanTask[]> {
    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    const endDateStr = endDate.toISOString().split('T')[0];

    return await knowledgeGraphService.getTedrisPlan(studentId, today, endDateStr);
  },

  async getPendingTasks(studentId: string): Promise<TedrisPlanTask[]> {
    const allTasks = await knowledgeGraphService.getTedrisPlan(studentId);
    return allTasks.filter(task => task.status === 'pending');
  },

  async startTask(taskId: string): Promise<void> {
    await knowledgeGraphService.updateTaskStatus(taskId, 'in_progress');
  },

  async completeTask(taskId: string, performanceScore?: number, timeSpentMinutes?: number): Promise<void> {
    await knowledgeGraphService.updateTaskStatus(taskId, 'completed', performanceScore, timeSpentMinutes);
  },

  async skipTask(taskId: string): Promise<void> {
    await knowledgeGraphService.updateTaskStatus(taskId, 'skipped');
  },

  async getTasksByDate(studentId: string, date: string): Promise<TedrisPlanTask[]> {
    return await knowledgeGraphService.getTedrisPlan(studentId, date, date);
  },

  async getPlanProgress(studentId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    skippedTasks: number;
    completionRate: number;
  }> {
    const allTasks = await knowledgeGraphService.getTedrisPlan(studentId);

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const pendingTasks = allTasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
    const skippedTasks = allTasks.filter(t => t.status === 'skipped').length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      skippedTasks,
      completionRate,
    };
  },

  async getTaskTypeDistribution(studentId: string): Promise<{
    diagnosis: number;
    learning: number;
    practice: number;
    review: number;
    assessment: number;
  }> {
    const allTasks = await knowledgeGraphService.getTedrisPlan(studentId);

    return {
      diagnosis: allTasks.filter(t => t.taskType === 'diagnosis').length,
      learning: allTasks.filter(t => t.taskType === 'learning').length,
      practice: allTasks.filter(t => t.taskType === 'practice').length,
      review: allTasks.filter(t => t.taskType === 'review').length,
      assessment: allTasks.filter(t => t.taskType === 'assessment').length,
    };
  },

  async shouldRegeneratePlan(studentId: string): Promise<{
    shouldRegenerate: boolean;
    reason?: string;
  }> {
    const pendingTasks = await this.getPendingTasks(studentId);

    if (pendingTasks.length === 0) {
      return {
        shouldRegenerate: true,
        reason: 'Tüm görevler tamamlandı',
      };
    }

    const weakModules = await knowledgeGraphService.getWeakModules(studentId, 0.5);

    if (weakModules.length >= 3) {
      return {
        shouldRegenerate: true,
        reason: '3+ zayıf modül tespit edildi',
      };
    }

    return {
      shouldRegenerate: false,
    };
  },

  async getAdaptivePlanLogs(studentId: string, limit: number = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from('adaptive_plan_logs')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching adaptive plan logs:', error);
      throw error;
    }

    return data || [];
  },

  async getLastPlanGenerationDate(studentId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('adaptive_plan_logs')
      .select('created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching last plan generation date:', error);
      return null;
    }

    return data?.created_at || null;
  },

  getTaskTypeIcon(taskType: string): string {
    const icons: { [key: string]: string } = {
      diagnosis: '🔍',
      learning: '📚',
      practice: '✍️',
      review: '🔄',
      assessment: '📝',
    };
    return icons[taskType] || '📌';
  },

  getTaskTypeLabel(taskType: string): string {
    const labels: { [key: string]: string } = {
      diagnosis: 'Tanı',
      learning: 'Öğrenme',
      practice: 'Pratik',
      review: 'Tekrar',
      assessment: 'Değerlendirme',
    };
    return labels[taskType] || taskType;
  },

  formatPlannedDate(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOnly = date.toISOString().split('T')[0];
    const todayOnly = today.toISOString().split('T')[0];
    const tomorrowOnly = tomorrow.toISOString().split('T')[0];

    if (dateOnly === todayOnly) return 'Bugün';
    if (dateOnly === tomorrowOnly) return 'Yarın';

    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      weekday: 'short'
    });
  },

  async getTasksByWeek(studentId: string): Promise<Map<string, TedrisPlanTask[]>> {
    const allTasks = await knowledgeGraphService.getTedrisPlan(studentId);

    const tasksByWeek = new Map<string, TedrisPlanTask[]>();

    allTasks.forEach(task => {
      const date = new Date(task.plannedDate);
      const weekKey = this.getWeekKey(date);

      if (!tasksByWeek.has(weekKey)) {
        tasksByWeek.set(weekKey, []);
      }

      tasksByWeek.get(weekKey)!.push(task);
    });

    return tasksByWeek;
  },

  getWeekKey(date: Date): string {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    return startOfWeek.toISOString().split('T')[0];
  },

  async clearPendingTasks(studentId: string): Promise<void> {
    const { error } = await supabase
      .from('tedris_plan')
      .delete()
      .eq('student_id', studentId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error clearing pending tasks:', error);
      throw error;
    }
  },
};
