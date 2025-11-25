import { getDueFlashcards } from './spacedRepetitionService';
import { createNotification } from './notificationService';
import { db } from './dbAdapter';

export const checkAndSendSpacedRepetitionReminders = async (studentId: string): Promise<void> => {
  try {
    const dueFlashcards = await getDueFlashcards(studentId);

    if (dueFlashcards.length === 0) {
      return;
    }

    const topics = [...new Set(dueFlashcards.map(f => f.flashcard?.topic).filter(Boolean))];
    const topicList = topics.slice(0, 3).join(', ');

    let message = '';
    if (dueFlashcards.length === 1) {
      message = `1 flashcard bugün tekrar edilmesi gerekiyor. Konu: ${topicList}. Hadi 5 dakika ayır!`;
    } else if (dueFlashcards.length <= 5) {
      message = `${dueFlashcards.length} flashcard bugün tekrar edilmesi gerekiyor. Konular: ${topicList}`;
    } else {
      message = `${dueFlashcards.length} flashcard seni bekliyor! Bugün ${Math.min(10, dueFlashcards.length)} tanesini tekrar etmeye ne dersin?`;
    }

    await createNotification(studentId, message, undefined, undefined);
  } catch (error) {
    console.error('Error checking spaced repetition reminders:', error);
  }
};

export const generatePersonalizedReminder = async (studentId: string): Promise<string | null> => {
  try {
    const result = await db.collection('spaced_repetition_schedule')
      .where('student_id', '==', studentId)
      .get();

    const schedules = result.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const dueFlashcards = await getDueFlashcards(studentId);

    if (schedules.length === 0) {
      return null;
    }

    if (dueFlashcards.length === 0) {
      return 'Harika! Bugün için tüm tekrarları tamamladın. Yarın yeni kartlar seni bekliyor.';
    }

    const reviewResult = await db.collection('flashcard_reviews')
      .where('student_id', '==', studentId)
      .get();

    const reviews = reviewResult.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayReviews = reviews.filter((r: any) => new Date(r.reviewed_at) >= today);

    if (todayReviews.length > 0) {
      const remaining = dueFlashcards.length;
      return `Bugün ${todayReviews.length} kart çalıştın, harika! ${remaining} kart daha kaldı.`;
    }

    const lastReview = reviews.length > 0
      ? reviews.reduce((latest: any, current: any) =>
          new Date(current.reviewed_at) > new Date(latest.reviewed_at) ? current : latest
        )
      : null;

    if (lastReview) {
      const daysSinceLastReview = Math.floor(
        (Date.now() - new Date(lastReview.reviewed_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastReview === 1) {
        return `Dün ${dueFlashcards.length} kart çalışmıştın. Bugün de devam edelim mi?`;
      } else if (daysSinceLastReview > 3) {
        return `${daysSinceLastReview} gündür tekrar yapmadın. ${dueFlashcards.length} kart seni bekliyor!`;
      }
    }

    const masteryCount = schedules.filter((s: any) => s.mastery_level >= 4).length;
    if (masteryCount > 0) {
      return `${masteryCount} kartı uzman seviyesinde biliyorsun! ${dueFlashcards.length} kart daha pekiştirmeyi bekliyor.`;
    }

    return `${dueFlashcards.length} flashcard bugün tekrar edilmeli. İlk 5 tanesiyle başla!`;
  } catch (error) {
    console.error('Error generating personalized reminder:', error);
    return null;
  }
};
