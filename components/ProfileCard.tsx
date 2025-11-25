import React from 'react';
import { Student } from '../types';
import { calculateLevel } from '../services/motivationService';

interface ProfileCardProps {
    student: Student;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ student }) => {
    const { level, xpForNextLevel, xpToNextLevel, totalXpForCurrentLevel } = calculateLevel(student.xp);
    const progressPercentage = (xpForNextLevel / xpToNextLevel) * 100;

    return (
        <div className="bg-card-background p-6 rounded-2xl shadow-lg border-l-4 border-success-brand">
            <h2 className="text-2xl font-bold text-text-primary mb-4 font-poppins text-amber-500">Tedris Başarı 🏆</h2>
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-primary text-lg">Seviye {level}</span>
                        <span className="text-sm text-text-secondary">{student.xp} / {totalXpForCurrentLevel + xpToNextLevel} XP</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                        <div
                            className="bg-success-brand h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                            style={{ width: `${progressPercentage}%` }}
                        >
                          <span className="text-yellow-800 text-[10px] font-bold">{Math.round(progressPercentage)}%</span>
                        </div>
                    </div>
                </div>

                {student.badges && student.badges.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-lg text-gray-700 mb-2">Rozetlerim</h3>
                        <div className="flex flex-wrap gap-4">
                            {student.badges.map(badge => (
                                <div key={badge.id} className="group relative" title={badge.description}>
                                    <div className="text-4xl p-2 bg-gray-100 rounded-full transition-transform duration-200 group-hover:scale-110">
                                        {badge.icon}
                                    </div>
                                    <span className="absolute bottom-full mb-2 w-max max-w-xs px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        <strong>{badge.title}</strong>: {badge.description}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileCard;