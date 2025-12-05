import React from 'react';
import { Student } from '../types';
import { calculateLevel } from '../services/motivationService';
import { EnhancedPomodoroTimer } from './EnhancedPomodoroTimer';

interface ProfileCardProps {
    student: Student;
    onNavigateToMistakeNotebook?: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ student, onNavigateToMistakeNotebook }) => {
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

                <div className="mt-4">
                    <EnhancedPomodoroTimer studentId={student.id} />
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

                {/* Mistake Notebook Button */}
                <div
                    onClick={onNavigateToMistakeNotebook}
                    className="mt-4 bg-white p-3 rounded-xl shadow-sm border border-red-100 cursor-pointer hover:shadow-md hover:bg-red-50 transition-all group flex items-center space-x-3"
                >
                    <div className="p-2 bg-red-100 rounded-full text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-800">Hata Defteri</h3>
                        <p className="text-[10px] text-gray-500">Hatalarını incele</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileCard;