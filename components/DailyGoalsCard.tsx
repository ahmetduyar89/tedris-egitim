import React, { useEffect, useState } from 'react';
import { StudentDailyGoals, DailyGoal } from '../types';
import { getTodaysDailyGoals, generateDailyGoals, updateDailyGoalProgress } from '../services/streakService';

interface DailyGoalsCardProps {
    studentId: string;
}

const DailyGoalsCard: React.FC<DailyGoalsCardProps> = ({ studentId }) => {
    const [dailyGoals, setDailyGoals] = useState<StudentDailyGoals | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDailyGoals();
    }, [studentId]);

    const loadDailyGoals = async () => {
        try {
            let goals = await getTodaysDailyGoals(studentId);

            // If no goals exist for today, generate them
            if (!goals) {
                goals = await generateDailyGoals(studentId);
            }

            setDailyGoals(goals);
        } catch (error) {
            console.error('Error loading daily goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGoalUpdate = async (goalId: string, progress: number) => {
        try {
            const updated = await updateDailyGoalProgress(studentId, goalId, progress);
            setDailyGoals(updated);
        } catch (error) {
            console.error('Error updating goal:', error);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse bg-gray-200 rounded-xl h-64"></div>
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
                                    <div className="bg-gray-300 text-gray-500 p-2 rounded-full">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
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
        </div>
    );
};

export default DailyGoalsCard;
