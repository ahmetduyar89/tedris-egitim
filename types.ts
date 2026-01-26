export enum UserRole {
  Tutor = 'tutor',
  Student = 'student',
  Admin = 'admin',
  Parent = 'parent',
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

// --- Parent Portal ---
export interface Parent {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ParentStudentRelation {
  id: string;
  parentId: string;
  studentId: string;
  relationshipType: 'anne' | 'baba' | 'vasi';
  createdAt: string;
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
  // Contact Information
  contact?: string;
  parentName?: string;
  parentPhone?: string;

  // Gamification fields
  level: number;
  xp: number;
  badges: Badge[];
  // Learning Loop
  learningLoopStatus: LearningLoopStatus;
  progressReports: ProgressReport[];
  // AI Assistant Control
  isAiAssistantEnabled?: boolean;
  isPremium?: boolean;
  // Multi-Subject support
  subjects?: Subject[];
}

// --- Streak System & Motivation ---
export interface StudentStreak {
  id: string;
  studentId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string; // ISO date string
  streakFreezeCount: number; // Number of available streak protections
  totalActivities: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyGoal {
  id: string;
  type: 'solve_questions' | 'watch_video' | 'study_time' | 'review_flashcards' | 'complete_test' | 'practice_topic';
  description: string;
  target: number;
  current: number;
  unit?: string; // 'minutes', 'questions', 'videos', etc.
  subject?: string;
  completed: boolean;
  icon: string; // Emoji
}

export interface StudentDailyGoals {
  id: string;
  studentId: string;
  goalDate: string; // ISO date string
  goals: DailyGoal[];
  totalGoals: number;
  completedGoals: number;
  completionPercentage: number;
  isFullyCompleted: boolean;
  completedAt?: string;
  xpReward: number;
  xpClaimed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AchievementType =
  | 'streak_milestone'
  | 'daily_goals_streak'
  | 'total_xp'
  | 'tests_completed'
  | 'perfect_score'
  | 'subject_master'
  | 'early_bird'
  | 'night_owl'
  | 'speed_demon'
  | 'consistency_king'
  | 'quiz_master';

export interface StudentAchievement {
  id: string;
  studentId: string;
  achievementType: AchievementType;
  achievementName: string;
  description: string;
  iconEmoji: string;
  milestoneValue?: number; // e.g., 7 for "7-day streak"
  xpReward: number;
  badgeUnlocked?: string;
  specialReward?: {
    type: 'avatar_item' | 'theme' | 'pet' | 'title';
    itemId: string;
    itemName: string;
  };
  unlockedAt: string;
  isViewed: boolean;
  viewedAt?: string;
  createdAt: string;
}

export type ActivityType =
  | 'test_completed'
  | 'video_watched'
  | 'flashcard_reviewed'
  | 'question_solved'
  | 'login'
  | 'study_session'
  | 'assignment_submitted'
  | 'goal_completed';

export interface StudentActivity {
  id: string;
  studentId: string;
  activityDate: string; // ISO date string
  activityType: ActivityType;
  activityDetails?: {
    testId?: string;
    subject?: string;
    duration?: number;
    score?: number;
    [key: string]: any;
  };
  xpEarned: number;
  createdAt: string;
}

export interface StreakUpdateResult {
  currentStreak: number;
  longestStreak: number;
  streakBroken: boolean;
  milestoneReached: boolean;
  milestoneValue?: number;
}


export enum Subject {
  Mathematics = 'Matematik',
  Science = 'Fen Bilimleri',
  Turkish = 'Türkçe',
  Physics = 'Fizik',
  Chemistry = 'Kimya',
  Biology = 'Biyoloji',
  English = 'İngilizce',
  History = 'Tarih',
  Geography = 'Coğrafya',
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
  teacherId?: string;
  subject: Subject;
  unit: string;
  grade: number;
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
  weekId?: string; // e.g. '2025-12-22'
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

export interface PrivateLesson {
  id: string;
  tutorId: string;
  studentId?: string;
  studentName?: string;
  startTime: string;
  endTime: string;
  subject: string;
  topic?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'started';
  sourceLessonId?: string; // For virtual lessons to track the template source
  notes?: string;
  duration?: number; // in minutes
  color?: string;
  contact?: string;
  grade?: number;
  lessonNotes?: string;
  homework?: string;
  attendance?: LessonAttendance;
  type?: 'face_to_face' | 'online';
}

export interface LessonAttendance {
  id: string;
  lessonId: string;
  studentId: string;
  tutorId: string;
  attendanceStatus: 'completed' | 'missed' | 'cancelled';
  paymentAmount?: number;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  paymentDate?: string;
  paymentNotes?: string;
  markedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentPaymentConfig {
  id: string;
  studentId: string;
  tutorId: string;
  perLessonFee: number;
  currency: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonStats {
  totalScheduled: number;
  totalCompleted: number;
  totalMissed: number;
  totalCancelled: number;
  completionRate: number;
}

export interface PaymentSummary {
  totalEarned: number;
  totalPending: number;
  totalLessons: number;
  paidLessons: number;
  unpaidLessons: number;
  currency: string;
}

// ============================================================================
// TURKISH LEARNING SYSTEM
// ============================================================================

export enum FlashcardCategory {
  General = 'general',
  Vocabulary = 'vocabulary',
  Idiom = 'idiom',
  Proverb = 'proverb',
  BookRelated = 'book_related'
}

export interface TurkishContentLibraryItem {
  id: string;
  teacherId: string;
  category: 'vocabulary' | 'idiom' | 'proverb';
  frontContent: string; // Word/Idiom/Proverb
  backContent: string; // Meaning/Explanation
  exampleSentence?: string;
  difficultyLevel: number; // 1-5
  isAiGenerated: boolean;
  createdAt: string;
  isActive: boolean;
  // Assignment-related fields (populated when fetching student assignments)
  assignmentId?: string;
  isLearned?: boolean;
  learnedAt?: string;
  reviewCount?: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  pageCount: number;
  difficultyLevel: number; // 1-5
  estimatedReadingDays: number; // 7 or 15
  coverImageUrl?: string;
  summary?: string;
  createdAt: string;
  createdBy: string;
  isActive: boolean;
}

export interface BookQuestion {
  id: string;
  bookId: string;
  questionText: string;
  questionType: 'text' | 'multiple_choice' | 'yes_no' | 'rating';
  options?: string[]; // For multiple choice
  orderIndex: number;
  isRequired: boolean;
  createdAt: string;
}

export interface BookAssignment {
  id: string;
  bookId: string;
  studentId: string;
  teacherId: string;
  assignedAt: string;
  dueDate?: string;
  status: 'assigned' | 'reading' | 'completed' | 'reviewed';
  startedAt?: string;
  completedAt?: string;
  teacherFeedback?: string;
  teacherScore?: number; // 0-100
  reviewedAt?: string;
  // Populated fields
  book?: Book;
  questions?: BookQuestion[];
  answers?: BookQuestionAnswer[];
}

export interface BookQuestionAnswer {
  id: string;
  assignmentId: string;
  questionId: string;
  answerText: string;
  submittedAt: string;
  // Populated field
  question?: BookQuestion;
}

export interface WeeklyTurkishGoals {
  id: string;
  studentId: string;
  weekStartDate: string; // ISO date

  // Vocabulary
  vocabularyTarget: number;
  vocabularyLearned: number;

  // Idioms
  idiomsTarget: number;
  idiomsLearned: number;

  // Proverbs
  proverbsTarget: number;
  proverbsLearned: number;

  // Book reading
  bookAssignmentId?: string;
  bookCompleted: boolean;

  createdAt: string;
  updatedAt: string;

  // Populated field
  bookAssignment?: BookAssignment;
}

export interface TurkishLearningProgress {
  weeklyGoals: WeeklyTurkishGoals;
  dueFlashcards: number;
  totalMastered: number;
  currentStreak: number;
}

// ============================================================================
// TURKISH CONTENT ASSIGNMENT SYSTEM (New Learning Flow)
// ============================================================================

export type TurkishLearningStatus = 'not_started' | 'learning' | 'practicing' | 'mastered';

export interface TurkishContentAssignment {
  id: string;
  studentId: string;
  teacherId: string;
  contentIds: string[]; // TurkishContentLibraryItem IDs
  category: 'vocabulary' | 'idiom' | 'proverb';
  assignedAt: string;
  dueDate: string; // Deadline for completion

  // Learning phase
  learningStatus: TurkishLearningStatus;
  learnedContentIds: string[]; // Content marked as learned

  // Practice phase
  practiceAttempts: number;
  practiceScore?: number; // 0-100
  practiceCompletedAt?: string;

  // Mastery phase (moved to flashcard system)
  masteredAt?: string;

  createdAt: string;
  updatedAt: string;

  // Populated fields
  contents?: TurkishContentLibraryItem[];
  student?: Student;
}

export interface TurkishContentProgress {
  id: string;
  assignmentId: string;
  studentId: string;
  contentId: string;

  // Learning tracking
  viewCount: number;
  markedAsLearned: boolean;
  learnedAt?: string;

  // Practice tracking
  practiceAttempts: number;
  correctCount: number;
  incorrectCount: number;
  lastPracticeAt?: string;

  createdAt: string;
  updatedAt: string;

  // Populated field
  content?: TurkishContentLibraryItem;
}
// ============================================================================
// COMPOSITION WRITING SYSTEM
// ============================================================================

export type CompositionCategory = 'narrative' | 'descriptive' | 'expository' | 'persuasive' | 'creative' | 'general';
export type CompositionStatus = 'assigned' | 'draft' | 'submitted' | 'ai_evaluated' | 'teacher_reviewed';

export interface CompositionRubric {
  content: number; // 0-25
  organization: number; // 0-25
  grammar: number; // 0-25
  vocabulary: number; // 0-25
}

export interface Composition {
  id: string;
  teacherId: string;
  title: string;
  description: string;
  prompt: string;
  guidelines: string[];
  minWordCount: number;
  maxWordCount: number;
  difficultyLevel: number; // 1-5
  gradeLevel?: number;
  category: CompositionCategory;
  rubric?: CompositionRubric;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GrammarIssue {
  issue: string;
  suggestion: string;
  position?: number;
}

export interface SpellingIssue {
  word: string;
  suggestion: string;
  position?: number;
}

export interface AICompositionFeedback {
  overall: string;
  strengths: string[];
  improvements: string[];
  grammarIssues: GrammarIssue[];
  spellingIssues: SpellingIssue[];
  vocabularyScore: number; // 0-100
  grammarScore: number; // 0-100
  organizationScore: number; // 0-100
  contentScore: number; // 0-100
}

export interface CompositionAssignment {
  id: string;
  compositionId: string;
  studentId: string;
  teacherId: string;
  assignedAt: string;
  dueDate?: string;
  status: CompositionStatus;
  isMandatory: boolean;

  // Submission
  studentText?: string;
  wordCount?: number;
  startedAt?: string;
  submittedAt?: string;

  // AI Evaluation
  aiScore?: number;
  aiFeedback?: AICompositionFeedback;
  aiEvaluatedAt?: string;

  // Teacher Evaluation
  teacherScore?: number;
  teacherFeedback?: string;
  teacherReviewedAt?: string;

  createdAt: string;
  updatedAt: string;

  // Populated fields
  composition?: Composition;
}
