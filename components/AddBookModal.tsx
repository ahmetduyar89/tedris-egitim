import React, { useState } from 'react';
import { User } from '../types';
import { createBook } from '../services/bookReadingService';

interface AddBookModalProps {
    user: User;
    onClose: () => void;
    onSuccess: (bookId: string) => void;
}

const AddBookModal: React.FC<AddBookModalProps> = ({ user, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [pageCount, setPageCount] = useState('');
    const [estimatedReadingDays, setEstimatedReadingDays] = useState('7');
    const [difficultyLevel, setDifficultyLevel] = useState(3);
    const [summary, setSummary] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !author.trim() || !pageCount) {
            alert('Lütfen tüm zorunlu alanları doldurun.');
            return;
        }

        const pages = parseInt(pageCount);
        const days = parseInt(estimatedReadingDays);

        if (pages <= 0 || days <= 0) {
            alert('Sayfa sayısı ve okuma süresi pozitif olmalıdır.');
            return;
        }

        setIsSubmitting(true);
        try {
            const book = await createBook(
                user.id,
                title.trim(),
                author.trim(),
                pages,
                days,
                difficultyLevel,
                summary.trim() || undefined
            );

            alert('Kitap başarıyla eklendi! Şimdi sorular ekleyebilirsiniz.');
            onSuccess(book.id);
        } catch (error) {
            console.error('Error creating book:', error);
            alert('Kitap eklenirken bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Yeni Kitap Ekle</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kitap Adı <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Örn: Küçük Prens"
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Author */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Yazar <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="Örn: Antoine de Saint-Exupéry"
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Page Count and Reading Days */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sayfa Sayısı <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={pageCount}
                                onChange={(e) => setPageCount(e.target.value)}
                                placeholder="120"
                                min="1"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tahmini Okuma Süresi (Gün)
                            </label>
                            <select
                                value={estimatedReadingDays}
                                onChange={(e) => setEstimatedReadingDays(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="7">1 Hafta (Kısa)</option>
                                <option value="15">15 Gün (Uzun)</option>
                            </select>
                        </div>
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

                    {/* Summary */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Özet (Opsiyonel)
                        </label>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Kitap hakkında kısa bir özet yazın..."
                            rows={4}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-700">
                            💡 Kitabı ekledikten sonra, öğrencilerin cevaplaması için sorular oluşturabileceksiniz.
                        </p>
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
                            {isSubmitting ? 'Ekleniyor...' : 'Kitap Ekle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddBookModal;
