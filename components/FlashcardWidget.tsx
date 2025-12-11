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
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center gap-2">
        <span className="bg-white/20 p-1.5 rounded-lg text-white backdrop-blur-sm">🔄</span>
        <h2 className="text-lg font-bold">Aralıklı Tekrar</h2>
      </div>

      <div className="p-4">
        {dueCount > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100">
              <div>
                <span className="text-3xl font-bold text-purple-600 block">{dueCount}</span>
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">Kart Bekliyor</span>
              </div>
              <div className="bg-white p-2 rounded-full shadow-sm">
                <span className="text-2xl">📚</span>
              </div>
            </div>

            <button
              onClick={onOpenFlashcards}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Hemen Başla</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <div className="text-center">
              <p className="text-[10px] text-gray-400 font-medium">Toplam {totalCount} kart</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 text-center bg-green-50 rounded-xl border border-green-100">
              <span className="text-3xl block mb-2">🎉</span>
              <h3 className="text-green-700 font-bold text-sm">Harika!</h3>
              <p className="text-green-600 text-xs mt-1">Bugünkü tekrarların bitti.</p>
            </div>

            <button
              onClick={onOpenFlashcards}
              className="w-full bg-gray-100 text-gray-600 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition-all text-xs"
            >
              Tüm Kartları Gör
            </button>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 font-medium">Toplam {totalCount} kart • Hepsi güncel</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardWidget;
