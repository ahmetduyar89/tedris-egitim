import React, { useState, useEffect } from 'react';
import { diagnosisTestManagementService } from '../services/diagnosisTestManagementService';
import { DiagnosisTest } from '../types/diagnosisTestTypes';

interface SelectDiagnosisTestModalProps {
    teacherId: string;
    studentId: string;
    onClose: () => void;
    onAssigned: () => void;
}

const SelectDiagnosisTestModal: React.FC<SelectDiagnosisTestModalProps> = ({
    teacherId,
    studentId,
    onClose,
    onAssigned
}) => {
    const [tests, setTests] = useState<DiagnosisTest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTests();
    }, [teacherId]);

    const loadTests = async () => {
        try {
            setIsLoading(true);
            const data = await diagnosisTestManagementService.getTeacherTests(teacherId);
            setTests(data);
        } catch (err) {
            console.error('Error loading tests:', err);
            setError('Testler yüklenirken hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssign = async (testId: string) => {
        setIsAssigning(true);
        setError(null);
        try {
            await diagnosisTestManagementService.assignTest({
                testId,
                studentIds: [studentId],
                isMandatory: true,
                whatsappWindow: window.open('', '_blank') || undefined
            }, teacherId);
            
            onAssigned();
            onClose();
        } catch (err: any) {
            console.error('Error assigning test:', err);
            setError(err.message || 'Test atanırken hata oluştu');
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Tanı Testi Seç</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        </div>
                    ) : tests.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-4">📝</div>
                            <p className="text-gray-500 font-medium">Henüz bir tanı testi oluşturmamışsınız.</p>
                            <p className="text-sm text-gray-400 mt-2">Öncelikle "Tanı Testleri" sayfasından bir test oluşturmalısınız.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tests.map(test => (
                                <button
                                    key={test.id}
                                    onClick={() => handleAssign(test.id)}
                                    disabled={isAssigning}
                                    className="w-full p-4 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left flex justify-between items-center group disabled:opacity-50"
                                >
                                    <div>
                                        <div className="font-bold text-gray-800 group-hover:text-blue-700">{test.title}</div>
                                        <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                                            <span>📚 {test.subject}</span>
                                            <span>⏱️ {test.durationMinutes} dk</span>
                                            <span>❓ {test.totalQuestions} Soru</span>
                                        </div>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Vazgeç
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectDiagnosisTestModal;
