import React, { useState, useEffect } from 'react';
import { User, CompositionAssignment, Student } from '../types';
import { getTeacherAssignments, deleteAssignment } from '../services/compositionService';
import CompositionReviewModal from './CompositionReviewModal';

interface CompositionAssignmentsViewProps {
    user: User;
    students: Student[];
}

const CompositionAssignmentsView: React.FC<CompositionAssignmentsViewProps> = ({ user, students }) => {
    const [assignments, setAssignments] = useState<CompositionAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAssignment, setSelectedAssignment] = useState<CompositionAssignment | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadAssignments();
    }, [user.id]);

    const loadAssignments = async () => {
        setIsLoading(true);
        try {
            const data = await getTeacherAssignments(user.id);
            console.log('Loaded assignments:', data);
            setAssignments(data);
        } catch (error) {
            console.error('Error loading assignments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (assignmentId: string, studentName: string, compositionTitle: string) => {
        if (!confirm(`${studentName} öğrencisinin "${compositionTitle}" kompozisyon atamasını silmek istediğinizden emin misiniz?`)) {
            return;
        }

        try {
            await deleteAssignment(assignmentId);
            await loadAssignments();
        } catch (error) {
            console.error('Error deleting assignment:', error);
            alert('Silme işlemi başarısız oldu.');
        }
    };

    const getStudentName = (studentId: string) => {
        const student = students.find(s => s.id === studentId);
        return student?.name || 'Bilinmeyen Öğrenci';
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { label: string; className: string }> = {
            assigned: { label: 'Atandı', className: 'bg-gray-100 text-gray-700' },
            draft: { label: 'Taslak', className: 'bg-orange-100 text-orange-700' },
            submitted: { label: 'Gönderildi', className: 'bg-yellow-100 text-yellow-700' },
            ai_evaluated: { label: 'AI Değerlendirdi', className: 'bg-blue-100 text-blue-700' },
            teacher_reviewed: { label: 'Değerlendirildi', className: 'bg-green-100 text-green-700' }
        };
        const badge = badges[status] || badges.assigned;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                {badge.label}
            </span>
        );
    };

    const filteredAssignments = assignments.filter(assignment => {
        // Status filter
        if (filterStatus !== 'all' && assignment.status !== filterStatus) {
            return false;
        }

        // Search filter
        if (searchTerm) {
            const studentName = getStudentName(assignment.studentId).toLowerCase();
            const compositionTitle = assignment.composition?.title.toLowerCase() || '';
            const search = searchTerm.toLowerCase();
            return studentName.includes(search) || compositionTitle.includes(search);
        }

        return true;
    });

    // Group assignments by composition
    const groupedAssignments = filteredAssignments.reduce((acc, assignment) => {
        const compositionId = assignment.compositionId;
        if (!acc[compositionId]) {
            acc[compositionId] = [];
        }
        acc[compositionId].push(assignment);
        return acc;
    }, {} as Record<string, CompositionAssignment[]>);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Kompozisyon Atamaları</h2>
                <p className="text-gray-600 mt-1">Öğrencilerinize atadığınız kompozisyonları görüntüleyin ve değerlendirin</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Öğrenci veya kompozisyon ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="all">Tüm Durumlar</option>
                        <option value="assigned">Atandı</option>
                        <option value="draft">Taslak</option>
                        <option value="submitted">Gönderildi</option>
                        <option value="ai_evaluated">AI Değerlendirdi</option>
                        <option value="teacher_reviewed">Değerlendirildi</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="text-2xl font-bold text-gray-900">{assignments.length}</div>
                    <div className="text-sm text-gray-600">Toplam Atama</div>
                </div>
                <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
                    <div className="text-2xl font-bold text-orange-700">
                        {assignments.filter(a => a.status === 'assigned' || a.status === 'draft').length}
                    </div>
                    <div className="text-sm text-orange-600">Bekleyen</div>
                </div>
                <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
                    <div className="text-2xl font-bold text-yellow-700">
                        {assignments.filter(a => a.status === 'submitted').length}
                    </div>
                    <div className="text-sm text-yellow-600">Gönderildi</div>
                </div>
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                    <div className="text-2xl font-bold text-blue-700">
                        {assignments.filter(a => a.status === 'ai_evaluated').length}
                    </div>
                    <div className="text-sm text-blue-600">AI Değerlendirdi</div>
                </div>
                <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                    <div className="text-2xl font-bold text-green-700">
                        {assignments.filter(a => a.status === 'teacher_reviewed').length}
                    </div>
                    <div className="text-sm text-green-600">Tamamlandı</div>
                </div>
            </div>

            {/* Assignments List */}
            {filteredAssignments.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl">
                    <div className="text-6xl mb-4">📝</div>
                    <p className="text-gray-600 font-medium mb-2">
                        {searchTerm || filterStatus !== 'all' ? 'Eşleşen atama bulunamadı' : 'Henüz kompozisyon ataması yapılmamış'}
                    </p>
                    <p className="text-sm text-gray-500">
                        {searchTerm || filterStatus !== 'all' ? 'Farklı filtreler deneyin' : 'Kompozisyon Konuları sekmesinden öğrencilerinize kompozisyon atayabilirsiniz'}
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedAssignments).map(([compositionId, compositionAssignments]) => {
                        const composition = compositionAssignments[0].composition;
                        if (!composition) return null;

                        return (
                            <div key={compositionId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Composition Header */}
                                <div className="bg-purple-50 border-b border-purple-100 p-4">
                                    <h3 className="text-lg font-bold text-purple-900">{composition.title}</h3>
                                    <p className="text-sm text-purple-700 mt-1">{composition.description}</p>
                                    <div className="flex items-center gap-2 mt-2 text-sm text-purple-600">
                                        <span>📏 {composition.minWordCount}-{composition.maxWordCount} kelime</span>
                                        <span>•</span>
                                        <span>👥 {compositionAssignments.length} öğrenci</span>
                                    </div>
                                </div>

                                {/* Students List */}
                                <div className="divide-y divide-gray-100">
                                    {compositionAssignments.map((assignment) => (
                                        <div key={assignment.id} className="p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="font-semibold text-gray-900">
                                                            {getStudentName(assignment.studentId)}
                                                        </h4>
                                                        {getStatusBadge(assignment.status)}
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                                        {assignment.assignedAt && (
                                                            <span>📅 Atandı: {new Date(assignment.assignedAt).toLocaleDateString('tr-TR')}</span>
                                                        )}
                                                        {assignment.dueDate && (
                                                            <span>⏰ Bitiş: {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}</span>
                                                        )}
                                                        {assignment.wordCount > 0 && (
                                                            <span>✍️ {assignment.wordCount} kelime</span>
                                                        )}
                                                    </div>

                                                    {/* Scores */}
                                                    {(assignment.aiScore !== undefined || assignment.teacherScore !== undefined) && (
                                                        <div className="flex items-center gap-2 mt-2">
                                                            {assignment.aiScore !== undefined && (
                                                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                                                                    🤖 AI: {assignment.aiScore}/100
                                                                </span>
                                                            )}
                                                            {assignment.teacherScore !== undefined && (
                                                                <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-semibold">
                                                                    👨‍🏫 Öğretmen: {assignment.teacherScore}/100
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2">
                                                    {(assignment.status === 'submitted' || assignment.status === 'ai_evaluated' || assignment.status === 'teacher_reviewed') && (
                                                        <button
                                                            onClick={() => setSelectedAssignment(assignment)}
                                                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                                                        >
                                                            Değerlendir
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(assignment.id, getStudentName(assignment.studentId), composition.title)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Atamayı Sil"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Review Modal */}
            {selectedAssignment && (
                <CompositionReviewModal
                    assignment={selectedAssignment}
                    onClose={() => setSelectedAssignment(null)}
                    onSuccess={() => {
                        setSelectedAssignment(null);
                        loadAssignments();
                    }}
                />
            )}
        </div>
    );
};

export default CompositionAssignmentsView;
