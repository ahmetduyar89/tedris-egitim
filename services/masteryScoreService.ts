import { supabase } from './supabase';
import { knowledgeGraphService } from './knowledgeGraphService';

interface TopicScore {
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
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-mastery-score`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId,
            testId,
            topicScores,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update mastery scores');
      }

      const result = await response.json();
      return {
        success: result.success,
        updatedModules: result.updatedModules || [],
        errors: result.errors || [],
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
