import React from 'react';
import { DiagnosisTestAssignment } from '../types/diagnosisTestTypes';

interface AssignedDiagnosisTestsModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignments: DiagnosisTestAssignment[];
    onStartTest: (assignmentId: string) => void;
}

const AssignedDiagnosisTestsModal: React.FC<AssignedDiagnosisTestsModalProps> = ({
    isOpen,
    onClose,
    assignments,
    onStartTest
}) => {
    if (!isOpen) return null;

    const mandatoryAssignments = assignments.filter(a => a.isMandatory);
    const optionalAssignments = assignments.filter(a => !a.isMandatory);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
                <div className="bg-gradient-to-r from-primary to-blue-600 p-6 text-white">
                    <h2 className="text-2xl font-bold flex items-center">
                        <span className="text-3xl mr-3">📝</span>
                        Atanan Tanı Testleri
                    </h2>
                    <p className="text-blue-100 mt-2">
                        Öğretmenin senin için seviye belirleme testleri hazırladı.
                    </p>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {mandatoryAssignments.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-red-600 font-bold text-lg mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Zorunlu Testler
                            </h3>
                            <div className="space-y-3">
                                {mandatoryAssignments.map(assignment => (
                                    <div key={assignment.id} className="bg-red-50 border border-red-100 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-lg">{assignment.test?.title}</h4>
                                            <div className="text-sm text-gray-600 mt-1 flex items-center space-x-3">
                                                <span>📚 {assignment.test?.subject}</span>
                                                <span>⏱️ {assignment.test?.durationMinutes} dk</span>
                                                <span>❓ {assignment.test?.totalQuestions} Soru</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onStartTest(assignment.id)}
                                            className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                                        >
                                            Başla
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {optionalAssignments.length > 0 && (
                        <div>
                            <h3 className="text-gray-700 font-bold text-lg mb-4">Diğer Testler</h3>
                            <div className="space-y-3">
                                {optionalAssignments.map(assignment => (
                                    <div key={assignment.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-lg">{assignment.test?.title}</h4>
                                            <div className="text-sm text-gray-600 mt-1 flex items-center space-x-3">
                                                <span>📚 {assignment.test?.subject}</span>
                                                <span>⏱️ {assignment.test?.durationMinutes} dk</span>
                                                <span>❓ {assignment.test?.totalQuestions} Soru</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onStartTest(assignment.id)}
                                            className="px-6 py-2 bg-white border-2 border-primary text-primary rounded-lg font-bold hover:bg-blue-50 transition-all"
                                        >
                                            Başla
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {assignments.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            Bekleyen test bulunmuyor. Harikasın! 🎉
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    {mandatoryAssignments.length === 0 && (
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Kapat
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssignedDiagnosisTestsModal;
