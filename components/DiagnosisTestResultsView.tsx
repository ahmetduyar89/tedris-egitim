import React, { useState, useEffect } from 'react';
import { DiagnosisTest, DiagnosisTestAssignment } from '../types/diagnosisTestTypes';
import { diagnosisTestManagementService } from '../services/diagnosisTestManagementService';
import DiagnosisTestDetailModal from './DiagnosisTestDetailModal';

interface DiagnosisTestResultsViewProps {
    test: DiagnosisTest;
    onBack: () => void;
}

const DiagnosisTestResultsView: React.FC<DiagnosisTestResultsViewProps> = ({ test, onBack }) => {
    const [assignments, setAssignments] = useState<DiagnosisTestAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

    useEffect(() => {
        loadAssignments();
    }, [test.id]);

    const loadAssignments = async () => {
        try {
            setIsLoading(true);
            const data = await diagnosisTestManagementService.getTestAssignments(test.id);
            setAssignments(data);
        } catch (error) {
            console.error('Error loading assignments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Tamamlandı</span>;
            case 'in_progress':
                return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Devam Ediyor</span>;
            case 'pending':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Bekliyor</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">{status}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center mb-8">
                    <button
                        onClick={onBack}
                        className="mr-4 p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-gray-600 hover:text-primary"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{test.title} - Sonuçlar</h1>
                        <p className="text-gray-600 text-sm mt-1">
                            {test.subject} • {test.grade}. Sınıf • {test.totalQuestions} Soru
                        </p>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : assignments.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">👥</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Henüz Atama Yapılmamış</h3>
                        <p className="text-gray-500">
                            Bu testi henüz hiçbir öğrenciye atamadınız.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Öğrenci</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Puan</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Doğru/Toplam</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tamamlanma Tarihi</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {assignments.map((assignment) => (
                                    <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mr-3">
                                                    {assignment.student?.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{assignment.student?.name || 'Bilinmeyen Öğrenci'}</div>
                                                    <div className="text-xs text-gray-500">{assignment.student?.contact || ''}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(assignment.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {assignment.status === 'completed' ? (
                                                <span className={`text-sm font-bold ${(assignment.score || 0) >= 80 ? 'text-green-600' :
                                                    (assignment.score || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'
                                                    }`}>
                                                    {assignment.score}%
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {assignment.status === 'completed' ? (
                                                `${assignment.totalCorrect} / ${assignment.totalQuestions}`
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {assignment.completedAt ? new Date(assignment.completedAt).toLocaleDateString('tr-TR', {
                                                day: 'numeric',
                                                month: 'long',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {assignment.status === 'completed' && (
                                                <button
                                                    onClick={() => setSelectedAssignmentId(assignment.id)}
                                                    className="text-primary hover:text-primary-dark font-semibold"
                                                >
                                                    Detayları Gör
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedAssignmentId && (
                <DiagnosisTestDetailModal
                    isOpen={!!selectedAssignmentId}
                    onClose={() => setSelectedAssignmentId(null)}
                    assignmentId={selectedAssignmentId}
                />
            )}
        </div>
    );
};

export default DiagnosisTestResultsView;
