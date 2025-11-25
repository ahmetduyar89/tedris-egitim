import React, { useState, useEffect } from 'react';
import { getDueFlashcards, getStudentFlashcardStats } from '../services/spacedRepetitionService';

interface FlashcardWidgetProps {
  studentId: string;
  onOpenFlashcards: () => void;
}

const FlashcardWidget: React.FC<FlashcardWidgetProps> = ({ studentId, onOpenFlashcards }) => {
  const [dueCount, setDueCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [studentId]);

  const loadStats = async () => {
    try {
      const [dueFlashcards, stats] = await Promise.all([
        getDueFlashcards(studentId),
        getStudentFlashcardStats(studentId)
      ]);
      setDueCount(dueFlashcards.length);
      setTotalCount(stats.totalFlashcards);
    } catch (error) {
      console.error('Error loading flashcard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card-background p-6 rounded-2xl shadow-lg border-l-4 border-purple-500">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-2xl shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <span className="text-3xl mr-3">🔄</span>
          <h2 className="text-xl font-bold font-poppins text-gray-800">Aralıklı Tekrar</h2>
        </div>
      </div>

      {dueCount > 0 ? (
        <div className="space-y-3">
          <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-purple-600">{dueCount}</div>
                <div className="text-sm text-gray-600">Bugün Tekrar Et</div>
              </div>
              <div className="text-4xl">📚</div>
            </div>
          </div>

          <button
            onClick={onOpenFlashcards}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105 shadow-md"
          >
            Hemen Başla
          </button>

          <div className="text-xs text-gray-500 text-center">
            Toplam {totalCount} kart
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-white rounded-xl p-4 border-2 border-green-200">
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <span className="text-2xl">✅</span>
              <span className="font-semibold">Bugün için tamamlandı!</span>
            </div>
          </div>

          <button
            onClick={onOpenFlashcards}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
          >
            Detayları Gör
          </button>

          <div className="text-xs text-gray-500 text-center">
            Toplam {totalCount} kart • Hepsi güncel
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardWidget;
