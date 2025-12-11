import React from 'react';
import { DailyMessage } from '../types';

interface MotivationCardProps {
    message: DailyMessage | null;
    isLoading: boolean;
}

const MotivationCard: React.FC<MotivationCardProps> = ({ message, isLoading }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center gap-2 text-white">
                <span className="bg-white/20 p-1.5 rounded-lg text-white backdrop-blur-sm shadow-sm">✨</span>
                <h2 className="text-lg font-bold">Günün Mesajı</h2>
            </div>
            <div className="p-6 text-center">
                {isLoading ? (
                    <div className="flex flex-col items-center gap-3 animate-pulse">
                        <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                    </div>
                ) : message ? (
                    <div className="animate-fade-in">
                        <p className="text-xl font-medium text-gray-800 italic leading-relaxed font-serif">"{message.message}"</p>
                    </div>
                ) : (
                    <p className="text-gray-500 italic">Bugün için motivasyon mesajı alınamadı.</p>
                )}
            </div>
        </div>
    );
};

export default MotivationCard;
