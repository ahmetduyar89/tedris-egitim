import React, { useState } from 'react';
import { TurkishContentLibraryItem } from '../types';

interface TurkishContentCardProps {
    content: TurkishContentLibraryItem;
    onMarkAsLearned: () => void;
    onNext: () => void;
    currentIndex: number;
    totalCount: number;
    isLearned: boolean;
}

const TurkishContentCard: React.FC<TurkishContentCardProps> = ({
    content,
    onMarkAsLearned,
    onNext,
    currentIndex,
    totalCount,
    isLearned
}) => {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const getCategoryIcon = () => {
        switch (content.category) {
            case 'vocabulary':
                return '📖';
            case 'idiom':
                return '💬';
            case 'proverb':
                return '🎯';
            default:
                return '📚';
        }
    };

    const getCategoryName = () => {
        switch (content.category) {
            case 'vocabulary':
                return 'Kelime';
            case 'idiom':
                return 'Deyim';
            case 'proverb':
                return 'Atasözü';
            default:
                return 'İçerik';
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] p-4">
            {/* Progress indicator */}
            <div className="mb-6 text-center">
                <p className="text-sm text-gray-600 mb-2">
                    {getCategoryIcon()} {getCategoryName()} {currentIndex + 1}/{totalCount}
                </p>
                <div className="w-64 bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
                    />
                </div>
            </div>

            {/* Flip card */}
            <div className="w-full max-w-md" style={{ perspective: '1000px' }}>
                <div
                    className="relative w-full h-80 transition-all duration-500"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                    }}
                >
                    {/* Front side */}
                    <div
                        className="absolute w-full h-full"
                        style={{
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden'
                        }}
                    >
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center text-white">
                            <div className="text-6xl mb-4">{getCategoryIcon()}</div>
                            <h2 className="text-3xl font-bold text-center mb-4">
                                {content.frontContent}
                            </h2>
                            <button
                                onClick={handleFlip}
                                className="mt-auto bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-semibold transition-all"
                            >
                                Çevir 🔄
                            </button>
                        </div>
                    </div>

                    {/* Back side */}
                    <div
                        className="absolute w-full h-full"
                        style={{
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)'
                        }}
                    >
                        <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-2xl p-8 flex flex-col text-white">
                            <div className="text-4xl mb-2 text-center">{getCategoryIcon()}</div>
                            <h3 className="text-2xl font-bold text-center mb-4">
                                {content.frontContent}
                            </h3>
                            <div className="flex-1 flex flex-col justify-center">
                                <p className="text-xl text-center mb-4 leading-relaxed">
                                    {content.backContent}
                                </p>
                                {content.exampleSentence && (
                                    <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg p-4">
                                        <p className="text-sm font-semibold mb-1">Örnek:</p>
                                        <p className="text-base italic">
                                            {content.exampleSentence}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleFlip}
                                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-2 rounded-lg font-semibold transition-all"
                            >
                                Geri Çevir 🔄
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="mt-8 flex gap-4">
                {!isLearned && (
                    <button
                        onClick={onMarkAsLearned}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg"
                    >
                        ✓ Öğrendim
                    </button>
                )}
                <button
                    onClick={onNext}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg"
                >
                    Sonraki →
                </button>
            </div>

            {isLearned && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                    <span className="text-sm font-semibold text-green-700">
                        ✓ Öğrenildi
                    </span>
                </div>
            )}
        </div>
    );
};

export default TurkishContentCard;
