import React, { useState, useEffect } from 'react';
import * as privateLessonService from '../../services/privateLessonService';

interface UpcomingLessonsWidgetProps {
    studentId: string;
    onJoinLesson: (lesson: any) => void;
}

const UpcomingLessonsWidget: React.FC<UpcomingLessonsWidgetProps> = ({ studentId, onJoinLesson }) => {
    const [lessons, setLessons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLessons = async () => {
            try {
                const data = await privateLessonService.getStudentLessons(studentId);
                setLessons(data);
            } catch (error) {
                console.error('Error fetching lessons:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLessons();

        // Refresh every minute to update "Join" button status
        const interval = setInterval(fetchLessons, 60000);
        return () => clearInterval(interval);
    }, [studentId]);

    if (loading || lessons.length === 0) return null;

    const isLessonJoinable = (lesson: any) => {
        return lesson.status === 'started' && lesson.type === 'online';
    };

    const handleJoinClick = (lesson: any) => {
        onJoinLesson(lesson);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-red-500 to-rose-600 text-white flex items-center gap-2">
                <span className="bg-white/20 p-1.5 rounded-lg text-white backdrop-blur-sm">📅</span>
                <h3 className="text-lg font-bold">Yaklaşan Dersler</h3>
            </div>

            <div className="p-4 space-y-3">
                {lessons.map((lesson) => {
                    const startTime = new Date(lesson.start_time);
                    const joinable = isLessonJoinable(lesson);

                    return (
                        <div key={lesson.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:border-red-200 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="flex flex-col items-center justify-center bg-gray-50 w-12 h-12 rounded-xl border border-gray-200 shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
                                    <span className="text-[10px] font-bold text-red-500 uppercase">{startTime.toLocaleDateString('tr-TR', { month: 'short' })}</span>
                                    <span className="text-lg font-bold text-gray-800">{startTime.getDate()}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-gray-800 group-hover:text-red-600 transition-colors text-sm truncate">{lesson.subject}</h4>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                        {startTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            {joinable ? (
                                <button
                                    onClick={() => handleJoinClick(lesson)}
                                    className="ml-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md animate-pulse hover:scale-105 active:scale-95 flex items-center gap-1 flex-shrink-0"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                    </svg>
                                    Katıl
                                </button>
                            ) : (
                                <span className={`ml-2 text-[10px] font-bold px-2 py-1 rounded-full border flex-shrink-0 whitespace-nowrap ${lesson.status === 'completed' ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                    {lesson.status === 'completed' ? 'Tamamlandı' : 'Bekleniyor'}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UpcomingLessonsWidget;
