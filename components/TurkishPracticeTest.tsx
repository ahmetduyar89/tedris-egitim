import React, { useState, useEffect } from 'react';
import { TurkishContentLibraryItem } from '../types';

interface TurkishPracticeTestProps {
    contents: TurkishContentLibraryItem[];
    onComplete: (score: number, results: { contentId: string; isCorrect: boolean }[]) => void;
    onBack: () => void;
}

interface QuestionResult {
    contentId: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
}

const TurkishPracticeTest: React.FC<TurkishPracticeTestProps> = ({
    contents,
    onComplete,
    onBack
}) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [results, setResults] = useState<QuestionResult[]>([]);
    const [shuffledContents, setShuffledContents] = useState<TurkishContentLibraryItem[]>([]);
    const [isComplete, setIsComplete] = useState(false);

    // Shuffle contents on mount
    useEffect(() => {
        const shuffled = [...contents].sort(() => Math.random() - 0.5);
        setShuffledContents(shuffled);
    }, [contents]);

    const currentContent = shuffledContents[currentQuestionIndex];
    const correctCount = results.filter(r => r.isCorrect).length;
    const incorrectCount = results.filter(r => !r.isCorrect).length;

    const handleSubmitAnswer = () => {
        if (!userAnswer.trim()) {
            alert('Lütfen bir cevap girin!');
            return;
        }

        const normalizedUserAnswer = userAnswer.trim().toLowerCase();
        const normalizedCorrectAnswer = currentContent.backContent.toLowerCase();

        // Simple similarity check - could be improved
        const isCorrect = normalizedCorrectAnswer.includes(normalizedUserAnswer) ||
            normalizedUserAnswer.includes(normalizedCorrectAnswer) ||
            normalizedUserAnswer === normalizedCorrectAnswer;

        const result: QuestionResult = {
            contentId: currentContent.id,
            question: currentContent.frontContent,
            userAnswer: userAnswer.trim(),
            correctAnswer: currentContent.backContent,
            isCorrect
        };

        setResults([...results, result]);
        setShowFeedback(true);
    };

    const handleNext = () => {
        setShowFeedback(false);
        setUserAnswer('');

        if (currentQuestionIndex < shuffledContents.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            // Test complete
            setIsComplete(true);
        }
    };

    const handleFinish = () => {
        const score = Math.round((correctCount / shuffledContents.length) * 100);
        const simpleResults = results.map(r => ({
            contentId: r.contentId,
            isCorrect: r.isCorrect
        }));
        onComplete(score, simpleResults);
    };

    const handleRetryIncorrect = () => {
        const incorrectItems = results
            .filter(r => !r.isCorrect)
            .map(r => contents.find(c => c.id === r.contentId))
            .filter((c): c is TurkishContentLibraryItem => c !== undefined);

        if (incorrectItems.length > 0) {
            setShuffledContents(incorrectItems.sort(() => Math.random() - 0.5));
            setCurrentQuestionIndex(0);
            setResults([]);
            setUserAnswer('');
            setShowFeedback(false);
            setIsComplete(false);
        }
    };

    if (!currentContent) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (isComplete) {
        const scorePercentage = Math.round((correctCount / shuffledContents.length) * 100);
        const hasIncorrect = incorrectCount > 0;

        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center mb-6">
                        <div className="text-6xl mb-4">
                            {scorePercentage >= 80 ? '🎉' : scorePercentage >= 60 ? '👍' : '💪'}
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Test Tamamlandı!
                        </h2>
                        <p className="text-gray-600">
                            {shuffledContents.length} sorudan {correctCount} doğru cevap
                        </p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6">
                        <div className="text-center">
                            <div className="text-5xl font-bold mb-2">{scorePercentage}%</div>
                            <div className="text-lg">Başarı Oranı</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-green-600">{correctCount}</div>
                            <div className="text-sm text-green-700">Doğru</div>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-red-600">{incorrectCount}</div>
                            <div className="text-sm text-red-700">Yanlış</div>
                        </div>
                    </div>

                    {scorePercentage >= 80 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <p className="text-green-700 text-center">
                                <strong>Harika!</strong> Bu içerikleri başarıyla öğrendiniz.
                                Artık aralıklı tekrar sistemine eklenecek.
                            </p>
                        </div>
                    )}

                    <div className="flex gap-4">
                        {hasIncorrect && scorePercentage < 100 && (
                            <button
                                onClick={handleRetryIncorrect}
                                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                            >
                                🔄 Yanlışları Tekrarla
                            </button>
                        )}
                        <button
                            onClick={handleFinish}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                        >
                            ✓ Tamamla
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="mb-4 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                    ← Geri
                </button>
                <div className="text-sm text-gray-600">
                    Soru {currentQuestionIndex + 1}/{shuffledContents.length}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
                {/* Progress bar */}
                <div className="mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentQuestionIndex + 1) / shuffledContents.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Question */}
                <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                        "{currentContent.frontContent}" ne anlama gelir?
                    </h3>
                </div>

                {!showFeedback ? (
                    <>
                        {/* Answer input */}
                        <div className="mb-6">
                            <textarea
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                placeholder="Cevabınızı yazın..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                rows={3}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmitAnswer();
                                    }
                                }}
                            />
                        </div>

                        {/* Submit button */}
                        <button
                            onClick={handleSubmitAnswer}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                        >
                            Kontrol Et
                        </button>
                    </>
                ) : (
                    <>
                        {/* Feedback */}
                        <div className={`mb-6 p-6 rounded-lg ${results[results.length - 1].isCorrect
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'
                            }`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="text-4xl">
                                    {results[results.length - 1].isCorrect ? '✅' : '❌'}
                                </div>
                                <div className="flex-1">
                                    <h4 className={`text-2xl font-bold ${results[results.length - 1].isCorrect
                                        ? 'text-green-700'
                                        : 'text-red-700'
                                        }`}>
                                        {results[results.length - 1].isCorrect ? 'DOĞRU!' : 'YANLIŞ!'}
                                    </h4>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div>
                                    <span className="font-semibold text-gray-700">Sizin Cevabınız:</span>
                                    <p className="text-gray-900">{results[results.length - 1].userAnswer}</p>
                                </div>
                                {!results[results.length - 1].isCorrect && (
                                    <div>
                                        <span className="font-semibold text-gray-700">Doğru Cevap:</span>
                                        <p className="text-gray-900">{results[results.length - 1].correctAnswer}</p>
                                    </div>
                                )}
                                {currentContent.exampleSentence && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <span className="font-semibold text-gray-700">Örnek Kullanım:</span>
                                        <p className="text-gray-900 italic">{currentContent.exampleSentence}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Next button */}
                        <button
                            onClick={handleNext}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                        >
                            {currentQuestionIndex < shuffledContents.length - 1 ? 'Sonraki Soru →' : 'Sonuçları Gör'}
                        </button>
                    </>
                )}

                {/* Score tracker */}
                <div className="mt-6 pt-6 border-t border-gray-200 flex justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-green-600 font-semibold">✓ Doğru:</span>
                        <span className="text-gray-900 font-bold">{correctCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-red-600 font-semibold">✗ Yanlış:</span>
                        <span className="text-gray-900 font-bold">{incorrectCount}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TurkishPracticeTest;
