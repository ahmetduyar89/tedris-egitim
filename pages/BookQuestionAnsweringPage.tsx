import React, { useState, useEffect } from 'react';
import { User, BookAssignment, BookQuestion } from '../types';
import { getBookQuestions, submitBookAnswers } from '../services/bookReadingService';

interface BookQuestionAnsweringPageProps {
    user: User;
    assignment: BookAssignment;
    onBack: () => void;
    onComplete: () => void;
}

const BookQuestionAnsweringPage: React.FC<BookQuestionAnsweringPageProps> = ({
    user,
    assignment,
    onBack,
    onComplete
}) => {
    const [questions, setQuestions] = useState<BookQuestion[]>([]);
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadQuestions();
    }, [assignment.bookId]);

    const loadQuestions = async () => {
        try {
            if (!assignment.bookId) {
                alert('Kitap bilgisi bulunamadı.');
                onBack();
                return;
            }

            const bookQuestions = await getBookQuestions(assignment.bookId);
            setQuestions(bookQuestions);

            // Initialize answers object
            const initialAnswers: { [key: string]: string } = {};
            bookQuestions.forEach((q) => {
                initialAnswers[q.id] = '';
            });
            setAnswers(initialAnswers);
        } catch (error) {
            console.error('Error loading questions:', error);
            alert('Sorular yüklenirken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerChange = (questionId: string, answer: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleSubmit = async () => {
        // Check if all questions are answered
        const unanswered = questions.filter(q => !answers[q.id] || answers[q.id].trim() === '');
        if (unanswered.length > 0) {
            if (!confirm(`${unanswered.length} soru cevaplanmadı. Yine de göndermek istiyor musunuz?`)) {
                return;
            }
        }

        setIsSubmitting(true);
        try {
            await submitBookAnswers(assignment.id, answers);
            alert('Cevaplarınız başarıyla gönderildi! Öğretmeniniz değerlendirdikten sonra puanınızı görebileceksiniz.');
            onComplete();
        } catch (error) {
            console.error('Error submitting answers:', error);
            alert('Cevaplar gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="p-4 md:p-6 max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <div className="text-6xl mb-4">❓</div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Bu kitap için henüz soru eklenmemiş
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Öğretmeniniz bu kitap için sorular ekledikten sonra burada görünecek.
                    </p>
                    <button
                        onClick={onBack}
                        className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                    >
                        Geri Dön
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={onBack}
                    className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Geri Dön
                </button>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    📖 {assignment.book?.title}
                </h1>
                <p className="text-sm md:text-base text-gray-600 mt-2">
                    Kitap sorularını cevaplayın
                </p>
            </div>

            {/* Questions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg md:text-xl font-bold text-gray-900">
                            Sorular ({questions.length})
                        </h2>
                        <span className="text-sm text-gray-600">
                            {Object.values(answers).filter(a => a.trim() !== '').length}/{questions.length} cevaplandı
                        </span>
                    </div>
                </div>

                <div className="space-y-6">
                    {questions.map((question, index) => (
                        <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start gap-3 mb-3">
                                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                                    {index + 1}
                                </span>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-2">
                                        {question.questionText}
                                    </h3>
                                    <textarea
                                        value={answers[question.id] || ''}
                                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                        placeholder="Cevabınızı buraya yazın..."
                                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        rows={4}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Submit Button */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
                    <button
                        onClick={onBack}
                        className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                        disabled={isSubmitting}
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Gönderiliyor...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Cevapları Gönder
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookQuestionAnsweringPage;
