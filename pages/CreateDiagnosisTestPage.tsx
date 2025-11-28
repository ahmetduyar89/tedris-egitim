import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { knowledgeGraphService } from '../services/knowledgeGraphService';
import { diagnosisTestManagementService } from '../services/diagnosisTestManagementService';
import { generateDiagnosisQuestions } from '../services/secureAIService';
import { DiagnosisTestQuestion } from '../types/diagnosisTestTypes';

interface CreateDiagnosisTestPageProps {
    user: User;
    onBack: () => void;
    onTestCreated: () => void;
}

const CreateDiagnosisTestPage: React.FC<CreateDiagnosisTestPageProps> = ({ user, onBack, onTestCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set(['Matematik']));
    const [availableModules, setAvailableModules] = useState<any[]>([]);
    const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
    const [questionsPerModule, setQuestionsPerModule] = useState(3);
    const [difficulty, setDifficulty] = useState(3);
    const [durationMinutes, setDurationMinutes] = useState(60);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<DiagnosisTestQuestion[]>([]);
    const [currentStep, setCurrentStep] = useState<'config' | 'preview' | 'assign'>('config');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadModules();
    }, [selectedSubjects]);

    const loadModules = async () => {
        try {
            const grades = [5, 6, 7, 8];
            const allModules: any[] = [];

            for (const subject of selectedSubjects) {
                for (const grade of grades) {
                    const modules = await knowledgeGraphService.getModules(subject, grade);
                    // Add subject and grade info to each module for filtering
                    const enrichedModules = modules.map(m => ({
                        ...m,
                        subject,
                        grade,
                        displayName: `[${grade}. Sınıf] ${m.title}`
                    }));
                    allModules.push(...enrichedModules);
                }
            }

            setAvailableModules(allModules);
        } catch (err) {
            console.error('Error loading modules:', err);
            setError('Modüller yüklenemedi');
        }
    };

    const toggleModule = (moduleId: string) => {
        const newSelected = new Set(selectedModules);
        if (newSelected.has(moduleId)) {
            newSelected.delete(moduleId);
        } else {
            newSelected.add(moduleId);
        }
        setSelectedModules(newSelected);
    };

    const handleGenerateQuestions = async () => {
        if (selectedModules.size === 0) {
            setError('Lütfen en az bir kazanım seçin');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const selectedModulesList = availableModules.filter(m => selectedModules.has(m.id));

            // Group by subject and grade
            const groupedModules = new Map<string, any[]>();
            selectedModulesList.forEach(m => {
                const key = `${m.subject}-${m.grade}`;
                if (!groupedModules.has(key)) {
                    groupedModules.set(key, []);
                }
                groupedModules.get(key)!.push({
                    id: m.id,
                    name: m.title,
                    code: m.code
                });
            });

            // Generate questions for each subject-grade combination
            const allQuestions: any[] = [];
            for (const [key, modules] of groupedModules.entries()) {
                const [subject, gradeStr] = key.split('-');
                const grade = parseInt(gradeStr);

                const questions = await generateDiagnosisQuestions(
                    subject,
                    grade,
                    modules,
                    questionsPerModule,
                    difficulty
                );

                allQuestions.push(...questions);
            }

            const formattedQuestions: DiagnosisTestQuestion[] = allQuestions.map((q: any, index: number) => ({
                id: `temp-${index}`,
                testId: '',
                moduleId: q.module_id,
                moduleName: q.module_name,
                questionText: q.question_text,
                options: q.options,
                correctAnswer: q.correct_answer,
                difficulty: q.difficulty,
                orderIndex: index,
                createdAt: new Date().toISOString()
            }));

            setGeneratedQuestions(formattedQuestions);
            setCurrentStep('preview');
        } catch (err: any) {
            console.error('Error generating questions:', err);
            setError(err.message || 'Sorular oluşturulurken hata oluştu');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveTest = async () => {
        if (!title.trim()) {
            setError('Lütfen test başlığı girin');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            // Determine subjects and grades from selected modules
            const selectedModulesList = availableModules.filter(m => selectedModules.has(m.id));
            const subjects = [...new Set(selectedModulesList.map(m => m.subject))];
            const grades = [...new Set(selectedModulesList.map(m => m.grade))];

            // Test oluştur (primary subject and grade from first module)
            const test = await diagnosisTestManagementService.createTest(user.id, {
                title,
                description,
                subject: subjects.join(', '),
                grade: Math.min(...grades), // Use lowest grade as primary
                moduleIds: Array.from(selectedModules),
                questionsPerModule,
                durationMinutes
            });

            // Soruları kaydet
            await diagnosisTestManagementService.saveQuestions(test.id, generatedQuestions);

            alert('✅ Test başarıyla oluşturuldu!');
            onTestCreated();
        } catch (err: any) {
            console.error('Error saving test:', err);
            setError(err.message || 'Test kaydedilirken hata oluştu');
        } finally {
            setIsSaving(false);
        }
    };

    const renderConfigStep = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Test Bilgileri</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Test Başlığı *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Örn: 5. Sınıf Matematik Tanı Testi"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Test hakkında kısa açıklama..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dersler * (Birden fazla seçebilirsiniz)</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['Matematik', 'Fen Bilimleri', 'Türkçe', 'Sosyal Bilgiler'].map(subj => (
                                <div
                                    key={subj}
                                    onClick={() => {
                                        const newSelected = new Set(selectedSubjects);
                                        if (newSelected.has(subj)) {
                                            if (newSelected.size > 1) { // At least one must remain
                                                newSelected.delete(subj);
                                            }
                                        } else {
                                            newSelected.add(subj);
                                        }
                                        setSelectedSubjects(newSelected);
                                    }}
                                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${selectedSubjects.has(subj)
                                            ? 'border-primary bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedSubjects.has(subj)}
                                            onChange={() => { }}
                                            className="pointer-events-none"
                                        />
                                        <span className="font-medium">{subj}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">5-6-7-8. Sınıflar</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Kazanım Başına Soru</label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={questionsPerModule}
                                onChange={(e) => setQuestionsPerModule(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Zorluk (1-5)</label>
                            <input
                                type="number"
                                min="1"
                                max="5"
                                value={difficulty}
                                onChange={(e) => setDifficulty(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Süre (dk)</label>
                            <input
                                type="number"
                                min="15"
                                max="180"
                                step="15"
                                value={durationMinutes}
                                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Kazanım Seçimi ({selectedModules.size} seçili)
                </h3>

                {availableModules.length === 0 ? (
                    <p className="text-gray-500">Bu ders ve sınıf için kazanım bulunamadı.</p>
                ) : (
                    <div className="space-y-4">
                        {/* Group modules by subject */}
                        {Array.from(selectedSubjects).map(subject => {
                            const subjectModules = availableModules.filter(m => m.subject === subject);
                            if (subjectModules.length === 0) return null;

                            return (
                                <div key={subject} className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-bold text-gray-800 mb-3">{subject}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                                        {subjectModules.map(module => (
                                            <div
                                                key={module.id}
                                                onClick={() => toggleModule(module.id)}
                                                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${selectedModules.has(module.id)
                                                    ? 'border-primary bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="flex items-start space-x-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedModules.has(module.id)}
                                                        onChange={() => { }}
                                                        className="mt-1 pointer-events-none"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-gray-800 text-sm">{module.displayName}</div>
                                                        {module.code && (
                                                            <div className="text-xs text-gray-500 mt-1">Kod: {module.code}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex justify-between">
                <button
                    onClick={onBack}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
                >
                    ← Geri
                </button>

                <button
                    onClick={handleGenerateQuestions}
                    disabled={isGenerating || selectedModules.size === 0}
                    className="px-8 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                    {isGenerating ? (
                        <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Sorular Oluşturuluyor...</span>
                        </>
                    ) : (
                        <>
                            <span>🤖</span>
                            <span>AI ile Soru Üret</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    const renderPreviewStep = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">
                        Soru Önizleme ({generatedQuestions.length} soru)
                    </h3>
                    <div className="text-sm text-gray-600">
                        Toplam Puan: {generatedQuestions.length * 5}
                    </div>
                </div>

                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4">
                    {generatedQuestions.map((q, index) => (
                        <div key={q.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center space-x-2">
                                    <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-bold">
                                        Soru {index + 1}
                                    </span>
                                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                                        {q.moduleName}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        Zorluk: {q.difficulty}/5
                                    </span>
                                </div>
                            </div>

                            <p className="text-gray-800 font-medium mb-4">{q.questionText}</p>

                            <div className="space-y-2">
                                {q.options.map((option, optIndex) => (
                                    <div
                                        key={optIndex}
                                        className={`p-3 rounded-lg border ${option.startsWith(q.correctAnswer)
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-200'
                                            }`}
                                    >
                                        <span className={option.startsWith(q.correctAnswer) ? 'text-green-700 font-semibold' : ''}>
                                            {option}
                                        </span>
                                        {option.startsWith(q.correctAnswer) && (
                                            <span className="ml-2 text-green-600">✓ Doğru Cevap</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-between">
                <button
                    onClick={() => setCurrentStep('config')}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
                >
                    ← Düzenle
                </button>

                <button
                    onClick={handleSaveTest}
                    disabled={isSaving}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                >
                    {isSaving ? (
                        <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Kaydediliyor...</span>
                        </>
                    ) : (
                        <>
                            <span>💾</span>
                            <span>Testi Kaydet</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        📝 Yeni Tanı Testi Oluştur
                    </h1>
                    <p className="text-gray-600">
                        AI destekli soru üretimi ile öğrencileriniz için kapsamlı tanı testi hazırlayın
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                        <span className="text-red-600 text-xl">⚠️</span>
                        <div>
                            <div className="font-semibold text-red-800">Hata</div>
                            <div className="text-red-700">{error}</div>
                        </div>
                    </div>
                )}

                {currentStep === 'config' && renderConfigStep()}
                {currentStep === 'preview' && renderPreviewStep()}
            </div>
        </div>
    );
};

export default CreateDiagnosisTestPage;
