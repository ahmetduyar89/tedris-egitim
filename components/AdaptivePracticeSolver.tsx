import React, { useState, useMemo, useCallback } from 'react';
import { Test, Question, QuestionType, Subject, Difficulty } from '../types';
import { explainWrongAnswer, generateTestQuestions, checkAnswer, generateRemedialQuestion } from '../services/optimizedAIService';

interface AdaptivePracticeSolverProps {
    test: Test;
    onComplete: (finalTest: Test) => void;
    onCancel: () => void;
}

const AdaptivePracticeSolver: React.FC<AdaptivePracticeSolverProps> = ({ test, onComplete, onCancel }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [remedialQuestion, setRemedialQuestion] = useState<Question | null>(null);
    const [explanation, setExplanation] = useState<string | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [completedQuestions, setCompletedQuestions] = useState<Question[]>([]);

    const currentQuestion = useMemo(() => {
        return remedialQuestion || test.questions[currentQuestionIndex];
    }, [remedialQuestion, test.questions, currentQuestionIndex]);

    const handleAnswerChange = (answer: string) => {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
    };

    const handleNext = async () => {
        const studentAnswer = answers[currentQuestion.id];
        if (!studentAnswer) {
            setError('Lütfen bir cevap seçiniz.');
            return;
        }

        setError(null);
        setIsProcessing(true);

        try {
            const correctAnswer = currentQuestion.correctAnswer;
            const isCorrect = studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

            if (isCorrect) {
                // Correct answer!
                const updatedQuestion = { ...currentQuestion, studentAnswer, isCorrect: true };

                if (remedialQuestion) {
                    // We were on a remedial question, now we can go back to the main track
                    setRemedialQuestion(null);
                    setExplanation(null);
                    setShowExplanation(false);
                } else {
                    // Advance to next question in main track
                    setCompletedQuestions(prev => [...prev, updatedQuestion]);
                    if (currentQuestionIndex < test.questions.length - 1) {
                        setCurrentQuestionIndex(prev => prev + 1);
                    } else {
                        // Test finished
                        const finalTest: Test = {
                            ...test,
                            completed: true,
                            questions: [...completedQuestions, updatedQuestion],
                            score: Math.round(([...completedQuestions, updatedQuestion].filter(q => q.isCorrect).length / test.questions.length) * 100),
                            submissionDate: new Date().toISOString()
                        };
                        onComplete(finalTest);
                    }
                }
            } else {
                // Wrong answer! Trigger adaptive remediation
                const aiExplanation = await explainWrongAnswer(
                    currentQuestion.text,
                    currentQuestion.options || [],
                    currentQuestion.correctAnswer,
                    studentAnswer,
                    test.subject,
                    test.grade
                );

                setExplanation(aiExplanation);
                setShowExplanation(true);

                // Generate a remedial question
                const remedialQ = await generateRemedialQuestion(
                    currentQuestion.text,
                    currentQuestion.topic || test.unit,
                    test.subject,
                    test.grade
                );

                if (remedialQ) {
                    setRemedialQuestion(remedialQ);
                }
            }
        } catch (err) {
            console.error('Adaptive flow error:', err);
            setError('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-inter">
            <header className="bg-white shadow-sm p-4 flex justify-between items-center border-b">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">{test.title}</h1>
                    <p className="text-sm text-gray-500">Adaptif Pratik Modu</p>
                </div>
                <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
                <div className="w-full max-w-3xl space-y-6">
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-500"
                            style={{ width: `${((currentQuestionIndex) / test.questions.length) * 100}%` }}
                        ></div>
                    </div>

                    {showExplanation && explanation && (
                        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl animate-fade-in">
                            <div className="flex items-center space-x-2 mb-3 text-amber-800">
                                <span className="text-2xl">💡</span>
                                <h3 className="font-bold">Öğretmen Notu</h3>
                            </div>
                            <div className="text-amber-900 whitespace-pre-wrap leading-relaxed">
                                {explanation}
                            </div>
                            <div className="mt-4 p-3 bg-amber-100 rounded-xl text-amber-800 text-sm font-medium">
                                Hedef "Tam Öğrenme": Şimdi bu benzer soruyu doğru cevaplayarak ilerleyelim.
                            </div>
                        </div>
                    )}

                    <div className={`bg-white p-6 md:p-8 rounded-2xl shadow-sm border ${remedialQuestion ? 'border-primary ring-1 ring-primary/20' : 'border-gray-200'}`}>
                        {remedialQuestion && (
                            <div className="mb-4 inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                                Pekiştirme Sorusu
                            </div>
                        )}
                        <p className="text-sm text-gray-400 mb-2">Soru {currentQuestionIndex + 1} / {test.questions.length}</p>
                        <h2 className="text-xl font-bold text-gray-800 mb-6 leading-snug">{currentQuestion.text}</h2>
                        <div className="space-y-3">
                            {currentQuestion.options?.map((option, idx) => (
                                <label
                                    key={idx}
                                    className={`flex items-center p-4 border rounded-xl transition-all cursor-pointer hover:bg-gray-50 has-[:checked]:bg-primary/5 has-[:checked]:border-primary group`}
                                >
                                    <input
                                        type="radio"
                                        name={currentQuestion.id}
                                        value={option}
                                        checked={answers[currentQuestion.id] === option}
                                        onChange={(e) => handleAnswerChange(e.target.value)}
                                        disabled={isProcessing}
                                        className="h-5 w-5 text-primary border-gray-300 focus:ring-primary"
                                    />
                                    <span className="ml-3 text-gray-700 font-medium group-has-[:checked]:text-primary transition-colors">{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm font-medium flex items-center bg-red-50 p-3 rounded-xl border border-red-100">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {error}
                        </div>
                    )}
                </div>
            </main>

            <footer className="bg-white border-t p-4 flex justify-center sticky bottom-0">
                <button
                    onClick={handleNext}
                    disabled={isProcessing}
                    className="w-full max-w-md bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                    {isProcessing ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span>Kontrol Ediliyor...</span>
                        </>
                    ) : (
                        <span>{currentQuestionIndex === test.questions.length - 1 && !remedialQuestion ? 'Testi Bitir' : 'Cevapla ve Devam Et'}</span>
                    )}
                </button>
            </footer>
        </div>
    );
};

export default AdaptivePracticeSolver;
