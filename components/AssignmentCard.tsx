import React from 'react';
import { Assignment, AssignmentStatus, Submission } from '../types';

interface AssignmentCardProps {
    assignment: Assignment;
    onGrade?: (submission: Submission) => void;
    onOpen?: (assignment: Assignment) => void;
    onEdit?: () => void;
}

const statusConfig: { [key in AssignmentStatus]: { color: string, text: string, borderColor: string, bgColor: string } } = {
    [AssignmentStatus.Pending]: {
        color: 'bg-yellow-100 text-yellow-800',
        text: 'Bekliyor',
        borderColor: 'border-l-yellow-400',
        bgColor: 'bg-yellow-50/50'
    },
    [AssignmentStatus.Submitted]: {
        color: 'bg-indigo-100 text-indigo-800',
        text: 'Teslim Edildi',
        borderColor: 'border-l-indigo-400',
        bgColor: 'bg-indigo-50/50'
    },
    [AssignmentStatus.Graded]: {
        color: 'bg-green-100 text-green-800',
        text: 'Değerlendirildi',
        borderColor: 'border-l-green-400',
        bgColor: 'bg-green-50/50'
    },
    [AssignmentStatus.Late]: {
        color: 'bg-red-100 text-red-800',
        text: 'Gecikti',
        borderColor: 'border-l-red-400',
        bgColor: 'bg-red-50/50'
    },
};

const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment, onGrade, onOpen, onEdit }) => {
    const status = assignment.submission?.status || AssignmentStatus.Pending;

    // Check if overdue
    let displayStatus = status;
    if (status === AssignmentStatus.Pending && new Date(assignment.dueDate) < new Date()) {
        displayStatus = AssignmentStatus.Late;
    }

    const config = statusConfig[displayStatus];
    const isTeacherView = !!onGrade;

    const score = assignment.submission?.teacherScore !== undefined && assignment.submission?.teacherScore !== null
        ? assignment.submission.teacherScore
        : (assignment.submission?.aiScore !== undefined && assignment.submission?.aiScore !== null
            ? assignment.submission.aiScore
            : null);

    const handleClick = () => {
        if (isTeacherView) {
            if (assignment.submission && (status === AssignmentStatus.Submitted || status === AssignmentStatus.Graded)) {
                onGrade(assignment.submission);
            }
        } else if (onOpen) {
            onOpen(assignment);
        }
    };

    const getActionText = () => {
        if (isTeacherView) {
            if (status === AssignmentStatus.Submitted) return "Değerlendir";
            if (status === AssignmentStatus.Graded) return "Görüntüle";
            return null;
        } else {
            if (status === AssignmentStatus.Pending) return "Ödevi Yap";
            return "Görüntüle";
        }
    };

    const actionText = getActionText();
    const dueDate = new Date(assignment.dueDate);
    const isOverdue = new Date() > dueDate && status === AssignmentStatus.Pending;

    return (
        <div className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full relative overflow-hidden border border-gray-100 border-l-4 ${config.borderColor}`}>
            <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${config.color}`}>
                        {config.text}
                    </span>
                    {isTeacherView && onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                            className="text-gray-400 hover:text-primary transition-colors p-1"
                            title="Düzenle"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                        </button>
                    )}
                </div>

                <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-2 leading-tight">{assignment.title}</h3>
                <p className="text-sm text-gray-500 font-medium mb-3">{assignment.subject}</p>

                <div className={`flex items-center text-xs ${isOverdue ? 'text-red-500 font-bold' : 'text-gray-500'} bg-gray-50 p-2 rounded-lg`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                    <span>Son Teslim: {dueDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {assignment.contentType && (
                    <div className="flex items-center mt-3 text-xs text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        <span className="font-medium">{assignment.contentType.toUpperCase()} içerik ekli</span>
                    </div>
                )}
            </div>

            <div className="p-4 pt-0 mt-auto">
                {actionText && (
                    <button
                        onClick={handleClick}
                        className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center ${isTeacherView
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-primary text-white hover:bg-primary-dark shadow-md hover:shadow-lg'
                            }`}
                    >
                        {actionText}
                        {!isTeacherView && (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        )}
                    </button>
                )}

                {status === AssignmentStatus.Graded && score !== null && (
                    <div className="mt-2 flex items-center justify-center space-x-2 bg-green-50 p-2 rounded-lg border border-green-100">
                        <span className="text-sm font-medium text-green-700">Puan:</span>
                        <span className="text-lg font-bold text-green-600">{score}</span>
                    </div>
                )}

                {status === AssignmentStatus.Graded && !isTeacherView && assignment.submission?.teacherFeedback && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <p className="text-xs font-semibold text-blue-800 mb-1">Öğretmen Geri Bildirimi:</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{assignment.submission.teacherFeedback}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssignmentCard;