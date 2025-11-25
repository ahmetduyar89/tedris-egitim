import React, { useState } from 'react';
import { Assignment, Subject } from '../types';

interface EditAssignmentModalProps {
    assignment: Assignment;
    onClose: () => void;
    onSave: (assignment: Assignment) => void;
    onDelete: (assignmentId: string) => void;
}

const EditAssignmentModal: React.FC<EditAssignmentModalProps> = ({ assignment, onClose, onSave, onDelete }) => {
    const [title, setTitle] = useState(assignment.title);
    const [description, setDescription] = useState(assignment.description);
    const [subject, setSubject] = useState<Subject>(assignment.subject);
    const [dueDate, setDueDate] = useState(assignment.dueDate.split('T')[0]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedAssignment: Assignment = {
            ...assignment,
            title,
            description,
            subject,
            dueDate: new Date(dueDate).toISOString(),
        };
        onSave(updatedAssignment);
    };

    const handleDelete = () => {
        onDelete(assignment.id);
    };

    if (showDeleteConfirm) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
                    <h2 className="text-2xl font-bold text-error mb-4">Ödevi Sil</h2>
                    <p className="text-gray-700 mb-6">
                        <strong>{assignment.title}</strong> ödevini silmek istediğinizden emin misiniz?
                        {assignment.submission && (
                            <span className="block mt-2 text-orange-600 font-semibold">
                                ⚠️ Bu ödevin teslim edilmiş bir cevabı var!
                            </span>
                        )}
                    </p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleDelete}
                            className="bg-error text-white px-4 py-2 rounded-xl hover:bg-red-700"
                        >
                            Evet, Sil
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Ödevi Düzenle</h2>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-error hover:text-red-700 font-semibold text-sm flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                        Sil
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Ödev Başlığı</label>
                        <input
                            type="text"
                            placeholder="Ödev Başlığı"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Açıklama</label>
                        <textarea
                            placeholder="Açıklama"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                            rows={4}
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Konu</label>
                            <select
                                value={subject}
                                onChange={e => setSubject(e.target.value as Subject)}
                                className="w-full p-2 border rounded-lg"
                            >
                                {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Son Tarih</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                required
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                    </div>
                    {assignment.submission && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                            ℹ️ Bu ödev öğrenci tarafından teslim edilmiş. Değişiklikler öğrenciye yansıyacak.
                        </div>
                    )}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-dark"
                        >
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditAssignmentModal;
