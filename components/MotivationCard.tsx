import React from 'react';
import { DailyMessage } from '../types';

interface MotivationCardProps {
    message: DailyMessage | null;
    isLoading: boolean;
}

const MotivationCard: React.FC<MotivationCardProps> = ({ message, isLoading }) => {
    return (
        <div className="bg-gradient-to-r from-primary to-blue-400 p-6 rounded-2xl shadow-lg text-white min-h-[120px] flex flex-col justify-center">
            <h2 className="text-2xl font-bold mb-2">Günün Mesajı ✨</h2>
            {isLoading ? (
                <p className="italic opacity-80 animate-pulse">Sana özel bir mesaj hazırlanıyor...</p>
            ) : message ? (
                 <p className="text-lg italic animate-fade-in">"{message.message}"</p>
            ) : (
                 <p className="italic opacity-80">Bugün için motivasyon mesajı alınamadı.</p>
            )}
        </div>
    );
};

export default MotivationCard;
