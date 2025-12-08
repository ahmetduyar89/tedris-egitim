import React, { useState } from 'react';
import { User } from '../types';
import { createTurkishContent } from '../services/turkishLearningService';

interface AddTurkishContentModalProps {
    user: User;
    onClose: () => void;
    onSuccess: () => void;
}

const AddTurkishContentModal: React.FC<AddTurkishContentModalProps> = ({ user, onClose, onSuccess }) => {
    const [category, setCategory] = useState<'vocabulary' | 'idiom' | 'proverb'>('vocabulary');
    const [frontContent, setFrontContent] = useState('');
    const [backContent, setBackContent] = useState('');
    const [exampleSentence, setExampleSentence] = useState('');
    const [difficultyLevel, setDifficultyLevel] = useState(3);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!frontContent.trim() || !backContent.trim()) {
            alert('Lütfen tüm zorunlu alanları doldurun.');
            return;
        }

        setIsSubmitting(true);
        try {
            await createTurkishContent(
                user.id,
                category,
                frontContent.trim(),
                backContent.trim(),
                exampleSentence.trim() || undefined,
                difficultyLevel,
                false
            );

            alert('İçerik başarıyla eklendi!');
            setFrontContent('');
            setBackContent('');
            setExampleSentence('');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating content:', error);
            alert('İçerik eklenirken bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const getCategoryLabel = () => {
        switch (category) {
            case 'vocabulary': return 'Kelime';
            case 'idiom': return 'Deyim';
            case 'proverb': return 'Atasözü';
        }
    };

    const getCategoryPlaceholder = () => {
        switch (category) {
            case 'vocabulary': return { front: 'Örn: Müstesna', back: 'İstisna, ayrıcalıklı' };
            case 'idiom': return { front: 'Örn: Ağzı kulaklarına varmak', back: 'Çok sevinmek' };
            case 'proverb': return { front: 'Örn: Damlaya damlaya göl olur', back: 'Küçük şeyler birikince büyük sonuçlar doğurur' };
        }
    };

    const placeholder = getCategoryPlaceholder();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Yeni İçerik Ekle</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Category Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Kategori</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setCategory('vocabulary')}
                                className={`p-4 rounded-lg border-2 transition-all ${category === 'vocabulary'
                                        ? 'border-purple-500 bg-purple-50'
                                        : 'border-gray-200 hover:border-purple-300'
                                    }`}
                            >
                                <div className="text-3xl mb-2">📖</div>
                                <div className="font-semibold text-sm">Kelime</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCategory('idiom')}
                                className={`p-4 rounded-lg border-2 transition-all ${category === 'idiom'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-300'
                                    }`}
                            >
                                <div className="text-3xl mb-2">💬</div>
                                <div className="font-semibold text-sm">Deyim</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCategory('proverb')}
                                className={`p-4 rounded-lg border-2 transition-all ${category === 'proverb'
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 hover:border-green-300'
                                    }`}
                            >
                                <div className="text-3xl mb-2">🎯</div>
                                <div className="font-semibold text-sm">Atasözü</div>
                            </button>
                        </div>
                    </div>

                    {/* Front Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {getCategoryLabel()} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={frontContent}
                            onChange={(e) => setFrontContent(e.target.value)}
                            placeholder={placeholder.front}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Back Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Anlamı / Açıklaması <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={backContent}
                            onChange={(e) => setBackContent(e.target.value)}
                            placeholder={placeholder.back}
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Example Sentence */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Örnek Cümle (Opsiyonel)
                        </label>
                        <textarea
                            value={exampleSentence}
                            onChange={(e) => setExampleSentence(e.target.value)}
                            placeholder="Bu kelime/deyim/atasözünü içeren örnek bir cümle yazın"
                            rows={2}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Difficulty Level */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Zorluk Seviyesi: {difficultyLevel}/5
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            value={difficultyLevel}
                            onChange={(e) => setDifficultyLevel(parseInt(e.target.value))}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Çok Kolay</span>
                            <span>Kolay</span>
                            <span>Orta</span>
                            <span>Zor</span>
                            <span>Çok Zor</span>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Ekleniyor...' : 'Ekle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTurkishContentModal;
