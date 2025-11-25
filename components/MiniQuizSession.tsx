import React, { useState, useEffect } from 'react';
import { Flashcard, MiniQuizQuestion } from '../types';
import FlashcardViewer from './FlashcardViewer';

interface MiniQuizSessionProps {
  flashcards: Flashcard[];
  onComplete: (results: { score: number; totalQuestions: number; correctAnswers: number; durationSeconds: number }) => void;
  onCancel: () => void;
}

const MiniQuizSession: React.FC<MiniQuizSessionProps> = ({ flashcards, onComplete, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizResults, setQuizResults] = useState<MiniQuizQuestion[]>([]);
  const [startTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentIndex]);

  const handleRating = (rating: number) => {
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const isCorrect = rating >= 3;

    const result: MiniQuizQuestion = {
      flashcard: flashcards[currentIndex],
      userAnswer: isCorrect ? 'Doğru' : 'Yanlış',
      isCorrect,
      timeSpent
    };

    const updatedResults = [...quizResults, result];
    setQuizResults(updatedResults);

    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      const totalDuration = Math.floor((Date.now() - startTime) / 1000);
      const correctCount = updatedResults.filter(r => r.isCorrect).length;
      const score = Math.round((correctCount / flashcards.length) * 100);

      onComplete({
        score,
        totalQuestions: flashcards.length,
        correctAnswers: correctCount,
        durationSeconds: totalDuration
      });
    }
  };

  if (flashcards.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Mini quiz için yeterli kart bulunamadı.</p>
        <button onClick={onCancel} className="mt-4 bg-gray-500 text-white px-6 py-2 rounded-xl hover:bg-gray-600">
          Geri Dön
        </button>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Mini Quiz</h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              İptal
            </button>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Soru {currentIndex + 1} / {flashcards.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="text-center mb-2">
            <span className="inline-block bg-purple-100 text-purple-800 px-4 py-1 rounded-full text-sm font-semibold">
              {flashcards[currentIndex].subject} - {flashcards[currentIndex].topic}
            </span>
          </div>
        </div>

        <FlashcardViewer
          flashcard={flashcards[currentIndex]}
          onRate={handleRating}
          showRating={true}
        />

        <div className="mt-6 bg-white rounded-2xl shadow-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-2xl font-bold text-purple-600">{quizResults.filter(r => r.isCorrect).length}</div>
              <div className="text-gray-600">Doğru</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{quizResults.filter(r => !r.isCorrect).length}</div>
              <div className="text-gray-600">Yanlış</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{flashcards.length - quizResults.length}</div>
              <div className="text-gray-600">Kalan</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniQuizSession;
