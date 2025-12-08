import React, { useEffect, useState } from 'react';
import { StudentDailyGoals, DailyGoal } from '../types';
import { getTodaysDailyGoals, generateDailyGoals, updateDailyGoalProgress } from '../services/streakService';

interface DailyGoalsCardProps {
    studentId: string;
}

const DailyGoalsCard: React.FC<DailyGoalsCardProps> = ({ studentId }) => {
    const [dailyGoals, setDailyGoals] = useState<StudentDailyGoals | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [justCompleted, setJustCompleted] = useState(false);

    useEffect(() => {
        loadDailyGoals();
    }, [studentId]);

    const loadDailyGoals = async () => {
        try {
            setError(null);
            console.log('🎯 Loading daily goals for student:', studentId);

            let goals = await getTodaysDailyGoals(studentId);
            console.log('📊 Existing goals:', goals);

            // If no goals exist for today, generate them
            if (!goals) {
                console.log('🔨 Generating new daily goals...');
                goals = await generateDailyGoals(studentId);
                console.log('✅ Generated goals:', goals);
            }

            setDailyGoals(goals);
        } catch (error) {
            console.error('❌ Error loading daily goals:', error);
            setError(error instanceof Error ? error.message : 'Hedefler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleGoalUpdate = async (goalId: string, progress: number) => {
        try {
            console.log('🔄 Updating goal:', goalId, 'progress:', progress);

            // Check if this was the last goal before update
            const wasCompleted = dailyGoals?.isFullyCompleted || false;

            const updated = await updateDailyGoalProgress(studentId, goalId, progress);
            console.log('✅ Goal updated:', updated);

            // Check if we just completed all goals
            if (!wasCompleted && updated.isFullyCompleted) {
                setJustCompleted(true);
                setShowCelebration(true);

                // Auto-hide celebration after 5 seconds
                setTimeout(() => {
                    setShowCelebration(false);
                }, 5000);

                console.log('🎉 ALL DAILY GOALS COMPLETED! Celebration triggered!');
            }

            setDailyGoals(updated);
        } catch (error) {
            console.error('❌ Error updating goal:', error);
            setError(error instanceof Error ? error.message : 'Hedef güncellenemedi');
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse bg-gray-200 rounded-xl h-64"></div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">⚠️</span>
                    <h3 className="font-bold text-red-900">Hata</h3>
                </div>
                <p className="text-sm text-red-700">{error}</p>
                <button
                    onClick={loadDailyGoals}
                    className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
                >
                    Tekrar Dene
                </button>
            </div>
        );
    }

    if (!dailyGoals) {
        return null;
    }

    const completionPercentage = dailyGoals.completionPercentage;
    const isFullyCompleted = dailyGoals.isFullyCompleted;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2.5 rounded-xl">
                            <span className="text-2xl">🎯</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Bugünün Hedefleri</h3>
                            <p className="text-sm text-gray-600">
                                {dailyGoals.completedGoals}/{dailyGoals.totalGoals} tamamlandı
                            </p>
                        </div>
                    </div>

                    {isFullyCompleted && (
                        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                            <span>✅</span>
                            <span>Tamamlandı!</span>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">İlerleme</span>
                        <span className="font-bold text-blue-600">{completionPercentage}%</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isFullyCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                }`}
                            style={{ width: `${completionPercentage}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Goals List */}
            <div className="p-5 space-y-3">
                {dailyGoals.goals.map((goal: DailyGoal) => (
                    <div
                        key={goal.id}
                        className={`p-4 rounded-xl border-2 transition-all ${goal.completed
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            {/* Icon */}
                            <div className={`text-3xl ${goal.completed ? 'opacity-50' : ''}`}>
                                {goal.icon}
                            </div>

                            {/* Goal Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className={`font-bold text-sm ${goal.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                        {goal.description}
                                    </h4>
                                    {goal.subject && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                            {goal.subject}
                                        </span>
                                    )}
                                </div>

                                {/* Progress */}
                                <div className="mt-2">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-gray-600">
                                            {goal.current}/{goal.target} {goal.unit || ''}
                                        </span>
                                        <span className={`font-bold ${goal.completed ? 'text-green-600' : 'text-blue-600'}`}>
                                            {Math.round((goal.current / goal.target) * 100)}%
                                        </span>
                                    </div>
                                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${goal.completed ? 'bg-green-500' : 'bg-blue-500'
                                                }`}
                                            style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Completion Status */}
                            <div>
                                {goal.completed ? (
                                    <div className="bg-green-500 text-white p-2 rounded-full">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleGoalUpdate(goal.id, 1)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-all hover:scale-110 active:scale-95"
                                        title="İlerleme ekle (+1)"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer - Reward Info */}
            {!isFullyCompleted && (
                <div className="p-5 bg-gradient-to-r from-yellow-50 to-orange-50 border-t border-yellow-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🎁</span>
                            <div>
                                <p className="text-sm font-bold text-gray-900">Tamamlama Ödülü</p>
                                <p className="text-xs text-gray-600">Tüm hedefleri tamamla</p>
                            </div>
                        </div>
                        <div className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl font-bold">
                            +{dailyGoals.xpReward} XP
                        </div>
                    </div>
                </div>
            )}

            {isFullyCompleted && !dailyGoals.xpClaimed && (
                <div className="p-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-3xl">🎉</span>
                            <div>
                                <p className="font-bold">Tebrikler!</p>
                                <p className="text-sm text-white/80">Tüm hedefleri tamamladın!</p>
                            </div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl font-bold text-lg">
                            +{dailyGoals.xpReward} XP
                        </div>
                    </div>
                </div>
            )}

            {/* Celebration Modal */}
            {showCelebration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scaleIn">
                        {/* Confetti Animation */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {[...Array(30)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute animate-confetti"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: '-10px',
                                        animationDelay: `${Math.random() * 2}s`,
                                        animationDuration: `${2 + Math.random() * 2}s`
                                    }}
                                >
                                    {['🎉', '🎊', '⭐', '✨', '🌟', '💫'][Math.floor(Math.random() * 6)]}
                                </div>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="relative p-8 text-center">
                            {/* Close Button */}
                            <button
                                onClick={() => setShowCelebration(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Trophy Icon */}
                            <div className="mb-6 animate-bounce">
                                <div className="inline-block bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-full shadow-lg">
                                    <span className="text-6xl">🏆</span>
                                </div>
                            </div>

                            {/* Title */}
                            <h2 className="text-3xl font-bold text-gray-900 mb-3">
                                Harika İş! 🎉
                            </h2>

                            {/* Message */}
                            <p className="text-lg text-gray-600 mb-6">
                                Bugünün tüm hedeflerini başarıyla tamamladın!
                            </p>

                            {/* XP Reward */}
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl p-6 mb-6 shadow-lg">
                                <div className="flex items-center justify-center gap-3">
                                    <span className="text-4xl">⭐</span>
                                    <div className="text-left">
                                        <p className="text-sm opacity-90">Kazandığın XP</p>
                                        <p className="text-3xl font-bold">+{dailyGoals?.xpReward || 50} XP</p>
                                    </div>
                                </div>
                            </div>

                            {/* Motivational Message */}
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6">
                                <p className="text-sm text-gray-700 font-medium">
                                    💪 Harika bir ilerleme! Yarın da bu motivasyonla devam et!
                                </p>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={() => setShowCelebration(false)}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                            >
                                Harika! 🚀
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add required CSS animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes scaleIn {
                    from { 
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    to { 
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                @keyframes confetti {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                
                .animate-scaleIn {
                    animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                
                .animate-confetti {
                    animation: confetti linear forwards;
                    font-size: 1.5rem;
                }
            `}</style>
        </div>
    );
};

export default DailyGoalsCard;
