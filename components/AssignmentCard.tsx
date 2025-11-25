import React from 'react';
import { Assignment, AssignmentStatus, Submission } from '../types';

interface AssignmentCardProps {
    assignment: Assignment;
    onGrade?: (submission: Submission) => void;
    onOpen?: (assignment: Assignment) => void;
    onEdit?: () => void;
}

const statusConfig: { [key in AssignmentStatus]: { color: string, text: string } } = {
    [AssignmentStatus.Pending]: { color: 'bg-yellow-100 text-yellow-800', text: 'Bekliyor' },
    [AssignmentStatus.Submitted]: { color: 'bg-indigo-100 text-primary', text: 'Teslim Edildi' },
    [AssignmentStatus.Graded]: { color: 'bg-green-100 text-success', text: 'Değerlendirildi' },
    [AssignmentStatus.Late]: { color: 'bg-red-100 text-error', text: 'Gecikti' },
};

const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment, onGrade, onOpen, onEdit }) => {
    console.log('[AssignmentCard] Rendering assignment:', assignment.title, 'Has submission:', !!assignment.submission);
    if (assignment.submission) {
        console.log('[AssignmentCard] Submission details:', assignment.submission);
    }

    const status = assignment.submission?.status || AssignmentStatus.Pending;
    console.log('[AssignmentCard] Status:', status, 'Expected Submitted:', AssignmentStatus.Submitted, 'Expected Graded:', AssignmentStatus.Graded);

    const config = statusConfig[status];
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

    return (
        <div className="bg-card-background p-4 rounded-xl shadow-md flex flex-col justify-between h-full relative">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${config.color}`}>{config.text}</span>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-text-secondary">Teslim: {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}</span>
                        {isTeacherView && onEdit && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit();
                                }}
                                className="text-gray-500 hover:text-primary transition-colors"
                                title="Düzenle"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
                <h3 className="font-bold font-poppins text-text-primary">{assignment.title}</h3>
                <p className="text-sm text-text-secondary mt-1">{assignment.subject}</p>
                {assignment.contentType && (
                    <div className="flex items-center mt-2 text-xs text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        <span className="font-medium">{assignment.contentType.toUpperCase()} içerik ekli</span>
                    </div>
                )}
            </div>
            <div className="mt-4">
                {actionText && (
                    <button
                        onClick={handleClick}
                        className="w-full bg-primary text-white py-2 rounded-lg font-semibold text-sm hover:bg-primary-dark transition-colors"
                    >
                        {actionText}
                    </button>
                )}
                {status === AssignmentStatus.Graded && score !== null && (
                    <div className="text-center mt-2 font-bold font-poppins text-lg text-success">
                        Puan: {score}%
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssignmentCard;