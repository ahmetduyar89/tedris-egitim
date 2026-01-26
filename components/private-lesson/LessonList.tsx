import React from 'react';
import { PrivateLesson } from '../../types';

interface LessonListProps {
    weekDays: Date[];
    DAYS_TR: string[];
    getLessonsForDay: (dayIdx: number) => PrivateLesson[];
    handleLessonClick: (lesson: PrivateLesson) => void;
    handleDeleteLesson: (id: string) => void;
}

const LessonList: React.FC<LessonListProps> = ({
    weekDays,
    DAYS_TR,
    getLessonsForDay,
    handleLessonClick,
    handleDeleteLesson
}) => {
    return (
        <div className="lg:hidden flex-1 overflow-auto">
            <div className="space-y-4">
                {weekDays.map((day, dayIdx) => {
                    const dayLessons = getLessonsForDay(dayIdx);
                    const isToday = day.toDateString() === new Date().toDateString();

                    return (
                        <div key={dayIdx} className={`border rounded-xl overflow-hidden ${isToday ? 'border-primary border-2 shadow-md' : 'border-gray-200'}`}>
                            <div className={`p-3 ${isToday ? 'bg-primary/10' : 'bg-gray-50'}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className={`font-bold text-sm ${isToday ? 'text-primary' : 'text-gray-700'}`}>
                                            {DAYS_TR[dayIdx]}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {day.getDate()} {day.toLocaleDateString('tr-TR', { month: 'long' })}
                                        </div>
                                    </div>
                                    {isToday && (
                                        <span className="text-xs bg-primary text-white px-2 py-1 rounded-full font-medium">
                                            Bugün
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-2">
                                {dayLessons.length > 0 ? (
                                    <div className="space-y-2">
                                        {dayLessons.map(lesson => {
                                            const startTime = new Date(lesson.startTime);
                                            const endTime = new Date(lesson.endTime);
                                            const duration = lesson.duration || 60;

                                            return (
                                                <div
                                                    key={lesson.id}
                                                    className="rounded-lg p-3 relative group cursor-pointer hover:shadow-md transition-shadow"
                                                    style={{ backgroundColor: lesson.color || '#FFB6C1' }}
                                                    onClick={() => handleLessonClick(lesson)}
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteLesson(lesson.id);
                                                        }}
                                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-20"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>

                                                    <div className="flex items-start justify-between pr-8">
                                                        <div className="flex-1">
                                                            <div className="font-bold text-base text-gray-900 mb-1">
                                                                {lesson.studentName}
                                                            </div>
                                                            <div className="text-sm text-gray-700 mb-1">
                                                                {lesson.subject}
                                                            </div>
                                                            <div className="flex items-center space-x-3 text-xs text-gray-600">
                                                                <span className="flex items-center">
                                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    {startTime.getHours().toString().padStart(2, '0')}:{startTime.getMinutes().toString().padStart(2, '0')} - {endTime.getHours().toString().padStart(2, '0')}:{endTime.getMinutes().toString().padStart(2, '0')}
                                                                </span>
                                                                <span>•</span>
                                                                <span>{duration} dk</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-gray-400 text-sm">
                                        Ders yok
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LessonList;
