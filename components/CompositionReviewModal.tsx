import React, { useState } from 'react';
import { CompositionAssignment } from '../types';
import { addTeacherReview } from '../services/compositionService';

interface CompositionReviewModalProps {
    assignment: CompositionAssignment;
    onClose: () => void;
    onSuccess: () => void;
}

const CompositionReviewModal: React.FC<CompositionReviewModalProps> = ({
    assignment,
    onClose,
    onSuccess
}) => {
    const [score, setScore] = useState(assignment.teacherScore || '');
    const [feedback, setFeedback] = useState(assignment.teacherFeedback || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const numScore = typeof score === 'string' ? parseInt(score) : score;

        if (!numScore || numScore < 0 || numScore > 100) {
            alert('Lütfen 0-100 arası bir puan girin.');
            return;
        }

        if (!feedback.trim()) {
            alert('Lütfen geri bildirim yazın.');
            return;
        }

        setIsSubmitting(true);
        try {
            await addTeacherReview(assignment.id, numScore, feedback.trim());
            alert('Değerlendirme başarıyla kaydedildi!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving review:', error);
            alert('Değerlendirme kaydedilemedi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Kompozisyon Değerlendirmesi</h2>
                            <p className="text-sm text-gray-600 mt-1">{assignment.composition?.title}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Student Composition */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Öğrenci Kompozisyonu</h3>
                        <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {assignment.studentText}
                            </p>
                            <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
                                Kelime Sayısı: {assignment.wordCount}
                            </div>
                        </div>
                    </div>

                    {/* AI Feedback (if available) */}
                    {assignment.aiFeedback && assignment.aiScore && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                <span>🤖</span>
                                AI Değerlendirmesi (Puan: {assignment.aiScore})
                            </h3>

                            {/* Score Breakdown */}
                            <div className="grid grid-cols-4 gap-2 mb-3">
                                <div className="text-center bg-white rounded p-2">
                                    <div className="text-sm font-bold text-purple-600">
                                        {assignment.aiFeedback.contentScore}
                                    </div>
                                    <div className="text-xs text-gray-600">İçerik</div>
                                </div>
                                <div className="text-center bg-white rounded p-2">
                                    <div className="text-sm font-bold text-blue-600">
                                        {assignment.aiFeedback.organizationScore}
                                    </div>
                                    <div className="text-xs text-gray-600">Organizasyon</div>
                                </div>
                                <div className="text-center bg-white rounded p-2">
                                    <div className="text-sm font-bold text-green-600">
                                        {assignment.aiFeedback.grammarScore}
                                    </div>
                                    <div className="text-xs text-gray-600">Gramer</div>
                                </div>
                                <div className="text-center bg-white rounded p-2">
                                    <div className="text-sm font-bold text-yellow-600">
                                        {assignment.aiFeedback.vocabularyScore}
                                    </div>
                                    <div className="text-xs text-gray-600">Kelime</div>
                                </div>
                            </div>

                            <p className="text-sm text-purple-800 bg-white rounded p-3">
                                {assignment.aiFeedback.overall}
                            </p>
                        </div>
                    )}

                    {/* Review Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Score */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Puan (0-100) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={score}
                                onChange={(e) => setScore(e.target.value)}
                                min="0"
                                max="100"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="0-100 arası bir puan girin"
                                required
                            />
                        </div>

                        {/* Feedback */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Geri Bildirim <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                rows={8}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                placeholder="Öğrenciye detaylı geri bildirim yazın..."
                                required
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Öğrencinin güçlü yönlerini ve geliştirilmesi gereken alanları belirtin.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                                disabled={isSubmitting}
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Kaydediliyor...' : 'Değerlendirmeyi Kaydet'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CompositionReviewModal;
