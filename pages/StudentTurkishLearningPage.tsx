import React, { useState, useEffect } from 'react';
import { User, WeeklyTurkishGoals, BookAssignment } from '../types';
import { getCurrentWeekGoals } from '../services/turkishLearningService';
import { getStudentBookAssignments } from '../services/bookReadingService';
import BookQuestionAnsweringPage from './BookQuestionAnsweringPage';

interface StudentTurkishLearningPageProps {
    user: User;
}

const StudentTurkishLearningPage: React.FC<StudentTurkishLearningPageProps> = ({ user }) => {
    const [weeklyGoals, setWeeklyGoals] = useState<WeeklyTurkishGoals | null>(null);
    const [bookAssignments, setBookAssignments] = useState<BookAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAssignment, setSelectedAssignment] = useState<BookAssignment | null>(null);

    useEffect(() => {
        loadData();
    }, [user.id]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [goals, books] = await Promise.all([
                getCurrentWeekGoals(user.id),
                getStudentBookAssignments(user.id)
            ]);

            setWeeklyGoals(goals);
            setBookAssignments(books);
        } catch (error) {
            console.error('Error loading Turkish learning data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartReading = async (assignmentId: string) => {
        try {
            const { updateBookAssignmentStatus } = await import('../services/bookReadingService');
            await updateBookAssignmentStatus(assignmentId, 'reading');
            await loadData();
        } catch (error) {
            console.error('Error starting reading:', error);
            alert('Bir hata oluştu. Lütfen tekrar deneyin.');
        }
    };

    const handleAnswerQuestions = (assignment: BookAssignment) => {
        setSelectedAssignment(assignment);
    };

    const handleBackFromQuestions = () => {
        setSelectedAssignment(null);
        loadData(); // Reload data to get updated status
    };

    const getProgressPercentage = (learned: number, target: number) => {
        if (target === 0) return 0;
        return Math.min(Math.round((learned / target) * 100), 100);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Show question answering page if an assignment is selected
    if (selectedAssignment) {
        return (
            <BookQuestionAnsweringPage
                user={user}
                assignment={selectedAssignment}
                onBack={handleBackFromQuestions}
                onComplete={handleBackFromQuestions}
            />
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">📚 Türkçe Öğrenimi</h1>
                <p className="text-gray-600 mt-2">
                    Haftalık hedefleriniz ve atanan kitaplarınız
                </p>
            </div>

            {!weeklyGoals && bookAssignments.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <div className="text-6xl mb-4">📖</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Henüz içerik atanmamış
                    </h3>
                    <p className="text-gray-600">
                        Öğretmeniniz size kelime, deyim, atasözü veya kitap atadığında burada görünecek.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Weekly Goals */}
                    {weeklyGoals && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Bu Haftanın Hedefleri
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Vocabulary */}
                                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-2xl">📖</span>
                                        <span className="text-sm font-semibold text-purple-700">
                                            {weeklyGoals.vocabularyLearned}/{weeklyGoals.vocabularyTarget}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Kelimeler</h3>
                                    <div className="w-full bg-purple-200 rounded-full h-2">
                                        <div
                                            className="bg-purple-600 h-2 rounded-full transition-all"
                                            style={{ width: `${getProgressPercentage(weeklyGoals.vocabularyLearned, weeklyGoals.vocabularyTarget)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-purple-700 mt-1">
                                        {getProgressPercentage(weeklyGoals.vocabularyLearned, weeklyGoals.vocabularyTarget)}% tamamlandı
                                    </p>
                                </div>

                                {/* Idioms */}
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-2xl">💬</span>
                                        <span className="text-sm font-semibold text-blue-700">
                                            {weeklyGoals.idiomsLearned}/{weeklyGoals.idiomsTarget}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Deyimler</h3>
                                    <div className="w-full bg-blue-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all"
                                            style={{ width: `${getProgressPercentage(weeklyGoals.idiomsLearned, weeklyGoals.idiomsTarget)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-blue-700 mt-1">
                                        {getProgressPercentage(weeklyGoals.idiomsLearned, weeklyGoals.idiomsTarget)}% tamamlandı
                                    </p>
                                </div>

                                {/* Proverbs */}
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-2xl">🎯</span>
                                        <span className="text-sm font-semibold text-green-700">
                                            {weeklyGoals.proverbsLearned}/{weeklyGoals.proverbsTarget}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Atasözleri</h3>
                                    <div className="w-full bg-green-200 rounded-full h-2">
                                        <div
                                            className="bg-green-600 h-2 rounded-full transition-all"
                                            style={{ width: `${getProgressPercentage(weeklyGoals.proverbsLearned, weeklyGoals.proverbsTarget)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-green-700 mt-1">
                                        {getProgressPercentage(weeklyGoals.proverbsLearned, weeklyGoals.proverbsTarget)}% tamamlandı
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-700">
                                    💡 <strong>İpucu:</strong> Flashcard'lar sekmesinden kelime, deyim ve atasözlerini çalışabilirsiniz.
                                    Her doğru cevap ilerlemenizi artırır!
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Book Assignments */}
                    {bookAssignments.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Atanan Kitaplar
                            </h2>
                            <div className="space-y-4">
                                {bookAssignments.map((assignment) => (
                                    <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-bold text-lg text-gray-900">
                                                        {assignment.book?.title}
                                                    </h3>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${assignment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        assignment.status === 'reading' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {assignment.status === 'completed' ? 'Tamamlandı' :
                                                            assignment.status === 'reading' ? 'Okunuyor' :
                                                                'Atandı'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    ✍️ {assignment.book?.author}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <span>📄 {assignment.book?.pageCount} sayfa</span>
                                                    {assignment.dueDate && (
                                                        <span>📅 Bitiş: {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}</span>
                                                    )}
                                                </div>
                                                {assignment.book?.summary && (
                                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                                        {assignment.book.summary}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            {assignment.status === 'assigned' && (
                                                <button
                                                    onClick={() => handleStartReading(assignment.id)}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                                                >
                                                    Okumaya Başla
                                                </button>
                                            )}
                                            {assignment.status === 'reading' && (
                                                <button
                                                    onClick={() => handleAnswerQuestions(assignment)}
                                                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                                                >
                                                    Soruları Cevapla
                                                </button>
                                            )}
                                            {assignment.status === 'completed' && assignment.teacherScore && (
                                                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                                                    <span className="text-sm font-semibold text-green-700">
                                                        Puan: {assignment.teacherScore}/100
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {assignment.teacherFeedback && (
                                            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                <p className="text-sm text-yellow-800">
                                                    <strong>Öğretmen Yorumu:</strong> {assignment.teacherFeedback}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentTurkishLearningPage;
