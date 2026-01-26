import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'info';
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const baseClasses = "fixed top-20 right-8 p-4 rounded-xl shadow-lg text-white font-semibold animate-fade-in-down z-50 flex items-center space-x-3";
    const typeClasses = {
        success: 'bg-success',
        info: 'bg-primary/80'
    };

    const icon = {
        success: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        info: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    };

    return (
        <div className={`${baseClasses} ${typeClasses[type]}`}>
            {icon[type]}
            <span>{message}</span>
        </div>
    );
};

export default Toast;
