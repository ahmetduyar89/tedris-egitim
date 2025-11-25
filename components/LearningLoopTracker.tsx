import React from 'react';
import { LearningLoopStatus } from '../types';

interface LearningLoopTrackerProps {
    status: LearningLoopStatus;
}

const LearningLoopTracker: React.FC<LearningLoopTrackerProps> = ({ status }) => {
    const stages = [
        { id: LearningLoopStatus.Initial, label: 'Başlangıç' },
        { id: LearningLoopStatus.TestAssigned, label: 'Test' },
        { id: LearningLoopStatus.AnalysisReady, label: 'Analiz' },
        { id: LearningLoopStatus.PlanGenerated, label: 'Plan' },
        { id: LearningLoopStatus.InProgress, label: 'Uygulama' },
    ];

    const currentStageIndex = stages.findIndex(s => s.id === status);

    return (
        <div className="bg-card-background p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-text-primary mb-4">Öğrenme Döngüm</h2>
            <div className="flex items-center justify-between space-x-2">
                {stages.map((stage, index) => {
                    const isCompleted = index < currentStageIndex;
                    const isActive = index === currentStageIndex;
                    return (
                        <React.Fragment key={stage.id}>
                            <div className="flex flex-col items-center text-center">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-colors duration-500
                                    ${isActive ? 'bg-primary text-white border-blue-200' : ''}
                                    ${isCompleted ? 'bg-accent text-white border-green-200' : ''}
                                    ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-500 border-gray-300' : ''}
                                `}>
                                    {isCompleted ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                        <span className="font-bold text-lg">{index + 1}</span>
                                    )}
                                </div>
                                <p className={`mt-2 text-sm font-semibold ${isActive ? 'text-primary' : 'text-gray-500'}`}>{stage.label}</p>
                            </div>
                            {index < stages.length - 1 && (
                                <div className={`flex-grow h-1 rounded-full transition-colors duration-500 ${isCompleted ? 'bg-accent' : 'bg-gray-200'}`}></div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default LearningLoopTracker;
