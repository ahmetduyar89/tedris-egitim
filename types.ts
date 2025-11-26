export enum UserRole {
  Tutor = 'tutor',
  Student = 'student',
  Admin = 'admin',
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status?: 'pending' | 'approved' | 'rejected';
  is_admin?: boolean;
}

export interface Badge {
  id: string;
  title: string;
  icon: string; // emoji or icon name
  description: string;
}

export interface DailyMessage {
  message: string;
  timestamp: string;
}

export enum LearningLoopStatus {
  Initial = 'Başlangıç', // No test taken yet
  TestAssigned = 'Test Atandı',
  AnalysisReady = 'Analiz Hazır',
  PlanGenerated = 'Plan Oluşturuldu',
  InProgress = 'Uygulama',
}

export interface ProgressReport {
  id: string;
  weekStartDate: string;
  lastScore: number;
  currentScore: number;
  progress: number;
  aiComment: string;
  focusTopics: string[];
}

export interface Student {
  id: string; // Should match the user ID for the student
  name: string;
  grade: number;
  tutorId: string;
  contact?: string;
  // Gamification fields
  level: number;
  xp: number;
  badges: Badge[];
  // Learning Loop
  learningLoopStatus: LearningLoopStatus;
  progressReports: ProgressReport[];
}

export enum Subject {
  Mathematics = 'Matematik',
  Science = 'Fen Bilimleri',
  Turkish = 'Türkçe',
}

export enum QuestionType {
  MultipleChoice = 'Çoktan Seçmeli',
  OpenEnded = 'Açık Uçlu',
  Mixed = 'Karma',
}

export enum Difficulty {
  Easy = 'Kolay',
  Medium = 'Orta',
  Hard = 'Zor',
  Mixed = 'Karma',
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string;
  studentAnswer?: string;
  topic?: string;
  isCorrect?: boolean; // Was the student's answer correct?
  aiEvaluation?: { // For open-ended questions
    score: number; // Score from 0-100
    feedback: string;
  };
  teacherScore?: number; // Manual override by the teacher
}

export interface Test {
  id: string;
  title: string;
  studentId: string;
  subject: Subject;
  unit: string;
  questions: Question[];
  duration: number; // in minutes
  dueDate: string;
  completed: boolean;
  score?: number;
  analysis?: AIAnalysisReport;
  submissionDate?: string; // To track progress over time
  isQuestionBankTest?: boolean;
  questionBankAssignmentId?: string;
}

export type TestResultSummary = {
  correct: number;
  wrong: number;
  scorePercent: number;
};

export interface AIAnalysisReport {
  summary: TestResultSummary;
  analysis: {
    weakTopics: string[];
    strongTopics: string[];
    recommendations: string[];
    overallComment: string;
  };
  evaluationTag?: string;
  topicBreakdown?: { topic: string; correct: number; wrong: number }[];
  questionEvaluations: Question[]; // Detailed per-question analysis
}


export enum TaskStatus {
  Assigned = 'atandı',
  Viewed = 'görüldü',
  Completed = 'tamamlandı',
}

export interface Task {
  id: string;
  description: string;
  title?: string;
  type?: string;
  status: TaskStatus;
  reviewPackageId?: string;
  subject?: Subject; // Added for color-coding and context
  ai_recommended?: boolean;
  duration: number; // in minutes
  contentId?: string; // Link to ContentLibraryItem
  contentType?: ContentType;
  isCompletionTask?: boolean;
  topic?: string;
  metadata?: any;
}


export interface WeeklyProgram {
  id: string;
  studentId: string;
  week: number;
  days: {
    day: string;
    tasks: Task[];
  }[];
}


export enum ReviewPackageItemType {
  Introduction = 'introduction', // Giriş ve Analoji
  KeyConcepts = 'key-concepts', // Anahtar Kavramlar
  InteractiveQuiz = 'interactive-quiz', // Etkileşimli Sınav
  Summary = 'summary', // Özet ve Teşvik
}

export interface ReviewPackageItem {
  id: string;
  type: ReviewPackageItemType;
  content: any;
}

export interface ReviewPackage {
  id: string;
  studentId: string;
  topic: string;
  items: ReviewPackageItem[];
}

export interface Notification {
  id: string;
  recipientId: string; // User ID of the recipient (student or tutor)
  message: string;
  read: boolean;
  timestamp: string;
  entityType?: 'test' | 'assignment' | 'content' | 'submission' | 'test_completed'; // What is this notification about?
  entityId?: string; // ID of the test/assignment etc.
}


// --- Content Library ---
export enum ContentType {
  PDF = 'pdf',
  Video = 'video',
  Image = 'image',
  Interactive = 'interactive',
  HTML = 'html',
}

export interface ContentLibraryItem {
  id: string;
  teacherId: string;
  title: string;
  subject: Subject;
  grade: number;
  unit: string;
  tags: string[];
  fileType: ContentType;
  fileUrl?: string; // For PDF, video, image
  htmlContent?: string; // For raw HTML
  interactiveContentId?: string; // For interactive content
  createdAt: string;
}

export interface ContentAssignment {
  id: string;
  studentId: string;
  contentId: string;
  assignedAt: string;
  viewed: boolean;
}

export interface InteractiveContentComponent {
  id: string;
  type: 'text' | 'mcq' | 'fill-in-the-blank' | 'true-false';
  content: any;
}

export interface InteractiveContent {
  id: string;
  teacherId: string;
  title: string;
  components: InteractiveContentComponent[];
}

// --- Question Bank System ---
export type QuestionBankQuestionType = 'multiple_choice' | 'open_ended' | 'matching' | 'true_false';
export type QuestionBankSource = 'ai_generated' | 'pdf_import' | 'manual';
export type QuestionBankAssignmentStatus = 'Atandı' | 'Devam Ediyor' | 'Tamamlandı';

export interface QuestionBankQuestion {
  id: string;
  type: QuestionBankQuestionType;
  question: string;
  topic?: string;
  difficulty: number;
  points: number;
  explanation?: string;
  options?: string[];
  correct_answer?: string | string[];
  model_answer?: string;
  rubric?: string[];
  left_items?: string[];
  right_items?: string[];
  correct_pairs?: Record<string, string>;
  aiEvaluation?: {
    score: number;
    feedback: string;
  };
}

export interface QuestionBank {
  id: string;
  teacherId: string;
  title: string;
  subject: string;
  grade: number;
  unit: string;
  topic?: string;
  difficultyLevel: number;
  questions: QuestionBankQuestion[];
  totalQuestions: number;
  source: QuestionBankSource;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionBankAssignment {
  id: string;
  questionBankId: string;
  studentId: string;
  teacherId: string;
  assignedAt: string;
  applicationDate?: string;
  timeLimitMinutes?: number;
  startedAt?: string;
  completedAt?: string;
  answers: Record<string, any>;
  score?: number;
  totalCorrect: number;
  totalQuestions: number;
  status: QuestionBankAssignmentStatus;
  aiFeedback?: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    overall: string;
  };
  questionBank?: QuestionBank;
}

// --- AI Assistant ---
export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text?: string;
  imageUrl?: string;
  explanation?: {
    topic: string;
    explanation: string;
    example: string;
    hint: string;
  };
  feedback?: {
    isCorrect: boolean;
    feedback: string;
  };
  isLoading?: boolean;
  timestamp: string;
}

// --- Homework System ---
export enum AssignmentStatus {
  Pending = 'Bekliyor',
  Submitted = 'Teslim Edildi',
  Graded = 'Değerlendirildi',
  Late = 'Gecikti',
}

export enum AssignmentType {
  Text = 'Metin',
  PDF = 'PDF',
  Video = 'Video',
  AIQuestionSet = 'AI Soru Seti',
}

export interface Assignment {
  id: string;
  teacherId: string;
  studentId: string;
  subject: Subject;
  title: string;
  description: string;
  dueDate: string;
  aiSuggested: boolean;
  createdAt: string;
  submission?: Submission;
  viewedByStudent?: boolean;
  contentType?: 'pdf' | 'video' | 'image' | 'html';
  fileUrl?: string;
  htmlContent?: string;
}

export interface AIHomeworkAnalysis {
  feedback: string;
  weakTopics: string[];
  strongTopics?: string[];
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  submissionText?: string;
  fileUrl?: string; // For file uploads
  submittedAt: string;
  status: AssignmentStatus;
  aiScore?: number;
  aiAnalysis?: AIHomeworkAnalysis;
  teacherScore?: number;
  teacherFeedback?: string;
}

// --- Learning Map ---
export type MapNodeStatus = 'mastered' | 'progress' | 'weak';

export interface MapNode {
  name: string;
  status: MapNodeStatus;
  score: number;
  questionCount: number;
  history: { name: string; score: number }[];
  questions: Question[];
}

export interface ContentRecommendation {
  title: string;
  type: 'Video' | 'Test' | 'Okuma' | 'Etkinlik';
  description: string;
  source: 'Kütüphane' | 'Web';
  contentId?: string;
}

export interface Flashcard {
  id: string;
  teacherId: string;
  subject: Subject;
  grade: number;
  topic: string;
  frontContent: string;
  backContent: string;
  difficultyLevel: number;
  createdAt: string;
  isAiGenerated: boolean;
}

export interface SpacedRepetitionSchedule {
  id: string;
  studentId: string;
  flashcardId: string;
  easeFactor: number;
  intervalDays: number;
  repetitionCount: number;
  lastReviewedAt?: string;
  nextReviewDate: string;
  masteryLevel: number;
  createdAt: string;
  flashcard?: Flashcard;
}

export interface FlashcardReview {
  id: string;
  scheduleId: string;
  studentId: string;
  flashcardId: string;
  qualityRating: number;
  timeSpentSeconds: number;
  reviewedAt: string;
  wasCorrect: boolean;
}

export interface MiniQuiz {
  id: string;
  studentId: string;
  subject: Subject;
  topic?: string;
  flashcardIds: string[];
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  durationSeconds: number;
  completedAt?: string;
  createdAt: string;
}

export interface MiniQuizQuestion {
  flashcard: Flashcard;
  userAnswer?: string;
  isCorrect?: boolean;
  timeSpent?: number;
}

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

export interface AdaptivePlanLog {
  id: string;
  studentId: string;
  triggerReason: 'initial_diagnosis' | 'test_failed' | 'milestone_reached' | 'manual_trigger' | 'scheduled';
  weakModules: any[];
  recommendedModules: any[];
  planDurationDays: number;
  createdAt: string;
}

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