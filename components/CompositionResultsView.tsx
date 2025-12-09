import React from 'react';
import { CompositionAssignment } from '../types';

interface CompositionResultsViewProps {
    assignment: CompositionAssignment;
    onBack: () => void;
}

const CompositionResultsView: React.FC<CompositionResultsViewProps> = ({ assignment, onBack }) => {
    const hasAIFeedback = assignment.aiFeedback && assignment.aiScore !== undefined;
    const hasTeacherFeedback = assignment.teacherScore !== undefined;

    const getScoreColor = (score: number) => {
        if (score >= 85) return 'text-green-600';
        if (score >= 70) return 'text-blue-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 85) return 'bg-green-50 border-green-200';
        if (score >= 70) return 'bg-blue-50 border-blue-200';
        if (score >= 50) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
                    <button
                        onClick={onBack}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-3"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Geri
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                        {assignment.composition?.title}
                    </h1>
                    <p className="text-gray-600">Değerlendirme Sonuçları</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">
                {/* Scores Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* AI Score */}
                    {hasAIFeedback && (
                        <div className={`rounded-xl border-2 p-6 ${getScoreBgColor(assignment.aiScore!)}`}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-gray-700">🤖 AI Değerlendirmesi</h3>
                                <span className={`text-3xl font-bold ${getScoreColor(assignment.aiScore!)}`}>
                                    {assignment.aiScore}
                                </span>
                            </div>
                            <div className="w-full bg-white rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${assignment.aiScore! >= 85 ? 'bg-green-500' :
                                            assignment.aiScore! >= 70 ? 'bg-blue-500' :
                                                assignment.aiScore! >= 50 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                        }`}
                                    style={{ width: `${assignment.aiScore}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Teacher Score */}
                    {hasTeacherFeedback && (
                        <div className={`rounded-xl border-2 p-6 ${getScoreBgColor(assignment.teacherScore!)}`}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-gray-700">👨‍🏫 Öğretmen Değerlendirmesi</h3>
                                <span className={`text-3xl font-bold ${getScoreColor(assignment.teacherScore!)}`}>
                                    {assignment.teacherScore}
                                </span>
                            </div>
                            <div className="w-full bg-white rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${assignment.teacherScore! >= 85 ? 'bg-green-500' :
                                            assignment.teacherScore! >= 70 ? 'bg-blue-500' :
                                                assignment.teacherScore! >= 50 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                        }`}
                                    style={{ width: `${assignment.teacherScore}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* AI Detailed Feedback */}
                {hasAIFeedback && assignment.aiFeedback && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-2xl">🤖</span>
                            AI Detaylı Değerlendirme
                        </h2>

                        {/* Overall Feedback */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-700 mb-2">Genel Değerlendirme</h3>
                            <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                                {assignment.aiFeedback.overall}
                            </p>
                        </div>

                        {/* Score Breakdown */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600">
                                    {assignment.aiFeedback.contentScore}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">İçerik</div>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    {assignment.aiFeedback.organizationScore}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">Organizasyon</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">
                                    {assignment.aiFeedback.grammarScore}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">Gramer</div>
                            </div>
                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                <div className="text-2xl font-bold text-yellow-600">
                                    {assignment.aiFeedback.vocabularyScore}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">Kelime Dağarcığı</div>
                            </div>
                        </div>

                        {/* Strengths */}
                        {assignment.aiFeedback.strengths && assignment.aiFeedback.strengths.length > 0 && (
                            <div className="mb-6">
                                <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Güçlü Yönler
                                </h3>
                                <ul className="space-y-2">
                                    {assignment.aiFeedback.strengths.map((strength, index) => (
                                        <li key={index} className="flex items-start gap-2 text-gray-700">
                                            <span className="text-green-500 mt-1">✓</span>
                                            <span>{strength}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Improvements */}
                        {assignment.aiFeedback.improvements && assignment.aiFeedback.improvements.length > 0 && (
                            <div className="mb-6">
                                <h3 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                    Geliştirilmesi Gerekenler
                                </h3>
                                <ul className="space-y-2">
                                    {assignment.aiFeedback.improvements.map((improvement, index) => (
                                        <li key={index} className="flex items-start gap-2 text-gray-700">
                                            <span className="text-orange-500 mt-1">→</span>
                                            <span>{improvement}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Grammar Issues */}
                        {assignment.aiFeedback.grammarIssues && assignment.aiFeedback.grammarIssues.length > 0 && (
                            <div className="mb-6">
                                <h3 className="font-semibold text-red-700 mb-3">Gramer Hataları</h3>
                                <div className="space-y-3">
                                    {assignment.aiFeedback.grammarIssues.map((issue, index) => (
                                        <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <p className="text-red-900 font-medium mb-1">{issue.issue}</p>
                                            <p className="text-red-700 text-sm">💡 {issue.suggestion}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Spelling Issues */}
                        {assignment.aiFeedback.spellingIssues && assignment.aiFeedback.spellingIssues.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-red-700 mb-3">İmla Hataları</h3>
                                <div className="space-y-3">
                                    {assignment.aiFeedback.spellingIssues.map((issue, index) => (
                                        <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <p className="text-red-900">
                                                <span className="font-medium line-through">{issue.word}</span>
                                                {' → '}
                                                <span className="font-medium text-green-700">{issue.suggestion}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Teacher Feedback */}
                {hasTeacherFeedback && assignment.teacherFeedback && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-2xl">👨‍🏫</span>
                            Öğretmen Geri Bildirimi
                        </h2>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-gray-700 whitespace-pre-wrap">{assignment.teacherFeedback}</p>
                        </div>
                    </div>
                )}

                {/* Your Composition */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">📝 Kompozisyonunuz</h2>
                    <div className="bg-gray-50 rounded-lg p-6">
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {assignment.studentText}
                        </p>
                        <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
                            Kelime Sayısı: {assignment.wordCount}
                        </div>
                    </div>
                </div>

                {/* Waiting Message */}
                {!hasAIFeedback && !hasTeacherFeedback && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                        <div className="text-4xl mb-3">⏳</div>
                        <p className="text-yellow-900 font-semibold mb-2">Değerlendirme Bekleniyor</p>
                        <p className="text-yellow-700 text-sm">
                            Kompozisyonunuz değerlendiriliyor. Sonuçlar hazır olduğunda burada görünecek.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompositionResultsView;
