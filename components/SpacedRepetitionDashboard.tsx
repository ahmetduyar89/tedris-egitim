import React, { useState, useEffect } from 'react';
import { SpacedRepetitionSchedule } from '../types';
import { getDueFlashcards, getStudentFlashcardStats, recordFlashcardReview, generateMiniQuiz } from '../services/spacedRepetitionService';
import { generatePersonalizedReminder } from '../services/spacedRepetitionNotificationService';
import FlashcardViewer from './FlashcardViewer';
import MiniQuizSession from './MiniQuizSession';
import { db } from '../services/dbAdapter';

interface SpacedRepetitionDashboardProps {
  studentId: string;
}

const SpacedRepetitionDashboard: React.FC<SpacedRepetitionDashboardProps> = ({ studentId }) => {
  const [dueFlashcards, setDueFlashcards] = useState<SpacedRepetitionSchedule[]>([]);
  const [allFlashcards, setAllFlashcards] = useState<SpacedRepetitionSchedule[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizFlashcards, setQuizFlashcards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewStartTime, setReviewStartTime] = useState(Date.now());
  const [personalizedReminder, setPersonalizedReminder] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadReminder();
  }, [studentId]);

  const loadReminder = async () => {
    const reminder = await generatePersonalizedReminder(studentId);
    setPersonalizedReminder(reminder);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [due, statistics] = await Promise.all([
        getDueFlashcards(studentId),
        getStudentFlashcardStats(studentId)
      ]);
      setDueFlashcards(due);
      setStats(statistics);

      const schedulesResult = await db.collection('spaced_repetition_schedule')
        .where('student_id', '==', studentId)
        .get();
      const schedules = schedulesResult.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const allFlashcardsWithSchedule = await Promise.all(
        schedules.map(async (schedule: any) => {
          const flashcardDoc = await db.collection('flashcards').doc(schedule.flashcardId).get();
          if (flashcardDoc.exists) {
            const flashcardData = flashcardDoc.data();
            return {
              id: schedule.id,
              flashcardId: schedule.flashcardId,
              studentId: schedule.studentId,
              easeFactor: schedule.easeFactor,
              intervalDays: schedule.intervalDays,
              repetitionCount: schedule.repetitionCount,
              nextReviewDate: schedule.nextReviewDate,
              lastReviewedAt: schedule.lastReviewedAt,
              masteryLevel: schedule.masteryLevel,
              flashcard: flashcardData
            };
          }
          return null;
        })
      );
      setAllFlashcards(allFlashcardsWithSchedule.filter(Boolean) as SpacedRepetitionSchedule[]);
    } catch (error) {
      console.error('Error loading spaced repetition data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartReview = () => {
    if (dueFlashcards.length > 0) {
      setIsReviewing(true);
      setCurrentFlashcardIndex(0);
      setReviewStartTime(Date.now());
    }
  };

  const handleRating = async (rating: number) => {
    const currentSchedule = dueFlashcards[currentFlashcardIndex];
    const timeSpent = Math.floor((Date.now() - reviewStartTime) / 1000);

    try {
      await recordFlashcardReview(
        currentSchedule.id,
        studentId,
        currentSchedule.flashcardId,
        rating,
        timeSpent
      );

      if (currentFlashcardIndex < dueFlashcards.length - 1) {
        setCurrentFlashcardIndex(currentFlashcardIndex + 1);
        setReviewStartTime(Date.now());
      } else {
        setIsReviewing(false);
        await loadData();
      }
    } catch (error) {
      console.error('Error recording review:', error);
      alert('Değerlendirme kaydedilirken bir hata oluştu.');
    }
  };

  const handleStartQuiz = async () => {
    try {
      const flashcards = await generateMiniQuiz(studentId, undefined, 5);
      if (flashcards.length > 0) {
        setQuizFlashcards(flashcards);
        setIsQuizMode(true);
      } else {
        alert('Mini quiz için yeterli kart bulunamadı. Lütfen daha fazla kart ekleyin.');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Mini quiz oluşturulurken bir hata oluştu.');
    }
  };

  const handleQuizComplete = async (results: any) => {
    try {
      await db.collection('mini_quizzes').add({
        student_id: studentId,
        subject: quizFlashcards[0]?.subject || 'Genel',
        topic: quizFlashcards[0]?.topic || '',
        flashcard_ids: quizFlashcards.map(f => f.id),
        score: results.score,
        total_questions: results.totalQuestions,
        correct_answers: results.correctAnswers,
        duration_seconds: results.durationSeconds,
        completed_at: new Date().toISOString()
      });

      setIsQuizMode(false);
      setQuizFlashcards([]);
      await loadData();

      alert(`Tebrikler! Puanın: ${results.score}/100 (${results.correctAnswers}/${results.totalQuestions} doğru)`);
    } catch (error) {
      console.error('Error saving quiz results:', error);
      alert('Quiz sonuçları kaydedilirken bir hata oluştu.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (isQuizMode) {
    return (
      <MiniQuizSession
        flashcards={quizFlashcards}
        onComplete={handleQuizComplete}
        onCancel={() => setIsQuizMode(false)}
      />
    );
  }

  if (isReviewing && dueFlashcards.length > 0 && dueFlashcards[currentFlashcardIndex].flashcard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Kart Tekrarı</h2>
              <button
                onClick={() => setIsReviewing(false)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Çıkış
              </button>
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Kart {currentFlashcardIndex + 1} / {dueFlashcards.length}</span>
                <span>Ustalık Seviyesi: {dueFlashcards[currentFlashcardIndex].masteryLevel}/5</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${((currentFlashcardIndex + 1) / dueFlashcards.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <FlashcardViewer
            flashcard={dueFlashcards[currentFlashcardIndex].flashcard!}
            onRate={handleRating}
            showRating={true}
          />
        </div>
      </div>
    );
  }

  const masteryLevelColors = ['bg-gray-200', 'bg-red-200', 'bg-orange-200', 'bg-yellow-200', 'bg-lime-200', 'bg-green-200'];
  const masteryLevelLabels = ['Yeni', 'Başlangıç', 'Gelişiyor', 'İyi', 'İleri', 'Uzman'];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Bugün';
    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return 'Yarın';
    if (diffDays < 7) return `${diffDays} gün sonra`;
    return date.toLocaleDateString('tr-TR');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl shadow-xl p-6">
        <h2 className="text-3xl font-bold mb-2">Aralıklı Tekrar Sistemi</h2>
        <p className="text-purple-100">Bilimsel olarak kanıtlanmış öğrenme yöntemi ile konuları pekiştir</p>
        {personalizedReminder && (
          <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
            <p className="text-white font-medium flex items-start">
              <span className="text-2xl mr-3">💬</span>
              <span>{personalizedReminder}</span>
            </p>
          </div>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="text-3xl font-bold text-blue-600">{stats.totalFlashcards}</div>
            <div className="text-sm text-gray-600">Toplam Kart</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="text-3xl font-bold text-orange-600">{stats.dueToday}</div>
            <div className="text-sm text-gray-600">Bugün Tekrar</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="text-3xl font-bold text-green-600">{stats.reviewsThisWeek}</div>
            <div className="text-sm text-gray-600">Bu Hafta Tekrar</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="text-3xl font-bold text-purple-600">{stats.averageQuality.toFixed(1)}/5</div>
            <div className="text-sm text-gray-600">Ortalama Performans</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <span className="text-3xl mr-3">🔄</span>
            Günlük Tekrar
          </h3>
          <p className="text-gray-600 mb-4">
            {dueFlashcards.length > 0
              ? `Bugün ${dueFlashcards.length} kart tekrar etmen gerekiyor.`
              : 'Bugün için tekrar edilecek kart yok. Harika iş!'}
          </p>
          <button
            onClick={handleStartReview}
            disabled={dueFlashcards.length === 0}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all"
          >
            {dueFlashcards.length > 0 ? 'Tekrara Başla' : 'Tekrar Yok'}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <span className="text-3xl mr-3">⚡</span>
            Mini Quiz (3-5 dk)
          </h3>
          <p className="text-gray-600 mb-4">
            Hızlı bir quiz ile bilgilerini test et. Random 5 kart.
          </p>
          <button
            onClick={handleStartQuiz}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all"
          >
            Mini Quiz Başlat
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <span className="text-3xl mr-3">📚</span>
            Tüm Kartlarım
          </h3>
          <p className="text-gray-600 mb-4">
            {allFlashcards.length > 0
              ? `Toplam ${allFlashcards.length} kartın var. Hepsini gör!`
              : 'Henüz hiç kartın yok.'}
          </p>
          <button
            onClick={() => {
              const element = document.getElementById('all-flashcards-section');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
            disabled={allFlashcards.length === 0}
            className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-teal-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all"
          >
            {allFlashcards.length > 0 ? 'Kartları Görüntüle' : 'Kart Yok'}
          </button>
        </div>
      </div>

      {stats && stats.masteryDistribution && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Ustalık Seviyesi Dağılımı</h3>
          <div className="space-y-3">
            {Object.entries(stats.masteryDistribution).map(([level, count]: [string, any]) => {
              const levelNum = parseInt(level);
              const percentage = stats.totalFlashcards > 0 ? (count / stats.totalFlashcards) * 100 : 0;
              return (
                <div key={level}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{masteryLevelLabels[levelNum]}</span>
                    <span className="text-gray-600">{count} kart ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`${masteryLevelColors[levelNum]} h-3 transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div id="all-flashcards-section" className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <span className="text-2xl mr-2">📚</span>
          Tüm Flashcard'larım
        </h3>
          {allFlashcards.length > 0 ? (
            <div className="space-y-3">
              {allFlashcards
                .sort((a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime())
                .map((schedule) => {
                  const isDue = new Date(schedule.nextReviewDate) <= new Date();
                  return (
                    <div
                      key={schedule.id}
                      className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                        isDue
                          ? 'bg-orange-50 border-orange-300'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs font-semibold px-2 py-1 bg-purple-100 text-purple-700 rounded">
                              {schedule.flashcard?.topic}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${masteryLevelColors[schedule.masteryLevel]}`}>
                              {masteryLevelLabels[schedule.masteryLevel]}
                            </span>
                            {isDue && (
                              <span className="text-xs font-semibold px-2 py-1 bg-orange-100 text-orange-700 rounded">
                                Tekrar Zamanı!
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-gray-800 text-sm mb-1">
                            {schedule.flashcard?.frontContent}
                          </p>
                          <p className="text-gray-600 text-xs">
                            {schedule.flashcard?.backContent}
                          </p>
                        </div>
                        <div className="ml-4 text-right text-xs text-gray-500">
                          <div className="mb-1">
                            <span className="font-semibold">Sonraki Tekrar:</span>
                            <br />
                            {formatDate(schedule.nextReviewDate)}
                          </div>
                          <div>
                            <span className="font-semibold">Tekrar Sayısı:</span> {schedule.repetitionCount}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Henüz hiç flashcard atanmamış.</p>
          )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-2 flex items-center">
          <span className="text-2xl mr-2">💡</span>
          Aralıklı Tekrar Nasıl Çalışır?
        </h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>✅ Bilimsel araştırmalara göre uzun süreli hafızada bilgi tutmayı %200 artırır</li>
          <li>✅ Her kartı performansına göre optimal zamanlarda tekrar edersin</li>
          <li>✅ İyi bildiğin kartlar daha seyrek, zorlandığın kartlar daha sık gelir</li>
          <li>✅ Ustalık seviyesi arttıkça kartlar uzun vadeli hafızana yerleşir</li>
        </ul>
      </div>
    </div>
  );
};

export default SpacedRepetitionDashboard;
