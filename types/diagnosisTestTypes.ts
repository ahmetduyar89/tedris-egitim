// Tanı Testi Sistemi - TypeScript Tipleri
import type { Student } from '../types';

export interface DiagnosisTest {
    id: string;
    teacherId: string;
    title: string;
    description?: string;
    subject: string;
    grade: number;
    totalQuestions: number;
    durationMinutes: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface DiagnosisTestQuestion {
    id: string;
    testId: string;
    moduleId?: string;
    moduleName: string;
    questionText: string;
    options: string[]; // ["A) ...", "B) ...", "C) ...", "D) ..."]
    correctAnswer: string;
    difficulty: number;
    orderIndex: number;
    createdAt: string;
}

export type DiagnosisTestStatus = 'pending' | 'in_progress' | 'completed';

export interface DiagnosisTestAssignment {
    id: string;
    testId: string;
    studentId: string;
    teacherId: string;
    assignedAt: string;
    dueDate?: string;
    isMandatory: boolean;
    status: DiagnosisTestStatus;
    startedAt?: string;
    completedAt?: string;
    score?: number;
    totalCorrect: number;
    totalQuestions: number;
    aiAnalysis?: DiagnosisAIAnalysis;
    createdAt: string;
    updatedAt: string;

    // Populated fields
    test?: DiagnosisTest;
    student?: Student;
    questions?: DiagnosisTestQuestion[];
}

export interface DiagnosisTestAnswer {
    id: string;
    assignmentId: string;
    questionId: string;
    studentAnswer?: string;
    isCorrect?: boolean;
    answeredAt: string;
    createdAt: string;
}

export type DiagnosisActionType = 'weekly_plan' | 'homework' | 'review_package' | 'note';

export interface DiagnosisTestAction {
    id: string;
    assignmentId: string;
    teacherId: string;
    actionType: DiagnosisActionType;
    actionData?: any;
    notes?: string;
    createdAt: string;
}

// AI Analiz Yapısı
export interface DiagnosisAIAnalysis {
    overallAssessment: string; // Genel değerlendirme
    proficiencyLevel: 'beginner' | 'intermediate' | 'advanced'; // Genel seviye

    strongAreas: {
        moduleName: string;
        moduleCode?: string;
        masteryScore: number;
        comment: string;
    }[];

    weakAreas: {
        moduleName: string;
        moduleCode?: string;
        masteryScore: number;
        gapAnalysis: string; // Eksiklik analizi
        priority: 'high' | 'medium' | 'low';
    }[];

    recommendations: {
        type: 'study_plan' | 'practice' | 'review' | 'advanced';
        description: string;
        modules: string[];
        estimatedDuration: string;
    }[];

    learningStyleInsights?: string; // Öğrenme stili hakkında gözlemler
    motivationMessage: string; // Motive edici mesaj
}

// Test Oluşturma için Config
export interface CreateDiagnosisTestConfig {
    title: string;
    description?: string;
    subject: string;
    grade: number;
    moduleIds: string[]; // Seçilen modül ID'leri
    questionsPerModule: number;
    durationMinutes?: number;
}

// Atama için Config
export interface AssignDiagnosisTestConfig {
    testId: string;
    studentIds: string[];
    dueDate?: string;
    isMandatory: boolean;
}

// Modül Bazlı Sonuç
export interface DiagnosisModuleResult {
    moduleId: string;
    moduleName: string;
    totalQuestions: number;
    correctAnswers: number;
    masteryScore: number; // 0-1 arası
    questions: {
        questionId: string;
        questionText: string;
        studentAnswer?: string;
        correctAnswer: string;
        isCorrect: boolean;
    }[];
}

// Detaylı Sonuç (Öğretmen için)
export interface DiagnosisDetailedResult {
    assignment: DiagnosisTestAssignment;
    student: Student;
    test: DiagnosisTest;
    moduleResults: DiagnosisModuleResult[];
    aiAnalysis: DiagnosisAIAnalysis;
    answers: DiagnosisTestAnswer[];
    actions: DiagnosisTestAction[];
}
