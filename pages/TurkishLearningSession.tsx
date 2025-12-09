import React, { useState, useEffect } from 'react';
import { TurkishContentLibraryItem, TurkishContentAssignment } from '../types';
import {
    markAssignmentContentAsLearned,
    submitPracticeAnswer,
    completePracticeSession,
    moveToSpacedRepetition
} from '../services/turkishLearningService';
import { supabase } from '../services/dbAdapter';
import TurkishContentCard from '../components/TurkishContentCard';
import TurkishPracticeTest from '../components/TurkishPracticeTest';

interface TurkishLearningSessionProps {
    assignment: TurkishContentAssignment;
    onComplete: () => void;
    onBack: () => void;
}

type SessionMode = 'learning' | 'practice' | 'completed';

const TurkishLearningSession: React.FC<TurkishLearningSessionProps> = ({
    assignment,
    onComplete,
    onBack
}) => {
    const [mode, setMode] = useState<SessionMode>('learning');
    const [contents, setContents] = useState<TurkishContentLibraryItem[]>([]);
    const [currentContentIndex, setCurrentContentIndex] = useState(0);
    const [learnedContentIds, setLearnedContentIds] = useState<string[]>(assignment.learnedContentIds || []);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadContents();
    }, [assignment.id]);

    const loadContents = async () => {
        setIsLoading(true);
        try {
            console.log('[TurkishLearningSession] Loading contents for assignment:', assignment.id);
            console.log('[TurkishLearningSession] Content IDs to load:', assignment.contentIds);
            console.log('[TurkishLearningSession] Content IDs type:', typeof assignment.contentIds);
            console.log('[TurkishLearningSession] Content IDs is array:', Array.isArray(assignment.contentIds));

            if (!assignment.contentIds || assignment.contentIds.length === 0) {
                console.error('[TurkishLearningSession] No content IDs in assignment!');
                alert('Bu atamada içerik bulunamadı. Lütfen öğretmeninizle iletişime geçin.');
                onBack();
                return;
            }

            const { data, error } = await supabase
                .from('turkish_content_library')
                .select('*')
                .in('id', assignment.contentIds);

            console.log('[TurkishLearningSession] Query result - data:', data);
            console.log('[TurkishLearningSession] Query result - error:', error);

            if (error) throw error;

            const mappedContents: TurkishContentLibraryItem[] = data.map((item: any) => ({
                id: item.id,
                teacherId: item.teacher_id,
                category: item.category,
                frontContent: item.front_content,
                backContent: item.back_content,
                exampleSentence: item.example_sentence,
                difficultyLevel: item.difficulty_level,
                isAiGenerated: item.is_ai_generated,
                createdAt: item.created_at,
                isActive: item.is_active
            }));

            setContents(mappedContents);

            console.log('[TurkishLearningSession] Loaded contents:', mappedContents.length);
            console.log('[TurkishLearningSession] Assignment status:', assignment.learningStatus);
            console.log('[TurkishLearningSession] Learned content IDs:', assignment.learnedContentIds);

            // Determine initial mode based on assignment status
            if (assignment.learningStatus === 'practicing' || assignment.learningStatus === 'mastered') {
                console.log('[TurkishLearningSession] Setting mode to practice (status-based)');
                setMode('practice');
            } else if (assignment.learnedContentIds && assignment.learnedContentIds.length > 0 && assignment.learnedContentIds.length === assignment.contentIds.length) {
                // Only go to practice if there are actually learned items
                console.log('[TurkishLearningSession] Setting mode to practice (all learned)');
                setMode('practice');
            } else {
                // Default to learning mode
                console.log('[TurkishLearningSession] Setting mode to learning (default)');
                setMode('learning');
            }
        } catch (error) {
            console.error('Error loading contents:', error);
            alert('İçerikler yüklenirken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsLearned = async () => {
        const currentContent = contents[currentContentIndex];
        if (!currentContent) return;

        try {
            await markAssignmentContentAsLearned(assignment.id, currentContent.id);
            setLearnedContentIds([...learnedContentIds, currentContent.id]);
        } catch (error) {
            console.error('Error marking content as learned:', error);
            alert('İçerik kaydedilirken bir hata oluştu.');
        }
    };

    const handleNext = () => {
        if (currentContentIndex < contents.length - 1) {
            setCurrentContentIndex(currentContentIndex + 1);
        } else {
            // All content viewed, check if all learned
            console.log('[TurkishLearningSession] End of content. Learned:', learnedContentIds.length, 'Total:', contents.length);
            if (learnedContentIds.length > 0 && learnedContentIds.length === contents.length) {
                console.log('[TurkishLearningSession] All learned, switching to practice');
                setMode('practice');
            } else {
                // Loop back to first
                console.log('[TurkishLearningSession] Not all learned, looping back');
                setCurrentContentIndex(0);
            }
        }
    };

    const handleStartPractice = () => {
        setMode('practice');
    };

    const handlePracticeComplete = async (score: number, results: { contentId: string; isCorrect: boolean }[]) => {
        try {
            // Submit practice answers
            for (const result of results) {
                await submitPracticeAnswer(
                    assignment.id,
                    assignment.studentId,
                    result.contentId,
                    result.isCorrect
                );
            }

            // Complete practice session
            await completePracticeSession(assignment.id, score);

            // If score is high enough, move to flashcard system
            if (score >= 80) {
                await moveToSpacedRepetition(assignment.id, assignment.studentId);
                setMode('completed');
            } else {
                // Allow retry
                alert(`Skorunuz: ${score}%. Daha iyi bir skor için tekrar deneyebilirsiniz.`);
                setMode('learning');
                setCurrentContentIndex(0);
            }
        } catch (error) {
            console.error('Error completing practice:', error);
            alert('Test tamamlanırken bir hata oluştu.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (mode === 'completed') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Tebrikler!
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Bu içerikleri başarıyla tamamladınız. Artık aralıklı tekrar sistemine eklendi ve
                        düzenli olarak tekrar edeceksiniz.
                    </p>
                    <button
                        onClick={onComplete}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                        Ana Sayfaya Dön
                    </button>
                </div>
            </div>
        );
    }

    if (mode === 'practice') {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <TurkishPracticeTest
                    contents={contents}
                    onComplete={handlePracticeComplete}
                    onBack={() => setMode('learning')}
                />
            </div>
        );
    }

    // Learning mode
    const currentContent = contents[currentContentIndex];
    const allLearned = learnedContentIds.length === contents.length;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                    >
                        ← Geri
                    </button>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {assignment.category === 'vocabulary' && '📖 Kelime Öğrenimi'}
                            {assignment.category === 'idiom' && '💬 Deyim Öğrenimi'}
                            {assignment.category === 'proverb' && '🎯 Atasözü Öğrenimi'}
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            {learnedContentIds.length}/{contents.length} öğrenildi
                        </p>
                    </div>
                    <div className="w-20"></div> {/* Spacer for centering */}
                </div>

                {/* Learning card */}
                {currentContent && (
                    <TurkishContentCard
                        content={currentContent}
                        onMarkAsLearned={handleMarkAsLearned}
                        onNext={handleNext}
                        currentIndex={currentContentIndex}
                        totalCount={contents.length}
                        isLearned={learnedContentIds.includes(currentContent.id)}
                    />
                )}

                {/* Practice button */}
                {allLearned && (
                    <div className="mt-8 text-center">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
                            <p className="text-green-700 font-semibold mb-2">
                                ✓ Tüm içerikleri öğrendiniz!
                            </p>
                            <p className="text-green-600 text-sm">
                                Şimdi öğrendiklerinizi test edebilirsiniz.
                            </p>
                        </div>
                        <button
                            onClick={handleStartPractice}
                            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg transition-all transform hover:scale-105"
                        >
                            🎯 Teste Başla
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TurkishLearningSession;
