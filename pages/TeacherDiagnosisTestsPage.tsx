import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { diagnosisTestManagementService } from '../services/diagnosisTestManagementService';
import { DiagnosisTest } from '../types/diagnosisTestTypes';
import CreateDiagnosisTestPage from './CreateDiagnosisTestPage';
import AssignDiagnosisTestModal from '../components/AssignDiagnosisTestModal';

import DiagnosisTestResultsView from '../components/DiagnosisTestResultsView';

interface TeacherDiagnosisTestsPageProps {
    user: User;
    onBack: () => void;
}

const TeacherDiagnosisTestsPage: React.FC<TeacherDiagnosisTestsPageProps> = ({ user, onBack }) => {
    const [view, setView] = useState<'list' | 'create' | 'results'>('list');
    const [tests, setTests] = useState<DiagnosisTest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [assignModalData, setAssignModalData] = useState<{ id: string; title: string } | null>(null);
    const [selectedTest, setSelectedTest] = useState<DiagnosisTest | null>(null);

    useEffect(() => {
        if (view === 'list') {
            loadTests();
        }
    }, [view]);

    const loadTests = async () => {
        try {
            setIsLoading(true);
            const data = await diagnosisTestManagementService.getTeacherTests(user.id);
            setTests(data);
        } catch (error) {
            console.error('Error loading tests:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestCreated = () => {
        setView('list');
        loadTests();
    };

    const handleViewResults = (test: DiagnosisTest) => {
        setSelectedTest(test);
        setView('results');
    };

    if (view === 'create') {
        return (
            <CreateDiagnosisTestPage
                user={user}
                onBack={() => setView('list')}
                onTestCreated={handleTestCreated}
            />
        );
    }

    if (view === 'results' && selectedTest) {
        return (
            <DiagnosisTestResultsView
                test={selectedTest}
                onBack={() => {
                    setSelectedTest(null);
                    setView('list');
                }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Tanı Testleri</h1>
                        <p className="text-gray-600 mt-1">
                            Öğrencilerinizin seviyesini belirlemek için yapay zeka destekli testler oluşturun
                        </p>
                    </div>
                    <button
                        onClick={() => setView('create')}
                        className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        <span className="text-xl">+</span>
                        <span>Yeni Test Oluştur</span>
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : tests.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">📝</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Henüz Test Oluşturmadınız</h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            Öğrencilerinizin eksiklerini belirlemek ve kişiselleştirilmiş çalışma planları oluşturmak için ilk tanı testinizi oluşturun.
                        </p>
                        <button
                            onClick={() => setView('create')}
                            className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                        >
                            İlk Testi Oluştur
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tests.map(test => (
                            <div key={test.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden flex flex-col">
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide">
                                            {test.subject}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {new Date(test.createdAt).toLocaleDateString('tr-TR')}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                                        {test.title}
                                    </h3>

                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                        {test.description || 'Açıklama yok'}
                                    </p>

                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <span className="mr-1">📚</span>
                                            {test.grade}. Sınıf
                                        </div>
                                        <div className="flex items-center">
                                            <span className="mr-1">❓</span>
                                            {test.totalQuestions} Soru
                                        </div>
                                        <div className="flex items-center">
                                            <span className="mr-1">⏱️</span>
                                            {test.durationMinutes} dk
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                                    <button
                                        onClick={() => setAssignModalData({ id: test.id, title: test.title })}
                                        className="text-primary font-semibold hover:text-primary-dark text-sm flex items-center"
                                    >
                                        <span>Öğrenciye Ata</span>
                                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </button>

                                    <button
                                        onClick={() => handleViewResults(test)}
                                        className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center"
                                    >
                                        <span>Sonuçlar</span>
                                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {assignModalData && (
                <AssignDiagnosisTestModal
                    teacherId={user.id}
                    testId={assignModalData.id}
                    testTitle={assignModalData.title}
                    onClose={() => setAssignModalData(null)}
                    onAssigned={() => {
                        // Opsiyonel: Atama sonrası bir şeyler yapılabilir
                    }}
                />
            )}
        </div>
    );
};

export default TeacherDiagnosisTestsPage;
