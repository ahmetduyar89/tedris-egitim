import React from 'react';
import { Student } from '../types';
import { calculateLevel } from '../services/motivationService';
import { EnhancedPomodoroTimer } from './EnhancedPomodoroTimer';


interface StudentProfileSectionProps {
    student: Student;
    studentId: string;
}

/**
 * Combined Student Profile Section
 * Displays: Achievement Level (Level & XP) + Pomodoro Timer + Daily Goals
 */
const StudentProfileSection: React.FC<StudentProfileSectionProps> = ({ student, studentId }) => {
    const { level, xpForNextLevel, xpToNextLevel, totalXpForCurrentLevel } = calculateLevel(student.xp);
    const progressPercentage = (xpForNextLevel / xpToNextLevel) * 100;

    return (
        <div className="space-y-6">
            {/* Achievement Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {/* Header with gradient */}
                <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-3 rounded-xl shadow-lg">
                            <span className="text-3xl">🏆</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-amber-600">Başarı Seviyesi</h2>
                            <p className="text-sm text-gray-600">Seviye ve İlerleme</p>
                        </div>
                    </div>

                    {/* Level Progress */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-primary text-xl">Seviye {level}</span>
                            <span className="text-sm text-gray-600 font-medium">
                                {student.xp} / {totalXpForCurrentLevel + xpToNextLevel} XP
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-5 relative overflow-hidden shadow-inner">
                            <div
                                className="bg-gradient-to-r from-amber-400 to-orange-500 h-5 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-3"
                                style={{ width: `${progressPercentage}%` }}
                            >
                                <span className="text-white text-xs font-bold drop-shadow">
                                    {Math.round(progressPercentage)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pomodoro Timer Section */}
                <div className="p-6 bg-white">
                    <EnhancedPomodoroTimer studentId={student.id} />
                </div>

                {/* Badges Section (if any) */}
                {student.badges && student.badges.length > 0 && (
                    <div className="p-6 bg-gray-50 border-t border-gray-100">
                        <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
                            <span>🏅</span>
                            <span>Rozetlerim</span>
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {student.badges.map(badge => (
                                <div key={badge.id} className="group relative" title={badge.description}>
                                    <div className="text-4xl p-3 bg-white rounded-xl shadow-sm transition-all duration-200 group-hover:scale-110 group-hover:shadow-md border border-gray-200">
                                        {badge.icon}
                                    </div>
                                    <span className="absolute bottom-full mb-2 w-max max-w-xs px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                                        <strong className="block mb-1">{badge.title}</strong>
                                        {badge.description}
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

export default StudentProfileSection;
