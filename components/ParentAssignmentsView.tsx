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

            {/* Ödev Kartları - Grid Layout */}
            {filteredAssignments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">✏️</div>
                    <p className="text-lg font-medium">
                        {filter === 'all' ? 'Henüz ödev bulunmuyor' : 'Bu kategoride ödev bulunmuyor'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAssignments.map((assignment) => {
                        const now = new Date();
                        const dueDate = new Date(assignment.dueDate || assignment.due_date);
                        const isCompleted = !!assignment.submission;
                        const isOverdue = !isCompleted && dueDate < now;

                        // Determine border color based on status
                        let borderColorClass = 'border-l-gray-300';
                        if (isCompleted) {
                            borderColorClass = 'border-l-green-400';
                        } else if (isOverdue) {
                            borderColorClass = 'border-l-red-400';
                        } else {
                            borderColorClass = 'border-l-yellow-400';
                        }

                        return (
                            <div
                                key={assignment.id}
                                className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full relative overflow-hidden border border-gray-100 border-l-4 ${borderColorClass}`}
                            >
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        {getStatusBadge(assignment)}
                                    </div>

                                    <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-2 leading-tight">
                                        {assignment.title}
                                    </h3>

                                    {assignment.subject && (
                                        <p className="text-sm text-gray-500 font-medium mb-3">{assignment.subject}</p>
                                    )}

                                    <div className={`flex items-center text-xs ${isOverdue ? 'text-red-500 font-bold' : 'text-gray-500'} bg-gray-50 p-2 rounded-lg mb-3`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                        </svg>
                                        <span>Son Teslim: {dueDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>

                                    {assignment.description && (
                                        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                                            {assignment.description}
                                        </p>
                                    )}

                                    {assignment.assignmentType && (
                                        <div className="flex items-center mt-2 text-xs text-gray-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                            </svg>
                                            <span className="font-medium">{assignment.assignmentType}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 pt-0 mt-auto">
                                    {assignment.submission && (
                                        <>
                                            {assignment.grade !== undefined && assignment.grade !== null && (
                                                <div className="mb-2 flex items-center justify-center space-x-2 bg-green-50 p-2 rounded-lg border border-green-100">
                                                    <span className="text-sm font-medium text-green-700">Puan:</span>
                                                    <span className="text-lg font-bold text-green-600">{assignment.grade}</span>
                                                </div>
                                            )}
                                            {assignment.feedback && (
                                                <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                                    <p className="text-xs font-semibold text-blue-800 mb-1">Öğretmen Geri Bildirimi:</p>
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">{assignment.feedback}</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ParentAssignmentsView;
