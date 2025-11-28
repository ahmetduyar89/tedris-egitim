import React from 'react';
import { GamificationService } from '../../services/gamificationService';

interface XPBarProps {
    xp: number;
    level: number;
}

export const XPBar: React.FC<XPBarProps> = ({ xp, level }) => {
    const { currentLevel, nextLevel, progress } = GamificationService.getLevelInfo(xp);

    return (
        <div className="w-full bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-indigo-700">Seviye {level}: {currentLevel.title}</span>
                <span className="text-sm text-gray-500">{xp} / {nextLevel ? nextLevel.minXp : 'Max'} XP</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="mt-1 text-xs text-center text-gray-400">
                {nextLevel ? `Sonraki seviye için ${nextLevel.minXp - xp} XP kaldı` : 'Maksimum seviyedesin!'}
            </div>
        </div>
    );
};
