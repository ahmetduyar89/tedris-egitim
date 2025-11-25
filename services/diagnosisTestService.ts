import { supabase } from './supabase';
import { knowledgeGraphService, KGModule } from './knowledgeGraphService';
import { masteryScoreService } from './masteryScoreService';

export interface DiagnosisQuestion {
  id: string;
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: number;
}

export interface DiagnosisTestResult {
  studentId: string;
  completedAt: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  moduleResults: {
    moduleId: string;
    moduleName: string;
    correct: number;
    total: number;
    masteryScore: number;
  }[];
}

export const diagnosisTestService = {
  async generateDiagnosisTest(
    studentId: string,
    subject: string,
    grade: number,
    questionsPerModule: number = 3
  ): Promise<DiagnosisQuestion[]> {
    try {
      console.log(`[DiagnosisTest] Generating test for student ${studentId}, subject: ${subject}, grade: ${grade}`);

      const modules = await knowledgeGraphService.getModules(subject, grade);

      console.log(`[DiagnosisTest] Found ${modules.length} modules`);

      if (modules.length === 0) {
        console.error(`[DiagnosisTest] No modules found for subject "${subject}" and grade ${grade}`);
        throw new Error(
          `Bu ders ve sınıf seviyesi için henüz modül tanımlanmamış. ` +
          `Lütfen öğretmeninizle iletişime geçin. (Ders: ${subject}, Sınıf: ${grade})`
        );
      }

      const diagnosticQuestions: DiagnosisQuestion[] = [];

      for (const module of modules) {
        for (let i = 0; i < questionsPerModule; i++) {
          diagnosticQuestions.push({
            id: `${module.id}-${i}`,
            moduleId: module.id,
            moduleCode: module.code,
            moduleName: module.title,
            question: this.generateSampleQuestion(module),
            options: this.generateOptions(),
            correctAnswer: 'A',
            difficulty: module.difficultyLevel,
          });
        }
      }

      console.log(`[DiagnosisTest] Generated ${diagnosticQuestions.length} questions`);
      return diagnosticQuestions;
    } catch (error) {
      console.error('[DiagnosisTest] Error generating diagnosis test:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Tanı testi oluşturulurken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
    }
  },

  generateSampleQuestion(module: KGModule): string {
    const questionTemplates = [
      `${module.title} konusunda temel bir soru: Bu konuyu ne kadar iyi biliyorsunuz?`,
      `${module.title} ile ilgili: Aşağıdakilerden hangisi doğrudur?`,
      `${module.title} konusunda: Aşağıdaki ifadelerden hangisi yanlıştır?`,
    ];

    return questionTemplates[Math.floor(Math.random() * questionTemplates.length)];
  },

  generateOptions(): string[] {
    return ['A) Seçenek 1', 'B) Seçenek 2', 'C) Seçenek 3', 'D) Seçenek 4'];
  },

  async submitDiagnosisTest(
    studentId: string,
    questions: DiagnosisQuestion[],
    answers: Record<string, string>
  ): Promise<DiagnosisTestResult> {
    const moduleResults = new Map<string, { correct: number; total: number; moduleName: string }>();

    let totalCorrect = 0;

    questions.forEach(question => {
      const studentAnswer = answers[question.id];
      const isCorrect = studentAnswer === question.correctAnswer;

      if (isCorrect) {
        totalCorrect++;
      }

      if (!moduleResults.has(question.moduleId)) {
        moduleResults.set(question.moduleId, {
          correct: 0,
          total: 0,
          moduleName: question.moduleName,
        });
      }

      const moduleResult = moduleResults.get(question.moduleId)!;
      moduleResult.total++;
      if (isCorrect) {
        moduleResult.correct++;
      }
    });

    const topicScores = Array.from(moduleResults.entries()).map(([moduleId, result]) => ({
      topicName: result.moduleName,
      correct: result.correct,
      wrong: result.total - result.correct,
    }));

    await masteryScoreService.updateMasteryScoresFromTest(
      studentId,
      'diagnosis-test',
      topicScores
    );

    const score = Math.round((totalCorrect / questions.length) * 100);

    const result: DiagnosisTestResult = {
      studentId,
      completedAt: new Date().toISOString(),
      totalQuestions: questions.length,
      correctAnswers: totalCorrect,
      score,
      moduleResults: Array.from(moduleResults.entries()).map(([moduleId, data]) => ({
        moduleId,
        moduleName: data.moduleName,
        correct: data.correct,
        total: data.total,
        masteryScore: data.total > 0 ? Math.round((data.correct / data.total) * 100) / 100 : 0,
      })),
    };

    return result;
  },

  async hasTakenDiagnosisTest(studentId: string): Promise<boolean> {
    const mastery = await knowledgeGraphService.getStudentMastery(studentId);
    return mastery.length > 0;
  },

  async needsDiagnosisTest(studentId: string): Promise<boolean> {
    return !(await this.hasTakenDiagnosisTest(studentId));
  },

  getDiagnosticQuestionsByDifficulty(
    questions: DiagnosisQuestion[],
    difficultyLevel: number
  ): DiagnosisQuestion[] {
    return questions.filter(q => q.difficulty === difficultyLevel);
  },

  groupQuestionsByModule(questions: DiagnosisQuestion[]): Map<string, DiagnosisQuestion[]> {
    const grouped = new Map<string, DiagnosisQuestion[]>();

    questions.forEach(question => {
      if (!grouped.has(question.moduleId)) {
        grouped.set(question.moduleId, []);
      }
      grouped.get(question.moduleId)!.push(question);
    });

    return grouped;
  },

  calculateModuleMasteryFromQuestions(
    moduleQuestions: DiagnosisQuestion[],
    answers: Record<string, string>
  ): { correct: number; total: number; score: number } {
    let correct = 0;
    const total = moduleQuestions.length;

    moduleQuestions.forEach(question => {
      const studentAnswer = answers[question.id];
      if (studentAnswer === question.correctAnswer) {
        correct++;
      }
    });

    const score = total > 0 ? Math.round((correct / total) * 100) / 100 : 0;

    return { correct, total, score };
  },
};
