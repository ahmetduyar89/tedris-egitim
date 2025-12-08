import React, { useState, useEffect } from 'react';
import { User, Student, BookAssignment } from '../types';
import { getTeacherBookAssignments, submitTeacherReview } from '../services/bookReadingService';

interface BookAssignmentsManagementProps {
    user: User;
    students: Student[];
}

const BookAssignmentsManagement: React.FC<BookAssignmentsManagementProps> = ({ user, students }) => {
    const [assignments, setAssignments] = useState<BookAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reviewingAssignment, setReviewingAssignment] = useState<BookAssignment | null>(null);
    const [feedback, setFeedback] = useState('');
    const [score, setScore] = useState('');

    useEffect(() => {
        loadAssignments();
    }, [user.id]);

    const loadAssignments = async () => {
        setIsLoading(true);
        try {
            const data = await getTeacherBookAssignments(user.id);
            setAssignments(data);
        } catch (error) {
            console.error('Error loading assignments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewingAssignment || !feedback.trim() || !score) {
            alert('Lütfen tüm alanları doldurun.');
            return;
        }

        const scoreNum = parseInt(score);
        if (scoreNum < 0 || scoreNum > 100) {
            alert('Puan 0-100 arasında olmalıdır.');
            return;
        }

        try {
            await submitTeacherReview(reviewingAssignment.id, feedback.trim(), scoreNum);
            setReviewingAssignment(null);
            setFeedback('');
            setScore('');
            await loadAssignments();
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Değerlendirme kaydedilirken bir hata oluştu.');
        }
    };

    const getStudentName = (studentId: string) => {
        const student = students.find(s => s.id === studentId);
        return student?.name || 'Bilinmeyen Öğrenci';
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'assigned':
                return <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">Atandı</span>;
            case 'reading':
                return <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">Okunuyor</span>;
            case 'completed':
                return <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Tamamlandı</span>;
            case 'reviewed':
                return <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">Değerlendirildi</span>;
            default:
                return <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Kitap Atamaları</h2>
                <p className="text-gray-600 mt-1">Öğrencilerinize atadığınız kitapları takip edin</p>
            </div>

            {assignments.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <div className="text-5xl mb-3">📚</div>
                    <p className="text-gray-600 font-medium">Henüz kitap ataması yapılmamış</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {assignments.map((assignment) => (
                        <div key={assignment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-bold text-lg text-gray-900">{assignment.book?.title}</h3>
                                        {getStatusBadge(assignment.status)}
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        👤 {getStudentName(assignment.studentId)} • ✍️ {assignment.book?.author}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                        <span>📅 Atandı: {new Date(assignment.assignedAt).toLocaleDateString('tr-TR')}</span>
                                        {assignment.dueDate && (
                                            <span>⏰ Bitiş: {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {assignment.status === 'completed' && !assignment.teacherScore && (
                                <div className="mt-4">
                                    <button
                                        onClick={() => setReviewingAssignment(assignment)}
                                        className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
                                    >
                                        Değerlendir
                                    </button>
                                </div>
                            )}

                            {assignment.teacherScore && (
                                <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-semibold text-purple-900">Puan: {assignment.teacherScore}/100</span>
                                    </div>
                                    {assignment.teacherFeedback && (
                                        <p className="text-sm text-purple-800">
                                            <strong>Yorum:</strong> {assignment.teacherFeedback}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Review Modal */}
            {reviewingAssignment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
                        <div className="border-b p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800">Kitabı Değerlendir</h2>
                            <button onClick={() => setReviewingAssignment(null)} className="text-gray-500 hover:text-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-2">
                                    <strong>Kitap:</strong> {reviewingAssignment.book?.title}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Öğrenci:</strong> {getStudentName(reviewingAssignment.studentId)}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Puan (0-100) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={score}
                                    onChange={(e) => setScore(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3"
                                    placeholder="85"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Yorum <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-lg p-3"
                                    placeholder="Öğrencinin kitap analizi hakkında yorumunuzu yazın..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setReviewingAssignment(null)}
                                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleSubmitReview}
                                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                                >
                                    Değerlendirmeyi Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookAssignmentsManagement;
