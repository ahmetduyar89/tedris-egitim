import React from 'react';
import { PrivateLesson } from '../../types';

interface CalendarGridProps {
    weekDays: Date[];
    timeRange: { start: number; end: number };
    DAYS_TR: string[];
    getLessonsForDay: (dayIdx: number) => PrivateLesson[];
    dropTarget: { day: number; hour: number } | null;
    handleDragOver: (e: React.DragEvent, dayIdx: number, hour: number) => void;
    handleDragLeave: () => void;
    handleDrop: (e: React.DragEvent, dayIdx: number, hour: number) => void;
    handleDragStart: (e: React.DragEvent, lesson: PrivateLesson) => void;
    handleDragEnd: (e: React.DragEvent) => void;
    handleLessonClick: (lesson: PrivateLesson) => void;
    handleDeleteLesson: (id: string) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
    weekDays,
    timeRange,
    DAYS_TR,
    getLessonsForDay,
    dropTarget,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragStart,
    handleDragEnd,
    handleLessonClick,
    handleDeleteLesson
}) => {
    return (
        <div className="hidden lg:block flex-1 overflow-auto">
            <div className="min-w-[1000px]">
                <div className="grid grid-cols-8 gap-2">
                    <div className="bg-gray-50 p-3 rounded-lg"></div>
                    {weekDays.map((day, idx) => (
                        <div key={idx} className={`bg-gray-50 p-3 rounded-lg text-center ${day.toDateString() === new Date().toDateString() ? 'bg-primary/10 border-2 border-primary' : ''}`}>
                            <div className="font-bold text-sm text-gray-700">{DAYS_TR[idx]}</div>
                            <div className="text-xs text-gray-500">{day.getDate()} {day.toLocaleDateString('tr-TR', { month: 'short' })}</div>
                        </div>
                    ))}

                    {Array.from({ length: timeRange.end - timeRange.start + 1 }, (_, i) => i + timeRange.start).map(hour => (
                        <React.Fragment key={hour}>
                            <div className="flex items-start justify-center pt-2 text-sm text-gray-500 font-medium">
                                {hour.toString().padStart(2, '0')}:00
                            </div>
                            {weekDays.map((_, dayIdx) => {
                                const dayLessons = getLessonsForDay(dayIdx);
                                const lessonsInHour = dayLessons.filter(lesson => {
                                    const lessonHour = new Date(lesson.startTime).getHours();
                                    return lessonHour === hour;
                                });

                                const isDropTarget = dropTarget?.day === dayIdx && dropTarget?.hour === hour;

                                return (
                                    <div
                                        key={dayIdx}
                                        className={`border rounded-lg min-h-[80px] relative transition-colors ${isDropTarget ? 'bg-blue-50 border-blue-300 border-2 border-dashed' : 'border-gray-100'}`}
                                        onDragOver={(e) => handleDragOver(e, dayIdx, hour)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, dayIdx, hour)}
                                    >
                                        {lessonsInHour.map(lesson => {
                                            const startTime = new Date(lesson.startTime);
                                            const duration = lesson.duration || 60;
                                            const startMinutes = startTime.getMinutes();
                                            const topOffset = (startMinutes / 60) * 80;
                                            const heightInPixels = (duration / 60) * 80;

                                            return (
                                                <div
                                                    key={lesson.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, lesson)}
                                                    onDragEnd={handleDragEnd}
                                                    onClick={() => handleLessonClick(lesson)}
                                                    className="absolute left-1 right-1 rounded-md p-2 text-xs shadow-sm cursor-pointer hover:shadow-md transition-all z-10 group overflow-hidden"
                                                    style={{
                                                        top: `${topOffset}px`,
                                                        height: `${heightInPixels}px`,
                                                        backgroundColor: lesson.color || '#E0F2F1',
                                                        borderLeft: `4px solid ${lesson.color ? lesson.color.replace('FF', 'CC') : '#26A69A'}`
                                                    }}
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteLesson(lesson.id);
                                                        }}
                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-20"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                    <div className="w-full h-full flex flex-col">
                                                        <div className="font-bold text-sm text-gray-800">
                                                            {startTime.getHours().toString().padStart(2, '0')}:{startTime.getMinutes().toString().padStart(2, '0')}
                                                        </div>
                                                        <div className="font-semibold text-gray-900 truncate">{lesson.studentName}</div>
                                                        <div className="text-xs text-gray-700 truncate">{lesson.subject}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CalendarGrid;
