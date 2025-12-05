import React from 'react';
import { Student } from '../../types';
import LearningMap from '../LearningMap';

interface StudentAnalyticsTabProps {
    student: Student;
    onGenerateReviewPackage: (topic: string) => void;
}

const StudentAnalyticsTab: React.FC<StudentAnalyticsTabProps> = ({
    student,
    onGenerateReviewPackage
}) => {
    return (
        <div className="space-y-8">
            <LearningMap student={student} onGenerateReviewPackage={onGenerateReviewPackage} />
        </div>
    );
};

export default StudentAnalyticsTab;
