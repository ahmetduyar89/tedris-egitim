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

      // Try calling the Edge Function first
      if (token) {
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

        if (response.ok) {
          const result = await response.json();
          return result;
        }
      }

      console.warn('Edge function unavailable or failed, falling back to client-side generation');
      return await this._generateFallbackPlan(studentId, planDurationDays);

    } catch (error) {
      console.warn('Error calling edge function, using fallback:', error);
      return await this._generateFallbackPlan(studentId, planDurationDays);
    }
  },

  async _generateFallbackPlan(studentId: string, durationDays: number): Promise<AdaptivePlanResult> {
    try {
      // 1. Get student grade
      const { data: studentData } = await supabase
        .from('students')
        .select('grade')
        .eq('id', studentId)
        .single();

      const studentGrade = studentData?.grade || 5; // Default to 5th grade if not found

      // 2. Get recent failed tests (last 30 days) to identify weaknesses
      const { data: failedTests } = await supabase
        .from('tests')
        .select('title, subject, unit, score')
        .eq('student_id', studentId)
        .lt('score', 70)
        .order('created_at', { ascending: false })
        .limit(10);

      const weakTopics = new Set(failedTests?.map(t => t.title) || []);
      const weakUnits = new Set(failedTests?.map(t => t.unit) || []);

      // 3. Get available modules for the student's grade
      const modules = await knowledgeGraphService.getModules(undefined, studentGrade);

      if (modules.length === 0) {
        // Try fallback to all modules if no grade-specific modules found
        const allModules = await knowledgeGraphService.getModules();
        if (allModules.length === 0) {
          throw new Error('No modules available to generate plan');
        }
      }

      // Filter modules to prioritize
      const priorityModules = modules.filter(m =>
        weakTopics.has(m.title) || weakUnits.has(m.unit) || weakTopics.has(m.unit)
      );

      const otherModules = modules.filter(m => !priorityModules.includes(m));

      // 4. Generate tasks
      const tasksToInsert: any[] = [];
      const today = new Date();

      for (let i = 0; i < durationDays; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        // Create 2-3 tasks per day
        const dailyTaskCount = 2 + Math.floor(Math.random() * 2);

        for (let j = 0; j < dailyTaskCount; j++) {
          let selectedModule: any;
          let taskType: 'learning' | 'practice' | 'review' = 'practice';
          let rationale = '';

          // Logic to distribute weak topics first, then standard curriculum
          if (priorityModules.length > 0 && Math.random() < 0.6) {
            // 60% chance to pick a priority module if available
            const idx = Math.floor(Math.random() * priorityModules.length);
            selectedModule = priorityModules[idx];
            taskType = 'learning'; // Weak topics usually need learning/review
            rationale = 'Düşük performans gösterilen sınav konularına dayalı.';
          } else if (otherModules.length > 0) {
            selectedModule = otherModules[Math.floor(Math.random() * otherModules.length)];
            taskType = Math.random() > 0.3 ? 'practice' : 'review';
            rationale = `${studentGrade}. sınıf müfredatına uygun çalışma.`;
          } else {
            // Fallback if lists are weirdly empty
            selectedModule = modules[Math.floor(Math.random() * modules.length)];
            rationale = 'Genel tekrar.';
          }

          if (selectedModule) {
            tasksToInsert.push({
              student_id: studentId,
              module_id: selectedModule.id,
              planned_date: dateStr,
              task_type: taskType,
              priority: j + 1,
              status: 'pending',
              ai_generated: true,
              notes: `AI Planı: ${rationale}`,
              created_at: new Date().toISOString()
            });
          }
        }
      }

      // 3. Insert into Supabase
      if (tasksToInsert.length > 0) {
        const { error } = await supabase
          .from('tedris_plan')
          .insert(tasksToInsert);

        if (error) {
          console.error('Fallback plan insertion error:', error);
          throw error;
        }
      }

      return {
        success: true,
        planCreated: true,
        tasksCount: tasksToInsert.length,
        weakModulesCount: priorityModules.length,
        rootCausesCount: 0,
        message: `Plan başarıyla oluşturuldu (${studentGrade}. Sınıf ve Sınav Analizli)`
      };
    } catch (e: any) {
      console.error('Fallback plan generation failed:', e);
      return {
        success: false,
        planCreated: false,
        tasksCount: 0,
        weakModulesCount: 0,
        rootCausesCount: 0,
        message: 'Plan oluşturulurken hata: ' + e.message
      };
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
