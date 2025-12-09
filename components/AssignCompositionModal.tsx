import React, { useState } from 'react';
import { Composition, Student } from '../types';
import { assignComposition } from '../services/compositionService';

interface AssignCompositionModalProps {
    composition: Composition;
    students: Student[];
    teacherId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const AssignCompositionModal: React.FC<AssignCompositionModalProps> = ({
    composition,
    students,
    teacherId,
    onClose,
    onSuccess
}) => {
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [dueDate, setDueDate] = useState('');
    const [isMandatory, setIsMandatory] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleToggleStudent = (studentId: string) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedStudents.size === students.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(students.map(s => s.id)));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedStudents.size === 0) {
            alert('Lütfen en az bir öğrenci seçin.');
            return;
        }

        setIsSubmitting(true);
        try {
            await assignComposition(
                composition.id,
                Array.from(selectedStudents),
                teacherId,
                dueDate || undefined,
                isMandatory
            );

            alert(`Kompozisyon ${selectedStudents.size} öğrenciye başarıyla atandı!`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error assigning composition:', error);
            alert('Atama işlemi başarısız oldu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Kompozisyon Ata</h2>
                            <p className="text-sm text-gray-600 mt-1">{composition.title}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Composition Info */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="text-2xl">✍️</div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-700 mb-2">{composition.description}</p>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="px-2 py-1 bg-white rounded border border-purple-200 text-purple-700">
                                        {composition.minWordCount}-{composition.maxWordCount} kelime
                                    </span>
                                    <span className="px-2 py-1 bg-white rounded border border-purple-200 text-purple-700">
                                        Zorluk: {composition.difficultyLevel}/5
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Son Teslim Tarihi (İsteğe Bağlı)
                        </label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    {/* Mandatory */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="mandatory"
                            checked={isMandatory}
                            onChange={(e) => setIsMandatory(e.target.checked)}
                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="mandatory" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Zorunlu kompozisyon
                        </label>
                    </div>

                    {/* Student Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-semibold text-gray-700">
                                Öğrenci Seçimi ({selectedStudents.size} seçili)
                            </label>
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                            >
                                {selectedStudents.size === students.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                            </button>
                        </div>

                        <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                            {students.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    Henüz öğrenci eklenmemiş
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {students.map((student) => (
                                        <label
                                            key={student.id}
                                            className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.has(student.id)}
                                                onChange={() => handleToggleStudent(student.id)}
                                                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{student.name}</p>
                                                <p className="text-sm text-gray-500">{student.grade}. Sınıf</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                            disabled={isSubmitting}
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting || selectedStudents.size === 0}
                        >
                            {isSubmitting ? 'Atanıyor...' : `${selectedStudents.size} Öğrenciye Ata`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignCompositionModal;
