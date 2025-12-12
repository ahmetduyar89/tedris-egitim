import React, { useState, useEffect } from 'react';
import { diagnosisTestManagementService } from '../services/diagnosisTestManagementService';
import { DiagnosisDetailedResult } from '../types/diagnosisTestTypes';
import { generateWeeklyProgram } from '../services/optimizedAIService';
import { WeeklyProgram, Subject } from '../types';
import EditableWeeklySchedule from './EditableWeeklySchedule';
import { db } from '../services/dbAdapter';

interface DiagnosisTestDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignmentId: string;
}

const DiagnosisTestDetailModal: React.FC<DiagnosisTestDetailModalProps> = ({ isOpen, onClose, assignmentId }) => {
    const [result, setResult] = useState<DiagnosisDetailedResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'analysis' | 'questions'>('analysis');

    // Weekly Program State
    const [generatedProgram, setGeneratedProgram] = useState<WeeklyProgram | null>(null);
    const [isGeneratingProgram, setIsGeneratingProgram] = useState(false);

    useEffect(() => {
        if (isOpen && assignmentId) {
            loadResult();
            // Reset program state when opening new result
            setGeneratedProgram(null);
        }
    }, [isOpen, assignmentId]);

    const loadResult = async () => {
        try {
            setIsLoading(true);
            const data = await diagnosisTestManagementService.getDetailedResults(assignmentId);
            setResult(data);

            // Try to check if a program was already generated for this test? 
            // For now, we don't link them explicitly in DB schema shown, so we start fresh or user generates new.
            // If we wanted to persist "linked" program, we'd need to store programId in assignment or vice versa.
            // Given the prompt "Öğretmen yapay zekanın hazırladığı haftalık planı düzenleyebilmeli, silebilmeli", 
            // we will generate and save. If existing check is needed, we'd query weeklyPrograms.
        } catch (error) {
            console.error('Error loading detailed result:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateProgram = async () => {
        if (!result || !result.assignment.studentId) return;

        try {
            setIsGeneratingProgram(true);

            // 1. Generate Program Content via AI
            const generatedContent = await generateWeeklyProgram(
                result.test.grade,
                result.test.subject as Subject, // Cast string to Subject enum
                result.aiAnalysis
            );

            // 2. Check for existing program
            const existingPrograms = await db.collection('weeklyPrograms')
                .where('studentId', '==', result.assignment.studentId)
                .limit(1)
                .get();

            let currentProgramId: string;

            // 3. Create or Update Program
            const programData = {
                studentId: result.assignment.studentId,
                week: getCurrentWeekNumber(),
                days: generatedContent.days
            };

            if (!existingPrograms.empty) {
                // Update existing
                currentProgramId = existingPrograms.docs[0].id;
                await db.collection('weeklyPrograms').doc(currentProgramId).update({
                    days: generatedContent.days, // Update days
                    week: getCurrentWeekNumber()
                });
            } else {
                // Create new
                const { id } = await db.collection('weeklyPrograms').add(programData);
                currentProgramId = id;
            }

            const newProgram: WeeklyProgram = {
                id: currentProgramId,
                ...programData
            };

            // 4. Update State
            setGeneratedProgram(newProgram);

        } catch (error) {
            console.error('Error generating weekly program:', error);
            alert('Haftalık program oluşturulurken bir hata oluştu.');
        } finally {
            setIsGeneratingProgram(false);
        }
    };

    const handleDeleteProgram = async () => {
        if (!generatedProgram) return;

        if (!confirm('Oluşturulan haftalık programı silmek istediğinize emin misiniz?')) return;

        try {
            await db.collection('weeklyPrograms').doc(generatedProgram.id).delete();
            setGeneratedProgram(null);
        } catch (error) {
            console.error('Error deleting program:', error);
            alert('Program silinirken bir hata oluştu.');
        }
    };

    const getCurrentWeekNumber = () => {
        const currentDate = new Date();
        const startDate = new Date(currentDate.getFullYear(), 0, 1);
        const days = Math.floor((currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
        return Math.ceil(days / 7);
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
                                    <div className={`text-4xl font-bold ${(result.assignment.score ?? 0) >= 80 ? 'text-green-600' :
                                        (result.assignment.score ?? 0) >= 50 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                        {result.assignment.score ?? 0}%
                                    </div>
                                </div>
                                <div className="text-center px-8 border-r border-gray-100">
                                    <div className="text-sm text-gray-500 mb-1">Doğru / Toplam</div>
                                    <div className="text-2xl font-bold text-gray-800">
                                        {result.assignment.totalCorrect ?? 0} <span className="text-gray-400 text-lg">/ {result.assignment.totalQuestions ?? 0}</span>
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
                                                    <p>{result.aiAnalysis.overallAssessment || (result.aiAnalysis as any).overall_assessment}</p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <h4 className="font-semibold text-green-700 mb-2">Güçlü Yönler</h4>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {/* Handle camelCase, old format, and snake_case */}
                                                            {(
                                                                result.aiAnalysis.strongAreas ||
                                                                (result.aiAnalysis as any).strengths ||
                                                                (result.aiAnalysis as any).strong_areas ||
                                                                []
                                                            ).map((s: any, i: number) => (
                                                                <li key={i}>
                                                                    {typeof s === 'string' ? s : (
                                                                        <>
                                                                            <span className="font-medium">{s.moduleName || s.module_name}</span>: {s.comment}
                                                                        </>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-red-700 mb-2">Gelişim Alanları</h4>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {/* Handle camelCase, old format, and snake_case */}
                                                            {(
                                                                result.aiAnalysis.weakAreas ||
                                                                (result.aiAnalysis as any).weaknesses ||
                                                                (result.aiAnalysis as any).weak_areas ||
                                                                []
                                                            ).map((w: any, i: number) => (
                                                                <li key={i}>
                                                                    {typeof w === 'string' ? w : (
                                                                        <>
                                                                            <span className="font-medium">{w.moduleName || w.module_name}</span>: {w.gapAnalysis || w.gap_analysis}
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
                                                                        <span className="font-medium">Süre:</span> {r.estimatedDuration || r.estimated_duration} • <span className="font-medium">Konular:</span> {r.modules?.join(', ')}
                                                                    </div>
                                                                </div>
                                                            )
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* AI Plan Generation Section */}
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                                <span className="mr-2">📅</span> Haftalık Çalışma Programı
                                            </h3>

                                            {generatedProgram && (
                                                <button
                                                    onClick={handleDeleteProgram}
                                                    className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                    </svg>
                                                    Planı Sil
                                                </button>
                                            )}
                                        </div>

                                        {!generatedProgram ? (
                                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                <div className="mb-4 text-4xl">✨</div>
                                                <h4 className="text-gray-800 font-medium mb-2">Kişiselleştirilmiş Program Oluştur</h4>
                                                <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                                                    Yapay zeka, öğrencinin test sonuçlarını analiz ederek eksik konularına odaklanan özel bir haftalık çalışma programı hazırlayabilir.
                                                </p>
                                                <button
                                                    onClick={handleGenerateProgram}
                                                    disabled={isGeneratingProgram}
                                                    className={`px-6 py-3 rounded-lg text-white font-medium shadow-md transition-all flex items-center gap-2 mx-auto ${isGeneratingProgram
                                                        ? 'bg-gray-400 cursor-not-allowed'
                                                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg hover:scale-105'
                                                        }`}
                                                >
                                                    {isGeneratingProgram ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-b-transparent"></div>
                                                            Hazırlanıyor...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 19.75l-4.313-1.312 3.823-7.555-5.328 1.144L5.688 8l3.411 1.764 1.132-5.362L13.125 5l-1.096 5.625 5.253.953-3.266 5.922 4.103 1.25-3.303 1.156z" />
                                                            </svg>
                                                            Yapay Zeka ile Haftalık Program Hazırla
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="animate-fade-in">
                                                <div className="mb-4 bg-green-50 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    Haftalık program başarıyla oluşturuldu ve öğrencinin takvimine eklendi. Aşağıdan düzenleyebilirsiniz.
                                                </div>
                                                <EditableWeeklySchedule
                                                    program={generatedProgram}
                                                    onProgramUpdate={setGeneratedProgram}
                                                />
                                            </div>
                                        )}
                                    </div>

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
