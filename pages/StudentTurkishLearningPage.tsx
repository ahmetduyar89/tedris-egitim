import React, { useState, useEffect } from 'react';
import { User, TurkishContentAssignment, BookAssignment, CompositionAssignment } from '../types';
import { getStudentTurkishAssignments } from '../services/turkishLearningService';
import { getStudentBookAssignments } from '../services/bookReadingService';
import { getStudentAssignments } from '../services/compositionService';
import TurkishLearningSession from './TurkishLearningSession';
import BookQuestionAnsweringPage from './BookQuestionAnsweringPage';
import CompositionWritingPage from './CompositionWritingPage';
import CompositionResultsView from '../components/CompositionResultsView';

interface StudentTurkishLearningPageProps {
    user: User;
}

const StudentTurkishLearningPage: React.FC<StudentTurkishLearningPageProps> = ({ user }) => {
    const [turkishAssignments, setTurkishAssignments] = useState<TurkishContentAssignment[]>([]);
    const [bookAssignments, setBookAssignments] = useState<BookAssignment[]>([]);
    const [compositionAssignments, setCompositionAssignments] = useState<CompositionAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTurkishAssignment, setSelectedTurkishAssignment] = useState<TurkishContentAssignment | null>(null);
    const [selectedBookAssignment, setSelectedBookAssignment] = useState<BookAssignment | null>(null);
    const [selectedCompositionId, setSelectedCompositionId] = useState<string | null>(null);
    const [viewCompositionResults, setViewCompositionResults] = useState<CompositionAssignment | null>(null);

    useEffect(() => {
        loadData();
    }, [user.id]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            console.log('[StudentTurkishLearningPage] Loading data for user:', user.id);
            const [turkish, books, compositions] = await Promise.all([
                getStudentTurkishAssignments(user.id),
                getStudentBookAssignments(user.id),
                getStudentAssignments(user.id)
            ]);

            console.log('[StudentTurkishLearningPage] Loaded Turkish assignments:', turkish);
            console.log('[StudentTurkishLearningPage] Number of assignments:', turkish.length);
            if (turkish.length > 0) {
                console.log('[StudentTurkishLearningPage] First assignment:', turkish[0]);
                console.log('[StudentTurkishLearningPage] First assignment contentIds:', turkish[0].contentIds);
            }

            setTurkishAssignments(turkish);
            setBookAssignments(books);
            setCompositionAssignments(compositions);
        } catch (error) {
            console.error('[StudentTurkishLearningPage] Error loading Turkish learning data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartTurkishAssignment = (assignment: TurkishContentAssignment) => {
        console.log('[StudentTurkishLearningPage] Starting assignment:', assignment);
        console.log('[StudentTurkishLearningPage] Assignment ID:', assignment.id);
        console.log('[StudentTurkishLearningPage] Assignment contentIds:', assignment.contentIds);
        console.log('[StudentTurkishLearningPage] Assignment contentIds type:', typeof assignment.contentIds);
        console.log('[StudentTurkishLearningPage] Assignment contentIds is array:', Array.isArray(assignment.contentIds));
        setSelectedTurkishAssignment(assignment);
    };

    const handleCompleteTurkishAssignment = () => {
        setSelectedTurkishAssignment(null);
        loadData();
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
        setSelectedBookAssignment(assignment);
    };

    const handleBackFromQuestions = () => {
        setSelectedBookAssignment(null);
        loadData();
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
        const learnedCount = assignment.learnedContentIds?.length || 0;
        const totalCount = assignment.contentIds?.length || 0;
        const allLearned = learnedCount === totalCount && totalCount > 0;

        switch (assignment.learningStatus) {
            case 'not_started':
                return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">Başlanmadı</span>;
            case 'learning':
                return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">Öğreniyor</span>;
            case 'practicing':
                return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">Test Ediyor</span>;
            case 'mastered':
                return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">✓ Tamamlandı</span>;
            default:
                return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">Bilinmiyor</span>;
        }
    };

    const getDaysRemaining = (dueDate: string) => {
        const due = new Date(dueDate);
        const now = new Date();
        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getProgressPercentage = (assignment: TurkishContentAssignment) => {
        const learnedCount = assignment.learnedContentIds?.length || 0;
        const totalCount = assignment.contentIds?.length || 0;
        if (totalCount === 0) return 0;
        return Math.round((learnedCount / totalCount) * 100);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Show Turkish learning session if selected
    if (selectedTurkishAssignment) {
        return (
            <TurkishLearningSession
                assignment={selectedTurkishAssignment}
                onComplete={handleCompleteTurkishAssignment}
                onBack={() => setSelectedTurkishAssignment(null)}
            />
        );
    }

    // Show book question answering if selected
    if (selectedBookAssignment) {
        return (
            <BookQuestionAnsweringPage
                user={user}
                assignment={selectedBookAssignment}
                onBack={handleBackFromQuestions}
                onComplete={handleBackFromQuestions}
            />
        );
    }

    // Show composition writing page if selected
    if (selectedCompositionId) {
        return (
            <CompositionWritingPage
                assignmentId={selectedCompositionId}
                onBack={() => setSelectedCompositionId(null)}
                onSubmitSuccess={() => {
                    setSelectedCompositionId(null);
                    loadData();
                }}
            />
        );
    }

    // Show composition results if selected
    if (viewCompositionResults) {
        return (
            <CompositionResultsView
                assignment={viewCompositionResults}
                onBack={() => setViewCompositionResults(null)}
            />
        );
    }

    const activeAssignments = turkishAssignments.filter(a => a.learningStatus !== 'mastered');
    const completedAssignments = turkishAssignments.filter(a => a.learningStatus === 'mastered');

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">📚 Türkçe Öğrenimi</h1>
                <p className="text-gray-600 mt-2">
                    Kelime, deyim ve atasözü öğrenme görevleriniz
                </p>
            </div>

            {activeAssignments.length === 0 && bookAssignments.length === 0 && compositionAssignments.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <div className="text-6xl mb-4">📖</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Henüz görev atanmamış
                    </h3>
                    <p className="text-gray-600">
                        Öğretmeniniz size görev atadığında burada görünecek.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Active Turkish Assignments */}
                    {activeAssignments.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                🎯 Aktif Görevler
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeAssignments.map((assignment) => {
                                    const daysRemaining = getDaysRemaining(assignment.dueDate);
                                    const progress = getProgressPercentage(assignment);
                                    const learnedCount = assignment.learnedContentIds?.length || 0;
                                    const totalCount = assignment.contentIds?.length || 0;

                                    return (
                                        <div
                                            key={assignment.id}
                                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-3xl">{getCategoryIcon(assignment.category)}</span>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-gray-900">
                                                            {totalCount} {getCategoryName(assignment.category)}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            {learnedCount}/{totalCount} öğrenildi
                                                        </p>
                                                    </div>
                                                </div>
                                                {getStatusBadge(assignment)}
                                            </div>

                                            {/* Progress bar */}
                                            <div className="mb-3">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Due date */}
                                            <div className="flex items-center justify-between mb-4">
                                                <span className={`text-sm font-semibold ${daysRemaining < 0 ? 'text-red-600' :
                                                    daysRemaining <= 2 ? 'text-orange-600' :
                                                        'text-gray-600'
                                                    }`}>
                                                    📅 {daysRemaining < 0 ? 'Süresi geçti!' :
                                                        daysRemaining === 0 ? 'Bugün bitiyor' :
                                                            daysRemaining === 1 ? 'Yarın bitiyor' :
                                                                `${daysRemaining} gün kaldı`}
                                                </span>
                                                {assignment.practiceScore !== undefined && (
                                                    <span className="text-sm font-semibold text-green-600">
                                                        Test: {assignment.practiceScore}%
                                                    </span>
                                                )}
                                            </div>

                                            {/* Action button */}
                                            <button
                                                onClick={() => handleStartTurkishAssignment(assignment)}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                                            >
                                                {assignment.learningStatus === 'not_started' ? 'Başla' : 'Devam Et'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Book Assignments */}
                    {bookAssignments.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                📚 Kitap Görevleri
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
                                                        ⭐ Puan: {assignment.teacherScore}/100
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

                    {/* Composition Assignments */}
                    {compositionAssignments.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                ✍️ Kompozisyon Görevleri
                            </h2>
                            <div className="space-y-4">
                                {compositionAssignments.map((assignment) => {
                                    const isSubmitted = assignment.status === 'submitted' || assignment.status === 'ai_evaluated' || assignment.status === 'teacher_reviewed';
                                    const hasResults = assignment.aiScore !== undefined || assignment.teacherScore !== undefined;

                                    return (
                                        <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-bold text-lg text-gray-900">
                                                            {assignment.composition?.title}
                                                        </h3>
                                                        <span className={`text-xs px-2 py-1 rounded-full ${assignment.status === 'teacher_reviewed' ? 'bg-green-100 text-green-700' :
                                                                assignment.status === 'ai_evaluated' ? 'bg-blue-100 text-blue-700' :
                                                                    assignment.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                                                                        assignment.status === 'draft' ? 'bg-orange-100 text-orange-700' :
                                                                            'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {assignment.status === 'teacher_reviewed' ? 'Değerlendirildi' :
                                                                assignment.status === 'ai_evaluated' ? 'AI Değerlendirildi' :
                                                                    assignment.status === 'submitted' ? 'Gönderildi' :
                                                                        assignment.status === 'draft' ? 'Taslak' :
                                                                            'Atandı'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        {assignment.composition?.description}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                                        <span>📏 {assignment.composition?.minWordCount}-{assignment.composition?.maxWordCount} kelime</span>
                                                        {assignment.wordCount && (
                                                            <span>✍️ {assignment.wordCount} kelime yazıldı</span>
                                                        )}
                                                        {assignment.dueDate && (
                                                            <span>📅 Bitiş: {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex gap-2">
                                                {!isSubmitted && (
                                                    <button
                                                        onClick={() => setSelectedCompositionId(assignment.id)}
                                                        className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
                                                    >
                                                        {assignment.status === 'draft' ? 'Devam Et' : 'Yazmaya Başla'}
                                                    </button>
                                                )}
                                                {hasResults && (
                                                    <button
                                                        onClick={() => setViewCompositionResults(assignment)}
                                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                                                    >
                                                        Sonuçları Gör
                                                    </button>
                                                )}
                                            </div>
                                            {(assignment.aiScore !== undefined || assignment.teacherScore !== undefined) && (
                                                <div className="mt-3 flex gap-2">
                                                    {assignment.aiScore !== undefined && (
                                                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                                            <span className="text-sm font-semibold text-blue-700">
                                                                🤖 AI: {assignment.aiScore}/100
                                                            </span>
                                                        </div>
                                                    )}
                                                    {assignment.teacherScore !== undefined && (
                                                        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                                            <span className="text-sm font-semibold text-green-700">
                                                                👨‍🏫 Öğretmen: {assignment.teacherScore}/100
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Completed Assignments */}
                    {completedAssignments.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                ✅ Tamamlanan Görevler
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {completedAssignments.map((assignment) => (
                                    <div
                                        key={assignment.id}
                                        className="border border-green-200 bg-green-50 rounded-lg p-4"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">{getCategoryIcon(assignment.category)}</span>
                                            <div>
                                                <h3 className="font-bold text-gray-900">
                                                    {assignment.contentIds?.length} {getCategoryName(assignment.category)}
                                                </h3>
                                                {assignment.practiceScore !== undefined && (
                                                    <p className="text-sm text-green-700 font-semibold">
                                                        Skor: {assignment.practiceScore}%
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-600">
                                            {new Date(assignment.masteredAt || assignment.updatedAt).toLocaleDateString('tr-TR')}
                                        </p>
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
