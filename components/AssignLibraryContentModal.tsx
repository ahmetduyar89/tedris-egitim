import React, { useState } from 'react';
import { ContentLibraryItem, Student } from '../types';
import { db } from '../services/dbAdapter';

interface AssignLibraryContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    contentItem: ContentLibraryItem;
    students: Student[];
}

const AssignLibraryContentModal: React.FC<AssignLibraryContentModalProps> = ({
    isOpen,
    onClose,
    contentItem,
    students
}) => {
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const toggleStudent = (studentId: string) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedStudents.length === 0) {
            alert('Lütfen en az bir öğrenci seçin.');
            return;
        }

        setIsSubmitting(true);
        try {
            const batch = db.batch();
            const now = new Date().toISOString();

            selectedStudents.forEach(studentId => {
                const newId = crypto.randomUUID();
                const assignmentRef = db.collection('contentAssignments').doc(newId);
                batch.set(assignmentRef, {
                    studentId,
                    contentId: contentItem.id,
                    assignedAt: now,
                    viewed: false
                });
            });

            await batch.commit();
            alert('İçerik başarıyla atandı!');
            onClose();
        } catch (error) {
            console.error('Error assigning content:', error);
            alert('İçerik atanırken bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">İçerik Ata</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Content Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">Atanacak İçerik</h3>
                        <p className="text-blue-800 font-medium">{contentItem.title}</p>
                        <div className="flex gap-2 mt-2 text-sm text-blue-700">
                            <span>📚 {contentItem.subject}</span>
                            <span>•</span>
                            <span>{contentItem.grade}. Sınıf</span>
                            <span>•</span>
                            <span>{contentItem.unit}</span>
                        </div>
                    </div>

                    {/* Student Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Öğrenci Seç <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                            {students && students.length > 0 ? (
                                students.filter(s => s && s.id).map(student => (
                                    <div
                                        key={student.id}
                                        onClick={() => toggleStudent(student.id)}
                                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${selectedStudents.includes(student.id)
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedStudents.includes(student.id)
                                                    ? 'border-blue-500 bg-blue-500'
                                                    : 'border-gray-300'
                                                    }`}>
                                                    {selectedStudents.includes(student.id) && (
                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <span className="font-medium text-gray-900">{student.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-4">Öğrenci bulunamadı</p>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            {selectedStudents.length} öğrenci seçildi
                        </p>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || selectedStudents.length === 0}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Atanıyor...' : 'İçeriği Ata'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignLibraryContentModal;
