import React, { useState } from 'react';
import { User, Student } from '../types';
import TurkishLearningPage from './TurkishLearningPage';
import MathematicsLearningSection from '../components/MathematicsLearningSection';
import ScienceLearningSection from '../components/ScienceLearningSection';

interface SubjectLearningPageProps {
    user: User;
    students: Student[];
}

type SubjectTab = 'turkish' | 'mathematics' | 'science';

const SubjectLearningPage: React.FC<SubjectLearningPageProps> = ({ user, students }) => {
    const [activeTab, setActiveTab] = useState<SubjectTab>('turkish');

    const tabs = [
        {
            id: 'turkish' as SubjectTab,
            label: 'Türkçe Öğrenimi',
            icon: '📚',
            color: 'purple'
        },
        {
            id: 'mathematics' as SubjectTab,
            label: 'Matematik Öğrenimi',
            icon: '🔢',
            color: 'blue'
        },
        {
            id: 'science' as SubjectTab,
            label: 'Fen Bilimleri Öğrenimi',
            icon: '🔬',
            color: 'green'
        }
    ];

    const getTabColorClasses = (tabId: SubjectTab, isActive: boolean) => {
        const colors = {
            turkish: {
                active: 'border-purple-500 text-purple-700 bg-purple-50',
                inactive: 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'
            },
            mathematics: {
                active: 'border-blue-500 text-blue-700 bg-blue-50',
                inactive: 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
            },
            science: {
                active: 'border-green-500 text-green-700 bg-green-50',
                inactive: 'text-gray-600 hover:text-green-700 hover:bg-green-50'
            }
        };

        return isActive ? colors[tabId].active : colors[tabId].inactive;
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'turkish':
                return <TurkishLearningPage user={user} students={students} />;
            case 'mathematics':
                return <MathematicsLearningSection />;
            case 'science':
                return <ScienceLearningSection />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                        Branş Çalışmaları
                    </h1>
                    <p className="text-sm md:text-base text-gray-600">
                        Farklı branşlar için öğrenme materyallerinizi yönetin
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="flex overflow-x-auto scrollbar-hide -mb-px">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 
                                    font-semibold text-sm md:text-base whitespace-nowrap
                                    border-b-2 transition-all duration-200
                                    ${getTabColorClasses(tab.id, activeTab === tab.id)}
                                    ${activeTab === tab.id ? 'border-b-2' : 'border-transparent'}
                                `}
                            >
                                <span className="text-xl md:text-2xl">{tab.icon}</span>
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="transition-all duration-300">
                {renderContent()}
            </div>
        </div>
    );
};

export default SubjectLearningPage;
