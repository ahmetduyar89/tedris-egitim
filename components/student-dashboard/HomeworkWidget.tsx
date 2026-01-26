import React from 'react';
import { Assignment } from '../../types';

interface HomeworkWidgetProps {
    assignments: Assignment[];
    onOpenAssignment: (assignment: Assignment) => void;
}

const HomeworkWidget: React.FC<HomeworkWidgetProps> = ({ assignments, onOpenAssignment }) => {
    const unviewedOrIncomplete = assignments.filter(a => !a.viewedByStudent || !a.submission);
    const displayAssignments = unviewedOrIncomplete.slice(0, 3);

    if (displayAssignments.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white flex items-center gap-2">
                <span className="bg-white/20 p-1.5 rounded-lg text-white backdrop-blur-sm">📚</span>
                <h2 className="text-lg font-bold">Ödevler</h2>
            </div>

            <div className="p-4 space-y-3">
                {displayAssignments.map(assignment => {
                    const isNew = !assignment.viewedByStudent;

                    return (
                        <div
                            key={assignment.id}
                            onClick={() => onOpenAssignment(assignment)}
                            className="p-3 rounded-xl bg-white border border-gray-100 hover:border-violet-200 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0 pr-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-sm font-bold text-gray-800 truncate group-hover:text-violet-600 transition-colors">
                                            {assignment.title}
                                        </h4>
                                        {isNew && (
                                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm animate-pulse flex-shrink-0">
                                                YENİ
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium truncate">
                                        {assignment.subject} · {new Date(assignment.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-1.5 rounded-full group-hover:bg-violet-50 transition-colors flex-shrink-0">
                                    <svg className="w-4 h-4 text-gray-400 group-hover:text-violet-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {unviewedOrIncomplete.length > 3 && (
                <div className="pb-3 text-center">
                    <button className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors">
                        +{unviewedOrIncomplete.length - 3} ödev daha
                    </button>
                </div>
            )}
        </div>
    );
};

export default HomeworkWidget;
