import React, { useEffect, useState } from 'react';
import { StudentDailyGoals, DailyGoal } from '../types';
import { getTodaysDailyGoals, generateDailyGoals, updateDailyGoalProgress } from '../services/streakService';

interface CompactDailyGoalsCardProps {
    studentId: string;
}

/**
 * Compact Daily Goals Card - Smaller version for sidebar
 * Updates XP when goals are completed
 */
const CompactDailyGoalsCard: React.FC<CompactDailyGoalsCardProps> = ({ studentId }) => {
    const [dailyGoals, setDailyGoals] = useState<StudentDailyGoals | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDailyGoals();
    }, [studentId]);

    const loadDailyGoals = async () => {
        try {
            let goals = await getTodaysDailyGoals(studentId);

            if (!goals) {
                goals = await generateDailyGoals(studentId);
            }

            setDailyGoals(goals);
        } catch (error) {
            console.error('❌ Error loading daily goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGoalUpdate = async (goalId: string, progress: number) => {
        try {
            const updated = await updateDailyGoalProgress(studentId, goalId, progress);
            setDailyGoals(updated);

            // If all goals completed, trigger page reload to update XP bar
            if (updated.isFullyCompleted && !dailyGoals?.isFullyCompleted) {
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        } catch (error) {
            console.error('❌ Error updating goal:', error);
        }
    };

    if (loading) {
        return <div className="animate-pulse bg-gray-200 rounded-xl h-48"></div>;
    }

    if (!dailyGoals) {
        return null;
    }

    const completionPercentage = dailyGoals.completionPercentage;
    const isFullyCompleted = dailyGoals.isFullyCompleted;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            {/* Compact Header */}
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <span className="text-xl">🎯</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Bugünün Hedefleri</h3>
                            <p className="text-xs text-gray-600">
                                {dailyGoals.completedGoals}/{dailyGoals.totalGoals}
                            </p>
                        </div>
                    </div>

                    {isFullyCompleted && (
                        <div className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">
                            ✅
                        </div>
                    )}
                </div>

                {/* Compact Progress Bar */}
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${isFullyCompleted
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            }`}
                        style={{ width: `${completionPercentage}%` }}
                    ></div>
                </div>
            </div>

            {/* Compact Goals List */}
            <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                {dailyGoals.goals.map((goal: DailyGoal) => (
                    <div
                        key={goal.id}
                        className={`p-2.5 rounded-lg border transition-all ${goal.completed
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            {/* Icon */}
                            <div className={`text-xl ${goal.completed ? 'opacity-50' : ''}`}>
                                {goal.icon}
                            </div>

                            {/* Goal Info */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-semibold truncate ${goal.completed ? 'line-through text-gray-500' : 'text-gray-900'
                                    }`}>
                                    {goal.description}
                                </p>

                                {/* Mini Progress */}
                                <div className="mt-1">
                                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                                        <span className="text-gray-600">
                                            {goal.current}/{goal.target}
                                        </span>
                                        <span className={`font-bold ${goal.completed ? 'text-green-600' : 'text-blue-600'
                                            }`}>
                                            {Math.round((goal.current / goal.target) * 100)}%
                                        </span>
                                    </div>
                                    <div className="bg-gray-200 rounded-full h-1 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${goal.completed ? 'bg-green-500' : 'bg-blue-500'
                                                }`}
                                            style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div>
                                {goal.completed ? (
                                    <div className="bg-green-500 text-white p-1.5 rounded-full">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleGoalUpdate(goal.id, 1)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded-full transition-all hover:scale-110 active:scale-95"
                                        title="İlerleme ekle (+1)"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Compact Footer */}
            {!isFullyCompleted && (
                <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border-t border-yellow-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <span className="text-lg">🎁</span>
                            <p className="text-xs font-semibold text-gray-900">Ödül</p>
                        </div>
                        <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg text-xs font-bold">
                            +{dailyGoals.xpReward} XP
                        </div>
                    </div>
                </div>
            )}

            {isFullyCompleted && !dailyGoals.xpClaimed && (
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <span className="text-lg">🎉</span>
                            <p className="text-xs font-bold">Tamamlandı!</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold">
                            +{dailyGoals.xpReward} XP
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompactDailyGoalsCard;
