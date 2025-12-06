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
    const [error, setError] = useState<string | null>(null);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

    useEffect(() => {
        loadAssignments();
    }, [test.id]);

    const loadAssignments = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await diagnosisTestManagementService.getTestAssignments(test.id);
            setAssignments(data);
        } catch (err: any) {
            console.error('Error loading assignments:', err);
            setError(err.message || 'Atamalar yüklenirken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTest = async () => {
        if (window.confirm('Bu testi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve testle ilgili tüm veriler (sorular, atamalar, sonuçlar) silinecektir.')) {
            try {
                setIsLoading(true);
                await diagnosisTestManagementService.deleteTest(test.id);
                onBack(); // Listeye geri dön
            } catch (err: any) {
                console.error('Error deleting test:', err);
                alert('Test silinirken bir hata oluştu.');
                setIsLoading(false);
            }
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
                    <div className="ml-auto flex items-center space-x-2">
                        <button
                            onClick={loadAssignments}
                            className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                            title="Yenile"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <button
                            onClick={handleDeleteTest}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Testi Sil"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                        <div className="text-red-500 text-xl font-bold mb-2">Bir Hata Oluştu</div>
                        <p className="text-gray-700">{error}</p>
                        <button
                            onClick={loadAssignments}
                            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                            Tekrar Dene
                        </button>
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
                                                    {assignment.score ?? 0}%
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {assignment.status === 'completed' ? (
                                                `${assignment.totalCorrect ?? 0} / ${assignment.totalQuestions ?? 0}`
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
                                            {assignment.status === 'completed' && (
                                                <button
                                                    onClick={() => {
                                                        const studentName = assignment.student?.name || 'Öğrenci';
                                                        const testName = test.title;
                                                        const score = assignment.score || 0;
                                                        const correct = assignment.totalCorrect || 0;
                                                        const total = assignment.totalQuestions || 0;

                                                        // Fallback to contact if parent contact not available
                                                        // Now using the mapped parentPhone from the service
                                                        const phone = assignment.student?.parentPhone?.replace(/\D/g, '') || assignment.student?.contact?.replace(/\D/g, '') || '';

                                                        if (!phone) {
                                                            alert('Öğrenci telefon numarası bulunamadı.');
                                                            return;
                                                        }

                                                        const message = `Merhaba Sayın Veli,\n\n` +
                                                            `📊 *${studentName}* isimli öğrencimizin *${testName}* deneme sınavı sonuçları:\n\n` +
                                                            `✅ *Puan:* ${score}\n` +
                                                            `🎯 *Doğru Sayısı:* ${correct} / ${total}\n\n` +
                                                            `Başarılarının devamını dileriz.`;

                                                        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                                                        window.open(whatsappUrl, '_blank');
                                                    }}
                                                    className="ml-3 text-green-600 hover:text-green-800"
                                                    title="WhatsApp ile Paylaş"
                                                >
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                                    </svg>
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
