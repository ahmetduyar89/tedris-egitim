import React from 'react';
import { PrivateLesson } from '../../types';

interface DeleteLessonModalProps {
    lesson: PrivateLesson | null;
    onConfirm: (mode: 'single' | 'all') => void;
    onCancel: () => void;
}

const DeleteLessonModal: React.FC<DeleteLessonModalProps> = ({ lesson, onConfirm, onCancel }) => {
    if (!lesson) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Dersi Sil</h3>
                <p className="text-gray-600 mb-6">Bu dersi nasıl silmek istersiniz?</p>
                <div className="flex flex-col space-y-2">
                    <button
                        onClick={() => onConfirm('single')}
                        className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                    >
                        Sadece Bu Haftayı Sil
                    </button>
                    <button
                        onClick={() => onConfirm('all')}
                        className="w-full py-3 bg-white border-2 border-red-600 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors"
                    >
                        Tüm Programı Sil
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
                    >
                        Vazgeç
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteLessonModal;
