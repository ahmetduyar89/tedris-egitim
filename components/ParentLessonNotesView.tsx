import React, { useState } from 'react';
import { Parent, Student, PrivateLesson } from '../types';
import * as parentService from '../services/parentService';

interface ParentLessonNotesViewProps {
    student: Student;
}

const ParentLessonNotesView: React.FC<ParentLessonNotesViewProps> = ({ student }) => {
    const [lessons, setLessons] = useState<PrivateLesson[]>([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchLessons = async () => {
            try {
                setLoading(true);
                const data = await parentService.getStudentLessonNotes(student.id);
                setLessons(data);
            } catch (error) {
                console.error('Error fetching lesson notes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLessons();
    }, [student.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (lessons.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Henüz Tamamlanmış Ders Yok
                </h3>
                <p className="text-gray-500">
                    Dersler tamamlandıkça burada görüntülenecektir.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                    📖 Ders Notları
                </h2>
                <span className="text-sm text-gray-500">
                    {lessons.length} ders tamamlandı
                </span>
            </div>

            <div className="space-y-3">
                {lessons.map((lesson) => {
                    const lessonDate = new Date(lesson.startTime);
                    const formattedDate = lessonDate.toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    });
                    const formattedTime = lessonDate.toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    return (
                        <div
                            key={lesson.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            {/* Başlık */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg font-semibold text-gray-800">
                                            {lesson.subject}
                                        </span>
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                            Tamamlandı
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            📅 {formattedDate}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            🕐 {formattedTime}
                                        </span>
                                        {lesson.duration && (
                                            <span className="flex items-center gap-1">
                                                ⏱️ {lesson.duration} dk
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* İşlenen Konu */}
                            {lesson.topic && (
                                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <div className="flex items-start gap-2">
                                        <span className="text-blue-600 font-semibold text-sm">
                                            📖 İşlenen Konu:
                                        </span>
                                        <span className="text-gray-700 text-sm flex-1">
                                            {lesson.topic}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Ders Notları */}
                            {lesson.lessonNotes && (
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-start gap-2">
                                        <span className="text-gray-600 font-semibold text-sm whitespace-nowrap">
                                            📝 Ders Notları:
                                        </span>
                                        <div className="text-gray-700 text-sm flex-1 whitespace-pre-wrap">
                                            {lesson.lessonNotes}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Eğer ne konu ne de not varsa */}
                            {!lesson.topic && !lesson.lessonNotes && (
                                <div className="text-center py-2 text-gray-400 text-sm">
                                    Bu ders için henüz not eklenmemiş
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ParentLessonNotesView;
