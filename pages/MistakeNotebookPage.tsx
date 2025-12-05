import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { mistakeService } from '../services/mistakeService';
import { analyzeMistake } from '../services/optimizedAIService';
import { Mistake } from '../types';

interface MistakeNotebookPageProps {
    user: User | null;
    onBack?: () => void;
}

const MistakeNotebookPage: React.FC<MistakeNotebookPageProps> = ({ user, onBack }) => {
    const [mistakes, setMistakes] = useState<Mistake[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'new' | 'analyzed' | 'mastered' | 'all'>('new');

    useEffect(() => {
        if (user) {
            fetchMistakes();
        }
    }, [user, filter]);

    const fetchMistakes = async () => {
        setLoading(true);
        try {
            const status = filter === 'all' ? undefined : filter;
            const data = await mistakeService.getMistakes(user!.id, status);
            setMistakes(data);
        } catch (error) {
            console.error("Error fetching mistakes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async (mistake: Mistake) => {
        setAnalyzingId(mistake.id);
        try {
            const analysis = await analyzeMistake(
                mistake.questionData.text || mistake.questionData.question,
                mistake.studentAnswer,
                mistake.correctAnswer
            );

            await mistakeService.updateMistakeAnalysis(mistake.id, analysis);

            // Update local state
            setMistakes(prev => prev.map(m =>
                m.id === mistake.id
                    ? { ...m, aiAnalysis: analysis, status: 'analyzed' }
                    : m
            ));
        } catch (error) {
            console.error("Error analyzing mistake:", error);
            alert("Analiz sırasında bir hata oluştu.");
        } finally {
            setAnalyzingId(null);
        }
    };

    const handleMarkAsMastered = async (mistakeId: string) => {
        if (!confirm("Bu konuyu tamamen anladığına emin misin?")) return;

        try {
            await mistakeService.markAsMastered(mistakeId);
            setMistakes(prev => prev.filter(m => m.id !== mistakeId));
        } catch (error) {
            console.error("Error marking as mastered:", error);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Geri Dön
                        </button>
                    )}
                    <h1 className="text-3xl font-bold font-poppins text-gray-800">Akıllı Hata Defteri 📓</h1>
                    <p className="text-gray-600 mt-2">Hatalarından ders çıkar, eksiklerini kapat.</p>
                </div>
                <div className="flex space-x-2">
                    {(['new', 'analyzed', 'mastered', 'all'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            {f === 'new' ? 'Yeni' : f === 'analyzed' ? 'Analizli' : f === 'mastered' ? 'Öğrenilen' : 'Tümü'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-500">Hata defterin yükleniyor...</p>
                </div>
            ) : mistakes.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <span className="text-6xl">🎉</span>
                    <h3 className="text-xl font-bold text-gray-800 mt-4">Harika! Hiç hatan yok.</h3>
                    <p className="text-gray-500 mt-2">Ya da seçili filtrede gösterilecek bir şey bulamadık.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {mistakes.map(mistake => (
                        <div key={mistake.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${mistake.status === 'new' ? 'bg-red-100 text-red-700' :
                                        mistake.status === 'analyzed' ? 'bg-blue-100 text-blue-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                        {mistake.status === 'new' ? 'Yeni Hata' :
                                            mistake.status === 'analyzed' ? 'Analiz Edildi' : 'Öğrenildi'}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(mistake.createdAt).toLocaleDateString('tr-TR')}
                                    </span>
                                </div>

                                <div className="mb-6">
                                    <h4 className="font-bold text-gray-800 mb-2">Soru:</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
                                        {mistake.questionData.text || mistake.questionData.question}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                        <p className="text-xs font-bold text-red-600 uppercase mb-1">Senin Cevabın</p>
                                        <p className="text-gray-800 font-medium">{mistake.studentAnswer}</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                        <p className="text-xs font-bold text-green-600 uppercase mb-1">Doğru Cevap</p>
                                        <p className="text-gray-800 font-medium">{mistake.correctAnswer}</p>
                                    </div>
                                </div>

                                {mistake.aiAnalysis ? (
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-100 mb-4">
                                        <h4 className="font-bold text-indigo-800 mb-3 flex items-center">
                                            <span className="text-xl mr-2">🤖</span> AI Analizi
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm font-bold text-indigo-900">Neden Yanlış Yaptın?</p>
                                                <p className="text-sm text-indigo-800 mt-1">{mistake.aiAnalysis.explanation}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-indigo-900">İpucu & Çözüm Yolu</p>
                                                <p className="text-sm text-indigo-800 mt-1">{mistake.aiAnalysis.hint}</p>
                                            </div>
                                            <div className="pt-2 border-t border-indigo-200">
                                                <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                                                    Konu: {mistake.aiAnalysis.relatedTopic}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-300 text-center mb-4">
                                        <p className="text-gray-500 mb-3">Bu hatanın nedenini henüz analiz etmedin.</p>
                                        <button
                                            onClick={() => handleAnalyze(mistake)}
                                            disabled={analyzingId === mistake.id}
                                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                        >
                                            {analyzingId === mistake.id ? 'Analiz Ediliyor...' : '✨ AI ile Analiz Et'}
                                        </button>
                                    </div>
                                )}

                                <div className="flex justify-end pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleMarkAsMastered(mistake.id)}
                                        className="text-green-600 hover:text-green-800 font-medium text-sm flex items-center"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Bu Konuyu Öğrendim (Arşivle)
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MistakeNotebookPage;
