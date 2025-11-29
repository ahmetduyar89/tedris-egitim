import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { knowledgeGraphService, KGModule } from '../services/knowledgeGraphService';
import { diagnosisTestManagementService } from '../services/diagnosisTestManagementService';
import { generateDiagnosisQuestions } from '../services/secureAIService';
import { DiagnosisTestQuestion } from '../types/diagnosisTestTypes';
import { Subject } from '../types';

interface CreateDiagnosisTestPageProps {
    user: User;
    onBack: () => void;
    onTestCreated: () => void;
}

interface UnitConfig {
    unitName: string;
    subject: string;
    modules: KGModule[];
    isSelected: boolean;
    questionCount: number;
    difficulty: number;
}

const CreateDiagnosisTestPage: React.FC<CreateDiagnosisTestPageProps> = ({ user, onBack, onTestCreated }) => {
    // Step 1: Grade
    const [selectedGrade, setSelectedGrade] = useState<number | null>(null);

    // Step 2: Subjects
    const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());

    // Step 3: Units & Modules
    const [units, setUnits] = useState<UnitConfig[]>([]);
    const [selectedModuleIds, setSelectedModuleIds] = useState<Set<string>>(new Set());
    const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

    // General State
    const [title, setTitle] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<DiagnosisTestQuestion[]>([]);
    const [currentStep, setCurrentStep] = useState<'config' | 'preview' | 'assign'>('config');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingUnits, setLoadingUnits] = useState(false);

    // Available options
    const grades = [5, 6, 7, 8];
    const availableSubjects = Object.values(Subject);

    useEffect(() => {
        if (selectedGrade && selectedSubjects.size > 0) {
            loadUnits();
        } else {
            setUnits([]);
        }
    }, [selectedGrade, selectedSubjects]);

    const loadUnits = async () => {
        if (!selectedGrade) return;

        setLoadingUnits(true);
        setError(null);
        try {
            const allModules: KGModule[] = [];
            for (const subject of selectedSubjects) {
                const modules = await knowledgeGraphService.getModules(subject, selectedGrade);
                allModules.push(...modules);
            }

            // Group by unit
            const groupedUnits = new Map<string, { subject: string, modules: KGModule[] }>();

            allModules.forEach(module => {
                const key = `${module.subject}-${module.unit}`;
                if (!groupedUnits.has(key)) {
                    groupedUnits.set(key, { subject: module.subject, modules: [] });
                }
                groupedUnits.get(key)!.modules.push(module);
            });

            const newUnits: UnitConfig[] = Array.from(groupedUnits.entries()).map(([key, data]) => {
                const [subject, unitName] = key.split('-');
                const existingUnit = units.find(u => u.unitName === unitName && u.subject === subject);

                return {
                    unitName: unitName,
                    subject: data.subject,
                    modules: data.modules,
                    isSelected: existingUnit ? existingUnit.isSelected : false,
                    questionCount: existingUnit ? existingUnit.questionCount : 3,
                    difficulty: existingUnit ? existingUnit.difficulty : 3
                };
            });

            setUnits(newUnits);
        } catch (err) {
            console.error('Error loading units:', err);
            setError('Üniteler yüklenirken bir hata oluştu.');
        } finally {
            setLoadingUnits(false);
        }
    };

    const toggleSubject = (subject: string) => {
        const newSelected = new Set(selectedSubjects);
        if (newSelected.has(subject)) {
            newSelected.delete(subject);
        } else {
            newSelected.add(subject);
        }
        setSelectedSubjects(newSelected);
    };

    const toggleUnitExpand = (unitKey: string) => {
        const newExpanded = new Set(expandedUnits);
        if (newExpanded.has(unitKey)) {
            newExpanded.delete(unitKey);
        } else {
            newExpanded.add(unitKey);
        }
        setExpandedUnits(newExpanded);
    };

    const toggleModule = (moduleId: string) => {
        const newSelected = new Set(selectedModuleIds);
        if (newSelected.has(moduleId)) {
            newSelected.delete(moduleId);
        } else {
            newSelected.add(moduleId);
        }
        setSelectedModuleIds(newSelected);
    };

    const toggleUnitSelection = (unit: UnitConfig) => {
        const newSelected = new Set(selectedModuleIds);
        const allSelected = unit.modules.every(m => newSelected.has(m.id));

        if (allSelected) {
            // Deselect all
            unit.modules.forEach(m => newSelected.delete(m.id));
        } else {
            // Select all
            unit.modules.forEach(m => newSelected.add(m.id));
        }
        setSelectedModuleIds(newSelected);
    };

    const updateUnitConfig = (index: number, field: 'questionCount' | 'difficulty', value: number) => {
        const newUnits = [...units];
        newUnits[index] = { ...newUnits[index], [field]: value };
        setUnits(newUnits);
    };

    const handleGenerateQuestions = async () => {
        if (selectedModuleIds.size === 0) {
            setError('Lütfen en az bir kazanım seçin');
            return;
        }

        if (!title.trim()) {
            setError('Lütfen test başlığı girin');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const allQuestions: any[] = [];

            // Group selected modules by unit to use unit config
            const selectedUnitsMap = new Map<string, KGModule[]>();

            units.forEach(unit => {
                const unitModules = unit.modules.filter(m => selectedModuleIds.has(m.id));
                if (unitModules.length > 0) {
                    selectedUnitsMap.set(`${unit.subject}-${unit.unitName}`, unitModules);
                }
            });

            for (const unit of units) {
                const unitKey = `${unit.subject}-${unit.unitName}`;
                const modules = selectedUnitsMap.get(unitKey);

                if (modules && modules.length > 0) {
                    // Map KGModule to the expected format for AI service
                    const mappedModules = modules.map(m => ({
                        id: m.id,
                        name: m.title,
                        code: m.code
                    }));

                    const questions = await generateDiagnosisQuestions(
                        unit.subject,
                        selectedGrade!,
                        mappedModules,
                        unit.questionCount,
                        unit.difficulty
                    );
                    allQuestions.push(...questions);
                }
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
        setIsSaving(true);
        setError(null);

        try {
            const testId = await diagnosisTestManagementService.createTest(user.id, {
                title: title,
                description: `${selectedGrade}. Sınıf - ${Array.from(selectedSubjects).join(', ')} Tanı Testi`,
                subject: Array.from(selectedSubjects).join(', '),
                grade: selectedGrade!,
                totalQuestions: generatedQuestions.length,
                durationMinutes: 60, // Default duration
                questions: generatedQuestions
            });

            onTestCreated();
        } catch (err: any) {
            console.error('Error saving test:', err);
            setError('Test kaydedilirken bir hata oluştu');
        } finally {
            setIsSaving(false);
        }
    };

    if (currentStep === 'preview') {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Test Önizleme</h2>
                    <div className="space-x-3">
                        <button
                            onClick={() => setCurrentStep('config')}
                            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Düzenle
                        </button>
                        <button
                            onClick={handleSaveTest}
                            disabled={isSaving}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isSaving ? 'Kaydediliyor...' : 'Testi Kaydet'}
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {generatedQuestions.map((q, index) => (
                        <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex justify-between mb-4">
                                <span className="text-sm font-medium text-indigo-600">{q.moduleName}</span>
                                <span className="text-sm text-gray-500">Zorluk: {q.difficulty}/5</span>
                            </div>
                            <p className="text-lg text-gray-800 mb-4">{index + 1}. {q.questionText}</p>
                            <div className="grid grid-cols-1 gap-3">
                                {q.options.map((opt, i) => (
                                    <div key={i} className={`p-3 rounded-lg border ${opt.startsWith(q.correctAnswer) ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                        }`}>
                                        {opt}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
                <button onClick={onBack} className="mr-4 text-gray-500 hover:text-gray-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Yeni Tanı Testi Oluştur</h1>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
                {/* Step 1: Grade Selection */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">1. Sınıf Seçimi</h3>
                    <div className="flex gap-4">
                        {grades.map(grade => (
                            <button
                                key={grade}
                                onClick={() => setSelectedGrade(grade)}
                                className={`px-6 py-3 rounded-lg border-2 transition-all ${selectedGrade === grade
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                                    : 'border-gray-200 hover:border-indigo-300 text-gray-600'
                                    }`}
                            >
                                {grade}. Sınıf
                            </button>
                        ))}
                    </div>
                </div>

                {/* Step 2: Subject Selection */}
                {selectedGrade && (
                    <div className="animate-fade-in">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">2. Ders Seçimi</h3>
                        <div className="flex flex-wrap gap-4">
                            {availableSubjects.map(subject => (
                                <button
                                    key={subject}
                                    onClick={() => toggleSubject(subject)}
                                    className={`px-4 py-2 rounded-full border transition-all ${selectedSubjects.has(subject)
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                                        }`}
                                >
                                    {subject}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Unit & Module Selection */}
                {selectedSubjects.size > 0 && (
                    <div className="animate-fade-in">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">3. Ünite ve Kazanım Seçimi</h3>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Test Başlığı</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Örn: 1. Dönem Genel Değerlendirme"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {loadingUnits ? (
                            <div className="text-center py-8 text-gray-500">Üniteler yükleniyor...</div>
                        ) : units.length > 0 ? (
                            <div className="space-y-4">
                                {units.map((unit, index) => {
                                    const unitKey = `${unit.subject}-${unit.unitName}`;
                                    const isExpanded = expandedUnits.has(unitKey);
                                    const selectedCount = unit.modules.filter(m => selectedModuleIds.has(m.id)).length;
                                    const allSelected = selectedCount === unit.modules.length;
                                    const someSelected = selectedCount > 0 && !allSelected;

                                    return (
                                        <div
                                            key={unitKey}
                                            className={`rounded-lg border-2 transition-all ${selectedCount > 0 ? 'border-indigo-500 bg-indigo-50/30' : 'border-gray-200'
                                                }`}
                                        >
                                            <div className="p-4 flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={allSelected}
                                                            ref={input => {
                                                                if (input) input.indeterminate = someSelected;
                                                            }}
                                                            onChange={() => toggleUnitSelection(unit)}
                                                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                                        />
                                                    </div>
                                                    <div onClick={() => toggleUnitExpand(unitKey)} className="cursor-pointer">
                                                        <h4 className="font-semibold text-gray-900">{unit.unitName}</h4>
                                                        <p className="text-sm text-gray-500">{unit.subject} • {selectedCount}/{unit.modules.length} Kazanım Seçili</p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => toggleUnitExpand(unitKey)}
                                                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                                                >
                                                    <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            </div>

                                            {isExpanded && (
                                                <div className="px-4 pb-4 border-t border-gray-200 pt-4">
                                                    <div className="space-y-2 mb-4">
                                                        {unit.modules.map(module => (
                                                            <div key={module.id} className="flex items-start space-x-3 pl-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedModuleIds.has(module.id)}
                                                                    onChange={() => toggleModule(module.id)}
                                                                    className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                                />
                                                                <span className="text-sm text-gray-700">{module.title}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="pl-2 grid grid-cols-2 gap-6 bg-white p-4 rounded-lg border border-gray-100">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Soru Sayısı (Bu ünite için)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="20"
                                                                value={unit.questionCount}
                                                                onChange={(e) => updateUnitConfig(index, 'questionCount', parseInt(e.target.value))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Zorluk Seviyesi (1-5)
                                                            </label>
                                                            <input
                                                                type="range"
                                                                min="1"
                                                                max="5"
                                                                value={unit.difficulty}
                                                                onChange={(e) => updateUnitConfig(index, 'difficulty', parseInt(e.target.value))}
                                                                className="w-full"
                                                            />
                                                            <div className="flex justify-between text-xs text-gray-500">
                                                                <span>Kolay</span>
                                                                <span>Zor</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                Seçilen kriterlere uygun ünite bulunamadı.
                            </div>
                        )}
                    </div>
                )}

                {/* Generate Button */}
                <div className="pt-6 border-t border-gray-200">
                    <button
                        onClick={handleGenerateQuestions}
                        disabled={isGenerating || selectedModuleIds.size === 0 || !title}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Sorular Üretiliyor...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>AI ile Soru Üret</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateDiagnosisTestPage;
