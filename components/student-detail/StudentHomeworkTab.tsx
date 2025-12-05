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
        <div className="bg-card-background p-4 md:p-6 rounded-xl shadow-md">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                <h3 className="text-lg md:text-xl font-bold font-poppins text-text-primary">Ödevler</h3>
                <button onClick={onCreateAssignment} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap">+ Yeni Ödev</button>
            </div>
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
    );
};

export default StudentHomeworkTab;
