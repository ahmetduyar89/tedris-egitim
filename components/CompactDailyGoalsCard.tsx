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
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative">
            {/* Header with Gradient */}
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm shadow-sm ring-1 ring-white/30">
                            <span className="text-xl">🎯</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Bugünün Hedefleri</h3>
                            <p className="text-blue-100 text-xs font-medium">
                                {dailyGoals.completedGoals}/{dailyGoals.totalGoals} Tamamlandı
                            </p>
                        </div>
                    </div>

                    {isFullyCompleted && (
                        <div className="bg-green-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm animate-pulse">
                            Tamamlandı!
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden ring-1 ring-white/10">
                    <div
                        className={`h-2.5 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)] ${isFullyCompleted ? 'bg-green-400' : 'bg-white'}`}
                        style={{ width: `${completionPercentage}%` }}
                    ></div>
                </div>
            </div>

            {/* Goals List */}
            <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
                {dailyGoals.goals.map((goal: DailyGoal) => (
                    <div
                        key={goal.id}
                        className={`p-3 rounded-xl border transition-all hover:shadow-sm ${goal.completed
                            ? 'bg-green-50 border-green-100 opacity-80'
                            : 'bg-white border-gray-100 hover:border-blue-200'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            {/* Icon */}
                            <div className={`text-2xl ${goal.completed ? 'grayscale opacity-50' : ''}`}>
                                {goal.icon}
                            </div>

                            {/* Goal Info */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${goal.completed ? 'line-through text-gray-500' : 'text-gray-900'
                                    }`}>
                                    {goal.description}
                                </p>

                                {/* Mini Progress */}
                                <div className="mt-1.5 flex items-center gap-2">
                                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${goal.completed ? 'bg-green-500' : 'bg-blue-500'
                                                }`}
                                            style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className={`text-[10px] font-bold ${goal.completed ? 'text-green-600' : 'text-blue-600'}`}>
                                        {Math.round((goal.current / goal.target) * 100)}%
                                    </span>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div>
                                {goal.completed ? (
                                    <div className="bg-green-100 text-green-600 p-1.5 rounded-full">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleGoalUpdate(goal.id, 1)}
                                        className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white p-1.5 rounded-full transition-all hover:scale-110 active:scale-95 border border-blue-100 hover:border-blue-600"
                                        title="İlerleme ekle (+1)"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer / Reward */}
            {!isFullyCompleted && (
                <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xl animate-bounce">🎁</span>
                            <p className="text-xs font-bold text-gray-700">Günlük Ödül</p>
                        </div>
                        <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">
                            +{dailyGoals.xpReward} XP
                        </div>
                    </div>
                </div>
            )}

            {isFullyCompleted && !dailyGoals.xpClaimed && (
                <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xl animate-pulse">🎉</span>
                            <p className="text-sm font-bold">Harika İş!</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold ring-1 ring-white/30">
                            +{dailyGoals.xpReward} XP Kazanıldı
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompactDailyGoalsCard;
