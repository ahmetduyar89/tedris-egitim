import React, { useState } from 'react';
import { User, CompositionCategory } from '../types';
import { createComposition } from '../services/compositionService';

interface CreateCompositionModalProps {
    user: User;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateCompositionModal: React.FC<CreateCompositionModalProps> = ({ user, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [prompt, setPrompt] = useState('');
    const [guidelines, setGuidelines] = useState<string[]>(['']);
    const [minWordCount, setMinWordCount] = useState(100);
    const [maxWordCount, setMaxWordCount] = useState(500);
    const [difficultyLevel, setDifficultyLevel] = useState(3);
    const [gradeLevel, setGradeLevel] = useState<number | undefined>(undefined);
    const [category, setCategory] = useState<CompositionCategory>('general');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddGuideline = () => {
        setGuidelines([...guidelines, '']);
    };

    const handleRemoveGuideline = (index: number) => {
        setGuidelines(guidelines.filter((_, i) => i !== index));
    };

    const handleGuidelineChange = (index: number, value: string) => {
        const newGuidelines = [...guidelines];
        newGuidelines[index] = value;
        setGuidelines(newGuidelines);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !description.trim() || !prompt.trim()) {
            alert('Lütfen tüm zorunlu alanları doldurun.');
            return;
        }

        if (minWordCount >= maxWordCount) {
            alert('Minimum kelime sayısı, maksimum kelime sayısından küçük olmalıdır.');
            return;
        }

        setIsSubmitting(true);
        try {
            await createComposition({
                teacherId: user.id,
                title: title.trim(),
                description: description.trim(),
                prompt: prompt.trim(),
                guidelines: guidelines.filter(g => g.trim() !== ''),
                minWordCount,
                maxWordCount,
                difficultyLevel,
                gradeLevel,
                category,
                isActive: true
            });

            alert('Kompozisyon konusu başarıyla oluşturuldu!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating composition:', error);
            alert('Kompozisyon oluşturulurken bir hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">✍️ Yeni Kompozisyon Konusu</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Başlık <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Örn: Hayalindeki Meslek"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Açıklama <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                            placeholder="Bu kompozisyon konusu hakkında kısa bir açıklama..."
                            required
                        />
                    </div>

                    {/* Prompt */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Kompozisyon Konusu/Yönergesi <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                            placeholder="Öğrencilere verilecek ana yazma konusu ve yönergeleri..."
                            required
                        />
                    </div>

                    {/* Guidelines */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                Yazma Yönergeleri (İsteğe Bağlı)
                            </label>
                            <button
                                type="button"
                                onClick={handleAddGuideline}
                                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                            >
                                + Yönerge Ekle
                            </button>
                        </div>
                        <div className="space-y-2">
                            {guidelines.map((guideline, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={guideline}
                                        onChange={(e) => handleGuidelineChange(index, e.target.value)}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder={`Yönerge ${index + 1}`}
                                    />
                                    {guidelines.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveGuideline(index)}
                                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Word Count */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Min. Kelime Sayısı
                            </label>
                            <input
                                type="number"
                                value={minWordCount}
                                onChange={(e) => setMinWordCount(parseInt(e.target.value) || 0)}
                                min="50"
                                max="1000"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Max. Kelime Sayısı
                            </label>
                            <input
                                type="number"
                                value={maxWordCount}
                                onChange={(e) => setMaxWordCount(parseInt(e.target.value) || 0)}
                                min="100"
                                max="2000"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Difficulty & Grade */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Zorluk Seviyesi
                            </label>
                            <select
                                value={difficultyLevel}
                                onChange={(e) => setDifficultyLevel(parseInt(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value={1}>1 - Çok Kolay</option>
                                <option value={2}>2 - Kolay</option>
                                <option value={3}>3 - Orta</option>
                                <option value={4}>4 - Zor</option>
                                <option value={5}>5 - Çok Zor</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Sınıf Seviyesi (İsteğe Bağlı)
                            </label>
                            <select
                                value={gradeLevel || ''}
                                onChange={(e) => setGradeLevel(e.target.value ? parseInt(e.target.value) : undefined)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="">Tüm Sınıflar</option>
                                {[5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                                    <option key={grade} value={grade}>{grade}. Sınıf</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Kategori
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as CompositionCategory)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="general">Genel</option>
                            <option value="narrative">Öykü/Anlatı</option>
                            <option value="descriptive">Betimleme</option>
                            <option value="expository">Açıklayıcı</option>
                            <option value="persuasive">İkna Edici</option>
                            <option value="creative">Yaratıcı</option>
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                            disabled={isSubmitting}
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Oluşturuluyor...' : 'Oluştur'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCompositionModal;
