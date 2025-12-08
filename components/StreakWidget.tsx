import React, { useEffect, useState } from 'react';
import { StudentStreak } from '../types';
import { getStudentStreak } from '../services/streakService';

interface StreakWidgetProps {
    studentId: string;
    compact?: boolean;
}

const StreakWidget: React.FC<StreakWidgetProps> = ({ studentId, compact = false }) => {
    const [streak, setStreak] = useState<StudentStreak | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStreak();
    }, [studentId]);

    const loadStreak = async () => {
        try {
            const data = await getStudentStreak(studentId);
            setStreak(data);
        } catch (error) {
            console.error('Error loading streak:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse bg-gray-200 rounded-xl h-24"></div>
        );
    }

    if (!streak) {
        return null;
    }

    const currentStreak = streak.currentStreak;
    const longestStreak = streak.longestStreak;
    const streakFreezeCount = streak.streakFreezeCount;

    // Determine streak level and color
    const getStreakLevel = (days: number) => {
        if (days >= 100) return { level: 'Efsane', color: 'from-purple-500 to-pink-500', emoji: '👑' };
        if (days >= 30) return { level: 'Usta', color: 'from-orange-500 to-red-500', emoji: '🏆' };
        if (days >= 14) return { level: 'İleri', color: 'from-blue-500 to-indigo-500', emoji: '⭐' };
        if (days >= 7) return { level: 'Başlangıç', color: 'from-green-500 to-teal-500', emoji: '🌟' };
        return { level: 'Yeni', color: 'from-gray-400 to-gray-500', emoji: '🔥' };
    };

    const streakLevel = getStreakLevel(currentStreak);

    if (compact) {
        return (
            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-red-50 px-4 py-2 rounded-xl border border-orange-200">
                <span className="text-2xl">{streakLevel.emoji}</span>
                <div>
                    <div className="text-lg font-bold text-gray-900">{currentStreak} Gün</div>
                    <div className="text-xs text-gray-600">Ardışık Çalışma</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${streakLevel.color} p-4 text-white shadow-sm hover:shadow-md transition-all`}>
            {/* Simplified Background */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full blur-2xl -mr-10 -mt-10"></div>
            </div>

            <div className="relative z-10">
                {/* Compact Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{streakLevel.emoji}</span>
                        <div>
                            <h3 className="text-xs font-semibold text-white/90">Ardışık Gün</h3>
                            <p className="text-[10px] text-white/60">{streakLevel.level} Seviye</p>
                        </div>
                    </div>
                    {streakFreezeCount > 0 && (
                        <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                            <span className="text-sm">🛡️</span>
                            <span className="text-xs font-bold">{streakFreezeCount}</span>
                        </div>
                    )}
                </div>

                {/* Compact Main Number */}
                <div className="mb-3">
                    <div className="text-3xl font-bold mb-0.5">{currentStreak}</div>
                    <p className="text-xs text-white/80">gün üst üste çalıştın! 🔥</p>
                </div>

                {/* Compact Stats */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                        <div className="text-[10px] text-white/70 mb-0.5">En Uzun Streak</div>
                        <div className="text-lg font-bold">{longestStreak}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                        <div className="text-[10px] text-white/70 mb-0.5">Toplam Aktivite</div>
                        <div className="text-lg font-bold">{streak.totalActivities}</div>
                    </div>
                </div>

                {/* Simplified Next Milestone */}
                {currentStreak < 365 && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-white/70">Sonraki Hedef:</span>
                            <span className="font-bold">
                                {currentStreak < 7 ? '7 Gün 🌟' :
                                    currentStreak < 14 ? '14 Gün ⭐' :
                                        currentStreak < 30 ? '30 Gün 🏆' :
                                            currentStreak < 100 ? '100 Gün 👑' :
                                                '365 Gün 💎'}
                            </span>
                        </div>
                        <div className="bg-white/20 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-white h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${(currentStreak % (currentStreak < 7 ? 7 : currentStreak < 14 ? 14 : currentStreak < 30 ? 30 : currentStreak < 100 ? 100 : 365)) / (currentStreak < 7 ? 7 : currentStreak < 14 ? 14 : currentStreak < 30 ? 30 : currentStreak < 100 ? 100 : 365) * 100}%`
                                }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StreakWidget;
