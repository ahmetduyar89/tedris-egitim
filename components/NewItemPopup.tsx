import React from 'react';
import { Notification } from '../types';

interface NewItemPopupProps {
    notifications: Notification[];
    onClose: () => void;
}

const entityTypeConfig = {
    test: { icon: '🧾', label: 'Yeni Test' },
    assignment: { icon: '✅', label: 'Yeni Ödev' },
    content: { icon: '📚', label: 'Yeni Materyal' },
    submission: { icon: '📊', label: 'Test Sonucu' },
    default: { icon: '🔔', label: 'Yeni Bildirim' },
};

const NewItemPopup: React.FC<NewItemPopupProps> = ({ notifications, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-card-background rounded-2xl shadow-xl w-full max-w-md m-4 transform transition-all animate-fade-in-down"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 bg-primary/10 rounded-t-2xl text-center">
                    <div className="text-5xl mb-3">🎉</div>
                    <h2 className="text-2xl font-bold font-poppins text-primary">Yeni Görevlerin Var!</h2>
                    <p className="text-text-secondary mt-1">Öğretmenin sana yeni materyaller atadı.</p>
                </div>
                
                <div className="p-6 space-y-3 max-h-64 overflow-y-auto">
                    {notifications.map(n => {
                        const config = entityTypeConfig[n.entityType as keyof typeof entityTypeConfig] || entityTypeConfig.default;
                        return (
                             <div key={n.id} className="p-3 bg-background rounded-lg flex items-start space-x-3">
                                <span className="text-xl mt-1">{config.icon}</span>
                                <div>
                                    <p className="font-semibold text-text-primary">{config.label}</p>
                                    <p className="text-sm text-text-secondary">{n.message}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="p-6 border-t">
                    <button 
                        onClick={onClose}
                        className="w-full bg-primary text-white font-bold py-3 px-4 rounded-xl hover:bg-primary-dark transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-primary"
                    >
                        Harika, Anladım!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewItemPopup;
