import React, { useEffect, useState } from 'react';
import { StudentAchievement } from '../types';
import { getStudentAchievements, markAchievementAsViewed } from '../services/streakService';

interface AchievementNotificationProps {
    studentId: string;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({ studentId }) => {
    const [unviewedAchievements, setUnviewedAchievements] = useState<StudentAchievement[]>([]);
    const [currentAchievement, setCurrentAchievement] = useState<StudentAchievement | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadUnviewedAchievements();
    }, [studentId]);

    useEffect(() => {
        if (unviewedAchievements.length > 0 && !showModal) {
            // Show the first unviewed achievement
            setCurrentAchievement(unviewedAchievements[0]);
            setShowModal(true);
        }
    }, [unviewedAchievements]);

    const loadUnviewedAchievements = async () => {
        try {
            const achievements = await getStudentAchievements(studentId, true);
            setUnviewedAchievements(achievements);
        } catch (error) {
            console.error('Error loading achievements:', error);
        }
    };

    const handleClose = async () => {
        if (currentAchievement) {
            try {
                await markAchievementAsViewed(currentAchievement.id);

                // Remove from unviewed list
                const remaining = unviewedAchievements.filter(a => a.id !== currentAchievement.id);
                setUnviewedAchievements(remaining);

                // Show next achievement if any
                if (remaining.length > 0) {
                    setCurrentAchievement(remaining[0]);
                } else {
                    setShowModal(false);
                    setCurrentAchievement(null);
                }
            } catch (error) {
                console.error('Error marking achievement as viewed:', error);
            }
        }
    };

    if (!showModal || !currentAchievement) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="relative max-w-md w-full">
                {/* Celebration Effects */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/4 text-4xl animate-bounce">🎉</div>
                    <div className="absolute top-0 right-1/4 text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎊</div>
                    <div className="absolute bottom-0 left-1/3 text-4xl animate-bounce" style={{ animationDelay: '0.4s' }}>✨</div>
                    <div className="absolute bottom-0 right-1/3 text-4xl animate-bounce" style={{ animationDelay: '0.6s' }}>⭐</div>
                </div>

                {/* Modal Content */}
                <div className="relative bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 rounded-3xl p-8 shadow-2xl transform animate-scaleIn">
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Achievement Icon */}
                    <div className="text-center mb-6">
                        <div className="inline-block bg-white/20 backdrop-blur-sm p-6 rounded-full mb-4">
                            <span className="text-7xl">{currentAchievement.iconEmoji}</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">
                            Başarı Kazandın!
                        </h2>
                    </div>

                    {/* Achievement Details */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                            {currentAchievement.achievementName}
                        </h3>
                        <p className="text-gray-700 text-center mb-4">
                            {currentAchievement.description}
                        </p>

                        {/* Rewards */}
                        <div className="grid grid-cols-2 gap-3">
                            {currentAchievement.xpReward > 0 && (
                                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl p-3 text-center">
                                    <div className="text-2xl mb-1">⚡</div>
                                    <div className="text-sm text-gray-600">XP Kazandın</div>
                                    <div className="text-xl font-bold text-blue-600">+{currentAchievement.xpReward}</div>
                                </div>
                            )}

                            {currentAchievement.badgeUnlocked && (
                                <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-3 text-center">
                                    <div className="text-2xl mb-1">🏆</div>
                                    <div className="text-sm text-gray-600">Rozet Kazandın</div>
                                    <div className="text-xs font-bold text-purple-600 truncate">{currentAchievement.badgeUnlocked}</div>
                                </div>
                            )}
                        </div>

                        {currentAchievement.specialReward && (
                            <div className="mt-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl p-3 text-center">
                                <div className="text-2xl mb-1">🎁</div>
                                <div className="text-sm text-gray-600">Özel Ödül</div>
                                <div className="text-sm font-bold text-orange-600">{currentAchievement.specialReward.itemName}</div>
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleClose}
                        className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-4 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
                    >
                        {unviewedAchievements.length > 1 ? (
                            <>Sonraki Başarı ({unviewedAchievements.length - 1} kaldı) →</>
                        ) : (
                            <>Harika! 🎉</>
                        )}
                    </button>

                    {/* Progress Indicator */}
                    {unviewedAchievements.length > 1 && (
                        <div className="mt-4 flex justify-center gap-2">
                            {unviewedAchievements.map((_, index) => (
                                <div
                                    key={index}
                                    className={`h-2 rounded-full transition-all ${index === 0 ? 'w-8 bg-white' : 'w-2 bg-white/40'
                                        }`}
                                ></div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }
      `}</style>
        </div>
    );
};

export default AchievementNotification;
