import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import * as parentService from '../services/parentService';

interface ParentAssignmentsViewProps {
    student: Student;
}

const ParentAssignmentsView: React.FC<ParentAssignmentsViewProps> = ({ student }) => {
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                setLoading(true);
                const [assignmentsData, statsData] = await Promise.all([
                    parentService.getStudentActiveAssignments(student.id),
                    parentService.getAssignmentStats(student.id)
                ]);
                setAssignments(assignmentsData);
                setStats(statsData);
            } catch (error) {
                console.error('Error fetching assignments:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignments();
    }, [student.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const getFilteredAssignments = () => {
        const now = new Date();
        switch (filter) {
            case 'pending':
                return assignments.filter(a => !a.submission && new Date(a.dueDate || a.due_date) > now);
            case 'completed':
                return assignments.filter(a => a.submission);
            case 'overdue':
                return assignments.filter(a => !a.submission && new Date(a.dueDate || a.due_date) <= now);
            default:
                return assignments;
        }
    };

    const filteredAssignments = getFilteredAssignments();

    const getStatusBadge = (assignment: any) => {
        const now = new Date();
        const dueDate = new Date(assignment.dueDate || assignment.due_date);

        if (assignment.submission) {
            return (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    ✓ Tamamlandı
                </span>
            );
        }

        if (dueDate < now) {
            return (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                    ⚠️ Gecikmiş
                </span>
            );
        }

        const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 2) {
            return (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                    ⏰ {daysLeft} gün kaldı
                </span>
            );
        }

        return (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                📝 Bekliyor
            </span>
        );
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return 'border-l-4 border-red-500';
            case 'medium':
                return 'border-l-4 border-yellow-500';
            case 'low':
                return 'border-l-4 border-green-500';
            default:
                return 'border-l-4 border-gray-300';
        }
    };

    return (
        <div className="space-y-6">
            {/* İstatistik Kartları */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="text-sm font-medium text-blue-700 mb-1">Toplam</div>
                        <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                        <div className="text-sm font-medium text-yellow-700 mb-1">Bekleyen</div>
                        <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <div className="text-sm font-medium text-green-700 mb-1">Tamamlanan</div>
                        <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                        <div className="text-sm font-medium text-red-700 mb-1">Gecikmiş</div>
                        <div className="text-2xl font-bold text-red-900">{stats.overdue}</div>
                    </div>
                </div>
            )}

            {/* Filtreler */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'all'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Tümü ({assignments.length})
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'pending'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Bekleyen ({stats?.pending || 0})
                </button>
                <button
                    onClick={() => setFilter('completed')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'completed'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Tamamlanan ({stats?.completed || 0})
                </button>
                <button
                    onClick={() => setFilter('overdue')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'overdue'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Gecikmiş ({stats?.overdue || 0})
                </button>
            </div>

            {/* Ödev Listesi */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {filteredAssignments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4">✏️</div>
                        <p className="text-lg font-medium">
                            {filter === 'all' ? 'Henüz ödev bulunmuyor' : 'Bu kategoride ödev bulunmuyor'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredAssignments.map((assignment) => (
                            <div
                                key={assignment.id}
                                className={`p-5 hover:bg-gray-50 transition ${getPriorityColor(assignment.priority)}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-bold text-gray-900 text-lg">
                                                {assignment.title}
                                            </h4>
                                            {getStatusBadge(assignment)}
                                        </div>

                                        {assignment.description && (
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                {assignment.description}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                📅 Son Tarih: {new Date(assignment.dueDate || assignment.due_date).toLocaleDateString('tr-TR')}
                                            </span>
                                            {assignment.subject && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                    {assignment.subject}
                                                </span>
                                            )}
                                            {assignment.assignmentType && (
                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                                    {assignment.assignmentType}
                                                </span>
                                            )}
                                        </div>

                                        {assignment.submission && (
                                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-green-700 font-medium">
                                                        ✓ Teslim Edildi
                                                    </span>
                                                    {assignment.grade && (
                                                        <span className="text-lg font-bold text-green-800">
                                                            {assignment.grade}/100
                                                        </span>
                                                    )}
                                                </div>
                                                {assignment.feedback && (
                                                    <p className="text-sm text-green-700 mt-2">
                                                        💬 {assignment.feedback}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParentAssignmentsView;
