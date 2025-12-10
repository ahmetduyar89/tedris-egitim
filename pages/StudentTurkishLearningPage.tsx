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

    const activeBookAssignments = bookAssignments.filter(b => b.status !== 'completed');
    const completedBookAssignments = bookAssignments.filter(b => b.status === 'completed');

    const activeCompositions = compositionAssignments.filter(c => c.status !== 'teacher_reviewed');
    const completedCompositions = compositionAssignments.filter(c => c.status === 'teacher_reviewed');

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    📚 Branş Çalışmaları
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                    Türkçe dersi görevlerin ve çalışmaların
                </p>
            </div>

            {/* Empty State */}
            {activeAssignments.length === 0 && bookAssignments.length === 0 && compositionAssignments.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <div className="text-6xl mb-4">📖</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Henüz görev atanmamış
                    </h3>
                    <p className="text-gray-600">
                        Öğretmenin size görev atadığında burada görünecek.
                    </p>
                </div>
            ) : (
                <>
                    {/* ============================================ */}
                    {/* SECTION 1: KELİME / DEYİM / ATASÖZÜ */}
                    {/* ============================================ */}
                    {(activeAssignments.length > 0 || completedAssignments.length > 0) && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Section Header */}
                            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    📖 Kelime, Deyim ve Atasözü Görevleri
                                </h2>
                                <p className="text-purple-100 text-sm mt-1">
                                    {activeAssignments.length} aktif görev
                                </p>
                            </div>

                            <div className="p-6">
                                {/* Active Assignments */}
                                {activeAssignments.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            🎯 Aktif Görevler
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {activeAssignments.map((assignment) => {
                                                const daysRemaining = getDaysRemaining(assignment.dueDate);
                                                const progress = getProgressPercentage(assignment);
                                                const learnedCount = assignment.learnedContentIds?.length || 0;
                                                const totalCount = assignment.contentIds?.length || 0;

                                                return (
                                                    <div
                                                        key={assignment.id}
                                                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50"
                                                    >
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-3xl">{getCategoryIcon(assignment.category)}</span>
                                                                <div>
                                                                    <h4 className="font-bold text-base text-gray-900">
                                                                        {totalCount} {getCategoryName(assignment.category)}
                                                                    </h4>
                                                                    <p className="text-xs text-gray-600">
                                                                        {learnedCount}/{totalCount} öğrenildi
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {getStatusBadge(assignment)}
                                                        </div>

                                                        {/* Progress bar */}
                                                        <div className="mb-3">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-xs font-medium text-gray-600">İlerleme</span>
                                                                <span className="text-xs font-bold text-blue-600">{progress}%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Due date and score */}
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className={`text-xs font-semibold ${daysRemaining < 0 ? 'text-red-600' :
                                                                daysRemaining <= 2 ? 'text-orange-600' :
                                                                    'text-gray-600'
                                                                }`}>
                                                                📅 {daysRemaining < 0 ? 'Süresi geçti!' :
                                                                    daysRemaining === 0 ? 'Bugün bitiyor' :
                                                                        daysRemaining === 1 ? 'Yarın bitiyor' :
                                                                            `${daysRemaining} gün kaldı`}
                                                            </span>
                                                            {assignment.practiceScore !== undefined && (
                                                                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                                                    ✓ Test: {assignment.practiceScore}%
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Action button */}
                                                        <button
                                                            onClick={() => handleStartTurkishAssignment(assignment)}
                                                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all text-sm shadow-sm hover:shadow"
                                                        >
                                                            {assignment.learningStatus === 'not_started' ? '🚀 Başla' : '▶️ Devam Et'}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Completed Assignments */}
                                {completedAssignments.length > 0 && (
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            ✅ Tamamlanan Görevler
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {completedAssignments.map((assignment) => {
                                                const totalCount = assignment.contentIds?.length || 0;

                                                return (
                                                    <div
                                                        key={assignment.id}
                                                        className="border border-green-200 rounded-lg p-3 bg-green-50"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-2xl">{getCategoryIcon(assignment.category)}</span>
                                                                <div>
                                                                    <h4 className="font-semibold text-sm text-gray-900">
                                                                        {totalCount} {getCategoryName(assignment.category)}
                                                                    </h4>
                                                                    {assignment.practiceScore !== undefined && (
                                                                        <p className="text-xs text-green-700 font-semibold">
                                                                            Test: {assignment.practiceScore}%
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                                ✓ Tamamlandı
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ============================================ */}
                    {/* SECTION 2: KİTAP GÖREVLERİ */}
                    {/* ============================================ */}
                    {bookAssignments.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Section Header */}
                            <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    📚 Kitap Okuma Görevleri
                                </h2>
                                <p className="text-orange-100 text-sm mt-1">
                                    {activeBookAssignments.length} aktif görev
                                </p>
                            </div>

                            <div className="p-6">
                                {/* Active Book Assignments */}
                                {activeBookAssignments.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            📖 Okunacak Kitaplar
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {activeBookAssignments.map((assignment) => {
                                                const daysRemaining = getDaysRemaining(assignment.dueDate);
                                                const hasQuestions = assignment.book?.questions && assignment.book.questions.length > 0;

                                                return (
                                                    <div
                                                        key={assignment.id}
                                                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-orange-50"
                                                    >
                                                        <div className="flex items-start gap-3 mb-3">
                                                            <div className="text-4xl">📕</div>
                                                            <div className="flex-1">
                                                                <h4 className="font-bold text-base text-gray-900 mb-1">
                                                                    {assignment.book?.title}
                                                                </h4>
                                                                <p className="text-xs text-gray-600 mb-1">
                                                                    {assignment.book?.author}
                                                                </p>
                                                                {hasQuestions && (
                                                                    <p className="text-xs text-orange-600 font-semibold">
                                                                        📝 {assignment.book.questions.length} soru
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${assignment.status === 'assigned' ? 'bg-gray-100 text-gray-700' :
                                                                assignment.status === 'reading' ? 'bg-blue-100 text-blue-700' :
                                                                    assignment.status === 'questions_answered' ? 'bg-orange-100 text-orange-700' :
                                                                        'bg-green-100 text-green-700'
                                                                }`}>
                                                                {assignment.status === 'assigned' ? 'Atandı' :
                                                                    assignment.status === 'reading' ? 'Okunuyor' :
                                                                        assignment.status === 'questions_answered' ? 'Sorular Cevaplandı' :
                                                                            'Tamamlandı'}
                                                            </span>
                                                        </div>

                                                        {/* Due date */}
                                                        <div className="mb-3">
                                                            <span className={`text-xs font-semibold ${daysRemaining < 0 ? 'text-red-600' :
                                                                daysRemaining <= 2 ? 'text-orange-600' :
                                                                    'text-gray-600'
                                                                }`}>
                                                                📅 {daysRemaining < 0 ? 'Süresi geçti!' :
                                                                    daysRemaining === 0 ? 'Bugün bitiyor' :
                                                                        daysRemaining === 1 ? 'Yarın bitiyor' :
                                                                            `${daysRemaining} gün kaldı`}
                                                            </span>
                                                        </div>

                                                        {/* Action buttons */}
                                                        <div className="flex gap-2">
                                                            {assignment.status === 'assigned' && (
                                                                <button
                                                                    onClick={() => handleStartReading(assignment.id)}
                                                                    className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all text-sm shadow-sm hover:shadow"
                                                                >
                                                                    📖 Okumaya Başla
                                                                </button>
                                                            )}
                                                            {assignment.status === 'reading' && hasQuestions && (
                                                                <button
                                                                    onClick={() => handleAnswerQuestions(assignment)}
                                                                    className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all text-sm shadow-sm hover:shadow"
                                                                >
                                                                    📝 Soruları Cevapla
                                                                </button>
                                                            )}
                                                            {assignment.status === 'questions_answered' && (
                                                                <div className="flex-1 text-center text-sm text-gray-600 py-2">
                                                                    ⏳ Öğretmen değerlendirmesi bekleniyor
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Completed Book Assignments */}
                                {completedBookAssignments.length > 0 && (
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            ✅ Tamamlanan Kitaplar
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {completedBookAssignments.map((assignment) => (
                                                <div
                                                    key={assignment.id}
                                                    className="border border-green-200 rounded-lg p-3 bg-green-50"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-2xl">📕</span>
                                                            <div>
                                                                <h4 className="font-semibold text-sm text-gray-900">
                                                                    {assignment.book?.title}
                                                                </h4>
                                                                {assignment.teacherScore !== undefined && (
                                                                    <p className="text-xs text-green-700 font-semibold">
                                                                        Puan: {assignment.teacherScore}/100
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                            ✓ Tamamlandı
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ============================================ */}
                    {/* SECTION 3: KOMPOZİSYON GÖREVLERİ */}
                    {/* ============================================ */}
                    {compositionAssignments.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Section Header */}
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    ✍️ Kompozisyon Görevleri
                                </h2>
                                <p className="text-indigo-100 text-sm mt-1">
                                    {activeCompositions.length} aktif görev
                                </p>
                            </div>

                            <div className="p-6">
                                {/* Active Compositions */}
                                {activeCompositions.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            ✍️ Yazılacak Kompozisyonlar
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {activeCompositions.map((assignment) => {
                                                const daysRemaining = getDaysRemaining(assignment.dueDate);

                                                return (
                                                    <div
                                                        key={assignment.id}
                                                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-indigo-50"
                                                    >
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-3xl">✍️</span>
                                                                <div>
                                                                    <h4 className="font-bold text-base text-gray-900">
                                                                        {assignment.composition?.title}
                                                                    </h4>
                                                                    <p className="text-xs text-gray-600">
                                                                        {assignment.composition?.minWordCount}-{assignment.composition?.maxWordCount} kelime
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${assignment.status === 'assigned' ? 'bg-gray-100 text-gray-700' :
                                                                assignment.status === 'draft' ? 'bg-blue-100 text-blue-700' :
                                                                    assignment.status === 'submitted' ? 'bg-orange-100 text-orange-700' :
                                                                        assignment.status === 'ai_evaluated' ? 'bg-purple-100 text-purple-700' :
                                                                            'bg-green-100 text-green-700'
                                                                }`}>
                                                                {assignment.status === 'assigned' ? 'Atandı' :
                                                                    assignment.status === 'draft' ? 'Taslak' :
                                                                        assignment.status === 'submitted' ? 'Gönderildi' :
                                                                            assignment.status === 'ai_evaluated' ? 'AI Değerlendirdi' :
                                                                                'Tamamlandı'}
                                                            </span>
                                                        </div>

                                                        {/* Word count */}
                                                        {assignment.wordCount !== undefined && assignment.wordCount > 0 && (
                                                            <div className="mb-3">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-xs font-medium text-gray-600">Kelime Sayısı</span>
                                                                    <span className="text-xs font-bold text-indigo-600">{assignment.wordCount}</span>
                                                                </div>
                                                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                                    <div
                                                                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full"
                                                                        style={{
                                                                            width: `${Math.min(100, (assignment.wordCount / (assignment.composition?.maxWordCount || 500)) * 100)}%`
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Due date and scores */}
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className={`text-xs font-semibold ${daysRemaining < 0 ? 'text-red-600' :
                                                                daysRemaining <= 2 ? 'text-orange-600' :
                                                                    'text-gray-600'
                                                                }`}>
                                                                📅 {daysRemaining < 0 ? 'Süresi geçti!' :
                                                                    daysRemaining === 0 ? 'Bugün bitiyor' :
                                                                        daysRemaining === 1 ? 'Yarın bitiyor' :
                                                                            `${daysRemaining} gün kaldı`}
                                                            </span>
                                                            {assignment.aiScore !== undefined && (
                                                                <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                                                                    🤖 AI: {assignment.aiScore}/100
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Action button */}
                                                        <button
                                                            onClick={() => {
                                                                if (assignment.status === 'teacher_reviewed') {
                                                                    setViewCompositionResults(assignment);
                                                                } else {
                                                                    setSelectedCompositionId(assignment.id);
                                                                }
                                                            }}
                                                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all text-sm shadow-sm hover:shadow"
                                                        >
                                                            {assignment.status === 'assigned' ? '✍️ Yazmaya Başla' :
                                                                assignment.status === 'draft' ? '▶️ Devam Et' :
                                                                    assignment.status === 'submitted' || assignment.status === 'ai_evaluated' ? '👁️ Görüntüle' :
                                                                        '📊 Sonuçları Gör'}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Completed Compositions */}
                                {completedCompositions.length > 0 && (
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            ✅ Tamamlanan Kompozisyonlar
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {completedCompositions.map((assignment) => (
                                                <div
                                                    key={assignment.id}
                                                    className="border border-green-200 rounded-lg p-3 bg-green-50 cursor-pointer hover:shadow-md transition-shadow"
                                                    onClick={() => setViewCompositionResults(assignment)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-2xl">✍️</span>
                                                            <div>
                                                                <h4 className="font-semibold text-sm text-gray-900">
                                                                    {assignment.composition?.title}
                                                                </h4>
                                                                <div className="flex gap-2 mt-1">
                                                                    {assignment.aiScore !== undefined && (
                                                                        <span className="text-xs text-purple-700 font-semibold">
                                                                            🤖 {assignment.aiScore}
                                                                        </span>
                                                                    )}
                                                                    {assignment.teacherScore !== undefined && (
                                                                        <span className="text-xs text-green-700 font-semibold">
                                                                            👨‍🏫 {assignment.teacherScore}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                            ✓ Tamamlandı
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StudentTurkishLearningPage;

