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
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative">
            {/* Header with Gradient */}
            <div className={`p-4 bg-gradient-to-r ${streakLevel.color} text-white`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm shadow-sm ring-1 ring-white/30">
                            <span className="text-xl">{streakLevel.emoji}</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold">Zaman Serisi</h3>
                            <p className="text-white/80 text-[10px] font-medium bg-white/20 px-2 py-0.5 rounded-full inline-block mt-0.5">
                                {streakLevel.level} Seviye
                            </p>
                        </div>
                    </div>
                    {streakFreezeCount > 0 && (
                        <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 ring-1 ring-white/30">
                            <span className="text-xs">🛡️</span>
                            <span className="text-xs font-bold">{streakFreezeCount}</span>
                        </div>
                    )}
                </div>

                <div className="mt-3 text-center">
                    <div className="text-3xl font-bold">{currentStreak}</div>
                    <p className="text-xs text-white/90 font-medium">Gün Üst Üste!</p>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 grid grid-cols-2 gap-3 bg-white">
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 text-center hover:bg-gray-100 transition-colors">
                    <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-0.5">En Uzun</div>
                    <div className="text-lg font-bold text-gray-800">{longestStreak} Gün</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 text-center hover:bg-gray-100 transition-colors">
                    <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Aktivite</div>
                    <div className="text-lg font-bold text-gray-800">{streak.totalActivities}</div>
                </div>
            </div>

            {/* Footer / Next Milestone */}
            {currentStreak < 365 && (
                <div className="px-4 pb-4 bg-white">
                    <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-gray-500 font-medium">Sonraki Hedef</span>
                            <span className="font-bold text-indigo-600">
                                {currentStreak < 7 ? '7 Gün 🌟' :
                                    currentStreak < 14 ? '14 Gün ⭐' :
                                        currentStreak < 30 ? '30 Gün 🏆' :
                                            currentStreak < 100 ? '100 Gün 👑' :
                                                '365 Gün 💎'}
                            </span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${streakLevel.color}`}
                                style={{
                                    width: `${(currentStreak % (currentStreak < 7 ? 7 : currentStreak < 14 ? 14 : currentStreak < 30 ? 30 : currentStreak < 100 ? 100 : 365)) / (currentStreak < 7 ? 7 : currentStreak < 14 ? 14 : currentStreak < 30 ? 30 : currentStreak < 100 ? 100 : 365) * 100}%`
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StreakWidget;
