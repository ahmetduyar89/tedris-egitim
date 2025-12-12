import React from 'react';
import { DailyMessage, Student } from '../types';
import { calculateLevel } from '../services/motivationService';

interface MotivationCardProps {
    message: DailyMessage | null;
    isLoading: boolean;
    student?: Student | null;
}

const MotivationCard: React.FC<MotivationCardProps> = ({ message, isLoading, student }) => {
    // Determine XP/Level data if student exists
    const levelData = student ? calculateLevel(student.xp) : null;
    const progressPercentage = levelData ? (levelData.xpForNextLevel / levelData.xpToNextLevel) * 100 : 0;

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6 flex flex-col md:flex-row min-h-[140px]">
            {/* Message Section (Left) - Flex 1 to take remaining space */}
            <div className="flex-1 flex flex-col">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 sm:p-4 flex items-center gap-2 text-white">
                    <span className="bg-white/20 p-1.5 rounded-lg text-white backdrop-blur-sm shadow-sm">✨</span>
                    <h2 className="text-base sm:text-lg font-bold">Günün Mesajı</h2>
                </div>
                <div className="p-4 sm:p-6 text-center flex-1 flex items-center justify-center">
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-3 animate-pulse w-full">
                            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                        </div>
                    ) : message ? (
                        <div className="animate-fade-in">
                            <p className="text-lg sm:text-xl font-medium text-gray-800 italic leading-relaxed font-serif">"{message.message}"</p>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">Bugün için motivasyon mesajı alınamadı.</p>
                    )}
                </div>
            </div>

            {/* XP/Achievement Section (Right) - Fixed width on desktop */}
            {student && levelData && (
                <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-gray-200 bg-gradient-to-br from-amber-500 to-orange-600 text-white p-4 flex flex-col justify-center relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l-3.954-1.583a1 1 0 010-1.88l3.954-1.583V.5a.5.5 0 01.5-.5c.2 0 .38.12.45.3L12.5 1.5l.55-1.2c.07-.18.25-.3.45-.3.27 0 .5.22.5.5v1.323l3.954 1.583a1 1 0 010 1.88L14 6.323V10a1 1 0 01-1 1h-2v2h2a1 1 0 011 1v2a1 1 0 01-1 1h-6a1 1 0 01-1-1v-2a1 1 0 011-1h2v-2H8a1 1 0 01-1-1V6.323L3.046 4.74a1 1 0 010-1.88L7 1.277V1a1 1 0 011-1h2z" clipRule="evenodd" />
                        </svg>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm shadow-sm ring-1 ring-white/30">
                                    <span className="text-xl">🏆</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Başarı Seviyesi</h3>
                                    <span className="inline-block bg-black/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                                        Seviye {levelData.level}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-amber-100 font-medium block">Toplam XP</span>
                                <span className="text-lg font-bold text-white">{student.xp}</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] text-amber-50 font-medium uppercase tracking-wider">
                                <span>İlerleme</span>
                                <span>{Math.round(levelData.totalXpForCurrentLevel + levelData.xpToNextLevel)} XP Hedefi</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-3 relative overflow-hidden ring-1 ring-white/10">
                                <div
                                    className="bg-white h-3 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                    style={{ width: `${progressPercentage}%` }}
                                >
                                </div>
                            </div>
                            <div className="text-right text-[10px] text-amber-100 font-medium">
                                Sonraki seviyeye {Math.round(levelData.xpToNextLevel - levelData.xpForNextLevel)} XP kaldı
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MotivationCard;
