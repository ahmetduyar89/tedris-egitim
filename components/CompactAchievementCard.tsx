import React from 'react';
import { Student } from '../types';
import { calculateLevel } from '../services/motivationService';

interface CompactAchievementCardProps {
    student: Student;
}

/**
 * Compact Achievement Card - Smaller version for sidebar
 */
const CompactAchievementCard: React.FC<CompactAchievementCardProps> = ({ student }) => {
    const { level, xpForNextLevel, xpToNextLevel, totalXpForCurrentLevel } = calculateLevel(student.xp);
    const progressPercentage = (xpForNextLevel / xpToNextLevel) * 100;

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden relative border border-gray-200">
            {/* Header with Gradient */}
            <div className="p-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm shadow-sm ring-1 ring-white/30">
                        <span className="text-2xl">🏆</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Başarı Seviyesi</h3>
                        <p className="text-amber-100 text-xs font-medium bg-amber-700/30 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-amber-400/30">Seviye {level}</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs text-amber-50 font-medium">
                        <span>{student.xp} XP</span>
                        <span className="opacity-80">{totalXpForCurrentLevel + xpToNextLevel} XP</span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-3 relative overflow-hidden ring-1 ring-white/10">
                        <div
                            className="bg-white h-3 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                            style={{ width: `${progressPercentage}%` }}
                        >
                        </div>
                    </div>
                    <div className="text-right text-[10px] text-amber-100 font-medium">
                        %{Math.round(progressPercentage)} tamamlandı
                    </div>
                </div>
            </div>

            {/* Badges Section */}
            {student.badges && student.badges.length > 0 && (
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 mb-3 text-gray-700">
                        <span className="text-sm">🏅</span>
                        <span className="text-xs font-bold uppercase tracking-wide">Son Rozetler</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {student.badges.slice(0, 6).map(badge => (
                            <div
                                key={badge.id}
                                className="group relative"
                            >
                                <div className="text-2xl p-2 bg-white rounded-xl shadow-sm hover:shadow-md hover:scale-105 transition-all border border-gray-200 hover:border-amber-300 cursor-help">
                                    {badge.icon}
                                </div>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                    {badge.title}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                            </div>
                        ))}
                        {student.badges.length > 6 && (
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-xs font-bold text-gray-500 border border-gray-200">
                                +{student.badges.length - 6}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompactAchievementCard;
