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
import AssignTurkishContentModal from '../components/AssignTurkishContentModal';
import BookAssignmentsManagement from '../components/BookAssignmentsManagement';
import TurkishAssignmentsManagement from '../components/TurkishAssignmentsManagement';
import CompositionManagement from '../components/CompositionManagement';

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
    const [showNewAssignModal, setShowNewAssignModal] = useState(false);
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
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    📚 Türkçe Öğrenimi
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                    Kelime, deyim, atasözü, kitap ve kompozisyon yönetimi
                </p>
            </div>

            {/* ============================================ */}
            {/* SECTION 1: KELİME / DEYİM / ATASÖZÜ */}
            {/* ============================================ */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Section Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        📖 Kelime, Deyim ve Atasözü Kütüphanesi
                    </h2>
                    <p className="text-purple-100 text-sm mt-1">İçerik ekleyin, düzenleyin ve öğrencilerinize atayın</p>
                </div>

                <div className="p-6">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-3">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">📖</span>
                                <div>
                                    <p className="text-xs font-medium text-purple-700">Kelimeler</p>
                                    <p className="text-xl font-bold text-purple-900">{vocabularyItems.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-3">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">💬</span>
                                <div>
                                    <p className="text-xs font-medium text-blue-700">Deyimler</p>
                                    <p className="text-xl font-bold text-blue-900">{idiomItems.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-3">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🎯</span>
                                <div>
                                    <p className="text-xs font-medium text-green-700">Atasözleri</p>
                                    <p className="text-xl font-bold text-green-900">{proverbItems.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Tek Ekle
                        </button>
                        <button
                            onClick={() => setShowBulkImportModal(true)}
                            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            Toplu Ekle
                        </button>
                        <button
                            onClick={() => setShowNewAssignModal(true)}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                            </svg>
                            Yeni Atama
                        </button>
                    </div>

                    {/* Content Tabs */}
                    <div className="bg-gray-50 rounded-lg border border-gray-200">
                        <div className="border-b border-gray-200">
                            <div className="flex">
                                <button
                                    onClick={() => setActiveTab('vocabulary')}
                                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'vocabulary'
                                            ? 'border-b-2 border-purple-500 text-purple-700 bg-white'
                                            : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    📖 Kelimeler ({vocabularyItems.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('idiom')}
                                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'idiom'
                                            ? 'border-b-2 border-blue-500 text-blue-700 bg-white'
                                            : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    💬 Deyimler ({idiomItems.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('proverb')}
                                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'proverb'
                                            ? 'border-b-2 border-green-500 text-green-700 bg-white'
                                            : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    🎯 Atasözleri ({proverbItems.length})
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-white">
                            {isLoading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-gray-600 mt-3 text-sm">Yükleniyor...</p>
                                </div>
                            ) : getCurrentItems().length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                    <div className="text-4xl mb-2">{getTabIcon()}</div>
                                    <p className="text-gray-600 font-medium mb-1 text-sm">Henüz {getTabLabel().toLowerCase()} eklenmemiş</p>
                                    <p className="text-xs text-gray-500">
                                        Yukarıdaki butonları kullanarak içerik ekleyebilirsiniz
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {getCurrentItems().map((item) => (
                                        <div key={item.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-white">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-sm text-gray-900 break-words">{item.frontContent}</h3>
                                                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600 flex-shrink-0">
                                                            Lv.{item.difficultyLevel}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 mb-1 break-words">{item.backContent}</p>
                                                    {item.exampleSentence && (
                                                        <p className="text-xs text-gray-600 italic break-words">
                                                            💡 {item.exampleSentence}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="flex-shrink-0 text-red-600 hover:text-red-800 hover:bg-red-50 rounded p-1 transition-colors"
                                                    title="Sil"
                                                >
                                                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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

                    {/* Turkish Assignments Management */}
                    <div className="mt-4">
                        <TurkishAssignmentsManagement user={user} students={students} />
                    </div>
                </div>
            </div>

            {/* ============================================ */}
            {/* SECTION 2: KİTAP YÖNETİMİ */}
            {/* ============================================ */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Section Header */}
                <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        📚 Kitap Yönetimi
                    </h2>
                    <p className="text-orange-100 text-sm mt-1">Kitap ekleyin, soru oluşturun ve öğrencilerinize atayın</p>
                </div>

                <div className="p-6">
                    <BookManagementSection user={user} />
                    <div className="mt-4">
                        <BookAssignmentsManagement user={user} students={students} />
                    </div>
                </div>
            </div>

            {/* ============================================ */}
            {/* SECTION 3: KOMPOZİSYON YÖNETİMİ */}
            {/* ============================================ */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Section Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        ✍️ Kompozisyon Yönetimi
                    </h2>
                    <p className="text-indigo-100 text-sm mt-1">Kompozisyon konuları oluşturun ve öğrencilerinize atayın</p>
                </div>

                <div className="p-6">
                    <CompositionManagement user={user} students={students} />
                </div>
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

            {showNewAssignModal && (
                <AssignTurkishContentModal
                    isOpen={showNewAssignModal}
                    onClose={() => setShowNewAssignModal(false)}
                    teacherId={user.id}
                    students={students}
                    onAssignmentCreated={loadContent}
                />
            )}
        </div>
    );
};

export default TurkishLearningPage;
