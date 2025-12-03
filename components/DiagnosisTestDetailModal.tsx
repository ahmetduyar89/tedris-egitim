import React, { useState, useEffect } from 'react';
import { diagnosisTestManagementService } from '../services/diagnosisTestManagementService';
import { DiagnosisDetailedResult } from '../types/diagnosisTestTypes';

interface DiagnosisTestDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignmentId: string;
}

const DiagnosisTestDetailModal: React.FC<DiagnosisTestDetailModalProps> = ({ isOpen, onClose, assignmentId }) => {
    const [result, setResult] = useState<DiagnosisDetailedResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'analysis' | 'questions'>('analysis');

    useEffect(() => {
        if (isOpen && assignmentId) {
            loadResult();
        }
    }, [isOpen, assignmentId]);

    const loadResult = async () => {
        try {
            setIsLoading(true);
            const data = await diagnosisTestManagementService.getDetailedResults(assignmentId);
            setResult(data);
        } catch (error) {
            console.error('Error loading detailed result:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
                {/* Header */}
                <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Test Sonuç Detayı</h2>
                        {result && (
                            <p className="text-gray-500 text-sm mt-1">
                                {result.student?.name} • {result.test?.title}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : !result ? (
                        <div className="text-center py-12 text-gray-500">Sonuç bulunamadı.</div>
                    ) : (
                        <div className="space-y-6">
                            {/* Score Card */}
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                                <div className="text-center px-8 border-r border-gray-100">
                                    <div className="text-sm text-gray-500 mb-1">Başarı Puanı</div>
                                    <div className={`text-4xl font-bold ${(result.assignment.score || 0) >= 80 ? 'text-green-600' :
                                        (result.assignment.score || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                        {result.assignment.score}%
                                    </div>
                                </div>
                                <div className="text-center px-8 border-r border-gray-100">
                                    <div className="text-sm text-gray-500 mb-1">Doğru / Toplam</div>
                                    <div className="text-2xl font-bold text-gray-800">
                                        {result.assignment.totalCorrect} <span className="text-gray-400 text-lg">/ {result.assignment.totalQuestions}</span>
                                    </div>
                                </div>
                                <div className="text-center px-8">
                                    <div className="text-sm text-gray-500 mb-1">Tamamlanma</div>
                                    <div className="text-lg font-medium text-gray-800">
                                        {new Date(result.assignment.completedAt!).toLocaleDateString('tr-TR')}
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-100 w-fit">
                                <button
                                    onClick={() => setActiveTab('analysis')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'analysis' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    Analiz & Öneriler
                                </button>
                                <button
                                    onClick={() => setActiveTab('questions')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'questions' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    Soru Detayları
                                </button>
                            </div>

                            {activeTab === 'analysis' ? (
                                <div className="space-y-6">
                                    {/* AI Analysis */}
                                    {result.aiAnalysis && (
                                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                <span className="mr-2">🤖</span> Yapay Zeka Analizi
                                            </h3>
                                            <div className="prose prose-sm max-w-none text-gray-600">
                                                <div className="mb-4">
                                                    <h4 className="font-semibold text-gray-800 mb-2">Genel Değerlendirme</h4>
                                                    <p>{result.aiAnalysis.overallAssessment}</p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <h4 className="font-semibold text-green-700 mb-2">Güçlü Yönler</h4>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {/* Handle both new (strongAreas) and old (strengths) data structures */}
                                                            {(result.aiAnalysis.strongAreas || (result.aiAnalysis as any).strengths || []).map((s: any, i: number) => (
                                                                <li key={i}>
                                                                    {typeof s === 'string' ? s : (
                                                                        <>
                                                                            <span className="font-medium">{s.moduleName}</span>: {s.comment}
                                                                        </>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-red-700 mb-2">Gelişim Alanları</h4>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {/* Handle both new (weakAreas) and old (weaknesses) data structures */}
                                                            {(result.aiAnalysis.weakAreas || (result.aiAnalysis as any).weaknesses || []).map((w: any, i: number) => (
                                                                <li key={i}>
                                                                    {typeof w === 'string' ? w : (
                                                                        <>
                                                                            <span className="font-medium">{w.moduleName}</span>: {w.gapAnalysis}
                                                                        </>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    <h4 className="font-semibold text-blue-700 mb-2">Öneriler</h4>
                                                    <div className="space-y-3">
                                                        {(result.aiAnalysis.recommendations || []).map((r: any, i: number) => (
                                                            typeof r === 'string' ? (
                                                                <li key={i} className="list-disc list-inside">{r}</li>
                                                            ) : (
                                                                <div key={i} className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                                    <div className="font-bold text-blue-800 text-sm mb-1 uppercase">
                                                                        {r.type === 'study_plan' ? 'Çalışma Planı' :
                                                                            r.type === 'practice' ? 'Pratik' :
                                                                                r.type === 'review' ? 'Tekrar' : 'İleri Seviye'}
                                                                    </div>
                                                                    <p className="text-gray-700 mb-1">{r.description}</p>
                                                                    <div className="text-xs text-gray-500">
                                                                        <span className="font-medium">Süre:</span> {r.estimatedDuration} • <span className="font-medium">Konular:</span> {r.modules?.join(', ')}
                                                                    </div>
                                                                </div>
                                                            )
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Module Performance */}
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-800 mb-4">Konu Bazlı Performans</h3>
                                        <div className="space-y-4">
                                            {result.moduleResults.map((module, index) => (
                                                <div key={index}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-sm font-medium text-gray-700">{module.moduleName}</span>
                                                        <span className="text-sm text-gray-500">
                                                            {module.correctAnswers}/{module.totalQuestions} Doğru (%{Math.round(module.masteryScore * 100)})
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${module.masteryScore >= 0.8 ? 'bg-green-500' :
                                                                module.masteryScore >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}
                                                            style={{ width: `${module.masteryScore * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Raw Data Debug */}
                                    <details className="mt-8 p-4 bg-gray-100 rounded-lg">
                                        <summary className="text-xs text-gray-500 cursor-pointer">Geliştirici Verisi (Debug)</summary>
                                        <pre className="mt-2 text-xs overflow-auto max-h-60">
                                            {JSON.stringify(result.aiAnalysis, null, 2)}
                                        </pre>
                                    </details>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {result.answers.map((answer, index) => {
                                        // Find question details (assuming we have them in moduleResults or need to fetch)
                                        // For now, let's try to find it in moduleResults
                                        let questionDetails = null;
                                        for (const mod of result.moduleResults) {
                                            const q = mod.questions.find(q => q.questionId === answer.questionId);
                                            if (q) {
                                                questionDetails = q;
                                                break;
                                            }
                                        }

                                        if (!questionDetails) return null;

                                        return (
                                            <div key={answer.id} className={`bg-white rounded-xl p-4 border-l-4 shadow-sm ${answer.isCorrect ? 'border-green-500' : 'border-red-500'
                                                }`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-bold text-gray-700">Soru {index + 1}</span>
                                                    {answer.isCorrect ? (
                                                        <span className="text-green-600 text-sm font-bold flex items-center">
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                            Doğru
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-600 text-sm font-bold flex items-center">
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                            Yanlış
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-800 mb-3">{questionDetails.questionText}</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                    <div className={`p-3 rounded-lg ${answer.isCorrect ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
                                                        <span className="font-semibold block mb-1">Öğrenci Cevabı:</span>
                                                        {answer.studentAnswer}
                                                    </div>
                                                    {!answer.isCorrect && (
                                                        <div className="p-3 rounded-lg bg-green-50 text-green-800 border border-green-100">
                                                            <span className="font-semibold block mb-1">Doğru Cevap:</span>
                                                            {questionDetails.correctAnswer}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiagnosisTestDetailModal;
