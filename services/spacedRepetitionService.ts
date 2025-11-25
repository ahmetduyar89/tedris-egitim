import { Flashcard, FlashcardReview, SpacedRepetitionSchedule } from '../types';
import { db } from './dbAdapter';

export const SM2_INITIAL_EASE_FACTOR = 2.5;
export const SM2_MIN_EASE_FACTOR = 1.3;
export const SM2_INITIAL_INTERVAL = 1;

export const calculateNextReview = (
  currentEaseFactor: number,
  currentInterval: number,
  qualityRating: number,
  repetitionCount: number
): { newEaseFactor: number; newInterval: number; newMasteryLevel: number } => {
  if (qualityRating < 0 || qualityRating > 5) {
    throw new Error('Quality rating must be between 0 and 5');
  }

  let newEaseFactor = currentEaseFactor + (0.1 - (5 - qualityRating) * (0.08 + (5 - qualityRating) * 0.02));

  if (newEaseFactor < SM2_MIN_EASE_FACTOR) {
    newEaseFactor = SM2_MIN_EASE_FACTOR;
  }

  let newInterval: number;
  const newRepetitionCount = repetitionCount + 1;

  if (qualityRating < 3) {
    newInterval = 1;
  } else {
    if (newRepetitionCount === 1) {
      newInterval = 1;
    } else if (newRepetitionCount === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * newEaseFactor);
    }
  }

  const newMasteryLevel = calculateMasteryLevel(newRepetitionCount, qualityRating, currentEaseFactor);

  return {
    newEaseFactor: Math.round(newEaseFactor * 100) / 100,
    newInterval,
    newMasteryLevel
  };
};

const calculateMasteryLevel = (repetitionCount: number, qualityRating: number, easeFactor: number): number => {
  if (repetitionCount < 3) return 0;
  if (repetitionCount < 5 && qualityRating >= 4) return 1;
  if (repetitionCount < 8 && qualityRating >= 4 && easeFactor >= 2.3) return 2;
  if (repetitionCount < 12 && qualityRating >= 4 && easeFactor >= 2.5) return 3;
  if (repetitionCount < 20 && qualityRating >= 4 && easeFactor >= 2.7) return 4;
  if (repetitionCount >= 20 && qualityRating >= 4 && easeFactor >= 2.8) return 5;
  return 0;
};

export const getDueFlashcards = async (studentId: string): Promise<SpacedRepetitionSchedule[]> => {
  const result = await db.collection('spaced_repetition_schedule')
    .where('student_id', '==', studentId)
    .get();

  const schedules = result.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueSchedules = schedules.filter((s: any) => {
    if (!s.nextReviewDate) return false;
    const reviewDate = new Date(s.nextReviewDate);
    reviewDate.setHours(0, 0, 0, 0);
    return reviewDate <= today;
  });

  const schedulesWithFlashcards = await Promise.all(
    dueSchedules.map(async (schedule: any) => {
      const flashcardDoc = await db.collection('flashcards').doc(schedule.flashcardId).get();
      if (flashcardDoc.exists) {
        return {
          ...schedule,
          flashcard: flashcardDoc.data()
        };
      }
      return {
        ...schedule,
        flashcard: undefined
      };
    })
  );

  return schedulesWithFlashcards;
};

export const recordFlashcardReview = async (
  scheduleId: string,
  studentId: string,
  flashcardId: string,
  qualityRating: number,
  timeSpentSeconds: number
): Promise<void> => {
  const scheduleDoc = await db.collection('spaced_repetition_schedule').doc(scheduleId).get();

  if (!scheduleDoc.exists) {
    throw new Error('Schedule not found');
  }

  const schedule = scheduleDoc.data();

  const { newEaseFactor, newInterval, newMasteryLevel } = calculateNextReview(
    schedule.easeFactor,
    schedule.intervalDays,
    qualityRating,
    schedule.repetitionCount
  );

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  await db.collection('spaced_repetition_schedule').doc(scheduleId).update({
    ease_factor: newEaseFactor,
    interval_days: newInterval,
    repetition_count: schedule.repetitionCount + 1,
    last_reviewed_at: new Date().toISOString(),
    next_review_date: nextReviewDate.toISOString().split('T')[0],
    mastery_level: newMasteryLevel
  });

  await db.collection('flashcard_reviews').add({
    schedule_id: scheduleId,
    student_id: studentId,
    flashcard_id: flashcardId,
    quality_rating: qualityRating,
    time_spent_seconds: timeSpentSeconds,
    reviewed_at: new Date().toISOString(),
    was_correct: qualityRating >= 3
  });
};

export const assignFlashcardsToStudent = async (
  studentId: string,
  flashcardIds: string[]
): Promise<void> => {
  const result = await db.collection('spaced_repetition_schedule')
    .where('student_id', '==', studentId)
    .get();

  const existingSchedules = result.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const existingFlashcardIds = new Set(existingSchedules.map((s: any) => s.flashcardId));

  const newFlashcards = flashcardIds.filter(id => !existingFlashcardIds.has(id));

  for (const flashcardId of newFlashcards) {
    await db.collection('spaced_repetition_schedule').add({
      student_id: studentId,
      flashcard_id: flashcardId,
      ease_factor: SM2_INITIAL_EASE_FACTOR,
      interval_days: SM2_INITIAL_INTERVAL,
      repetition_count: 0,
      next_review_date: new Date().toISOString().split('T')[0],
      mastery_level: 0
    });
  }
};

export const getStudentFlashcardStats = async (studentId: string) => {
  const result = await db.collection('spaced_repetition_schedule')
    .where('student_id', '==', studentId)
    .get();

  const schedules = result.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueCount = schedules.filter((s: any) => {
    if (!s.nextReviewDate) return false;
    const reviewDate = new Date(s.nextReviewDate);
    reviewDate.setHours(0, 0, 0, 0);
    return reviewDate <= today;
  }).length;

  const totalCount = schedules.length;

  const masteryLevels = schedules.reduce((acc: any, s: any) => {
    const level = s.masteryLevel !== undefined && s.masteryLevel !== null ? s.masteryLevel : 0;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  const reviewResult = await db.collection('flashcard_reviews')
    .where('student_id', '==', studentId)
    .get();

  const reviews = reviewResult.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const today7Days = new Date();
  today7Days.setDate(today7Days.getDate() - 7);
  const recentReviews = reviews.filter((r: any) => {
    if (!r.reviewedAt) return false;
    return new Date(r.reviewedAt) >= today7Days;
  });

  return {
    totalFlashcards: totalCount,
    dueToday: dueCount,
    masteryDistribution: masteryLevels,
    totalReviews: reviews.length,
    reviewsThisWeek: recentReviews.length,
    averageQuality: reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.qualityRating, 0) / reviews.length
      : 0
  };
};

export const generateMiniQuiz = async (
  studentId: string,
  subject?: string,
  count: number = 5
): Promise<Flashcard[]> => {
  let query = db.collection('spaced_repetition_schedule')
    .where('student_id', '==', studentId);

  const result = await query.get();
  const schedules = result.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueSchedules = schedules.filter((s: any) => {
    if (!s.nextReviewDate) return false;
    const reviewDate = new Date(s.nextReviewDate);
    reviewDate.setHours(0, 0, 0, 0);
    return reviewDate <= today;
  });

  const selectedSchedules = dueSchedules
    .sort(() => Math.random() - 0.5)
    .slice(0, count);

  const flashcards = await Promise.all(
    selectedSchedules.map(async (schedule: any) => {
      const flashcardDoc = await db.collection('flashcards').doc(schedule.flashcardId).get();
      if (flashcardDoc.exists) {
        return flashcardDoc.data();
      }
      return null;
    })
  );

  return flashcards.filter(f => f !== null) as Flashcard[];
};
