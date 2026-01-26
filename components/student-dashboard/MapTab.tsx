import React from 'react';
import { Student } from '../../types';
import MasteryMapVisualization from '../MasteryMapVisualization';
import AdaptivePlanDashboard from '../AdaptivePlanDashboard';
import LearningMap from '../LearningMap';
import DiagnosisTestModal from '../DiagnosisTestModal';

interface MapTabProps {
    studentId: string;
    studentData: Student | null;
    showDiagnosisModal: boolean;
    setShowDiagnosisModal: (show: boolean) => void;
}

const MapTab: React.FC<MapTabProps> = ({
    studentId,
    studentData,
    showDiagnosisModal,
    setShowDiagnosisModal
}) => (
    <div className="p-4 md:p-8 animate-fade-in space-y-8">
        <MasteryMapVisualization studentId={studentId} />
        <AdaptivePlanDashboard studentId={studentId} />
        {studentData && <LearningMap student={studentData} />}
        {showDiagnosisModal && studentData && (
            <DiagnosisTestModal
                isOpen={showDiagnosisModal}
                onClose={() => setShowDiagnosisModal(false)}
                studentId={studentId}
                subject="Matematik"
                grade={studentData.grade}
            />
        )}
    </div>
);

export default MapTab;
