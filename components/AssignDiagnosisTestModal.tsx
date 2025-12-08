import React, { useState, useEffect } from 'react';
import { supabase } from '../services/dbAdapter';
import { Student } from '../types';
import { diagnosisTestManagementService } from '../services/diagnosisTestManagementService';

interface AssignDiagnosisTestModalProps {
    teacherId: string;
    testId: string;
    testTitle: string;
    onClose: () => void;
    onAssigned: () => void;
}

const AssignDiagnosisTestModal: React.FC<AssignDiagnosisTestModalProps> = ({
    teacherId,
    testId,
    testTitle,
    onClose,
    onAssigned
}) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [dueDate, setDueDate] = useState<string>('');
    const [isMandatory, setIsMandatory] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadStudents();
    }, [teacherId]);

    const loadStudents = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('tutor_id', teacherId);

            if (error) throw error;

            setStudents(data || []);
        } catch (err: any) {
            console.error('Error loading students:', err);
            setError('Öğrenciler yüklenirken hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStudent = (studentId: string) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
    };

    const toggleAll = () => {
        if (selectedStudents.size === students.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(students.filter(s => s && s.id).map(s => s.id)));
        }
    };

    const handleAssign = async () => {
        if (selectedStudents.size === 0) {
            setError('Lütfen en az bir öğrenci seçin');
            return;
        }

        setIsAssigning(true);
        setError(null);

        try {
            await diagnosisTestManagementService.assignTest({
                testId,
                studentIds: Array.from(selectedStudents),
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                isMandatory
            }, teacherId);

            onAssigned();
            onClose();
            alert('Test başarıyla atandı!');
        } catch (err: any) {
            console.error('Error assigning test:', err);
            setError(err.message || 'Test atanırken hata oluştu');
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Test Ata: {testTitle}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Son Tarih (Opsiyonel)</label>
                            <input
                                type="datetime-local"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div className="flex items-center pt-6">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isMandatory}
                                    onChange={(e) => setIsMandatory(e.target.checked)}
                                    className="w-5 h-5 text-primary rounded focus:ring-primary"
                                />
                                <span className="text-gray-700 font-medium">Zorunlu Test</span>
                            </label>
                        </div>
                    </div>

                    <div className="mb-4 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">Öğrenciler ({selectedStudents.size} seçili)</h3>
                        <button
                            onClick={toggleAll}
                            className="text-sm text-primary hover:text-primary-dark font-medium"
                        >
                            {selectedStudents.size === students.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : students.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Kayıtlı öğrenci bulunamadı.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {students.filter(s => s && s.id).map(student => (
                                <div
                                    key={student.id}
                                    onClick={() => toggleStudent(student.id)}
                                    className={`p-3 border rounded-lg cursor-pointer transition-colors flex items-center space-x-3 ${selectedStudents.has(student.id)
                                        ? 'border-primary bg-blue-50'
                                        : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedStudents.has(student.id)
                                        ? 'bg-primary border-primary text-white'
                                        : 'border-gray-300 bg-white'
                                        }`}>
                                        {selectedStudents.has(student.id) && (
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-800">{student.name}</div>
                                        <div className="text-xs text-gray-500">{student.grade === 4 ? 'İlkokul' : `${student.grade}. Sınıf`}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={isAssigning || selectedStudents.size === 0}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium disabled:opacity-50 flex items-center space-x-2"
                    >
                        {isAssigning ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Atanıyor...</span>
                            </>
                        ) : (
                            <span>Testi Ata</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignDiagnosisTestModal;
