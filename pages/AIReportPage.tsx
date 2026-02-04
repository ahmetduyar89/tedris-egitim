import React, { useState, useEffect, useMemo } from 'react';
import * as Recharts from 'recharts';
import { User, Student, Test, Question, QuestionType, TestResultSummary } from '../types';

const { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } = Recharts;

const COLORS = { correct: '#10B981', wrong: '#EF4444', primary: '#4F46E5', secondary: '#06B6D4' };
const evaluationTagColors: { [key: string]: string } = {
    "Harika Başarı": "bg-success/10 text-success",
    "İlerleme gösteriyor": "bg-primary/10 text-primary",
    "Tekrar Gerekli": "bg-warning/10 text-yellow-700",
};

interface AIReportPageProps {
    user: User;
    student: Student;
    test: Test;
    allCompletedTests: Test[];
    onBack: () => void;
    onLogout: () => void;
    isGeneratingPlan: boolean;
    onGenerateReviewPackage: (topic: string) => void;
    onGenerateWeeklyPlan: (test: Test) => void;
    onReportUpdate: (test: Test) => void;
    onRecommendContent: () => void;
}

const AIReportPage: React.FC<AIReportPageProps> = ({ user, student, test, allCompletedTests, onBack, onLogout, isGeneratingPlan, onGenerateReviewPackage, onGenerateWeeklyPlan, onReportUpdate, onRecommendContent }) => {
    const [editedScores, setEditedScores] = useState<Record<string, number | ''>>({});

    useEffect(() => {
        // Reset edited scores when the test prop changes
        setEditedScores({});
    }, [test.id]);

    const handleScoreChange = (questionId: string, value: string) => {
        if (value === '') {
            setEditedScores(prev => ({ ...prev, [questionId]: '' }));
        } else {
            const score = parseInt(value, 10);
            if (!isNaN(score) && score >= 0 && score <= 100) {
                setEditedScores(prev => ({ ...prev, [questionId]: score }));
            }
        }
    };

    const handleSaveScores = () => {
        // Start with the current questions and apply any pending edits from the state
        let updatedQuestionsWithEdits = test.analysis?.questionEvaluations.map(q => {
            const editedValue = editedScores[q.id];
            if (editedValue !== undefined) {
                const newTeacherScore = editedValue === '' ? undefined : editedValue;
                return { ...q, teacherScore: newTeacherScore };
            }
            return q;
        }) || [];

        // Recalculate correctness for each question based on the final score (manual override > AI)
        const finalQuestionsWithRecalculation = updatedQuestionsWithEdits.map(q => {
            let isCorrect: boolean;
            if (q.type === QuestionType.MultipleChoice) {
                isCorrect = q.isCorrect ?? false;
            } else { // OpenEnded
                const finalScore = q.teacherScore ?? q.aiEvaluation?.score ?? 0;
                isCorrect = finalScore >= 50;
            }
            return { ...q, isCorrect };
        });

        // Recalculate the overall test summary based on the new correctness states
        const correctCount = finalQuestionsWithRecalculation.filter(q => q.isCorrect).length;
        const totalQuestions = finalQuestionsWithRecalculation.length;
        const wrongCount = totalQuestions - correctCount;
        const newOverallScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

        // Construct the fully updated test object
        const updatedTest: Test = {
            ...test,
            score: newOverallScore,
            questions: finalQuestionsWithRecalculation, // The `questions` array should also be updated
            analysis: test.analysis ? {
                ...test.analysis,
                questionEvaluations: finalQuestionsWithRecalculation,
                summary: { // Update the summary object to reflect changes
                    correct: correctCount,
                    wrong: wrongCount,
                    scorePercent: newOverallScore,
                }
            } : undefined
        };

        onReportUpdate(updatedTest);
        setEditedScores({}); // Clear pending edits after saving
        alert("Puanlar güncellendi!");
    };

    const { analysis } = test;

    const recalculatedSummary = useMemo((): TestResultSummary => {
        if (!analysis || !analysis.questionEvaluations) return { correct: 0, wrong: 0, scorePercent: 0 };

        const finalQuestions = analysis.questionEvaluations.map(q => {
            let isCorrect = false;
            if (q.type === QuestionType.MultipleChoice) {
                isCorrect = q.isCorrect ?? false;
            } else { // OpenEnded
                let finalScore = 0;
                const editedValue = editedScores[q.id];

                if (typeof editedValue === 'number') {
                    finalScore = editedValue;
                } else if (editedValue === '') {
                    // If input is cleared, fall back to AI score for summary preview
                    finalScore = q.aiEvaluation?.score ?? 0;
                } else { // editedValue is undefined, so use saved scores
                    finalScore = q.teacherScore ?? q.aiEvaluation?.score ?? 0;
                }
                isCorrect = finalScore >= 50;
            }
            return { ...q, isCorrect };
        });

        const correct = finalQuestions.filter(q => q.isCorrect).length;
        const wrong = finalQuestions.length - correct;
        const scorePercent = finalQuestions.length > 0 ? Math.round((correct / finalQuestions.length) * 100) : 0;

        return { correct, wrong, scorePercent };
    }, [analysis, editedScores]);

    if (!analysis || !analysis.questionEvaluations) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
                <button onClick={onBack} className="self-start flex items-center text-primary mb-6 font-semibold hover:underline">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                    Öğrenci Detayına Geri Dön
                </button>
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Rapor Bulunamadı</h2>
                    <p className="text-gray-600 mb-6">
                        Bu test için henüz bir AI analiz raporu oluşturulmamış. Test tamamlandıktan sonra rapor otomatik olarak oluşturulur.
                    </p>
                    <button
                        onClick={onBack}
                        className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
                    >
                        Geri Dön
                    </button>
                </div>
            </div>
        );
    }

    const overallData = [
        { name: 'Doğru', value: recalculatedSummary.correct },
        { name: 'Yanlış', value: recalculatedSummary.wrong },
    ];
    const tagColor = evaluationTagColors[analysis.evaluationTag || ''] || "bg-gray-100 text-gray-800";
    const hasEditedScores = Object.keys(editedScores).length > 0;

    return (
        <>
            <button onClick={onBack} className="flex items-center text-primary mb-6 font-semibold hover:underline">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                Öğrenci Detayına Geri Dön
            </button>

            <div className="bg-card-background p-6 rounded-xl shadow-md mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold font-poppins text-text-primary">AI Analiz Raporu</h1>
                        <p className="text-text-secondary mt-1">{student.name} - {test.title}</p>
                    </div>
                    {analysis.evaluationTag && <span className={`px-4 py-2 rounded-full font-semibold text-sm ${tagColor}`}>{analysis.evaluationTag}</span>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-card-background p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-bold font-poppins text-text-primary mb-4 text-center">Genel Başarı</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={overallData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                    <Cell key="cell-0" fill={COLORS.correct} /><Cell key="cell-1" fill={COLORS.wrong} />
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${value} Soru`, name]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="text-center mt-4 text-5xl font-bold text-primary">{recalculatedSummary.scorePercent}%</div>
                        <div className="text-center text-text-secondary mt-1">Başarı Oranı</div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-card-background p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-bold font-poppins text-text-primary mb-4">Gelişim Alanları ve Öneriler</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold font-poppins text-lg mb-3 text-error">Geliştirilmesi Gereken Konular</h4>
                                <ul className="space-y-2">
                                    {analysis.analysis.weakTopics.map((topic, i) => (
                                        <li key={i} className="p-3 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
                                            <span className="text-red-800 font-medium">{topic}</span>
                                            <button onClick={() => onGenerateReviewPackage(topic)} className="ml-4 flex-shrink-0 bg-primary text-white text-xs px-3 py-1 rounded-full hover:bg-primary-dark" title={`"${topic}" için telafi paketi oluştur`}>AI Paket</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold font-poppins text-lg mb-3 text-success">Güçlü Olduğu Konular</h4>
                                <ul className="space-y-2">
                                    {analysis.analysis.strongTopics.map((topic, i) =>
                                        <li key={i} className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 font-medium">{topic}</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card-background p-6 rounded-xl shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold font-poppins text-text-primary">Soru Bazlı Detaylı Değerlendirme</h3>
                            {hasEditedScores && (
                                <button onClick={handleSaveScores} className="bg-success text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-600">Değişiklikleri Kaydet</button>
                            )}
                        </div>
                        <div className="space-y-4 max-h-[700px] overflow-y-auto">
                            {analysis.questionEvaluations.map((q, index) => {
                                const finalScore = q.type === QuestionType.OpenEnded
                                    ? (editedScores[q.id] ?? q.teacherScore ?? q.aiEvaluation?.score ?? 0)
                                    : (q.isCorrect ? 100 : 0);
                                const displayScore = typeof finalScore === 'number' ? finalScore : 0;

                                return (
                                    <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                        {/* Question Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold">
                                                        Soru {index + 1}
                                                    </span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${q.type === QuestionType.MultipleChoice
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-purple-100 text-purple-700'
                                                        }`}>
                                                        {q.type === QuestionType.MultipleChoice ? 'Çoktan Seçmeli' : 'Açık Uçlu'}
                                                    </span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${q.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {q.isCorrect ? '✓ Doğru' : '✗ Yanlış'}
                                                    </span>
                                                </div>
                                                <p className="font-semibold text-gray-900 text-base leading-relaxed">{q.text}</p>
                                            </div>
                                            {/* Score Badge */}
                                            <div className="ml-4 flex flex-col items-center">
                                                <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl ${displayScore >= 70 ? 'bg-green-100 text-green-700' :
                                                    displayScore >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {displayScore}
                                                </div>
                                                <span className="text-xs text-gray-500 mt-1">Puan</span>
                                            </div>
                                        </div>

                                        {/* Answer Section */}
                                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                                            <div className={`p-3 rounded-lg border-l-4 ${q.isCorrect ? 'bg-red-50/50 border-red-400' : 'bg-red-50 border-red-500'
                                                }`}>
                                                <p className="text-xs font-semibold text-gray-600 mb-1">Öğrenci Cevabı</p>
                                                <p className="text-sm text-gray-900 font-medium">{q.studentAnswer}</p>
                                            </div>
                                            <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
                                                <p className="text-xs font-semibold text-gray-600 mb-1">Doğru Cevap</p>
                                                <p className="text-sm text-green-900 font-medium">{q.correctAnswer}</p>
                                            </div>
                                        </div>

                                        {/* AI Analysis for Open Ended */}
                                        {q.type === QuestionType.OpenEnded && q.aiEvaluation && (
                                            <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                                                <div className="flex items-start space-x-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                                                    </svg>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold text-blue-800 mb-1">AI Değerlendirmesi</p>
                                                        {q.aiEvaluation.feedback && (
                                                            <p className="text-sm text-blue-900 leading-relaxed italic">"{q.aiEvaluation.feedback}"</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Teacher Score Input for Open Ended */}
                                        {q.type === QuestionType.OpenEnded && (
                                            <div className="mt-4 flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                                                <label className="text-sm font-semibold text-gray-700">Öğretmen Puanı:</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={editedScores[q.id] ?? q.teacherScore ?? q.aiEvaluation?.score ?? ''}
                                                    onChange={(e) => handleScoreChange(q.id, e.target.value)}
                                                    className="w-24 px-3 py-2 text-center border-2 border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 font-bold text-lg"
                                                    placeholder="0-100"
                                                />
                                                <span className="text-xs text-gray-500">(0-100 arası bir değer girin)</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-card-background p-6 rounded-xl shadow-md flex justify-between items-center gap-4 flex-wrap">
                        <div>
                            <h3 className="text-xl font-bold font-poppins text-text-primary">Sonraki Adım</h3>
                            <p className="text-text-secondary">Bu analize göre öğrenci için sonraki adımı belirleyin.</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button onClick={onRecommendContent} className="bg-secondary text-white px-4 py-2 rounded-xl hover:bg-cyan-600 transition duration-200 flex items-center space-x-2 text-sm font-semibold">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.311a15.045 15.045 0 0 1-4.5 0m3.75-2.311a15.045 15.045 0 0 0 4.5 0m-4.5-2.311a12.06 12.06 0 0 0-4.5 0" /></svg>
                                <span>AI İçerik Öner</span>
                            </button>
                            <button onClick={() => onGenerateWeeklyPlan(test)} disabled={isGeneratingPlan} className="bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-dark transition duration-200 flex items-center space-x-2 disabled:bg-gray-400 text-sm font-semibold">
                                {isGeneratingPlan ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18M-4.5 12h22.5" /></svg>}
                                <span>AI Haftalık Plan Oluştur</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div >
        </>
    );
};

export default AIReportPage;