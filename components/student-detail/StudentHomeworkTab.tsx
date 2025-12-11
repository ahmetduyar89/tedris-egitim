import React from 'react';
import { Assignment, Submission } from '../../types';
import AssignmentCard from '../AssignmentCard';

interface StudentHomeworkTabProps {
    assignments: Assignment[];
    onGrade: (submission: Submission) => void;
    onEdit: (assignment: Assignment) => void;
    onCreateAssignment: () => void;
}

const StudentHomeworkTab: React.FC<StudentHomeworkTabProps> = ({
    assignments,
    onGrade,
    onEdit,
    onCreateAssignment
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <h3 className="text-lg md:text-xl font-bold font-poppins text-white flex items-center gap-2">
                    <span className="bg-white/20 p-1.5 rounded-lg text-white">📚</span>
                    Ödevler
                </h3>
                <button
                    onClick={onCreateAssignment}
                    className="bg-white text-violet-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-violet-50 transition-colors whitespace-nowrap"
                >
                    + Yeni Ödev
                </button>
            </div>
            <div className="p-4 md:p-6">
                {assignments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {assignments.map(assignment => (
                            <AssignmentCard
                                key={assignment.id}
                                assignment={assignment}
                                onGrade={onGrade}
                                onEdit={() => onEdit(assignment)}
                            />
                        ))}
                    </div>
                ) : <p className="text-gray-500 text-center py-4">Bu öğrenciye henüz bir ödev atanmamış.</p>}
            </div>
        </div>
    );
};

export default StudentHomeworkTab;
