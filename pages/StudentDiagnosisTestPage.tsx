import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { diagnosisTestManagementService } from '../services/diagnosisTestManagementService';
import { DiagnosisTestAssignment, DiagnosisTestQuestion } from '../types/diagnosisTestTypes';
import { analyzeDiagnosisTest } from '../services/secureAIService';


interface StudentDiagnosisTestPageProps {
    user: User;
    assignmentId: string;
    onBack: () => void;
    onComplete: () => void;
}

const StudentDiagnosisTestPage: React.FC<StudentDiagnosisTestPageProps> = ({
    user,
    assignmentId,
    onBack,
    onComplete
}) => {
    const [assignment, setAssignment] = useState<DiagnosisTestAssignment | null>(null);
    const [questions, setQuestions] = useState<DiagnosisTestQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [showAiFeedback, setShowAiFeedback] = useState(false);
    const [aiExplanation, setAiExplanation] = useState<string | null>(null);
    const [isAiExplaining, setIsAiExplaining] = useState(false);
    const [lastCheckedQuestionId, setLastCheckedQuestionId] = useState<string | null>(null);

    useEffect(() => {
        loadTest();
    }, [assignmentId]);

    useEffect(() => {
        if (timeLeft === null) return;
        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => (prev !== null ? prev - 1 : null));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const loadTest = async () => {
        try {
            setIsLoading(true);
            // Assignment detaylarını çek
            const studentAssignments = await diagnosisTestManagementService.getStudentAssignments(user.id);
            const currentAssignment = studentAssignments.find(a => a.id === assignmentId);

            if (!currentAssignment || !currentAssignment.test) {
                throw new Error('Test bulunamadı');
            }

            setAssignment(currentAssignment);

            // Soruları çek
            const testQuestions = await diagnosisTestManagementService.getTestQuestions(currentAssignment.testId);
            setQuestions(testQuestions);

            // Varsa önceki cevapları çek
            const existingAnswers = await diagnosisTestManagementService.getAssignmentAnswers(assignmentId);
            const answersMap: Record<string, string> = {};
            existingAnswers.forEach(a => {
                answersMap[a.questionId] = a.studentAnswer || '';
            });
            setAnswers(answersMap);

            // Test başlamadıysa başlat
            if (currentAssignment.status === 'pending') {
                await diagnosisTestManagementService.startTest(assignmentId);
            }

            // Süreyi ayarla (dk -> sn)
            if (currentAssignment.test.durationMinutes) {
                // Eğer test daha önce başladıysa kalan süreyi hesapla
                if (currentAssignment.startedAt) {
                    const startTime = new Date(currentAssignment.startedAt).getTime();
                    const now = new Date().getTime();
                    const elapsedSeconds = Math.floor((now - startTime) / 1000);
                    const totalSeconds = currentAssignment.test.durationMinutes * 60;
                    const remaining = Math.max(0, totalSeconds - elapsedSeconds);
                    setTimeLeft(remaining);
                } else {
                    setTimeLeft(currentAssignment.test.durationMinutes * 60);
                }
            }
        } catch (error) {
            console.error('Error loading test:', error);
            alert('Test yüklenirken bir hata oluştu.');
            onBack();
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerSelect = async (option: string) => {
        const currentQuestion = questions[currentQuestionIndex];

        // State güncelle
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: option
        }));

        // Reset feedback when answer changes
        setShowAiFeedback(false);
        setAiExplanation(null);

        // Veritabanına kaydet (arkaplanda)
        try {
            await diagnosisTestManagementService.saveAnswer(assignmentId, currentQuestion.id, option);
        } catch (error) {
            console.error('Error saving answer:', error);
        }
    };

    const handleCheckAnswer = async () => {
        const currentQuestion = questions[currentQuestionIndex];
        const studentAnswer = answers[currentQuestion.id];

        if (!studentAnswer) {
            alert('Lütfen bir seçenek belirleyin!');
            return;
        }

        const isCorrect = studentAnswer.trim() === currentQuestion.correctAnswer.trim();

        if (!isCorrect) {
            setIsAiExplaining(true);
            try {
                const { explainWrongAnswer } = await import('../services/optimizedAIService');
                const explanation = await explainWrongAnswer(
                    currentQuestion.questionText,
                    currentQuestion.options,
                    currentQuestion.correctAnswer,
                    studentAnswer,
                    assignment?.test?.subject,
                    assignment?.test?.grade
                );
                setAiExplanation(explanation);
                setShowAiFeedback(true);
                setLastCheckedQuestionId(currentQuestion.id);
            } catch (error) {
                console.error('Error getting AI explanation:', error);
            } finally {
                setIsAiExplaining(false);
            }
        } else {
            // Correct answer - move to next or show success?
            // User requested explanations for WRONG answers.
            setAiExplanation('Harika! Doğru cevap.');
            setShowAiFeedback(true);
            setLastCheckedQuestionId(currentQuestion.id);
        }
    };

    const handleNextQuestion = () => {
        setShowAiFeedback(false);
        setAiExplanation(null);
        setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1));
    };

    const handleSubmit = async () => {
        if (!assignment || !assignment.test) return;

        setIsSubmitting(true);

        try {
            // 1. Sonuçları hesapla
            let correctCount = 0;
            const moduleResultsMap = new Map<string, { correct: number; total: number; name: string }>();

            questions.forEach(q => {
                const answer = answers[q.id];
                let isCorrect = false;

                if (answer) {
                    const cleanAnswer = answer.trim();
                    const cleanCorrect = q.correctAnswer.trim();

                    // 1. Tam eşleşme
                    if (cleanAnswer === cleanCorrect) {
                        isCorrect = true;
                    }
                    // 2. Harf indeksi ve Prefix kontrolü
                    else if (cleanCorrect.length === 1) {
                        // a. İndeks kontrolü
                        const answerIndex = q.options.indexOf(answer);
                        if (answerIndex !== -1) {
                            const answerLetter = String.fromCharCode(65 + answerIndex);
                            if (answerLetter === cleanCorrect) {
                                isCorrect = true;
                            }
                        }

                        // b. Prefix kontrolü (Yedek)
                        if (!isCorrect && (
                            cleanAnswer.startsWith(`${cleanCorrect})`) ||
                            cleanAnswer.startsWith(`${cleanCorrect}.`)
                        )) {
                            isCorrect = true;
                        }
                    }
                }

                if (isCorrect) correctCount++;

                const moduleKey = q.moduleId || q.moduleName;
                if (!moduleResultsMap.has(moduleKey)) {
                    moduleResultsMap.set(moduleKey, {
                        correct: 0,
                        total: 0,
                        name: q.moduleName
                    });
                }

                const moduleResult = moduleResultsMap.get(moduleKey)!;
                moduleResult.total++;
                if (isCorrect) moduleResult.correct++;
            });

            // 2. AI Analizi al
            const aiAnalysis = await analyzeDiagnosisTest(
                assignment.test.subject,
                assignment.test.grade,
                questions.length,
                correctCount,
                Array.from(moduleResultsMap.values()).map(m => ({
                    moduleName: m.name,
                    correct: m.correct,
                    total: m.total
                }))
            );

            // 3. Testi tamamla
            const totalQuestions = questions.length;
            const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

            await diagnosisTestManagementService.completeTest(
                assignmentId,
                aiAnalysis,
                {
                    score,
                    totalCorrect: correctCount,
                    totalQuestions
                }
            );


            // ------------------------------------------

            onComplete();
        } catch (error) {
            console.error('Error submitting test:', error);
            alert('Test gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading || !assignment) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm px-6 py-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">{assignment.test?.title}</h1>
                        <div className="text-sm text-gray-500">
                            Soru {currentQuestionIndex + 1} / {questions.length}
                        </div>
                    </div>

                    {timeLeft !== null && (
                        <div className={`text-xl font-mono font-bold ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-primary'}`}>
                            {formatTime(timeLeft)}
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="max-w-4xl mx-auto mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-4xl mx-auto w-full p-6">
                <div className="bg-white rounded-2xl shadow-sm p-8 min-h-[400px] flex flex-col">
                    <div className="flex-1">
                        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-4">
                            {currentQuestion.moduleName}
                        </span>

                        <h2 className="text-2xl font-medium text-gray-800 mb-8 leading-relaxed">
                            {currentQuestion.questionText}
                        </h2>

                        <div className="space-y-3">
                            {currentQuestion.options.map((option, index) => {
                                const isSelected = answers[currentQuestion.id] === option;
                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleAnswerSelect(option)}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected
                                            ? 'border-primary bg-blue-50 text-primary font-medium'
                                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 ${isSelected ? 'border-primary bg-primary text-white' : 'border-gray-300 text-gray-500'
                                                }`}>
                                                {String.fromCharCode(65 + index)}
                                            </div>
                                            {option}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* AI Feedback Section */}
                    {showAiFeedback && aiExplanation && (
                        <div className={`mt-6 p-6 rounded-2xl animate-fade-in ${aiExplanation.includes('Harika') ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'}`}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="text-2xl">{aiExplanation.includes('Harika') ? '🌟' : '💡'}</div>
                                <h3 className={`font-bold ${aiExplanation.includes('Harika') ? 'text-green-800' : 'text-amber-800'}`}>
                                    {aiExplanation.includes('Harika') ? 'Tebrikler!' : 'Öğretmen Notu'}
                                </h3>
                            </div>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {aiExplanation}
                            </p>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between items-center mt-8 pt-8 border-t border-gray-100">
                        <button
                            onClick={() => {
                                setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
                                setShowAiFeedback(false);
                                setAiExplanation(null);
                            }}
                            disabled={currentQuestionIndex === 0 || isAiExplaining}
                            className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent"
                        >
                            ← Önceki
                        </button>

                        <div className="flex gap-3">
                            {!showAiFeedback && (
                                <button
                                    onClick={handleCheckAnswer}
                                    disabled={!answers[currentQuestion.id] || isAiExplaining}
                                    className="px-8 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isAiExplaining ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-b-transparent"></div>
                                            Düşünülüyor...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 19.75l-4.313-1.312 3.823-7.555-5.328 1.144L5.688 8l3.411 1.764 1.132-5.362L13.125 5l-1.096 5.625 5.253.953-3.266 5.922 4.103 1.25-3.303 1.156z" />
                                            </svg>
                                            Kontrol Et
                                        </>
                                    )}
                                </button>
                            )}

                            {currentQuestionIndex === questions.length - 1 ? (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || isAiExplaining}
                                    className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Gönderiliyor...' : 'Testi Bitir'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleNextQuestion}
                                    disabled={isAiExplaining}
                                    className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                                >
                                    Sonraki →
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentDiagnosisTestPage;
