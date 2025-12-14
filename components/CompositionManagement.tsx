import React, { useState, useEffect } from 'react';
import { User, Composition, Student } from '../types';
import { getTeacherCompositions, deleteComposition } from '../services/compositionService';
import CreateCompositionModal from './CreateCompositionModal';
import AssignCompositionModal from './AssignCompositionModal';
import CompositionAssignmentsView from './CompositionAssignmentsView';

interface CompositionManagementProps {
    user: User;
    students: Student[];
}

const CompositionManagement: React.FC<CompositionManagementProps> = ({ user, students }) => {
    const [compositions, setCompositions] = useState<Composition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedComposition, setSelectedComposition] = useState<Composition | null>(null);
    const [activeTab, setActiveTab] = useState<'topics' | 'assignments'>('topics');

    useEffect(() => {
        loadCompositions();
    }, [user.id]);

    const loadCompositions = async () => {
        setIsLoading(true);
        try {
            const data = await getTeacherCompositions(user.id);
            setCompositions(data);
        } catch (error) {
            console.error('Error loading compositions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`"${title}" kompozisyonunu silmek istediğinizden emin misiniz?`)) {
            return;
        }

        try {
            await deleteComposition(id);
            await loadCompositions();
        } catch (error) {
            console.error('Error deleting composition:', error);
            alert('Silme işlemi başarısız oldu.');
        }
    };

    const handleAssign = (composition: Composition) => {
        setSelectedComposition(composition);
        setShowAssignModal(true);
    };

    const getDifficultyColor = (level: number) => {
        switch (level) {
            case 1: return 'bg-green-100 text-green-700';
            case 2: return 'bg-blue-100 text-blue-700';
            case 3: return 'bg-yellow-100 text-yellow-700';
            case 4: return 'bg-orange-100 text-orange-700';
            case 5: return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getDifficultyLabel = (level: number) => {
        switch (level) {
            case 1: return 'Çok Kolay';
            case 2: return 'Kolay';
            case 3: return 'Orta';
            case 4: return 'Zor';
            case 5: return 'Çok Zor';
            default: return 'Bilinmiyor';
        }
    };

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            general: 'Genel',
            narrative: 'Öykü/Anlatı',
            descriptive: 'Betimleme',
            expository: 'Açıklayıcı',
            persuasive: 'İkna Edici',
            creative: 'Yaratıcı'
        };
        return labels[category] || category;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row">
                        <button
                            onClick={() => setActiveTab('topics')}
                            className={`flex-1 px-6 py-4 text-sm sm:text-base font-semibold transition-colors ${activeTab === 'topics'
                                ? 'border-l-4 sm:border-l-0 sm:border-b-2 border-purple-500 text-purple-700 bg-purple-50'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            ✍️ Kompozisyon Konuları
                        </button>
                        <button
                            onClick={() => setActiveTab('assignments')}
                            className={`flex-1 px-6 py-4 text-sm sm:text-base font-semibold transition-colors ${activeTab === 'assignments'
                                ? 'border-l-4 sm:border-l-0 sm:border-b-2 border-purple-500 text-purple-700 bg-purple-50'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            📋 Atamalar
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {activeTab === 'topics' ? (
                        <div className="space-y-6">
                            {/* Topics Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Kompozisyon Konuları</h2>
                                    <p className="text-gray-600 mt-1">Öğrencilerinize atayabileceğiniz yazma konularını yönetin</p>
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="w-full sm:w-auto bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Yeni Konu Oluştur
                                </button>
                            </div>

                            {/* Compositions List */}
                            {isLoading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                                </div>
                            ) : compositions.length === 0 ? (
                                <div className="text-center py-16 bg-gray-50 rounded-2xl">
                                    <div className="text-6xl mb-4">✍️</div>
                                    <p className="text-gray-600 font-medium mb-2">Henüz kompozisyon konusu eklenmemiş</p>
                                    <p className="text-sm text-gray-500 mb-6">
                                        Yukarıdaki butonu kullanarak yeni bir kompozisyon konusu oluşturabilirsiniz
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {compositions.map((composition) => (
                                        <div
                                            key={composition.id}
                                            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
                                        >
                                            {/* Card Header */}
                                            <div className="p-6 border-b border-gray-100">
                                                <div className="flex items-start justify-between mb-3">
                                                    <h3 className="text-lg font-bold text-gray-900 flex-1 pr-2">
                                                        {composition.title}
                                                    </h3>
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(composition.difficultyLevel)}`}>
                                                        {getDifficultyLabel(composition.difficultyLevel)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                    {composition.description}
                                                </p>
                                            </div>

                                            {/* Card Body */}
                                            <div className="p-6 space-y-3">
                                                {/* Category & Grade */}
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded font-medium">
                                                        {getCategoryLabel(composition.category)}
                                                    </span>
                                                    {composition.gradeLevel && (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium">
                                                            {composition.gradeLevel}. Sınıf
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Word Count */}
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <span>{composition.minWordCount}-{composition.maxWordCount} kelime</span>
                                                </div>

                                                {/* Guidelines Count */}
                                                {composition.guidelines && composition.guidelines.length > 0 && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                        </svg>
                                                        <span>{composition.guidelines.length} yönerge</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Card Actions */}
                                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                                                <button
                                                    onClick={() => handleAssign(composition)}
                                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                                                >
                                                    Ata
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(composition.id, composition.title)}
                                                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Sil"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <CompositionAssignmentsView user={user} students={students} />
                    )}
                </div>
            </div>

            {/* Modals */}
            {showCreateModal && (
                <CreateCompositionModal
                    user={user}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={loadCompositions}
                />
            )}

            {showAssignModal && selectedComposition && (
                <AssignCompositionModal
                    composition={selectedComposition}
                    students={students}
                    teacherId={user.id}
                    onClose={() => {
                        setShowAssignModal(false);
                        setSelectedComposition(null);
                    }}
                    onSuccess={loadCompositions}
                />
            )}
        </div>
    );
};

export default CompositionManagement;
