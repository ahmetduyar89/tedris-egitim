import { supabase } from './supabase';
import { knowledgeGraphService } from './knowledgeGraphService';

interface TopicScore {
  moduleId?: string;
  topicName: string;
  correct: number;
  wrong: number;
}

export const masteryScoreService = {
  async updateMasteryScoresFromTest(
    studentId: string,
    testId: string,
    topicScores: TopicScore[]
  ): Promise<{ success: boolean; updatedModules: any[]; errors: any[] }> {
    try {
      const updatedModules = [];
      const errors = [];
      const timestamp = new Date().toISOString();

      for (const score of topicScores) {
        try {
          let moduleId = score.moduleId;

          // If no moduleId provided, try to find it by name (fallback)
          if (!moduleId) {
            const module = await knowledgeGraphService.getModuleByTitle(score.topicName);
            if (module) moduleId = module.id;
          }

          if (moduleId) {
            const total = score.correct + score.wrong;
            const masteryScore = total > 0 ? Math.round((score.correct / total) * 100) / 100 : 0;

            // 1. Update Student Mastery
            const { data: currentMastery } = await supabase
              .from('student_mastery')
              .select('*')
              .eq('student_id', studentId)
              .eq('module_id', moduleId)
              .maybeSingle();

            const attemptsCount = (currentMastery?.attempts_count || 0) + 1;
            // Calculate new moving average or just take latest test score? 
            // For now, let's weight the new score 70% and old score 30% if exists
            const prevScore = currentMastery?.mastery_score || 0;
            const newScoreWeighted = currentMastery
              ? Math.round((prevScore * 0.3 + masteryScore * 0.7) * 100) / 100
              : masteryScore;

            const masteryData = {
              student_id: studentId,
              module_id: moduleId,
              mastery_score: newScoreWeighted,
              confidence_level: Math.round(newScoreWeighted * 10) / 10, // Simple mapping
              attempts_count: attemptsCount,
              last_practiced_at: timestamp,
              streak_days: currentMastery?.streak_days || 0
            };

            const { error: upsertError } = await supabase
              .from('student_mastery')
              .upsert(masteryData);

            if (upsertError) throw upsertError;

            // 2. Log History
            const { error: historyError } = await supabase
              .from('mastery_history')
              .insert({
                student_id: studentId,
                module_id: moduleId,
                mastery_score: masteryScore, // Log the raw test score
                change_reason: 'test_completed',
                previous_score: prevScore,
                test_id: testId,
                recorded_at: timestamp
              });

            if (historyError) console.warn('Error logging mastery history:', historyError);

            updatedModules.push({ moduleId, score: newScoreWeighted });
          } else {
            console.warn(`Module not found for topic: ${score.topicName}`);
            errors.push({ topic: score.topicName, error: 'Module not found' });
          }
        } catch (err) {
          console.error(`Error updating mastery for topic ${score.topicName}:`, err);
          errors.push({ topic: score.topicName, error: err });
        }
      }

      return {
        success: errors.length === 0,
        updatedModules,
        errors,
      };
    } catch (error) {
      console.error('Error updating mastery scores:', error);
      throw error;
    }
  },

  async calculateMasteryScore(correct: number, wrong: number): Promise<number> {
    const total = correct + wrong;
    if (total === 0) return 0;
    return Math.round((correct / total) * 100) / 100;
  },

  async getMasteryMap(studentId: string): Promise<Map<string, { score: number; color: string; label: string }>> {
    const masteryData = await knowledgeGraphService.getStudentMastery(studentId);

    const map = new Map<string, { score: number; color: string; label: string }>();

    masteryData.forEach(mastery => {
      if (mastery.module) {
        const color = this.getMasteryColorCode(mastery.masteryScore);
        const label = knowledgeGraphService.getMasteryLabel(mastery.masteryScore);

        map.set(mastery.module.title, {
          score: mastery.masteryScore,
          color,
          label,
        });
      }
    });

    return map;
  },

  getMasteryColorCode(score: number): string {
    if (score < 0.5) return '#F05039';
    if (score < 0.7) return '#F5C542';
    return '#10B981';
  },

  async getWeakModulesWithPrerequisites(studentId: string): Promise<{
    weakModule: any;
    criticalPrerequisites: any[];
  }[]> {
    const weakModules = await knowledgeGraphService.getWeakModules(studentId, 0.7);

    const result = [];

    for (const weakModule of weakModules) {
      const prerequisites = await knowledgeGraphService.getCriticalPrerequisites(weakModule.moduleId);
      result.push({
        weakModule,
        criticalPrerequisites: prerequisites,
      });
    }

    return result;
  },

  async shouldTriggerRiskAlert(studentId: string, moduleId: string): Promise<boolean> {
    const mastery = await knowledgeGraphService.getStudentMasteryByModule(studentId, moduleId);

    if (!mastery) return false;

    return mastery.masteryScore < 0.5 && mastery.attemptsCount >= 3;
  },

  async getMasteryTrend(studentId: string, moduleId: string): Promise<{
    improving: boolean;
    stagnant: boolean;
    declining: boolean;
    recentScores: number[];
  }> {
    const history = await knowledgeGraphService.getMasteryHistory(studentId, moduleId);

    if (history.length < 2) {
      return {
        improving: false,
        stagnant: true,
        declining: false,
        recentScores: history.map(h => h.masteryScore),
      };
    }

    const recentScores = history.slice(0, 5).map(h => h.masteryScore);
    const latestScore = recentScores[0];
    const previousScore = recentScores[1];

    const improving = latestScore > previousScore + 0.1;
    const declining = latestScore < previousScore - 0.1;
    const stagnant = !improving && !declining;

    return {
      improving,
      stagnant,
      declining,
      recentScores,
    };
  },

  async getModuleRecommendations(studentId: string): Promise<{
    moduleId: string;
    moduleName: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }[]> {
    const weakModulesWithPrereqs = await this.getWeakModulesWithPrerequisites(studentId);

    const recommendations = [];

    for (const { weakModule, criticalPrerequisites } of weakModulesWithPrereqs) {
      if (criticalPrerequisites.length > 0) {
        for (const prereq of criticalPrerequisites) {
          const prereqMastery = await knowledgeGraphService.getStudentMasteryByModule(
            studentId,
            prereq.id
          );

          if (!prereqMastery || prereqMastery.masteryScore < 0.7) {
            recommendations.push({
              moduleId: prereq.id,
              moduleName: prereq.title,
              reason: `${weakModule.module?.title || 'Hedef konu'} için kritik ön koşul`,
              priority: 'high' as const,
            });
          }
        }
      } else {
        recommendations.push({
          moduleId: weakModule.moduleId,
          moduleName: weakModule.module?.title || 'Bilinmeyen',
          reason: 'Doğrudan çalışma gerekiyor',
          priority: weakModule.masteryScore < 0.3 ? 'high' as const : 'medium' as const,
        });
      }
    }

    const uniqueRecommendations = recommendations.reduce((acc, rec) => {
      if (!acc.find(r => r.moduleId === rec.moduleId)) {
        acc.push(rec);
      }
      return acc;
    }, [] as typeof recommendations);

    return uniqueRecommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  },

  async getMasteryStatistics(studentId: string): Promise<{
    totalModules: number;
    masteredCount: number;
    progressCount: number;
    weakCount: number;
    averageScore: number;
    totalAttempts: number;
  }> {
    const masteryData = await knowledgeGraphService.getStudentMastery(studentId);

    let masteredCount = 0;
    let progressCount = 0;
    let weakCount = 0;
    let totalScore = 0;
    let totalAttempts = 0;

    masteryData.forEach(mastery => {
      totalScore += mastery.masteryScore;
      totalAttempts += mastery.attemptsCount;

      if (mastery.masteryScore >= 0.7) {
        masteredCount++;
      } else if (mastery.masteryScore >= 0.5) {
        progressCount++;
      } else {
        weakCount++;
      }
    });

    return {
      totalModules: masteryData.length,
      masteredCount,
      progressCount,
      weakCount,
      averageScore: masteryData.length > 0 ? Math.round((totalScore / masteryData.length) * 100) / 100 : 0,
      totalAttempts,
    };
  },

  async getBulkMasteryStatistics(studentIds: string[]): Promise<Record<string, {
    totalModules: number;
    masteredCount: number;
    progressCount: number;
    weakCount: number;
    averageScore: number;
    totalAttempts: number;
  }>> {
    const bulkMasteryData = await knowledgeGraphService.getBulkStudentMastery(studentIds);
    const result: Record<string, any> = {};

    studentIds.forEach(studentId => {
      const masteryData = bulkMasteryData[studentId] || [];

      let masteredCount = 0;
      let progressCount = 0;
      let weakCount = 0;
      let totalScore = 0;
      let totalAttempts = 0;

      masteryData.forEach(mastery => {
        totalScore += mastery.masteryScore;
        totalAttempts += mastery.attemptsCount;

        if (mastery.masteryScore >= 0.7) {
          masteredCount++;
        } else if (mastery.masteryScore >= 0.5) {
          progressCount++;
        } else {
          weakCount++;
        }
      });

      result[studentId] = {
        totalModules: masteryData.length,
        masteredCount,
        progressCount,
        weakCount,
        averageScore: masteryData.length > 0 ? Math.round((totalScore / masteryData.length) * 100) / 100 : 0,
        totalAttempts,
      };
    });

    return result;
  },
};
