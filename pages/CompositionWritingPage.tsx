import React, { useState, useEffect, useCallback } from 'react';
import { CompositionAssignment } from '../types';
import { saveDraft, submitComposition, getAssignmentById } from '../services/compositionService';
import { evaluateComposition } from '../services/secureAIService';
import { saveAIEvaluation } from '../services/compositionService';

interface CompositionWritingPageProps {
    assignmentId: string;
    onBack: () => void;
    onSubmitSuccess: () => void;
}

const CompositionWritingPage: React.FC<CompositionWritingPageProps> = ({
    assignmentId,
    onBack,
    onSubmitSuccess
}) => {
    const [assignment, setAssignment] = useState<CompositionAssignment | null>(null);
    const [text, setText] = useState('');
    const [wordCount, setWordCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    useEffect(() => {
        loadAssignment();
    }, [assignmentId]);

    const loadAssignment = async () => {
        setIsLoading(true);
        try {
            const data = await getAssignmentById(assignmentId);
            if (data) {
                setAssignment(data);
                setText(data.studentText || '');
                setWordCount(data.wordCount || 0);
            }
        } catch (error) {
            console.error('Error loading assignment:', error);
            alert('Kompozisyon yüklenemedi.');
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-save functionality
    const autoSave = useCallback(async (content: string) => {
        if (!assignment || assignment.status === 'submitted') return;

        try {
            setIsSaving(true);
            await saveDraft(assignmentId, content);
            setLastSaved(new Date());
        } catch (error) {
            console.error('Auto-save failed:', error);
        } finally {
            setIsSaving(false);
        }
    }, [assignmentId, assignment]);

    // Debounced auto-save
    useEffect(() => {
        if (!text || assignment?.status === 'submitted') return;

        const timer = setTimeout(() => {
            autoSave(text);
        }, 2000); // Save after 2 seconds of inactivity

        return () => clearTimeout(timer);
    }, [text, autoSave, assignment]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setText(newText);

        // Calculate word count
        const words = newText.trim().split(/\s+/).filter(word => word.length > 0);
        setWordCount(words.length);
    };

    const handleSubmit = async () => {
        if (!assignment || !assignment.composition) return;

        const { minWordCount, maxWordCount } = assignment.composition;

        if (wordCount < minWordCount) {
            alert(`Minimum ${minWordCount} kelime yazmalısınız. Şu an: ${wordCount} kelime`);
            return;
        }

        if (wordCount > maxWordCount) {
            alert(`Maximum ${maxWordCount} kelime yazabilirsiniz. Şu an: ${wordCount} kelime`);
            return;
        }

        if (!confirm('Kompozisyonunuzu göndermek istediğinizden emin misiniz? Gönderildikten sonra değişiklik yapamazsınız.')) {
            return;
        }

        setIsSubmitting(true);
        try {
            // Submit the composition
            await submitComposition(assignmentId, text);

            // Trigger AI evaluation in the background
            evaluateAndSave();

            alert('Kompozisyonunuz başarıyla gönderildi! AI değerlendirmesi yapılıyor...');
            onSubmitSuccess();
        } catch (error) {
            console.error('Error submitting composition:', error);
            alert('Gönderim başarısız oldu. Lütfen tekrar deneyin.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const evaluateAndSave = async () => {
        if (!assignment || !assignment.composition) return;

        try {
            const feedback = await evaluateComposition(
                assignment.composition.prompt,
                text,
                assignment.composition.minWordCount,
                assignment.composition.maxWordCount
            );

            // Calculate overall score
            const overallScore = Math.round(
                (feedback.contentScore + feedback.organizationScore +
                    feedback.grammarScore + feedback.vocabularyScore) / 4
            );

            await saveAIEvaluation(assignmentId, overallScore, feedback);
        } catch (error) {
            console.error('Error evaluating composition:', error);
        }
    };

    const getWordCountColor = () => {
        if (!assignment?.composition) return 'text-gray-600';
        const { minWordCount, maxWordCount } = assignment.composition;

        if (wordCount < minWordCount) return 'text-red-600';
        if (wordCount > maxWordCount) return 'text-orange-600';
        return 'text-green-600';
    };

    const getProgressPercentage = () => {
        if (!assignment?.composition) return 0;
        const { minWordCount, maxWordCount } = assignment.composition;
        const range = maxWordCount - minWordCount;
        const progress = ((wordCount - minWordCount) / range) * 100;
        return Math.min(Math.max(progress, 0), 100);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!assignment || !assignment.composition) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <p className="text-red-600 mb-4">Kompozisyon bulunamadı.</p>
                <button onClick={onBack} className="text-purple-600 hover:underline">
                    Geri Dön
                </button>
            </div>
        );
    }

    const isSubmitted = assignment.status === 'submitted' || assignment.status === 'ai_evaluated' || assignment.status === 'teacher_reviewed';

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <button
                            onClick={onBack}
                            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Geri
                        </button>

                        {!isSubmitted && (
                            <div className="flex items-center gap-4">
                                {isSaving && (
                                    <span className="text-sm text-gray-500 flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                                        Kaydediliyor...
                                    </span>
                                )}
                                {lastSaved && !isSaving && (
                                    <span className="text-sm text-gray-500">
                                        Son kayıt: {lastSaved.toLocaleTimeString('tr-TR')}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                        {assignment.composition.title}
                    </h1>
                    <p className="text-gray-600">{assignment.composition.description}</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
                {/* Instructions */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
                    <h2 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Kompozisyon Konusu
                    </h2>
                    <p className="text-gray-700 mb-4 whitespace-pre-wrap">{assignment.composition.prompt}</p>

                    {assignment.composition.guidelines && assignment.composition.guidelines.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-purple-900 mb-2">Yazma Yönergeleri:</h3>
                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                                {assignment.composition.guidelines.map((guideline, index) => (
                                    <li key={index}>{guideline}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Word Counter */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Kelime Sayısı</span>
                        <span className={`text-lg font-bold ${getWordCountColor()}`}>
                            {wordCount} / {assignment.composition.minWordCount}-{assignment.composition.maxWordCount}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all ${wordCount < assignment.composition.minWordCount ? 'bg-red-500' :
                                    wordCount > assignment.composition.maxWordCount ? 'bg-orange-500' :
                                        'bg-green-500'
                                }`}
                            style={{ width: `${getProgressPercentage()}%` }}
                        />
                    </div>
                </div>

                {/* Text Editor */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <textarea
                        value={text}
                        onChange={handleTextChange}
                        disabled={isSubmitted}
                        className="w-full p-6 min-h-[500px] resize-none focus:outline-none text-gray-900 leading-relaxed disabled:bg-gray-50 disabled:text-gray-600"
                        placeholder="Kompozisyonunuzu buraya yazın..."
                    />
                </div>

                {/* Submit Button */}
                {!isSubmitted && (
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || wordCount < assignment.composition.minWordCount}
                            className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Gönderiliyor...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Kompozisyonu Gönder
                                </>
                            )}
                        </button>
                    </div>
                )}

                {isSubmitted && (
                    <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                        <div className="text-4xl mb-3">✅</div>
                        <p className="text-green-900 font-semibold mb-2">Kompozisyonunuz Gönderildi!</p>
                        <p className="text-green-700 text-sm">
                            AI değerlendirmesi ve öğretmen geri bildirimi için sonuçlar sayfasını kontrol edin.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompositionWritingPage;
