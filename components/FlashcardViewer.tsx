import React, { useState } from 'react';
import { Flashcard } from '../types';

interface FlashcardViewerProps {
  flashcard: Flashcard;
  onRate: (rating: number) => void;
  showRating?: boolean;
}

const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ flashcard, onRate, showRating = true }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRating = (rating: number) => {
    setSelectedRating(rating);
    onRate(rating);
  };

  const ratingOptions = [
    { value: 0, label: 'Hiç', emoji: '😰', color: 'bg-red-500' },
    { value: 1, label: 'Zor', emoji: '😕', color: 'bg-orange-500' },
    { value: 2, label: 'Zorlandım', emoji: '😐', color: 'bg-yellow-500' },
    { value: 3, label: 'İyi', emoji: '🙂', color: 'bg-lime-500' },
    { value: 4, label: 'Kolay', emoji: '😊', color: 'bg-green-500' },
    { value: 5, label: 'Çok Kolay', emoji: '🤩', color: 'bg-emerald-500' }
  ];

  const difficultyStars = '⭐'.repeat(flashcard.difficultyLevel);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-full max-w-2xl h-96 cursor-pointer perspective-1000"
        onClick={handleFlip}
      >
        <div
          className={`absolute w-full h-full transition-all duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          <div
            className="absolute w-full h-full backface-hidden bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl p-8 flex flex-col justify-center items-center text-white"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="absolute top-4 right-4 text-2xl">{difficultyStars}</div>
            <div className="text-sm font-semibold mb-2 opacity-80">
              {flashcard.subject} - {flashcard.topic}
            </div>
            <div className="text-3xl font-bold text-center mb-4">
              {flashcard.frontContent}
            </div>
            <div className="text-sm opacity-70 mt-4">Tıklayarak çevir</div>
          </div>

          <div
            className="absolute w-full h-full backface-hidden bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-2xl p-8 flex flex-col justify-center items-center text-white"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="text-sm font-semibold mb-2 opacity-80">Cevap</div>
            <div className="text-2xl text-center leading-relaxed">
              {flashcard.backContent}
            </div>
            <div className="text-sm opacity-70 mt-4">Tıklayarak geri dön</div>
          </div>
        </div>
      </div>

      {showRating && isFlipped && (
        <div className="mt-8 w-full max-w-2xl">
          <h3 className="text-lg font-semibold text-center mb-4 text-gray-700">
            Bu kartı ne kadar iyi biliyordun?
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {ratingOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleRating(option.value)}
                className={`${option.color} ${
                  selectedRating === option.value ? 'ring-4 ring-blue-400 scale-105' : ''
                } text-white rounded-xl p-4 hover:scale-105 transition-all duration-200 shadow-lg flex flex-col items-center justify-center`}
              >
                <span className="text-3xl mb-1">{option.emoji}</span>
                <span className="text-xs font-semibold">{option.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-500 text-center">
            <p>0-2: Kartı tekrar göreceksin • 3-5: Sonraki tekrar zamanı uzatılacak</p>
          </div>
        </div>
      )}

      {!isFlipped && (
        <div className="mt-4 text-gray-500 text-sm text-center">
          <p>Önce cevabı düşün, sonra kartı çevir</p>
        </div>
      )}
    </div>
  );
};

export default FlashcardViewer;
