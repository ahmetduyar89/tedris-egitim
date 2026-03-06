import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Sil',
    cancelText = 'İptal',
    onConfirm,
    onCancel,
    type = 'danger'
}) => {
    if (!isOpen) return null;

    const bgColor = type === 'danger' ? 'bg-red-100' : type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100';
    const textColor = type === 'danger' ? 'text-red-600' : type === 'warning' ? 'text-yellow-600' : 'text-blue-600';
    const btnColor = type === 'danger' ? 'bg-error hover:bg-red-700 shadow-red-200' : type === 'warning' ? 'bg-warning hover:bg-yellow-600 shadow-yellow-200' : 'bg-primary hover:bg-primary-dark shadow-indigo-200';

    const Icon = () => {
        if (type === 'danger') {
            return (
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            );
        }
        if (type === 'warning') {
            return (
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            );
        }
        return (
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
                <div className={`flex items-center justify-center w-16 h-16 ${bgColor} rounded-full mx-auto mb-4`}>
                    <Icon />
                </div>
                <h2 className="text-2xl font-bold font-poppins mb-2 text-center text-gray-800">{title}</h2>
                <div className="text-gray-600 text-center mb-8 whitespace-pre-wrap">
                    {message}
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 ${btnColor} text-white px-4 py-3 rounded-xl font-medium transition-all shadow-lg active:scale-95`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
