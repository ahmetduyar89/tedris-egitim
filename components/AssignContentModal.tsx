import React, { useState, useEffect } from 'react';
import { User, Student, TurkishContentLibraryItem, Book } from '../types';
import { getTeacherTurkishContent } from '../services/turkishLearningService';
import { getTeacherBooks, assignBookToStudent } from '../services/bookReadingService';
import { assignWeeklyContent } from '../services/turkishLearningService';

interface AssignContentModalProps {
    user: User;
    students: Student[];
    onClose: () => void;
    onSuccess: () => void;
}

const AssignContentModal: React.FC<AssignContentModalProps> = ({ user, students, onClose, onSuccess }) => {
    const [selectedStudent, setSelectedStudent] = useState<string>('');
    const [weekStartDate, setWeekStartDate] = useState('');
    const [vocabularyItems, setVocabularyItems] = useState<TurkishContentLibraryItem[]>([]);
    const [idiomItems, setIdiomItems] = useState<TurkishContentLibraryItem[]>([]);
    const [proverbItems, setProverbItems] = useState<TurkishContentLibraryItem[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [selectedVocabulary, setSelectedVocabulary] = useState<string[]>([]);
    const [selectedIdioms, setSelectedIdioms] = useState<string[]>([]);
    const [selectedProverbs, setSelectedProverbs] = useState<string[]>([]);
    const [selectedBook, setSelectedBook] = useState<string>('');
    const [bookDueDate, setBookDueDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'vocabulary' | 'idiom' | 'proverb' | 'book'>('vocabulary');

    useEffect(() => {
        loadContent();
        // Set default week start date to next Monday
        const today = new Date();
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
        setWeekStartDate(nextMonday.toISOString().split('T')[0]);
    }, [user.id]);

    const loadContent = async () => {
        try {
            const [vocabulary, idioms, proverbs, booksData] = await Promise.all([
                getTeacherTurkishContent(user.id, 'vocabulary'),
                getTeacherTurkishContent(user.id, 'idiom'),
                getTeacherTurkishContent(user.id, 'proverb'),
                getTeacherBooks(user.id)
            ]);

            setVocabularyItems(vocabulary);
            setIdiomItems(idioms);
            setProverbItems(proverbs);
            setBooks(booksData);
        } catch (error) {
            console.error('Error loading content:', error);
        }
    };

    const toggleSelection = (id: string, type: 'vocabulary' | 'idiom' | 'proverb') => {
        switch (type) {
            case 'vocabulary':
                setSelectedVocabulary(prev =>
                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                );
                break;
            case 'idiom':
                setSelectedIdioms(prev =>
                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                );
                break;
            case 'proverb':
                setSelectedProverbs(prev =>
                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                );
                break;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedStudent) {
            alert('Lütfen bir öğrenci seçin.');
            return;
        }

        if (selectedVocabulary.length === 0 && selectedIdioms.length === 0 && selectedProverbs.length === 0 && !selectedBook) {
            alert('Lütfen en az bir içerik seçin.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Assign vocabulary, idioms, and proverbs
            if (selectedVocabulary.length > 0 || selectedIdioms.length > 0 || selectedProverbs.length > 0) {
                await assignWeeklyContent(
                    user.id,
                    selectedStudent,
                    weekStartDate,
                    selectedVocabulary,
                    selectedIdioms,
                    selectedProverbs
                );
            }

            // Assign book
            if (selectedBook && bookDueDate) {
                await assignBookToStudent(selectedBook, selectedStudent, user.id, bookDueDate);
            }

            alert('İçerik başarıyla atandı!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error assigning content:', error);
            alert('İçerik atanırken bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const getCurrentItems = () => {
        switch (activeTab) {
            case 'vocabulary': return vocabularyItems;
            case 'idiom': return idiomItems;
            case 'proverb': return proverbItems;
            case 'book': return [];
        }
    };

    const getSelectedCount = () => {
        switch (activeTab) {
            case 'vocabulary': return selectedVocabulary.length;
            case 'idiom': return selectedIdioms.length;
            case 'proverb': return selectedProverbs.length;
            case 'book': return selectedBook ? 1 : 0;
        }
    };

    const isSelected = (id: string) => {
        switch (activeTab) {
            case 'vocabulary': return selectedVocabulary.includes(id);
            case 'idiom': return selectedIdioms.includes(id);
            case 'proverb': return selectedProverbs.includes(id);
            default: return false;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Haftalık İçerik Ata</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Student and Week Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Öğrenci Seç <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedStudent}
                                onChange={(e) => setSelectedStudent(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3"
                                required
                            >
                                <option value="">Öğrenci seçin...</option>
                                {students && students.filter(s => s && s.id).map(student => (
                                    <option key={student.id} value={student.id}>{student.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Hafta Başlangıcı
                            </label>
                            <input
                                type="date"
                                value={weekStartDate}
                                onChange={(e) => setWeekStartDate(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3"
                                required
                            />
                        </div>
                    </div>

                    {/* Selection Summary */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">Seçilen İçerikler</h3>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-blue-700">📖 Kelime:</span>
                                <span className="ml-2 font-bold">{selectedVocabulary.length}</span>
                            </div>
                            <div>
                                <span className="text-blue-700">💬 Deyim:</span>
                                <span className="ml-2 font-bold">{selectedIdioms.length}</span>
                            </div>
                            <div>
                                <span className="text-blue-700">🎯 Atasözü:</span>
                                <span className="ml-2 font-bold">{selectedProverbs.length}</span>
                            </div>
                            <div>
                                <span className="text-blue-700">📚 Kitap:</span>
                                <span className="ml-2 font-bold">{selectedBook ? '1' : '0'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <div className="flex">
                            <button
                                type="button"
                                onClick={() => setActiveTab('vocabulary')}
                                className={`flex-1 px-4 py-3 font-semibold transition-colors ${activeTab === 'vocabulary'
                                    ? 'border-b-2 border-purple-500 text-purple-700'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                📖 Kelime ({selectedVocabulary.length}/{vocabularyItems.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('idiom')}
                                className={`flex-1 px-4 py-3 font-semibold transition-colors ${activeTab === 'idiom'
                                    ? 'border-b-2 border-blue-500 text-blue-700'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                💬 Deyim ({selectedIdioms.length}/{idiomItems.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('proverb')}
                                className={`flex-1 px-4 py-3 font-semibold transition-colors ${activeTab === 'proverb'
                                    ? 'border-b-2 border-green-500 text-green-700'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                🎯 Atasözü ({selectedProverbs.length}/{proverbItems.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('book')}
                                className={`flex-1 px-4 py-3 font-semibold transition-colors ${activeTab === 'book'
                                    ? 'border-b-2 border-orange-500 text-orange-700'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                📚 Kitap ({selectedBook ? '1' : '0'}/{books.length})
                            </button>
                        </div>
                    </div>

                    {/* Content Selection */}
                    <div className="max-h-96 overflow-y-auto">
                        {activeTab === 'book' ? (
                            <div className="space-y-4">
                                {books.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">Henüz kitap eklenmemiş</p>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 gap-3">
                                            {books.map(book => (
                                                <div
                                                    key={book.id}
                                                    onClick={() => setSelectedBook(book.id === selectedBook ? '' : book.id)}
                                                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${selectedBook === book.id
                                                        ? 'border-orange-500 bg-orange-50'
                                                        : 'border-gray-200 hover:border-orange-300'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-gray-900">{book.title}</h4>
                                                            <p className="text-sm text-gray-600">✍️ {book.author}</p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                📄 {book.pageCount} sayfa • 📅 {book.estimatedReadingDays} gün
                                                            </p>
                                                        </div>
                                                        {selectedBook === book.id && (
                                                            <span className="text-orange-600">✓</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {selectedBook && (
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Bitiş Tarihi
                                                </label>
                                                <input
                                                    type="date"
                                                    value={bookDueDate}
                                                    onChange={(e) => setBookDueDate(e.target.value)}
                                                    className="w-full border border-gray-300 rounded-lg p-3"
                                                    required={!!selectedBook}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {getCurrentItems().length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">Henüz içerik eklenmemiş</p>
                                ) : (
                                    getCurrentItems().map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleSelection(item.id, activeTab)}
                                            className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${isSelected(item.id)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-900">{item.frontContent}</h4>
                                                    <p className="text-sm text-gray-600">{item.backContent}</p>
                                                </div>
                                                {isSelected(item.id) && (
                                                    <span className="text-blue-600">✓</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
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
                            {isSubmitting ? 'Atanıyor...' : 'İçerikleri Ata'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignContentModal;