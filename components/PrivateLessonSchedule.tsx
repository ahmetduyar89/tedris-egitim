import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/dbAdapter';
import { User, Student, PrivateLesson, Subject } from '../types';
import * as optimizedAIService from '../services/optimizedAIService';

interface PrivateLessonScheduleProps {
    user: User;
    students: Student[];
}

const COLORS = [
    '#FFB6C1', '#FFD4A3', '#FFF4A3', '#C1FFC1', '#A3FFD4',
    '#A3E4FF', '#C1D4FF', '#D4C1FF', '#FFC1FF', '#FFC1D4',
    '#E6C1FF', '#FFC1E6', '#FFD1DC', '#FFE1CC'
];

const DAYS_TR = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const DURATION_OPTIONS = [30, 45, 60, 90, 120]; // Realistic lesson durations

const PrivateLessonSchedule: React.FC<PrivateLessonScheduleProps> = ({ user, students }) => {
    const [lessons, setLessons] = useState<PrivateLesson[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);
    const [isStudentDetailModalOpen, setIsStudentDetailModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<PrivateLesson | null>(null);

    // Add Lesson Form
    const [lessonFormDay, setLessonFormDay] = useState('Pazartesi');
    const [lessonFormStudentId, setLessonFormStudentId] = useState('');
    const [lessonFormTime, setLessonFormTime] = useState('15:00');
    const [lessonFormDuration, setLessonFormDuration] = useState(60);
    const [lessonFormSubject, setLessonFormSubject] = useState(Subject.Mathematics);
    const [lessonFormColor, setLessonFormColor] = useState(COLORS[0]);

    // Student Detail - Homework Assignment
    const [detailActiveTab, setDetailActiveTab] = useState<'notes' | 'homework' | 'ai'>('notes');
    const [detailLessonNotes, setDetailLessonNotes] = useState('');
    const [detailTopic, setDetailTopic] = useState('');
    const [weeklyHomework, setWeeklyHomework] = useState<{ [day: string]: string }>({
        'Pazartesi': '',
        'Salı': '',
        'Çarşamba': '',
        'Perşembe': '',
        'Cuma': '',
        'Cumartesi': '',
        'Pazar': ''
    });

    // AI Assistant states
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSummary, setAiSummary] = useState('');
    const [aiHomeworkSuggestions, setAiHomeworkSuggestions] = useState('');

    useEffect(() => {
        const fetchAllStudents = async () => {
            try {
                const { data, error } = await supabase
                    .from('students')
                    .select('*')
                    .order('name');

                if (error) throw error;

                const list = (data || []).map(row => ({
                    id: row.id,
                    name: row.name,
                    grade: row.grade,
                    tutorId: row.tutor_id,
                    contact: row.contact,
                    level: row.level,
                    xp: row.xp,
                    badges: [],
                    learningLoopStatus: row.learning_loop_status,
                    progressReports: [],
                })) as Student[];
                setAllStudents(list);
            } catch (error) {
                console.error('Error fetching all students:', error);
            }
        };
        fetchAllStudents();
    }, []);

    const weekStart = useMemo(() => {
        const d = new Date(currentDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }, [currentDate]);

    const weekEnd = useMemo(() => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 6);
        d.setHours(23, 59, 59, 999);
        return d;
    }, [weekStart]);

    const fetchLessons = async () => {
        try {
            // Fetch ALL lessons for this tutor (not just current week)
            const { data, error } = await supabase
                .from('private_lessons')
                .select('*')
                .eq('tutor_id', user.id);

            if (error) throw error;

            const allLessons = (data || []).map(row => ({
                id: row.id,
                tutorId: row.tutor_id,
                studentId: row.student_id,
                studentName: row.student_name,
                startTime: row.start_time,
                endTime: row.end_time,
                subject: row.subject,
                topic: row.topic,
                status: row.status,
                notes: row.notes,
                duration: row.duration,
                color: row.color,
                contact: row.contact,
                grade: row.grade,
                lessonNotes: row.lesson_notes,
                homework: row.homework
            }));

            // Create a map of lessons by day-of-week and time
            const lessonTemplates = new Map<string, PrivateLesson>();

            allLessons.forEach(lesson => {
                const lessonDate = new Date(lesson.startTime);
                const dayOfWeek = lessonDate.getDay(); // 0-6 (Sunday-Saturday)
                const hours = lessonDate.getHours();
                const minutes = lessonDate.getMinutes();
                const key = `${dayOfWeek}-${hours}-${minutes}-${lesson.studentId}`;

                // Keep the most recent lesson for this slot
                if (!lessonTemplates.has(key) || new Date(lesson.startTime) > new Date(lessonTemplates.get(key)!.startTime)) {
                    lessonTemplates.set(key, lesson);
                }
            });

            // Project lessons onto current week
            const currentWeekLessons: PrivateLesson[] = [];

            lessonTemplates.forEach(template => {
                const templateDate = new Date(template.startTime);
                const dayOfWeek = templateDate.getDay();
                const hours = templateDate.getHours();
                const minutes = templateDate.getMinutes();

                // Calculate the date for this day in the current week
                const currentWeekDate = new Date(weekStart);
                const daysToAdd = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday start
                currentWeekDate.setDate(currentWeekDate.getDate() + daysToAdd);
                currentWeekDate.setHours(hours, minutes, 0, 0);

                const endDate = new Date(currentWeekDate);
                endDate.setMinutes(endDate.getMinutes() + (template.duration || 60));

                // Check if there's already a lesson in the database for this exact slot
                const existingLesson = allLessons.find(l => {
                    const lDate = new Date(l.startTime);
                    return lDate.getTime() === currentWeekDate.getTime() && l.studentId === template.studentId;
                });

                if (existingLesson) {
                    // Use the existing lesson from database
                    currentWeekLessons.push(existingLesson);
                } else {
                    // Create a virtual lesson based on template
                    currentWeekLessons.push({
                        ...template,
                        id: `virtual-${template.id}-${currentWeekDate.getTime()}`,
                        startTime: currentWeekDate.toISOString(),
                        endTime: endDate.toISOString(),
                        status: 'scheduled'
                    });
                }
            });

            setLessons(currentWeekLessons);
        } catch (error) {
            console.error('Error fetching lessons:', error);
        }
    };

    useEffect(() => {
        fetchLessons();
    }, [weekStart, user.id]);

    const handlePrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const handleAddLesson = async (e: React.FormEvent) => {
        e.preventDefault();

        const student = allStudents.find(s => s.id === lessonFormStudentId);
        if (!student) return;

        const dayIndex = DAYS_TR.indexOf(lessonFormDay);
        const lessonDate = new Date(weekStart);
        lessonDate.setDate(lessonDate.getDate() + dayIndex);

        const [hours, minutes] = lessonFormTime.split(':');
        lessonDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const endDate = new Date(lessonDate);
        endDate.setMinutes(endDate.getMinutes() + lessonFormDuration);

        try {
            const { error } = await supabase
                .from('private_lessons')
                .insert([{
                    tutor_id: user.id,
                    student_id: student.id,
                    student_name: student.name,
                    start_time: lessonDate.toISOString(),
                    end_time: endDate.toISOString(),
                    subject: lessonFormSubject,
                    duration: lessonFormDuration,
                    status: 'scheduled',
                    color: lessonFormColor,
                    contact: student.contact,
                    grade: student.grade
                }]);

            if (error) throw error;

            fetchLessons();
            setIsAddLessonModalOpen(false);
        } catch (error) {
            console.error('Error adding lesson:', error);
            alert('Ders eklenirken bir hata oluştu.');
        }
    };

    const handleLessonClick = (lesson: PrivateLesson) => {
        setSelectedLesson(lesson);
        const student = allStudents.find(s => s.id === lesson.studentId);
        if (student) {
            setSelectedStudent(student);
            setDetailLessonNotes(lesson.lessonNotes || '');
            setDetailTopic(lesson.topic || '');

            // Reset AI states
            setAiSummary('');
            setAiHomeworkSuggestions('');
            setAiLoading(false);

            // Parse homework if exists
            if (lesson.homework) {
                try {
                    const parsed = JSON.parse(lesson.homework);
                    setWeeklyHomework(parsed);
                } catch {
                    setWeeklyHomework({
                        'Pazartesi': '', 'Salı': '', 'Çarşamba': '', 'Perşembe': '',
                        'Cuma': '', 'Cumartesi': '', 'Pazar': ''
                    });
                }
            }

            setIsStudentDetailModalOpen(true);
        }
    };

    const handleSaveStudentDetail = async () => {
        if (!selectedLesson) return;

        try {
            // Check if this is a virtual lesson
            if (selectedLesson.id.startsWith('virtual-')) {
                // Create a new lesson record for this virtual lesson
                const { error } = await supabase
                    .from('private_lessons')
                    .insert([{
                        tutor_id: selectedLesson.tutorId,
                        student_id: selectedLesson.studentId,
                        student_name: selectedLesson.studentName,
                        start_time: selectedLesson.startTime,
                        end_time: selectedLesson.endTime,
                        subject: selectedLesson.subject,
                        duration: selectedLesson.duration,
                        status: selectedLesson.status,
                        color: selectedLesson.color,
                        contact: selectedLesson.contact,
                        grade: selectedLesson.grade,
                        lesson_notes: detailLessonNotes,
                        homework: JSON.stringify(weeklyHomework),
                        topic: detailTopic
                    }]);

                if (error) throw error;
            } else {
                // Update existing lesson
                const { error } = await supabase
                    .from('private_lessons')
                    .update({
                        lesson_notes: detailLessonNotes,
                        homework: JSON.stringify(weeklyHomework),
                        topic: detailTopic
                    })
                    .eq('id', selectedLesson.id);

                if (error) throw error;
            }

            fetchLessons();
            setIsStudentDetailModalOpen(false);
            alert('Kaydedildi!');
        } catch (error) {
            console.error('Error saving:', error);
            alert('Kaydedilirken bir hata oluştu.');
        }
    };

    const handleGenerateAISuggestions = async () => {
        if (!selectedLesson || !selectedStudent) return;

        if (!detailTopic || detailTopic.trim() === '') {
            alert('Lütfen önce "Ders Notları" sekmesinden işlenen konuyu giriniz.');
            setDetailActiveTab('notes');
            return;
        }

        setAiLoading(true);
        try {
            // Generate lesson summary
            const summaryPrompt = `${selectedLesson.subject} dersi için "${detailTopic}" konusu işlendi. ${selectedStudent.grade}. sınıf seviyesinde, öğrenciye WhatsApp ile gönderilebilecek kısa ve öz bir ders özeti oluştur. Özet maksimum 3-4 cümle olsun ve konunun ana noktalarını vurgulasın.`;

            const summaryResponse = await optimizedAIService.explainTopic(summaryPrompt, selectedStudent.grade || 9);
            const summary = summaryResponse.explanation || summaryResponse.content || 'Özet oluşturulamadı.';
            setAiSummary(summary);

            // Generate homework suggestions
            const homeworkResponse = await optimizedAIService.suggestHomework(
                selectedStudent.grade || 9,
                selectedLesson.subject,
                [detailTopic]
            );

            const homework = homeworkResponse.homework || homeworkResponse.suggestions || homeworkResponse.content || 'Ödev önerisi oluşturulamadı.';
            setAiHomeworkSuggestions(homework);

        } catch (error) {
            console.error('Error generating AI suggestions:', error);
            alert('AI önerileri oluşturulurken bir hata oluştu.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleApplyAISuggestions = () => {
        // Apply AI summary to lesson notes
        if (aiSummary) {
            const updatedNotes = detailLessonNotes ?
                `${detailLessonNotes}\n\n📝 AI Özeti:\n${aiSummary}` :
                `📝 AI Özeti:\n${aiSummary}`;
            setDetailLessonNotes(updatedNotes);
        }

        // Apply AI homework to weekly homework (add to first empty day or Monday)
        if (aiHomeworkSuggestions) {
            const firstEmptyDay = DAYS_TR.find(day => !weeklyHomework[day] || weeklyHomework[day].trim() === '');
            if (firstEmptyDay) {
                setWeeklyHomework({
                    ...weeklyHomework,
                    [firstEmptyDay]: aiHomeworkSuggestions
                });
            } else {
                // If all days are filled, add to Monday
                setWeeklyHomework({
                    ...weeklyHomework,
                    'Pazartesi': weeklyHomework['Pazartesi'] ?
                        `${weeklyHomework['Pazartesi']}\n\n${aiHomeworkSuggestions}` :
                        aiHomeworkSuggestions
                });
            }
        }

        // Switch to notes tab to show the changes
        setDetailActiveTab('notes');
        alert('AI önerileri ders notlarına ve ödev programına eklendi!');
    };

    const handleWhatsAppShare = () => {
        if (!selectedStudent || !selectedLesson) return;

        const homeworkList = Object.entries(weeklyHomework)
            .filter(([_, hw]) => hw.trim() !== '')
            .map(([day, hw]) => `*${day}:*\n${hw}`)
            .join('\n\n');

        let message = `Merhaba ${selectedStudent.name},\n\n` +
            `📚 *${new Date(selectedLesson.startTime).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} Tarihli Ders Özeti*\n\n` +
            `📖 *İşlenen Konu:*\n${detailTopic || 'Belirtilmedi'}\n\n`;

        // Add AI summary if available
        if (aiSummary) {
            message += `🤖 *AI Özeti:*\n${aiSummary}\n\n`;
        }

        message += `📝 *Ders Notları:*\n${detailLessonNotes || 'Not eklenmedi'}\n\n` +
            `✏️ *Haftalık Ödevler:*\n\n${homeworkList || 'Ödev verilmedi'}\n\n` +
            `İyi çalışmalar! 📚✨`;

        const encodedMessage = encodeURIComponent(message);
        const phoneNumber = selectedStudent.contact?.replace(/\D/g, '') || '';
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
    };

    const weekDays = useMemo(() => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    }, [weekStart]);

    const getLessonsForDay = (dayIndex: number) => {
        return lessons.filter(lesson => {
            const lessonDate = new Date(lesson.startTime);
            const targetDate = new Date(weekStart);
            targetDate.setDate(targetDate.getDate() + dayIndex);
            return lessonDate.toDateString() === targetDate.toDateString();
        }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    };

    // Calculate dynamic time range based on actual lessons
    const timeRange = useMemo(() => {
        if (lessons.length === 0) {
            return { start: 8, end: 21 }; // Default range
        }

        let earliestHour = 23;
        let latestHour = 0;

        lessons.forEach(lesson => {
            const startHour = new Date(lesson.startTime).getHours();
            const endHour = new Date(lesson.endTime).getHours();

            if (startHour < earliestHour) earliestHour = startHour;
            if (endHour > latestHour) latestHour = endHour;
        });

        // Add 1 hour buffer before and after
        return {
            start: Math.max(8, earliestHour - 1),
            end: Math.min(22, latestHour + 1)
        };
    }, [lessons]);

    const handleDeleteLesson = async (lessonId: string) => {
        // Check if this is a virtual lesson
        if (lessonId.startsWith('virtual-')) {
            if (!confirm('Bu sanal dersi kaldırmak istediğinizden emin misiniz? (Şablon ders korunacak, sadece bu hafta görünmeyecek)')) return;

            // For virtual lessons, we just remove from display
            setLessons(lessons.filter(l => l.id !== lessonId));
            return;
        }

        if (!confirm('Bu dersi silmek istediğinizden emin misiniz? Bu ders şablondan da kaldırılacak.')) return;

        try {
            const { error } = await supabase
                .from('private_lessons')
                .delete()
                .eq('id', lessonId);

            if (error) throw error;

            fetchLessons();
            alert('Ders silindi!');
        } catch (error) {
            console.error('Error deleting lesson:', error);
            alert('Ders silinirken bir hata oluştu.');
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold font-poppins text-gray-800">Özel Ders Programı</h2>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setIsAddLessonModalOpen(true)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium flex items-center space-x-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        <span>Ders Ekle</span>
                    </button>
                    <div className="flex items-center bg-gray-50 rounded-lg p-1">
                        <button onClick={handlePrevWeek} className="p-2 hover:bg-white rounded-md transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <span className="px-4 font-semibold text-gray-700">
                            {weekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - {weekEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                        </span>
                        <button onClick={handleNextWeek} className="p-2 hover:bg-white rounded-md transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Weekly Schedule Grid */}
            <div className="flex-1 overflow-auto">
                <div className="min-w-[1200px]">
                    <div className="grid grid-cols-8 gap-2">
                        {/* Header */}
                        <div className="bg-gray-50 p-3 rounded-lg"></div>
                        {weekDays.map((day, idx) => (
                            <div key={idx} className={`bg-gray-50 p-3 rounded-lg text-center ${day.toDateString() === new Date().toDateString() ? 'bg-primary/10 border-2 border-primary' : ''}`}>
                                <div className="font-bold text-sm text-gray-700">{DAYS_TR[idx]}</div>
                                <div className="text-xs text-gray-500">{day.getDate()} {day.toLocaleDateString('tr-TR', { month: 'short' })}</div>
                            </div>
                        ))}

                        {/* Time slots - Dynamic based on lessons */}
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

                                    return (
                                        <div key={dayIdx} className="border border-gray-100 rounded-lg min-h-[80px] relative">
                                            {lessonsInHour.map(lesson => {
                                                const startTime = new Date(lesson.startTime);
                                                const endTime = new Date(lesson.endTime);
                                                const duration = lesson.duration || 60;

                                                // Calculate exact position and height
                                                const startMinutes = startTime.getMinutes();
                                                const topOffset = (startMinutes / 60) * 80; // pixels from top of hour slot
                                                const heightInPixels = (duration / 60) * 80; // 80px per hour

                                                return (
                                                    <div
                                                        key={lesson.id}
                                                        className="absolute left-1 right-1 rounded-lg p-2 cursor-pointer hover:opacity-90 transition-opacity group z-10"
                                                        style={{
                                                            backgroundColor: lesson.color || '#FFB6C1',
                                                            top: `${topOffset}px`,
                                                            height: `${heightInPixels}px`,
                                                            minHeight: '50px'
                                                        }}
                                                    >
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteLesson(lesson.id);
                                                            }}
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-20"
                                                            title="Dersi Sil"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                        <div
                                                            onClick={() => handleLessonClick(lesson)}
                                                            className="w-full h-full"
                                                        >
                                                            <div className="font-bold text-sm text-gray-800">
                                                                {startTime.getHours().toString().padStart(2, '0')}:{startTime.getMinutes().toString().padStart(2, '0')}
                                                            </div>
                                                            <div className="font-semibold text-gray-900">{lesson.studentName}</div>
                                                            <div className="text-xs text-gray-700">{lesson.subject}</div>
                                                            {duration > 60 && (
                                                                <div className="text-xs text-gray-600 mt-1">
                                                                    {duration} dk
                                                                </div>
                                                            )}
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

            {/* Add Lesson Modal */}
            {isAddLessonModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
                        <h3 className="text-xl font-bold font-poppins mb-2">Yeni Ders Ekle</h3>
                        <p className="text-sm text-gray-500 mb-4">Programa ders ekle</p>

                        <form onSubmit={handleAddLesson} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gün</label>
                                <select
                                    value={lessonFormDay}
                                    onChange={e => setLessonFormDay(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg py-2 px-3"
                                >
                                    {DAYS_TR.map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci Seç</label>
                                <select
                                    value={lessonFormStudentId}
                                    onChange={e => setLessonFormStudentId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg py-2 px-3"
                                    required
                                >
                                    <option value="">Öğrenci seçiniz...</option>
                                    {allStudents.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ders</label>
                                <select
                                    value={lessonFormSubject}
                                    onChange={e => setLessonFormSubject(e.target.value as Subject)}
                                    className="w-full border border-gray-300 rounded-lg py-2 px-3"
                                >
                                    {Object.values(Subject).map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Saat</label>
                                    <input
                                        type="time"
                                        value={lessonFormTime}
                                        onChange={e => setLessonFormTime(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg py-2 px-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Süre (Dk)</label>
                                    <select
                                        value={lessonFormDuration}
                                        onChange={e => setLessonFormDuration(parseInt(e.target.value))}
                                        className="w-full border border-gray-300 rounded-lg py-2 px-3"
                                    >
                                        {DURATION_OPTIONS.map(duration => (
                                            <option key={duration} value={duration}>{duration} dk</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Renk</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.slice(0, 7).map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setLessonFormColor(color)}
                                            className={`w-8 h-8 rounded-full border-2 ${lessonFormColor === color ? 'border-gray-800 scale-110' : 'border-gray-200'} transition-transform`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button type="button" onClick={() => setIsAddLessonModalOpen(false)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50">
                                    İptal
                                </button>
                                <button type="submit" className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark">
                                    Ekle
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Student Detail Modal */}
            {isStudentDetailModalOpen && selectedStudent && selectedLesson && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center space-x-2 mb-1">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedLesson.color || '#FFB6C1' }}></div>
                                    <span className="text-sm text-gray-500">{selectedLesson.subject}</span>
                                    <span className="text-sm text-gray-500">
                                        {new Date(selectedLesson.startTime).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold font-poppins">{selectedStudent.name}</h3>
                            </div>
                            <button onClick={() => setIsStudentDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 mb-6">
                            <button
                                onClick={() => setDetailActiveTab('notes')}
                                className={`px-6 py-3 font-medium flex items-center space-x-2 ${detailActiveTab === 'notes' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span>Ders Notları</span>
                            </button>
                            <button
                                onClick={() => setDetailActiveTab('homework')}
                                className={`px-6 py-3 font-medium flex items-center space-x-2 ${detailActiveTab === 'homework' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Haftalık Program</span>
                            </button>
                            <button
                                onClick={() => setDetailActiveTab('ai')}
                                className={`px-6 py-3 font-medium flex items-center space-x-2 ${detailActiveTab === 'ai' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <span>AI Asistan</span>
                            </button>
                        </div>

                        {/* Tab Content */}
                        {detailActiveTab === 'notes' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">İşlenen Konu</label>
                                    <input
                                        type="text"
                                        value={detailTopic}
                                        onChange={e => setDetailTopic(e.target.value)}
                                        placeholder="Bugün ne işlendi?"
                                        className="w-full border border-gray-300 rounded-lg py-2 px-3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Ders Notları</label>
                                    <textarea
                                        value={detailLessonNotes}
                                        onChange={e => setDetailLessonNotes(e.target.value)}
                                        placeholder="Ders notları..."
                                        className="w-full border border-gray-300 rounded-lg py-2 px-3 h-32"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-gray-700">Ödevler</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                // This will be populated from the weekly program tab
                                                const homeworkSummary = Object.entries(weeklyHomework)
                                                    .filter(([_, hw]) => hw.trim() !== '')
                                                    .map(([day, hw]) => `${day}: ${hw}`)
                                                    .join('\n');
                                                if (homeworkSummary) {
                                                    setDetailLessonNotes(detailLessonNotes + '\n\nÖdevler:\n' + homeworkSummary);
                                                }
                                            }}
                                            className="text-xs text-primary hover:text-primary-dark flex items-center space-x-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            <span>Haftalık Programdan Aktar</span>
                                        </button>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto">
                                        {Object.entries(weeklyHomework).filter(([_, hw]) => hw.trim() !== '').length > 0 ? (
                                            <div className="space-y-2">
                                                {Object.entries(weeklyHomework)
                                                    .filter(([_, hw]) => hw.trim() !== '')
                                                    .map(([day, hw]) => (
                                                        <div key={day} className="bg-white rounded-lg p-2 border border-gray-200">
                                                            <div className="text-xs font-semibold text-primary mb-1">{day}</div>
                                                            <div className="text-sm text-gray-700">{hw}</div>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-400 text-sm py-4">
                                                Henüz ödev eklenmedi. "Haftalık Program" sekmesinden ödev ekleyebilirsiniz.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button onClick={() => setIsStudentDetailModalOpen(false)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50">
                                        Vazgeç
                                    </button>
                                    <button onClick={handleSaveStudentDetail} className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark">
                                        Kaydet
                                    </button>
                                </div>
                            </div>
                        )}

                        {detailActiveTab === 'homework' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-lg font-semibold">Öğrenci Çalışma Programı</h4>
                                    <button
                                        onClick={() => setWeeklyHomework({
                                            'Pazartesi': '', 'Salı': '', 'Çarşamba': '', 'Perşembe': '',
                                            'Cuma': '', 'Cumartesi': '', 'Pazar': ''
                                        })}
                                        className="text-sm text-orange-600 hover:text-orange-700 flex items-center space-x-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        <span>Tümünü Temizle</span>
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {DAYS_TR.map(day => (
                                        <div key={day} className="border border-gray-200 rounded-lg p-3 hover:border-primary/30 transition-colors">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-semibold text-gray-700">{day}</span>
                                                {weeklyHomework[day] ? (
                                                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">✓ Görev var</span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Görev yok</span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <textarea
                                                    value={weeklyHomework[day]}
                                                    onChange={e => setWeeklyHomework({ ...weeklyHomework, [day]: e.target.value })}
                                                    placeholder="Bu gün için görev yazın..."
                                                    className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm resize-none focus:border-primary focus:ring-1 focus:ring-primary"
                                                    rows={2}
                                                />
                                                {weeklyHomework[day] && (
                                                    <button
                                                        onClick={() => setWeeklyHomework({ ...weeklyHomework, [day]: '' })}
                                                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                                                        title="Temizle"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between pt-4">
                                    <button
                                        onClick={handleWhatsAppShare}
                                        className="px-6 py-2 border border-green-600 text-green-600 rounded-xl hover:bg-green-50 flex items-center space-x-2"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                        <span>WhatsApp Paylaş</span>
                                    </button>
                                    <div className="flex space-x-3">
                                        <button onClick={() => setIsStudentDetailModalOpen(false)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50">
                                            Vazgeç
                                        </button>
                                        <button onClick={handleSaveStudentDetail} className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark">
                                            Kaydet
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {detailActiveTab === 'ai' && (
                            <div className="space-y-6">
                                {/* AI Assistant Header */}
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Yapay Zeka Asistanı</h3>
                                    <p className="text-gray-600">Mevcut konu ve notlarınıza göre ödev önerileri alın.</p>
                                </div>

                                {/* Generate Button */}
                                {!aiSummary && !aiHomeworkSuggestions && (
                                    <div className="text-center py-8">
                                        <button
                                            onClick={handleGenerateAISuggestions}
                                            disabled={aiLoading || !detailTopic}
                                            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2 mx-auto shadow-lg"
                                        >
                                            {aiLoading ? (
                                                <>
                                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span>Öneriler Oluşturuluyor...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    <span>Öneri Oluştur</span>
                                                </>
                                            )}
                                        </button>
                                        {!detailTopic && (
                                            <p className="text-sm text-orange-600 mt-4">
                                                ⚠️ Önce "Ders Notları" sekmesinden işlenen konuyu giriniz.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* AI Results */}
                                {(aiSummary || aiHomeworkSuggestions) && (
                                    <div className="space-y-4">
                                        {/* Summary Section */}
                                        {aiSummary && (
                                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                                                <div className="flex items-center space-x-2 mb-3">
                                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <h4 className="font-semibold text-blue-900">Ders Özeti</h4>
                                                </div>
                                                <p className="text-gray-700 whitespace-pre-wrap">{aiSummary}</p>
                                            </div>
                                        )}

                                        {/* Homework Suggestions */}
                                        {aiHomeworkSuggestions && (
                                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                                                <div className="flex items-center space-x-2 mb-3">
                                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                    </svg>
                                                    <h4 className="font-semibold text-green-900">Ödev Önerileri</h4>
                                                </div>
                                                <p className="text-gray-700 whitespace-pre-wrap">{aiHomeworkSuggestions}</p>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex justify-between items-center pt-4 border-t">
                                            <button
                                                onClick={() => {
                                                    setAiSummary('');
                                                    setAiHomeworkSuggestions('');
                                                }}
                                                className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center space-x-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                <span>Yeniden Oluştur</span>
                                            </button>
                                            <button
                                                onClick={handleApplyAISuggestions}
                                                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 flex items-center space-x-2 shadow-lg"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>Ders Notlarına Aktar</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Bottom Actions */}
                                <div className="flex justify-end space-x-3 pt-4 border-t">
                                    <button onClick={() => setIsStudentDetailModalOpen(false)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50">
                                        Vazgeç
                                    </button>
                                    <button onClick={handleSaveStudentDetail} className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark">
                                        Kaydet
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrivateLessonSchedule;
