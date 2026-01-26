import React from 'react';

interface ConfirmDeleteModalProps {
    studentName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ studentName, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-2xl font-bold font-poppins mb-2 text-center text-gray-800">Öğrenciyi Sil</h2>
            <p className="text-gray-600 text-center mb-8">
                <span className="font-bold text-gray-900">{studentName}</span> adlı öğrenciyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve öğrencinin tüm verileri silinecektir.
            </p>
            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 font-medium transition-colors">
                    İptal
                </button>
                <button onClick={onConfirm} className="flex-1 bg-red-600 text-white px-4 py-3 rounded-xl hover:bg-red-700 font-medium transition-colors shadow-lg shadow-red-200">
                    Evet, Sil
                </button>
            </div>
        </div>
    </div>
);

export default ConfirmDeleteModal;
