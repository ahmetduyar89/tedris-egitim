import React from 'react';
import { ContentLibraryItem } from '../types';

interface AiRecommendationModalProps {
    isOpen: boolean;
    onClose: () => void;
    recommendations: ContentLibraryItem[];
    onAddTask: (item: ContentLibraryItem) => void;
}

const AiRecommendationModal: React.FC<AiRecommendationModalProps> = ({ isOpen, onClose, recommendations, onAddTask }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">AI İçerik Önerileri</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
                </div>
                <p className="text-gray-600 mb-6">Öğrencinin zayıf konularına göre kütüphaneden önerilen materyaller:</p>
                
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {recommendations.length > 0 ? (
                        recommendations.map(item => (
                            <div key={item.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{item.title}</p>
                                    <p className="text-sm text-gray-500">{item.subject} - {item.grade}. Sınıf</p>
                                </div>
                                <button
                                    onClick={() => onAddTask(item)}
                                    className="bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold hover:bg-primary-dark"
                                >
                                    Plana Ekle
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-8">Bu konularla ilgili kütüphanede uygun materyal bulunamadı.</p>
                    )}
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="bg-gray-500 text-white px-6 py-2 rounded-xl">Kapat</button>
                </div>
            </div>
        </div>
    );
};

export default AiRecommendationModal;
