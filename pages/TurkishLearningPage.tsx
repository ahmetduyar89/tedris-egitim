import React, { useState, useEffect } from 'react';
import { User, TurkishContentLibraryItem, Book, BookQuestion, Student } from '../types';
import { getTeacherTurkishContent, deleteTurkishContent } from '../services/turkishLearningService';
import { getTeacherBooks, deleteBook, getBookQuestions } from '../services/bookReadingService';
import AddTurkishContentModal from '../components/AddTurkishContentModal';
import BulkImportTurkishContentModal from '../components/BulkImportTurkishContentModal';
import AddBookModal from '../components/AddBookModal';
import ManageBookQuestionsModal from '../components/ManageBookQuestionsModal';
import BookManagementSection from '../components/BookManagementSection';
import AssignContentModal from '../components/AssignContentModal';
import BookAssignmentsManagement from '../components/BookAssignmentsManagement';

interface TurkishLearningPageProps {
    user: User;
    students: Student[];
}

const TurkishLearningPage: React.FC<TurkishLearningPageProps> = ({ user, students }) => {
    const [vocabularyItems, setVocabularyItems] = useState<TurkishContentLibraryItem[]>([]);
    const [idiomItems, setIdiomItems] = useState<TurkishContentLibraryItem[]>([]);
    const [proverbItems, setProverbItems] = useState<TurkishContentLibraryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkImportModal, setShowBulkImportModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'vocabulary' | 'idiom' | 'proverb'>('vocabulary');

    useEffect(() => {
        loadContent();
    }, [user.id]);

    const loadContent = async () => {
        setIsLoading(true);
        try {
            const [vocabulary, idioms, proverbs] = await Promise.all([
                getTeacherTurkishContent(user.id, 'vocabulary'),
                getTeacherTurkishContent(user.id, 'idiom'),
                getTeacherTurkishContent(user.id, 'proverb')
            ]);

            setVocabularyItems(vocabulary);
            setIdiomItems(idioms);
            setProverbItems(proverbs);
        } catch (error) {
            console.error('Error loading content:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu içeriği silmek istediğinizden emin misiniz?')) return;

        try {
            await deleteTurkishContent(id);
            await loadContent();
        } catch (error) {
            console.error('Error deleting content:', error);
            alert('Silme işlemi başarısız oldu.');
        }
    };

    const getCurrentItems = () => {
        switch (activeTab) {
            case 'vocabulary': return vocabularyItems;
            case 'idiom': return idiomItems;
            case 'proverb': return proverbItems;
        }
    };

    const getTabLabel = () => {
        switch (activeTab) {
            case 'vocabulary': return 'Kelimeler';
            case 'idiom': return 'Deyimler';
            case 'proverb': return 'Atasözleri';
        }
    };

    const getTabIcon = () => {
        switch (activeTab) {
            case 'vocabulary': return '📖';
            case 'idiom': return '💬';
            case 'proverb': return '🎯';
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-4 md:mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Türkçe Öğrenimi</h1>
                <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
                    Kelime, deyim ve atasözü kütüphanenizi yönetin
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs md:text-sm font-medium text-purple-700">Kelimeler</span>
                            <p className="text-2xl md:text-3xl font-bold text-purple-900 mt-1">{vocabularyItems.length}</p>
                        </div>
                        <span className="text-3xl md:text-4xl">📖</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs md:text-sm font-medium text-blue-700">Deyimler</span>
                            <p className="text-2xl md:text-3xl font-bold text-blue-900 mt-1">{idiomItems.length}</p>
                        </div>
                        <span className="text-3xl md:text-4xl">💬</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs md:text-sm font-medium text-green-700">Atasözleri</span>
                            <p className="text-2xl md:text-3xl font-bold text-green-900 mt-1">{proverbItems.length}</p>
                        </div>
                        <span className="text-3xl md:text-4xl">🎯</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-4 md:mb-6">
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Tek Tek Ekle
                </button>
                <button
                    onClick={() => setShowBulkImportModal(true)}
                    className="bg-green-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    Toplu Ekle
                </button>
                <button
                    onClick={() => setShowAssignModal(true)}
                    className="bg-purple-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    Öğrenciye Ata
                </button>
            </div>

            {/* Content Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                    <div className="flex overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('vocabulary')}
                            className={`flex-1 min-w-[100px] px-3 md:px-6 py-3 md:py-4 text-xs md:text-base font-semibold transition-colors whitespace-nowrap ${activeTab === 'vocabulary'
                                ? 'border-b-2 border-purple-500 text-purple-700'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <span className="hidden sm:inline">📖 Kelimeler ({vocabularyItems.length})</span>
                            <span className="sm:hidden">📖 ({vocabularyItems.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('idiom')}
                            className={`flex-1 min-w-[100px] px-3 md:px-6 py-3 md:py-4 text-xs md:text-base font-semibold transition-colors whitespace-nowrap ${activeTab === 'idiom'
                                ? 'border-b-2 border-blue-500 text-blue-700'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <span className="hidden sm:inline">💬 Deyimler ({idiomItems.length})</span>
                            <span className="sm:hidden">💬 ({idiomItems.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('proverb')}
                            className={`flex-1 min-w-[100px] px-3 md:px-6 py-3 md:py-4 text-xs md:text-base font-semibold transition-colors whitespace-nowrap ${activeTab === 'proverb'
                                ? 'border-b-2 border-green-500 text-green-700'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <span className="hidden sm:inline">🎯 Atasözleri ({proverbItems.length})</span>
                            <span className="sm:hidden">🎯 ({proverbItems.length})</span>
                        </button>
                    </div>
                </div>

                <div className="p-3 md:p-6">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600 mt-4">Yükleniyor...</p>
                        </div>
                    ) : getCurrentItems().length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <div className="text-5xl mb-3">{getTabIcon()}</div>
                            <p className="text-gray-600 font-medium mb-2">Henüz {getTabLabel().toLowerCase()} eklenmemiş</p>
                            <p className="text-sm text-gray-500 mb-4">
                                Yukarıdaki butonları kullanarak içerik ekleyebilirsiniz
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2 md:space-y-3">
                            {getCurrentItems().map((item) => (
                                <div key={item.id} className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                                                <h3 className="font-semibold text-base md:text-lg text-gray-900 break-words">{item.frontContent}</h3>
                                                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600 w-fit">
                                                    Seviye {item.difficultyLevel}
                                                </span>
                                            </div>
                                            <p className="text-sm md:text-base text-gray-700 mb-2 break-words">{item.backContent}</p>
                                            {item.exampleSentence && (
                                                <p className="text-xs md:text-sm text-gray-600 italic break-words">
                                                    💡 {item.exampleSentence}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="flex-shrink-0 text-red-600 hover:text-red-800 transition-colors p-1"
                                            title="Sil"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Book Management Section */}
            <BookManagementSection user={user} />

            {/* Book Assignments Management */}
            <div className="mt-8">
                <BookAssignmentsManagement user={user} students={students} />
            </div>

            {/* Modals */}
            {showAddModal && (
                <AddTurkishContentModal
                    user={user}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={loadContent}
                />
            )}

            {showBulkImportModal && (
                <BulkImportTurkishContentModal
                    user={user}
                    onClose={() => setShowBulkImportModal(false)}
                    onSuccess={loadContent}
                />
            )}

            {showAssignModal && (
                <AssignContentModal
                    user={user}
                    students={students}
                    onClose={() => setShowAssignModal(false)}
                    onSuccess={loadContent}
                />
            )}
        </div>
    );
};

export default TurkishLearningPage;
