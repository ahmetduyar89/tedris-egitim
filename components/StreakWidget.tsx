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
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${streakLevel.color} p-6 text-white shadow-lg hover:shadow-xl transition-all`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl -ml-16 -mb-16"></div>
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-4xl">{streakLevel.emoji}</span>
                        <div>
                            <h3 className="text-sm font-medium text-white/80">Ardışık Gün</h3>
                            <p className="text-xs text-white/60">{streakLevel.level} Seviye</p>
                        </div>
                    </div>
                    {streakFreezeCount > 0 && (
                        <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                            <div className="flex items-center gap-1">
                                <span className="text-lg">🛡️</span>
                                <span className="text-sm font-bold">{streakFreezeCount}</span>
                            </div>
                            <p className="text-[10px] text-white/80">Koruma</p>
                        </div>
                    )}
                </div>

                {/* Main Streak Number */}
                <div className="mb-4">
                    <div className="text-5xl font-bold mb-1">{currentStreak}</div>
                    <p className="text-sm text-white/80">gün üst üste çalıştın! 🔥</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                        <div className="text-xs text-white/70 mb-1">En Uzun Streak</div>
                        <div className="text-2xl font-bold">{longestStreak}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                        <div className="text-xs text-white/70 mb-1">Toplam Aktivite</div>
                        <div className="text-2xl font-bold">{streak.totalActivities}</div>
                    </div>
                </div>

                {/* Next Milestone */}
                {currentStreak < 365 && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-white/80">Sonraki Hedef:</span>
                            <span className="font-bold">
                                {currentStreak < 7 ? '7 Gün 🌟' :
                                    currentStreak < 14 ? '14 Gün ⭐' :
                                        currentStreak < 30 ? '30 Gün 🏆' :
                                            currentStreak < 60 ? '60 Gün 🔥' :
                                                currentStreak < 100 ? '100 Gün 💎' :
                                                    '365 Gün 👑'}
                            </span>
                        </div>
                        <div className="mt-2 bg-white/20 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-white h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${(currentStreak % (currentStreak < 7 ? 7 : currentStreak < 14 ? 14 : currentStreak < 30 ? 30 : currentStreak < 60 ? 60 : currentStreak < 100 ? 100 : 365)) / (currentStreak < 7 ? 7 : currentStreak < 14 ? 14 : currentStreak < 30 ? 30 : currentStreak < 60 ? 60 : currentStreak < 100 ? 100 : 365) * 100}%`
                                }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Motivational Message */}
                <div className="mt-4 text-center">
                    <p className="text-xs text-white/70 italic">
                        {currentStreak === 0 ? 'Bugün başla, streak\'ini oluştur!' :
                            currentStreak < 3 ? 'Harika başlangıç! Devam et! 💪' :
                                currentStreak < 7 ? 'Mükemmel gidiyorsun! 🌟' :
                                    currentStreak < 14 ? 'İnanılmaz bir çaba! 🚀' :
                                        currentStreak < 30 ? 'Sen bir şampiyonsun! 🏆' :
                                            currentStreak < 100 ? 'Efsane performans! 👑' :
                                                'Sen bir fenomensin! 🌟✨'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StreakWidget;
