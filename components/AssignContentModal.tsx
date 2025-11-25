import React, { useState } from 'react';
import { ContentLibraryItem, Student, ContentAssignment } from '../types';
import { createNotification } from '../services/notificationService';
import { db } from '../services/dbAdapter';

interface AssignContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    contentItem: ContentLibraryItem;
    students: Student[];
}

const AssignContentModal: React.FC<AssignContentModalProps> = ({ isOpen, onClose, contentItem, students }) => {
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

    const handleToggleStudent = (studentId: string) => {
        const newSelection = new Set(selectedStudentIds);
        if (newSelection.has(studentId)) {
            newSelection.delete(studentId);
        } else {
            newSelection.add(studentId);
        }
        setSelectedStudentIds(newSelection);
    };
    
    const handleAssign = async () => {
        if (selectedStudentIds.size === 0) {
            alert("Lütfen en az bir öğrenci seçin.");
            return;
        }

        try {
            const studentIdArray = Array.from(selectedStudentIds);
            const existingAssignmentsSnapshot = await db.collection('contentAssignments')
                .where('contentId', '==', contentItem.id)
                .get();

            const alreadyAssignedStudentIds = new Set(
                existingAssignmentsSnapshot.docs
                    .map((doc) => doc.data().studentId as string)
                    .filter(id => studentIdArray.includes(id))
            );

            let newAssignmentsCount = 0;

            for (const studentId of studentIdArray) {
                if (!alreadyAssignedStudentIds.has(studentId)) {
                    const newAssignment: Omit<ContentAssignment, 'id'> = {
                        studentId,
                        contentId: contentItem.id,
                        assignedAt: new Date().toISOString(),
                        viewed: false,
                    };

                    await db.collection('contentAssignments').add(newAssignment);
                    newAssignmentsCount++;

                    await createNotification(
                        studentId,
                        `'${contentItem.title}' başlıklı yeni bir materyal atandı.`,
                        'content',
                        contentItem.id
                    );
                }
            }

            if (newAssignmentsCount > 0) {
                alert(`${newAssignmentsCount} öğrenciye içerik atandı.`);
            } else {
                alert("Seçilen tüm öğrencilere bu içerik zaten atanmış.");
            }
            onClose();
        } catch (error) {
            console.error("Error assigning content:", error);
            alert("İçerik atanırken bir hata oluştu.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-2">İçerik Ata</h2>
                <p className="text-gray-600 mb-4">"{contentItem.title}"</p>

                <div className="max-h-64 overflow-y-auto border-t border-b py-2 my-4">
                    {students.length > 0 ? (
                        students.map(student => (
                            <div key={student.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg">
                                <input
                                    type="checkbox"
                                    id={`student-${student.id}`}
                                    checked={selectedStudentIds.has(student.id)}
                                    onChange={() => handleToggleStudent(student.id)}
                                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor={`student-${student.id}`} className="ml-3 text-sm font-medium text-gray-700">
                                    {student.name}
                                </label>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-4">Atanacak öğrenci bulunmuyor.</p>
                    )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <button type="button" onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded-xl">İptal</button>
                    <button onClick={handleAssign} className="bg-primary text-white px-4 py-2 rounded-xl">Ata</button>
                </div>
            </div>
        </div>
    );
};

export default AssignContentModal;