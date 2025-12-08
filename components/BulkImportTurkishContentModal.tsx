import React, { useState } from 'react';
import { User } from '../types';
import { bulkCreateTurkishContent } from '../services/turkishLearningService';

interface BulkImportTurkishContentModalProps {
    user: User;
    onClose: () => void;
    onSuccess: () => void;
}

const BulkImportTurkishContentModal: React.FC<BulkImportTurkishContentModalProps> = ({ user, onClose, onSuccess }) => {
    const [category, setCategory] = useState<'vocabulary' | 'idiom' | 'proverb'>('vocabulary');
    const [textInput, setTextInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!textInput.trim()) {
            alert('Lütfen içerik girin.');
            return;
        }

        // Parse the input
        const lines = textInput.trim().split('\n').filter(line => line.trim());
        const items: Array<{
            category: 'vocabulary' | 'idiom' | 'proverb';
            frontContent: string;
            backContent: string;
            exampleSentence?: string;
            difficultyLevel?: number;
        }> = [];

        for (const line of lines) {
            // Format: "Front | Back" or "Front | Back | Example"
            const parts = line.split('|').map(p => p.trim());

            if (parts.length < 2) {
                alert(`Geçersiz format: "${line}"\nDoğru format: "Kelime | Anlamı" veya "Kelime | Anlamı | Örnek Cümle"`);
                return;
            }

            items.push({
                category,
                frontContent: parts[0],
                backContent: parts[1],
                exampleSentence: parts[2] || undefined,
                difficultyLevel: 3
            });
        }

        if (items.length === 0) {
            alert('Geçerli içerik bulunamadı.');
            return;
        }

        setIsSubmitting(true);
        try {
            await bulkCreateTurkishContent(user.id, items);
            alert(`${items.length} içerik başarıyla eklendi!`);
            setTextInput('');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error bulk creating content:', error);
            alert('İçerikler eklenirken bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
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

    const getExampleText = () => {
        switch (category) {
            case 'vocabulary':
                return `Müstesna | İstisna, ayrıcalıklı
Mahcup | Utanmış, sıkılmış
Mütevazi | Alçak gönüllü, gösterişsiz | O çok mütevazi bir insandır.`;
            case 'idiom':
                return `Ağzı kulaklarına varmak | Çok sevinmek
Burnundan kıl aldırmamak | Çok kurnaz olmak
Gözü dönmek | Çok öfkelenmek | Öyle kızdı ki gözü döndü.`;
            case 'proverb':
                return `Damlaya damlaya göl olur | Küçük şeyler birikince büyük sonuçlar doğurur
Akıllı ol ama akıllı olduğunu belli etme | Bilgili olmak iyidir ama bunu gösteriş yapmak için kullanma
Ağaç yaşken eğilir | İnsanın karakteri gençken şekillenir`;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Toplu İçerik Ekle</h2>
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

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">📝 Nasıl Kullanılır?</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Her satıra bir {getCategoryLabel().toLowerCase()} yazın</li>
                            <li>• Format: <code className="bg-blue-100 px-1 rounded">Kelime | Anlamı</code></li>
                            <li>• Örnek cümle eklemek için: <code className="bg-blue-100 px-1 rounded">Kelime | Anlamı | Örnek Cümle</code></li>
                            <li>• Pipe (|) karakteri ile ayırın</li>
                        </ul>
                    </div>

                    {/* Text Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            İçerikler (Her satırda bir tane)
                        </label>
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder={getExampleText()}
                            rows={12}
                            className="w-full border border-gray-300 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {textInput.trim().split('\n').filter(l => l.trim()).length} satır
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
                            {isSubmitting ? 'Ekleniyor...' : `Toplu Ekle (${textInput.trim().split('\n').filter(l => l.trim()).length})`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BulkImportTurkishContentModal;
