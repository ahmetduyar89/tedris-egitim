import React, { useState, useEffect } from 'react';
import { ReviewPackage, ReviewPackageItem, ReviewPackageItemType } from '../types';

interface ReviewPackageEditorModalProps {
    studentId: string;
    topic: string;
    isLoading: boolean;
    initialItems: ReviewPackageItem[] | null;
    onClose: () => void;
    onAssign: (pkg: ReviewPackage) => void;
}

const stepConfig: { [key in ReviewPackageItemType]: { title: string; icon: React.ReactNode } } = {
    [ReviewPackageItemType.Introduction]: {
        title: 'Giriş & Analoji',
        icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.311a15.045 15.045 0 0 1-4.5 0M12 2.25v4.5m-3.25.3-1.5 1.5m10.5-1.5-1.5 1.5m-8.5 6.5-1.5 1.5m10.5-1.5-1.5 1.5m-8.5 6.5-1.5 1.5m10.5-1.5-1.5 1.5M12 6.75a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" /></svg>
    },
    [ReviewPackageItemType.KeyConcepts]: {
        title: 'Anahtar Kavramlar',
        icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
    },
    [ReviewPackageItemType.InteractiveQuiz]: {
        title: 'Mini Sınav (Önizleme)',
        icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>
    },
    [ReviewPackageItemType.Summary]: {
        title: 'Özet & Teşvik',
        icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 0 0 9 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 16.5c-1.437-1.29-3.262-2.25-5.375-2.25-2.113 0-3.938.96-5.375 2.25M12 14.25v-3.75m-3.75 3.75v-3.75m7.5 3.75v-3.75M9 14.25v-6.75a3 3 0 0 1 6 0v6.75M12 3.75a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-1.5 0V4.5a.75.75 0 0 1 .75-.75Zm-3.75 0a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-1.5 0V4.5a.75.75 0 0 1 .75-.75Zm7.5 0a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-1.5 0V4.5a.75.75 0 0 1 .75-.75Z" /></svg>
    },
};


const ReviewPackageEditorModal: React.FC<ReviewPackageEditorModalProps> = ({ studentId, topic, isLoading, initialItems, onClose, onAssign }) => {
    const [items, setItems] = useState<ReviewPackageItem[]>([]);

    useEffect(() => {
        if (initialItems) {
            setItems(initialItems);
        }
    }, [initialItems]);

    const handleAssign = () => {
        const newPackage: ReviewPackage = {
            id: `pkg-${Date.now()}`,
            studentId,
            topic,
            items,
        };
        onAssign(newPackage);
    };
    
    const handleContentChange = (itemType: ReviewPackageItemType, field: string, value: string, index?: number, subField?: string) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.type === itemType) {
                let newContent = { ...item.content };
                if (index !== undefined && subField) {
                    // Handle changes in arrays like key_concepts or interactive_quiz
                    const arrayToUpdate = newContent[field];
                    if (Array.isArray(arrayToUpdate)) {
                        arrayToUpdate[index] = { ...arrayToUpdate[index], [subField]: value };
                    }
                } else {
                    // Handle simple field changes
                    newContent = { ...item.content, [field]: value };
                }
                return { ...item, content: newContent };
            }
            return item;
        }));
    };
    
    const renderItemEditor = (item: ReviewPackageItem) => {
        switch (item.type) {
            case ReviewPackageItemType.Introduction:
                return (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                            <input
                                type="text"
                                value={item.content.title || ''}
                                onChange={(e) => handleContentChange(item.type, 'title', e.target.value)}
                                className="w-full font-semibold border-gray-300 rounded-lg p-2 text-base shadow-sm"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Analoji/Benzetme</label>
                            <textarea
                                value={item.content.analogy || ''}
                                onChange={(e) => handleContentChange(item.type, 'analogy', e.target.value)}
                                className="w-full border-gray-300 rounded-lg p-2 shadow-sm"
                                rows={3}
                            />
                        </div>
                    </div>
                );
            case ReviewPackageItemType.KeyConcepts:
                return (
                    <div className="space-y-4">
                         {item.content.concepts?.map((concept: any, index: number) => (
                            <div key={index}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kavram</label>
                                <input
                                    type="text"
                                    value={concept.concept || ''}
                                    onChange={(e) => handleContentChange(item.type, 'concepts', e.target.value, index, 'concept')}
                                    className="w-full font-semibold border-gray-300 rounded-lg p-2 mb-2 shadow-sm"
                                />
                                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                                <textarea
                                    value={concept.explanation || ''}
                                    onChange={(e) => handleContentChange(item.type, 'concepts', e.target.value, index, 'explanation')}
                                    className="w-full border-gray-300 rounded-lg p-2 text-sm shadow-sm"
                                    rows={2}
                                />
                            </div>
                        ))}
                    </div>
                );
            case ReviewPackageItemType.InteractiveQuiz:
                return (
                     <div className="space-y-4">
                        {item.content.questions?.map((q: any, i: number) => (
                            <div key={i} className="p-3 bg-gray-100 rounded-lg">
                                <p className="font-semibold text-gray-800">{i + 1}. {q.question}</p>
                                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                    {q.options.map((opt: string) => (
                                        <div key={opt} className={`p-2 rounded-md flex items-center ${opt === q.correctAnswer ? 'bg-green-100 text-green-800 font-bold' : 'bg-gray-200 text-gray-700'}`}>
                                            {opt === q.correctAnswer ? '✅' : '⚪️'}
                                            <span className="ml-2">{opt}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case ReviewPackageItemType.Summary:
                 return (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Özet Metni</label>
                            <textarea
                                value={item.content.summary_text || ''}
                                onChange={(e) => handleContentChange(item.type, 'summary_text', e.target.value)}
                                className="w-full border-gray-300 rounded-lg p-2 shadow-sm"
                                rows={4}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teşvik Mesajı</label>
                             <input
                                type="text"
                                value={item.content.encouragement || ''}
                                onChange={(e) => handleContentChange(item.type, 'encouragement', e.target.value)}
                                className="w-full border-gray-300 rounded-lg p-2 shadow-sm"
                            />
                        </div>
                    </div>
                );
            default:
                return <p>Düzenlenemeyen içerik tipi.</p>;
        }
    }


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-3xl h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-1">AI Konu Tekrar Paketi</h2>
                <p className="text-gray-600 mb-4">"{topic}"</p>

                {isLoading ? (
                    <div className="flex-grow flex items-center justify-center">
                        <div className="text-center">
                            <svg className="animate-spin mx-auto h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="mt-4 text-lg">AI Paket Oluşturuyor...</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow overflow-y-auto pr-2 space-y-4 bg-gray-50 p-4 rounded-lg">
                        {items.map(item => {
                             const config = stepConfig[item.type];
                             return (
                                <div key={item.id} className="p-4 bg-white rounded-xl shadow-sm border">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <span className="text-primary">{config.icon}</span>
                                        <h4 className="text-lg font-bold font-poppins text-text-primary">{config.title}</h4>
                                    </div>
                                    <div className="pl-10">
                                        {renderItemEditor(item)}
                                    </div>
                                </div>
                             )
                        })}
                    </div>
                )}

                <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
                    <button onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600">İptal</button>
                    <button onClick={handleAssign} disabled={isLoading || !initialItems} className="bg-success text-white px-4 py-2 rounded-xl disabled:bg-gray-400">
                        Öğrenciye Ata
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewPackageEditorModal;