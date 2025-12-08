import React, { useState, useEffect } from 'react';
import { User, Student, BookAssignment } from '../types';
import { getTeacherBookAssignments, submitTeacherReview, deleteBookAssignment, updateBookAssignment } from '../services/bookReadingService';

interface BookAssignmentsManagementProps {
    user: User;
    students: Student[];
}

const BookAssignmentsManagement: React.FC<BookAssignmentsManagementProps> = ({ user, students }) => {
    const [assignments, setAssignments] = useState<BookAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reviewingAssignment, setReviewingAssignment] = useState<BookAssignment | null>(null);
    const [editingAssignment, setEditingAssignment] = useState<BookAssignment | null>(null);
    const [feedback, setFeedback] = useState('');
    const [score, setScore] = useState('');
    const [editDueDate, setEditDueDate] = useState('');
    const [studentAnswers, setStudentAnswers] = useState<any[]>([]);
    const [loadingAnswers, setLoadingAnswers] = useState(false);

    useEffect(() => {
        loadAssignments();
    }, [user.id]);

    useEffect(() => {
        if (reviewingAssignment) {
            loadStudentAnswers(reviewingAssignment.id);
        } else {
            setStudentAnswers([]);
        }
    }, [reviewingAssignment]);

    const loadStudentAnswers = async (assignmentId: string) => {
        setLoadingAnswers(true);
        try {
            const { getStudentAnswers } = await import('../services/bookReadingService');
            const answers = await getStudentAnswers(assignmentId);
            console.log('[Review] Loaded student answers:', answers);
            setStudentAnswers(answers);
        } catch (error) {
            console.error('[Review] Error loading student answers:', error);
            setStudentAnswers([]);
        } finally {
            setLoadingAnswers(false);
        }
    };

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

    const handleDeleteAssignment = async (assignmentId: string) => {
        if (!confirm('Bu kitap atamasını silmek istediğinizden emin misiniz?')) return;

        try {
            await deleteBookAssignment(assignmentId);
            await loadAssignments();
        } catch (error) {
            console.error('Error deleting assignment:', error);
            alert('Silme işlemi başarısız oldu.');
        }
    };

    const handleEditAssignment = (assignment: BookAssignment) => {
        setEditingAssignment(assignment);
        setEditDueDate(assignment.dueDate ? assignment.dueDate.split('T')[0] : '');
    };

    const handleUpdateAssignment = async () => {
        if (!editingAssignment) return;

        try {
            await updateBookAssignment(editingAssignment.id, {
                dueDate: editDueDate || undefined
            });
            setEditingAssignment(null);
            setEditDueDate('');
            await loadAssignments();
        } catch (error) {
            console.error('Error updating assignment:', error);
            alert('Güncelleme işlemi başarısız oldu.');
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
                <p className="text-gray-600 mt-1">Öğrencilerinize atadığınız kitapları takip edin ve yönetin</p>
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

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditAssignment(assignment)}
                                        className="text-blue-600 hover:text-blue-800 transition-colors p-2"
                                        title="Düzenle"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAssignment(assignment.id)}
                                        className="text-red-600 hover:text-red-800 transition-colors p-2"
                                        title="Sil"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
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

            {/* Edit Modal */}
            {editingAssignment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
                        <div className="border-b p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800">Atamayı Düzenle</h2>
                            <button onClick={() => setEditingAssignment(null)} className="text-gray-500 hover:text-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-2">
                                    <strong>Kitap:</strong> {editingAssignment.book?.title}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Öğrenci:</strong> {getStudentName(editingAssignment.studentId)}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bitiş Tarihi
                                </label>
                                <input
                                    type="date"
                                    value={editDueDate}
                                    onChange={(e) => setEditDueDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setEditingAssignment(null)}
                                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleUpdateAssignment}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                >
                                    Güncelle
                                </button>
                            </div>
                        </div>
                    </div>
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

                            {/* Student Answers Section */}
                            <div className="border-t pt-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="text-lg">📝</span>
                                    Öğrencinin Cevapları
                                </h3>

                                {loadingAnswers ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                    </div>
                                ) : studentAnswers.length === 0 ? (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                                        <p className="text-sm text-yellow-700">
                                            ⚠️ Öğrenci henüz soruları cevaplamamış
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-4">
                                        {studentAnswers.map((answer, index) => (
                                            <div key={answer.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-start gap-3">
                                                    <span className="flex-shrink-0 w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-sm">
                                                        {index + 1}
                                                    </span>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-900 mb-2">
                                                            {answer.question?.questionText || 'Soru metni bulunamadı'}
                                                        </h4>
                                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                            <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                                                {answer.answerText}
                                                            </p>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            Cevaplandı: {new Date(answer.submittedAt).toLocaleString('tr-TR')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="border-t pt-4">
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
