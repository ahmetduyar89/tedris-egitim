import React, { useState, useEffect } from 'react';
import { assessmentService, Question, Answer } from '../services/assessmentService';
import { User } from '../types';

interface DiagnosticTestPageProps {
    user: User;
    onComplete: () => void;
}

const DiagnosticTestPage: React.FC<DiagnosticTestPageProps> = ({ user, onComplete }) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [results, setResults] = useState<{ total: number, correct: number } | null>(null);

    useEffect(() => {
        const initTest = async () => {
            try {
                const [qs, sid] = await Promise.all([
                    assessmentService.getDiagnosticQuestions(),
                    assessmentService.startSession(user.id)
                ]);
                setQuestions(qs);
                setSessionId(sid);
            } catch (error) {
                console.error('Failed to init test:', error);
            } finally {
                setLoading(false);
            }
        };
        initTest();
    }, [user.id]);

    const handleAnswer = (val: string) => {
        setAnswers(prev => ({
            ...prev,
            [questions[currentIndex].id]: val
        }));
    };

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const prevQuestion = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const submitTest = async () => {
        if (!sessionId) return;
        setIsSubmitting(true);
        try {
            const formattedAnswers: Answer[] = questions.map(q => ({
                questionId: q.id,
                studentAnswer: answers[q.id] || ''
            }));
            const res = await assessmentService.submitTest(sessionId, user.id, formattedAnswers);

            // Generate adaptive study plan based on new results
            try {
                await assessmentService.generateWeeklyPlan(user.id);
            } catch (planError) {
                console.error('Study plan generation failed:', planError);
                // We don't block the UI for this, just log it
            }

            setResults(res);
        } catch (error) {
            console.error('Submission failed:', error);
            alert('Sınav gönderilirken bir hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (results) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Test Tamamlandı!</h2>
                    <p className="text-gray-600 mb-6">Başarıyla bitirdiniz. İşte sonucunuz:</p>
                    <div className="bg-indigo-50 rounded-2xl p-6 mb-8">
                        <div className="text-5xl font-black text-primary mb-1">
                            {results.correct} / {results.total}
                        </div>
                        <div className="text-sm font-medium text-indigo-600 uppercase tracking-widest">Doğru Cevap</div>
                    </div>
                    <button
                        onClick={onComplete}
                        className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                        Panele Dön
                    </button>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Henüz soru eklenmemiş.</p>
            </div>
        );
    }

    const currentQ = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${currentQ.subject === 'math' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                        {currentQ.subject === 'math' ? '🔢' : '🧬'}
                    </div>
                    <h1 className="font-bold text-gray-800">Tanı Testi</h1>
                </div>
                <div className="text-sm font-medium text-gray-500">
                    Soru {currentIndex + 1} / {questions.length}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-gray-200">
                <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            {/* Main Content */}
            <main className="flex-1 max-w-3xl mx-auto w-full p-6 flex flex-col">
                <div className="flex-1 bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-6">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase tracking-wider">
                            {currentQ.topic}
                        </span>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${currentQ.difficulty === 'easy' ? 'bg-green-100 text-green-600' :
                            currentQ.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                'bg-red-100 text-red-600'
                            }`}>
                            {currentQ.difficulty}
                        </span>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-8 leading-relaxed">
                        {currentQ.question_text}
                    </h2>

                    <div className="mt-8">
                        <label className="block text-sm font-medium text-gray-500 mb-3">Cevabınız:</label>
                        <input
                            type="text"
                            value={answers[currentQ.id] || ''}
                            onChange={(e) => handleAnswer(e.target.value)}
                            placeholder="Cevabınızı buraya yazın..."
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white p-4 rounded-2xl text-xl font-medium outline-none transition-all shadow-inner"
                        />
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center gap-4">
                    <button
                        onClick={prevQuestion}
                        disabled={currentIndex === 0}
                        className="px-8 py-4 bg-white text-gray-600 font-bold rounded-2xl shadow-md hover:shadow-lg disabled:opacity-30 transition-all border border-gray-100"
                    >
                        Geri
                    </button>

                    {currentIndex === questions.length - 1 ? (
                        <button
                            onClick={submitTest}
                            disabled={isSubmitting}
                            className="flex-1 bg-primary text-white font-bold py-4 rounded-2xl shadow-indigo-200 shadow-xl hover:bg-primary-dark transition-all flex justify-center items-center"
                        >
                            {isSubmitting ? (
                                <div className="animate-spin h-6 w-6 border-b-2 border-white rounded-full"></div>
                            ) : 'Testi Bitir'}
                        </button>
                    ) : (
                        <button
                            onClick={nextQuestion}
                            className="flex-1 bg-primary text-white font-bold py-4 rounded-2xl shadow-indigo-200 shadow-xl hover:bg-primary-dark transition-all"
                        >
                            Sıradaki Soru
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
};

export default DiagnosticTestPage;
