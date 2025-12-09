import React, { useState, useEffect } from 'react';
import { User, TurkishContentAssignment, Student } from '../types';
import {
    getTeacherAssignments,
    deleteTurkishContentAssignment
} from '../services/turkishLearningService';
import EditTurkishAssignmentModal from './EditTurkishAssignmentModal';

interface TurkishAssignmentsManagementProps {
    user: User;
    students: Student[];
}

const TurkishAssignmentsManagement: React.FC<TurkishAssignmentsManagementProps> = ({
    user,
    students
}) => {
    const [assignments, setAssignments] = useState<(TurkishContentAssignment & { studentName: string })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingAssignment, setEditingAssignment] = useState<(TurkishContentAssignment & { studentName: string }) | null>(null);
    const [filterCategory, setFilterCategory] = useState<'all' | 'vocabulary' | 'idiom' | 'proverb'>('all');

    useEffect(() => {
        loadAssignments();
    }, [user.id]);

    const loadAssignments = async () => {
        setIsLoading(true);
        try {
            const data = await getTeacherAssignments(user.id);
            setAssignments(data);
        } catch (error) {
            console.error('Error loading assignments:', error);
            alert('Atamalar yüklenirken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (assignmentId: string) => {
        if (!confirm('Bu atamayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
            return;
        }

        try {
            await deleteTurkishContentAssignment(assignmentId);
            await loadAssignments();
            alert('Atama başarıyla silindi.');
        } catch (error) {
            console.error('Error deleting assignment:', error);
            alert('Atama silinirken bir hata oluştu.');
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'vocabulary': return '📖';
            case 'idiom': return '💬';
            case 'proverb': return '🎯';
            default: return '📚';
        }
    };

    const getCategoryName = (category: string) => {
        switch (category) {
            case 'vocabulary': return 'Kelime';
            case 'idiom': return 'Deyim';
            case 'proverb': return 'Atasözü';
            default: return 'İçerik';
        }
    };

    const getStatusBadge = (assignment: TurkishContentAssignment) => {
        const now = new Date();
        const dueDate = new Date(assignment.dueDate);
        const isOverdue = now > dueDate && assignment.learningStatus !== 'mastered';

        if (assignment.learningStatus === 'mastered') {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">✓ Tamamlandı</span>;
        } else if (assignment.learningStatus === 'practicing') {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Pratik Yapıyor</span>;
        } else if (assignment.learningStatus === 'learning') {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">Öğreniyor</span>;
        } else if (isOverdue) {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Süresi Geçti</span>;
        } else {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">Başlanmadı</span>;
        }
    };

    const filteredAssignments = filterCategory === 'all'
        ? assignments
        : assignments.filter(a => a.category === filterCategory);

    return (
        <div className="mt-8">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Öğrenci Atamaları</h2>
                <p className="text-gray-600">Öğrencilere atadığınız Türkçe içeriklerini görüntüleyin ve yönetin</p>
            </div>

            {/* Filter Tabs */}
            <div className="mb-4 flex gap-2 overflow-x-auto">
                <button
                    onClick={() => setFilterCategory('all')}
                    className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${filterCategory === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Tümü ({assignments.length})
                </button>
                <button
                    onClick={() => setFilterCategory('vocabulary')}
                    className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${filterCategory === 'vocabulary'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    📖 Kelime ({assignments.filter(a => a.category === 'vocabulary').length})
                </button>
                <button
                    onClick={() => setFilterCategory('idiom')}
                    className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${filterCategory === 'idiom'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    💬 Deyim ({assignments.filter(a => a.category === 'idiom').length})
                </button>
                <button
                    onClick={() => setFilterCategory('proverb')}
                    className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${filterCategory === 'proverb'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    🎯 Atasözü ({assignments.filter(a => a.category === 'proverb').length})
                </button>
            </div>

            {/* Assignments List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 mt-4">Yükleniyor...</p>
                    </div>
                ) : filteredAssignments.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <div className="text-5xl mb-3">📚</div>
                        <p className="text-gray-600 font-medium mb-2">
                            {filterCategory === 'all' ? 'Henüz atama yapılmamış' : `Henüz ${getCategoryName(filterCategory).toLowerCase()} ataması yapılmamış`}
                        </p>
                        <p className="text-sm text-gray-500">
                            "Yeni Atama Oluştur" butonunu kullanarak öğrencilere içerik atayabilirsiniz
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredAssignments.map((assignment) => (
                            <div key={assignment.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">{getCategoryIcon(assignment.category)}</span>
                                            <h3 className="font-semibold text-lg text-gray-900">
                                                {assignment.studentName}
                                            </h3>
                                            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-600">
                                                {getCategoryName(assignment.category)}
                                            </span>
                                            {getStatusBadge(assignment)}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-2">
                                            <div>
                                                <span className="font-medium">İçerik Sayısı:</span> {assignment.contentIds.length}
                                            </div>
                                            <div>
                                                <span className="font-medium">Öğrenilen:</span> {assignment.learnedContentIds?.length || 0}/{assignment.contentIds.length}
                                            </div>
                                            <div>
                                                <span className="font-medium">Son Tarih:</span>{' '}
                                                {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}
                                            </div>
                                        </div>

                                        {assignment.practiceScore !== null && assignment.practiceScore !== undefined && (
                                            <div className="text-sm text-gray-600">
                                                <span className="font-medium">Pratik Skoru:</span>{' '}
                                                <span className={`font-semibold ${assignment.practiceScore >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    %{assignment.practiceScore}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => setEditingAssignment(assignment)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Düzenle"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(assignment.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Sil"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingAssignment && (
                <EditTurkishAssignmentModal
                    assignment={editingAssignment}
                    teacherId={user.id}
                    onClose={() => setEditingAssignment(null)}
                    onSuccess={() => {
                        setEditingAssignment(null);
                        loadAssignments();
                    }}
                />
            )}
        </div>
    );
};

export default TurkishAssignmentsManagement;
