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

    // Helper to distribute specific number of questions for a subject
    const distributeQuestions = (subject: string, count: number, difficulty: number) => {
        // 1. Find all units and modules for this subject
        const subjectUnits = units.filter(u => u.subject === subject);

        // 2. Clear current selection for this subject
        const allSubjectModuleIds = subjectUnits.flatMap(u => u.modules.map(m => m.id));
        const newSelectedModuleIds = new Set(selectedModuleIds);
        allSubjectModuleIds.forEach(id => newSelectedModuleIds.delete(id));

        // 3. Select modules logic
        // We want to pick 'count' modules randomly if count <= total modules
        // If count > total modules, we select all and increase questions per unit

        const allModules = subjectUnits.flatMap(u => u.modules);
        const shuffledModules = [...allModules].sort(() => 0.5 - Math.random());

        let questionsPerUnit = 1;
        let selectedModulesForDistribution: KGModule[] = [];

        if (count <= allModules.length) {
            // Select random 'count' modules
            selectedModulesForDistribution = shuffledModules.slice(0, count);
        } else {
            // Select all modules
            selectedModulesForDistribution = allModules;
            // Rough estimate for questions per unit (limitation: can't specify per module)
            questionsPerUnit = Math.max(1, Math.round(count / allModules.length));
        }

        // 4. Update selections
        selectedModulesForDistribution.forEach(m => newSelectedModuleIds.add(m.id));
        setSelectedModuleIds(newSelectedModuleIds);

        // 5. Update Unit Configs (Count & Difficulty)
        const newUnits = units.map(u => {
            if (u.subject === subject) {
                return {
                    ...u,
                    difficulty: difficulty,
                    questionCount: questionsPerUnit
                };
            }
            return u;
        });
        setUnits(newUnits);
    };

    // Store subject-level counts locally for the inputs
    const [subjectConfigs, setSubjectConfigs] = useState<Record<string, { count: number, difficulty: number }>>({});

    // Initialize subject configs when units load
    useEffect(() => {
        const initialConfigs: Record<string, { count: number, difficulty: number }> = {};
        selectedSubjects.forEach(subject => {
            initialConfigs[subject] = { count: 5, difficulty: 3 }; // Default 5 questions
        });
        setSubjectConfigs(initialConfigs);
    }, [selectedSubjects.size]); // Re-init when subjects change

    // Auto-distribute when configs or units are ready (optional, but good UX)
    // Note: We avoid infinite loop by not depending on 'units' here, or doing it carefully.
    // Actually, let's explicit trigger via button or effect only on mount of step 3?
    // Better: Trigger distribution when Step 3 becomes active? 
    // For now, let's just use the inputs manual triggering or initial default.

    useEffect(() => {
        if (units.length > 0 && selectedSubjects.size > 0 && Object.keys(subjectConfigs).length > 0) {
            // Initial distribution for new subjects
            // Only distribute if no modules selected for that subject yet?
            // For simplicity, let's just let the user click "Dağıt" or do it automatically once.
            // Let's rely on the user inputting/confirming or default distribution.

            // Actually, let's distribute automatically for subjects that have 0 selected modules but have a config
            selectedSubjects.forEach(subject => {
                const hasSelection = units
                    .filter(u => u.subject === subject)
                    .some(u => u.modules.some(m => selectedModuleIds.has(m.id)));

                if (!hasSelection && subjectConfigs[subject]) {
                    distributeQuestions(subject, subjectConfigs[subject].count, subjectConfigs[subject].difficulty);
                }
            });
        }
    }, [loadingUnits, currentStep]);


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

                {/* Step 3: Subject Configuration & Unit Selection */}
                {selectedSubjects.size > 0 && (
                    <div className="animate-fade-in">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">3. Test Yapılandırması</h3>

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
                            <div className="space-y-8">
                                {Array.from(selectedSubjects).map(subject => {
                                    const subjectUnits = units.filter(u => u.subject === subject);
                                    const config = subjectConfigs[subject] || { count: 5, difficulty: 3 };

                                    return (
                                        <div key={subject} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                                <h4 className="text-lg font-bold text-gray-900 border-l-4 border-indigo-500 pl-3">{subject}</h4>

                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Soru Sayısı</label>
                                                        <div className="flex items-center">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="50"
                                                                value={config.count}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value);
                                                                    setSubjectConfigs(prev => ({ ...prev, [subject]: { ...config, count: val } }));
                                                                }}
                                                                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-bold text-indigo-700"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Zorluk</label>
                                                        <select
                                                            value={config.difficulty}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                setSubjectConfigs(prev => ({ ...prev, [subject]: { ...config, difficulty: val } }));
                                                            }}
                                                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                                        >
                                                            <option value="1">Kolay</option>
                                                            <option value="3">Orta</option>
                                                            <option value="5">Zor</option>
                                                        </select>
                                                    </div>
                                                    <button
                                                        onClick={() => distributeQuestions(subject, config.count, config.difficulty)}
                                                        className="mt-4 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 font-semibold text-sm transition-colors"
                                                    >
                                                        Uygula
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Details Accordion */}
                                            <div className="mt-4">
                                                <details className="group">
                                                    <summary className="flex items-center gap-2 cursor-pointer text-gray-500 hover:text-indigo-600 text-sm font-medium select-none">
                                                        <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                                        </svg>
                                                        <span>Detaylı Konu Seçimi ({subjectUnits.map(u => u.modules).flat().filter(m => selectedModuleIds.has(m.id)).length} Kazanım Seçili)</span>
                                                    </summary>

                                                    <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-200">
                                                        {subjectUnits.map((unit, index) => {
                                                            const unitKey = `${unit.subject}-${unit.unitName}`;
                                                            const selectedCount = unit.modules.filter(m => selectedModuleIds.has(m.id)).length;
                                                            const allSelected = selectedCount === unit.modules.length;
                                                            const someSelected = selectedCount > 0 && !allSelected;

                                                            return (
                                                                <div key={unitKey} className="bg-white rounded-lg border border-gray-200 p-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center space-x-3">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={allSelected}
                                                                                ref={input => { if (input) input.indeterminate = someSelected; }}
                                                                                onChange={() => toggleUnitSelection(unit)}
                                                                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                                            />
                                                                            <span className="text-sm font-medium text-gray-800">{unit.unitName}</span>
                                                                        </div>
                                                                        <span className="text-xs text-gray-500">{selectedCount}/{unit.modules.length}</span>
                                                                    </div>

                                                                    {selectedCount > 0 && (
                                                                        <div className="mt-2 text-xs text-gray-500 pl-7">
                                                                            Soru yoğunluğu: {unit.questionCount} (Bu üniteden seçilen kazanımlar için)
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </details>
                                            </div>
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
                                <span>AI ile Soru Üret ({Array.from(selectedSubjects).map(s => subjectConfigs[s]?.count || 0).reduce((a, b) => a + b, 0)} Soru Hedefleniyor)</span>
                            </>
                        )}
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                        * Yapay zeka seçilen kazanımlara göre soruları dağıtacaktır. Toplam soru sayısı yaklaşık olarak hedefi tutturur.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CreateDiagnosisTestPage;
