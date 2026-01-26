import React from 'react';
import { Assignment, AssignmentStatus } from '../../types';
import AssignmentCard from '../AssignmentCard';

interface HomeworkTabProps {
    assignments: Assignment[];
    onOpenAssignment: (assignment: Assignment) => void;
}

const HomeworkTab: React.FC<HomeworkTabProps> = ({ assignments, onOpenAssignment }) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const groups = {
        overdue: [] as Assignment[],
        today: [] as Assignment[],
        thisWeek: [] as Assignment[],
        upcoming: [] as Assignment[],
        completed: [] as Assignment[]
    };

    assignments.forEach(assignment => {
        // Check if completed (submitted or graded)
        if (assignment.submission && (assignment.submission.status === AssignmentStatus.Submitted || assignment.submission.status === AssignmentStatus.Graded)) {
            groups.completed.push(assignment);
            return;
        }

        const dueDate = new Date(assignment.dueDate);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

        if (dueDate < now) {
            groups.overdue.push(assignment);
        } else if (dueDateOnly.getTime() === today.getTime()) {
            groups.today.push(assignment);
        } else if (dueDateOnly > today && dueDateOnly <= nextWeek) {
            groups.thisWeek.push(assignment);
        } else {
            groups.upcoming.push(assignment);
        }
    });

    // Sort groups
    groups.overdue.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    groups.today.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    groups.thisWeek.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    groups.upcoming.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    groups.completed.sort((a, b) => new Date(b.submission!.submittedAt).getTime() - new Date(a.submission!.submittedAt).getTime());

    const hasAnyHomework = Object.values(groups).some(g => g.length > 0);

    if (!hasAnyHomework) {
        return (
            <div className="p-8 flex flex-col items-center justify-center text-center animate-fade-in">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Harika!</h3>
                <p className="text-gray-500 mt-2">Şu an için yapman gereken bir ödev bulunmuyor.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 animate-fade-in space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-800">Ödevlerim</h2>
                <div className="text-sm text-gray-500">
                    Toplam: <span className="font-bold text-primary">{assignments.length}</span>
                </div>
            </div>

            {groups.overdue.length > 0 && (
                <section>
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="w-2 h-8 bg-red-500 rounded-full"></div>
                        <h3 className="text-xl font-bold text-red-600">Gecikmiş Ödevler</h3>
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">{groups.overdue.length}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {groups.overdue.map(assignment => (
                            <AssignmentCard key={assignment.id} assignment={assignment} onOpen={onOpenAssignment} />
                        ))}
                    </div>
                </section>
            )}

            {groups.today.length > 0 && (
                <section>
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="w-2 h-8 bg-amber-500 rounded-full"></div>
                        <h3 className="text-xl font-bold text-amber-600">Bugün Son Gün</h3>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-xs font-bold">{groups.today.length}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {groups.today.map(assignment => (
                            <AssignmentCard key={assignment.id} assignment={assignment} onOpen={onOpenAssignment} />
                        ))}
                    </div>
                </section>
            )}

            {groups.thisWeek.length > 0 && (
                <section>
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                        <h3 className="text-xl font-bold text-blue-600">Bu Hafta</h3>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">{groups.thisWeek.length}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {groups.thisWeek.map(assignment => (
                            <AssignmentCard key={assignment.id} assignment={assignment} onOpen={onOpenAssignment} />
                        ))}
                    </div>
                </section>
            )}

            {groups.upcoming.length > 0 && (
                <section>
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
                        <h3 className="text-xl font-bold text-indigo-600">Gelecek Ödevler</h3>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-xs font-bold">{groups.upcoming.length}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {groups.upcoming.map(assignment => (
                            <AssignmentCard key={assignment.id} assignment={assignment} onOpen={onOpenAssignment} />
                        ))}
                    </div>
                </section>
            )}

            {groups.completed.length > 0 && (
                <section>
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="w-2 h-8 bg-green-500 rounded-full"></div>
                        <h3 className="text-xl font-bold text-green-600">Tamamlananlar</h3>
                        <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs font-bold">{groups.completed.length}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-75 hover:opacity-100 transition-opacity">
                        {groups.completed.map(assignment => (
                            <AssignmentCard key={assignment.id} assignment={assignment} onOpen={onOpenAssignment} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default HomeworkTab;
