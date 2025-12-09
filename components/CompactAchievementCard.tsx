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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            {/* Compact Header */}
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                <div className="flex items-center gap-2 mb-3">
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-2 rounded-lg shadow">
                        <span className="text-xl">🏆</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-amber-600">Başarı Seviyesi</h3>
                        <p className="text-xs text-gray-600">Seviye {level}</p>
                    </div>
                </div>

                {/* Compact Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-700">{student.xp} XP</span>
                        <span className="text-gray-500">{totalXpForCurrentLevel + xpToNextLevel} XP</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden shadow-inner">
                        <div
                            className="bg-gradient-to-r from-amber-400 to-orange-500 h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        >
                        </div>
                    </div>
                    <div className="text-center text-xs font-medium text-gray-600">
                        {Math.round(progressPercentage)}% tamamlandı
                    </div>
                </div>
            </div>

            {/* Compact Badges */}
            {student.badges && student.badges.length > 0 && (
                <div className="p-3 bg-gray-50">
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-sm">🏅</span>
                        <span className="text-xs font-semibold text-gray-700">Rozetler ({student.badges.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {student.badges.slice(0, 6).map(badge => (
                            <div
                                key={badge.id}
                                className="text-2xl p-1.5 bg-white rounded-lg shadow-sm hover:scale-110 transition-transform border border-gray-200"
                                title={`${badge.title}: ${badge.description}`}
                            >
                                {badge.icon}
                            </div>
                        ))}
                        {student.badges.length > 6 && (
                            <div className="text-xs text-gray-500 self-center ml-1">
                                +{student.badges.length - 6} daha
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompactAchievementCard;
