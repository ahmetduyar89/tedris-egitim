import { supabase } from './supabase';

export interface KGModule {
  id: string;
  code: string;
  title: string;
  subject: string;
  grade: number;
  unit: string;
  difficultyLevel: number;
  description: string;
  estimatedDurationMinutes: number;
}

export interface KGPrerequisite {
  id: string;
  moduleId: string;
  prerequisiteModuleId: string;
  relationshipType: 'CRITICAL' | 'RECOMMENDED';
  strength: number;
  module?: KGModule;
  prerequisiteModule?: KGModule;
}

export interface StudentMastery {
  id: string;
  studentId: string;
  moduleId: string;
  masteryScore: number;
  confidenceLevel: number;
  attemptsCount: number;
  lastPracticedAt?: string;
  firstPracticedAt?: string;
  streakDays: number;
  module?: KGModule;
}

export interface TedrisPlanTask {
  id: string;
  studentId: string;
  moduleId: string;
  contentId?: string;
  plannedDate: string;
  priority: number;
  taskType: 'diagnosis' | 'learning' | 'practice' | 'review' | 'assessment';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: string;
  performanceScore?: number;
  timeSpentMinutes: number;
  aiGenerated: boolean;
  notes: string;
  module?: KGModule;
  content?: any;
}

export interface MasteryHistory {
  id: string;
  studentId: string;
  moduleId: string;
  masteryScore: number;
  changeReason: 'test_completed' | 'practice_completed' | 'manual_adjustment' | 'diagnosis';
  previousScore?: number;
  testId?: string;
  recordedAt: string;
  module?: KGModule;
}

export const knowledgeGraphService = {
  async getModules(subject?: string, grade?: number): Promise<KGModule[]> {
    try {
      console.log(`[KnowledgeGraph] Fetching modules - subject: ${subject}, grade: ${grade}`);

      let query = supabase
        .from('kg_modules')
        .select('*')
        .order('difficulty_level', { ascending: true });

      if (subject) {
        query = query.eq('subject', subject);
      }

      if (grade) {
        query = query.eq('grade', grade);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[KnowledgeGraph] Database error fetching modules:', error);
        throw new Error(
          `Veritabanına erişirken hata oluştu. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin. ` +
          `Hata: ${error.message}`
        );
      }

      if (!data || data.length === 0) {
        console.warn('[KnowledgeGraph] No data returned from query, returning MOCK data for development');
        // Mock data generator
        const mockModules: KGModule[] = [];
        const subjects = subject ? [subject] : ['Matematik', 'Fen Bilimleri', 'Türkçe'];
        const grades = grade ? [grade] : [5, 6, 7, 8];

        subjects.forEach(subj => {
          grades.forEach(grd => {
            const units = ['Ünite 1', 'Ünite 2', 'Ünite 3'];
            units.forEach((unit, uIdx) => {
              // 3 modules per unit
              for (let i = 1; i <= 3; i++) {
                mockModules.push({
                  id: `mock-${subj}-${grd}-${uIdx}-${i}`,
                  code: `${subj.substring(0, 3).toUpperCase()}${grd}.${uIdx + 1}.${i}`,
                  title: `${unit} - Kazanım ${i}`,
                  subject: subj,
                  grade: grd,
                  unit: unit,
                  difficultyLevel: 3,
                  description: `Mock module description for ${subj} ${grd}. class`,
                  estimatedDurationMinutes: 40
                });
              }
            });
          });
        });

        return mockModules;
      }

      console.log(`[KnowledgeGraph] Successfully fetched ${data.length} modules`);
      return data.map(convertFromSnakeCase);
    } catch (error) {
      console.error('[KnowledgeGraph] Error in getModules:', error);
      if (error instanceof Error && error.message.includes('Veritabanına')) {
        throw error;
      }
      throw new Error('Modül bilgileri alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  },

  async getModuleById(moduleId: string): Promise<KGModule | null> {
    const { data, error } = await supabase
      .from('kg_modules')
      .select('*')
      .eq('id', moduleId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching module:', error);
      throw error;
    }

    return data ? convertFromSnakeCase(data) : null;
  },

  async getModuleByTitle(title: string): Promise<KGModule | null> {
    const { data, error } = await supabase
      .from('kg_modules')
      .select('*')
      .ilike('title', title)
      .maybeSingle();

    if (error) {
      console.error('Error fetching module by title:', error);
      throw error;
    }

    return data ? convertFromSnakeCase(data) : null;
  },

  async getPrerequisites(moduleId: string): Promise<KGPrerequisite[]> {
    const { data, error } = await supabase
      .from('kg_prerequisites')
      .select(`
        *,
        kg_modules!kg_prerequisites_prerequisite_module_id_fkey (*)
      `)
      .eq('module_id', moduleId);

    if (error) {
      console.error('Error fetching prerequisites:', error);
      throw error;
    }

    return data.map(item => ({
      ...convertFromSnakeCase(item),
      prerequisiteModule: item.kg_modules ? convertFromSnakeCase(item.kg_modules) : undefined,
    }));
  },

  async getCriticalPrerequisites(moduleId: string): Promise<KGModule[]> {
    const { data, error } = await supabase
      .from('kg_prerequisites')
      .select(`
        kg_modules!kg_prerequisites_prerequisite_module_id_fkey (*)
      `)
      .eq('module_id', moduleId)
      .eq('relationship_type', 'CRITICAL');

    if (error) {
      console.error('Error fetching critical prerequisites:', error);
      throw error;
    }

    return data
      .map(item => item.kg_modules)
      .filter(Boolean)
      .map(convertFromSnakeCase);
  },

  async getStudentMastery(studentId: string): Promise<StudentMastery[]> {
    const { data, error } = await supabase
      .from('student_mastery')
      .select(`
        *,
        kg_modules (*)
      `)
      .eq('student_id', studentId)
      .order('mastery_score', { ascending: true });

    if (error) {
      console.error('Error fetching student mastery:', error);
      throw error;
    }

    return data.map(item => ({
      ...convertFromSnakeCase(item),
      module: item.kg_modules ? convertFromSnakeCase(item.kg_modules) : undefined,
    }));
  },

  async getStudentMasteryByModule(studentId: string, moduleId: string): Promise<StudentMastery | null> {
    const { data, error } = await supabase
      .from('student_mastery')
      .select(`
        *,
        kg_modules (*)
      `)
      .eq('student_id', studentId)
      .eq('module_id', moduleId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching student mastery by module:', error);
      throw error;
    }

    if (!data) return null;

    return {
      ...convertFromSnakeCase(data),
      module: data.kg_modules ? convertFromSnakeCase(data.kg_modules) : undefined,
    };
  },

  async getWeakModules(studentId: string, threshold: number = 0.7): Promise<StudentMastery[]> {
    const { data, error } = await supabase
      .from('student_mastery')
      .select(`
        *,
        kg_modules (*)
      `)
      .eq('student_id', studentId)
      .lt('mastery_score', threshold)
      .order('mastery_score', { ascending: true });

    if (error) {
      console.error('Error fetching weak modules:', error);
      throw error;
    }

    return data.map(item => ({
      ...convertFromSnakeCase(item),
      module: item.kg_modules ? convertFromSnakeCase(item.kg_modules) : undefined,
    }));
  },

  async getMasteryHistory(studentId: string, moduleId?: string): Promise<MasteryHistory[]> {
    let query = supabase
      .from('mastery_history')
      .select(`
        *,
        kg_modules (*)
      `)
      .eq('student_id', studentId)
      .order('recorded_at', { ascending: false });

    if (moduleId) {
      query = query.eq('module_id', moduleId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching mastery history:', error);
      throw error;
    }

    return data.map(item => ({
      ...convertFromSnakeCase(item),
      module: item.kg_modules ? convertFromSnakeCase(item.kg_modules) : undefined,
    }));
  },

  async getTedrisPlan(studentId: string, startDate?: string, endDate?: string): Promise<TedrisPlanTask[]> {
    let query = supabase
      .from('tedris_plan')
      .select(`
        *,
        kg_modules (*),
        kg_content (*)
      `)
      .eq('student_id', studentId)
      .order('planned_date', { ascending: true })
      .order('priority', { ascending: true });

    if (startDate) {
      query = query.gte('planned_date', startDate);
    }

    if (endDate) {
      query = query.lte('planned_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tedris plan:', error);
      throw error;
    }

    return data.map(item => ({
      ...convertFromSnakeCase(item),
      module: item.kg_modules ? convertFromSnakeCase(item.kg_modules) : undefined,
      content: item.kg_content ? convertFromSnakeCase(item.kg_content) : undefined,
    }));
  },

  async updateTaskStatus(
    taskId: string,
    status: 'in_progress' | 'completed' | 'skipped',
    performanceScore?: number,
    timeSpentMinutes?: number
  ): Promise<void> {
    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    if (performanceScore !== undefined) {
      updates.performance_score = performanceScore;
    }

    if (timeSpentMinutes !== undefined) {
      updates.time_spent_minutes = timeSpentMinutes;
    }

    const { error } = await supabase
      .from('tedris_plan')
      .update(updates)
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  },

  getMasteryColor(score: number): 'red' | 'yellow' | 'green' {
    if (score < 0.5) return 'red';
    if (score < 0.7) return 'yellow';
    return 'green';
  },

  getMasteryLabel(score: number): string {
    if (score < 0.5) return 'Zayıf';
    if (score < 0.7) return 'Gelişiyor';
    return 'Güçlü';
  },
};

function convertFromSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(convertFromSnakeCase);

  const converted: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    converted[camelKey] = convertFromSnakeCase(obj[key]);
  }
  return converted;
}
