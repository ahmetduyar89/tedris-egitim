import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/dbAdapter';
import { User, Student, PrivateLesson, Subject } from '../types';

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

const PrivateLessonSchedule: React.FC<PrivateLessonScheduleProps> = ({ user, students }) => {
    const [lessons, setLessons] = useState<PrivateLesson[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);
    const [isStudentDetailModalOpen, setIsStudentDetailModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<PrivateLesson | null>(null);

    // Add Student Form
    const [studentFormName, setStudentFormName] = useState('');
    const [studentFormSubject, setStudentFormSubject] = useState(Subject.Mathematics);
    const [studentFormGrade, setStudentFormGrade] = useState(5);
    const [studentFormContact, setStudentFormContact] = useState('');
    const [studentFormColor, setStudentFormColor] = useState(COLORS[0]);

    // Add Lesson Form
    const [lessonFormDay, setLessonFormDay] = useState('Pazartesi');
    const [lessonFormStudentId, setLessonFormStudentId] = useState('');
    const [lessonFormTime, setLessonFormTime] = useState('15:00');
    const [lessonFormDuration, setLessonFormDuration] = useState(60);

    // Student Detail Form
    const [detailLessonNotes, setDetailLessonNotes] = useState('');
    const [detailHomework, setDetailHomework] = useState('');
    const [detailTopic, setDetailTopic] = useState('');
    const [detailActiveTab, setDetailActiveTab] = useState<'notes' | 'schedule' | 'ai'>('notes');

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
            const { data, error } = await supabase
                .from('private_lessons')
                .select('*')
                .eq('tutor_id', user.id)
                .gte('start_time', weekStart.toISOString())
                .lte('end_time', weekEnd.toISOString());

            if (error) throw error;

            const loadedLessons = (data || []).map(row => ({
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
            setLessons(loadedLessons);
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

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        // This would create a new student entry in the system
        // For now, we'll just close the modal
        setIsAddStudentModalOpen(false);
        alert('Öğrenci ekleme özelliği yakında eklenecek');
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
                    subject: studentFormSubject,
                    duration: lessonFormDuration,
                    status: 'scheduled',
                    color: studentFormColor,
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
            setDetailHomework(lesson.homework || '');
            setDetailTopic(lesson.topic || '');
            setIsStudentDetailModalOpen(true);
        }
    };

    const handleSaveStudentDetail = async () => {
        if (!selectedLesson) return;

        try {
            const { error } = await supabase
                .from('private_lessons')
                .update({
                    lesson_notes: detailLessonNotes,
                    homework: detailHomework,
                    topic: detailTopic
                })
                .eq('id', selectedLesson.id);

            if (error) throw error;

            fetchLessons();
            setIsStudentDetailModalOpen(false);
        } catch (error) {
            console.error('Error saving:', error);
            alert('Kaydedilirken bir hata oluştu.');
        }
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

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold font-poppins text-gray-800">Özel Ders Programı</h2>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setIsAddStudentModalOpen(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center space-x-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                        </svg>
                        <span>Öğrenci Ekle</span>
                    </button>
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

                        {/* Time slots - 08:00 to 21:00 */}
                        {Array.from({ length: 14 }, (_, i) => i + 8).map(hour => (
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
                                        <div key={dayIdx} className="border border-gray-100 rounded-lg min-h-[60px] p-1 relative">
                                            {lessonsInHour.map(lesson => {
                                                const startTime = new Date(lesson.startTime);
                                                const duration = lesson.duration || 60;
                                                const heightMultiplier = duration / 60;

                                                return (
                                                    <div
                                                        key={lesson.id}
                                                        onClick={() => handleLessonClick(lesson)}
                                                        className="rounded-lg p-2 mb-1 cursor-pointer hover:opacity-80 transition-opacity"
                                                        style={{
                                                            backgroundColor: lesson.color || '#FFB6C1',
                                                            minHeight: `${heightMultiplier * 50}px`
                                                        }}
                                                    >
                                                        <div className="font-bold text-sm text-gray-800">
                                                            {startTime.getHours().toString().padStart(2, '0')}:{startTime.getMinutes().toString().padStart(2, '0')}
                                                        </div>
                                                        <div className="font-semibold text-gray-900">{lesson.studentName}</div>
                                                        <div className="text-xs text-gray-700">{lesson.subject}</div>
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

            {/* Add Student Modal */}
            {isAddStudentModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold font-poppins">Yeni Öğrenci Ekle</h3>
                            <button onClick={() => setIsAddStudentModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddStudent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                                <select
                                    value={studentFormName}
                                    onChange={e => setStudentFormName(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                >
                                    <option value="">Örn: Ahmet Yılmaz</option>
                                    {allStudents.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ders</label>
                                    <select
                                        value={studentFormSubject}
                                        onChange={e => setStudentFormSubject(e.target.value as Subject)}
                                        className="w-full border border-gray-300 rounded-lg py-2 px-3"
                                    >
                                        {Object.values(Subject).map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Seviye/Sınıf</label>
                                    <select
                                        value={studentFormGrade}
                                        onChange={e => setStudentFormGrade(parseInt(e.target.value))}
                                        className="w-full border border-gray-300 rounded-lg py-2 px-3"
                                    >
                                        {[5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                                            <option key={g} value={g}>{g}. Sınıf</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">İletişim (Tel/Email)</label>
                                <input
                                    type="text"
                                    value={studentFormContact}
                                    onChange={e => setStudentFormContact(e.target.value)}
                                    placeholder="0555..."
                                    className="w-full border border-gray-300 rounded-lg py-2 px-3"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Renk Etiketi</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setStudentFormColor(color)}
                                            className={`w-10 h-10 rounded-full border-2 ${studentFormColor === color ? 'border-gray-800 scale-110' : 'border-gray-200'} transition-transform`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button type="button" onClick={() => setIsAddStudentModalOpen(false)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50">
                                    İptal
                                </button>
                                <button type="submit" className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark">
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Lesson Modal */}
            {isAddLessonModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
                        <h3 className="text-xl font-bold font-poppins mb-2">Yeni Ders Ekle</h3>
                        <p className="text-sm text-gray-500 mb-4">Pazartesi günü için ders planla</p>

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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Saat</label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={lessonFormTime}
                                            onChange={e => setLessonFormTime(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg py-2 px-3"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Süre (Dk)</label>
                                    <input
                                        type="number"
                                        value={lessonFormDuration}
                                        onChange={e => setLessonFormDuration(parseInt(e.target.value))}
                                        className="w-full border border-gray-300 rounded-lg py-2 px-3"
                                        min="15"
                                        step="15"
                                    />
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
                                onClick={() => setDetailActiveTab('schedule')}
                                className={`px-6 py-3 font-medium flex items-center space-x-2 ${detailActiveTab === 'schedule' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
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
                                <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                    <span className="text-sm text-gray-500">Tamamlanmadı</span>
                                </div>

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
                                    <label className="block text-sm font-medium text-orange-600 mb-2">Verilen Ödevler</label>
                                    <textarea
                                        value={detailHomework}
                                        onChange={e => setDetailHomework(e.target.value)}
                                        placeholder="Ödevler..."
                                        className="w-full border border-gray-300 rounded-lg py-2 px-3 h-32"
                                    />
                                </div>

                                <div className="flex justify-between pt-4">
                                    <button className="px-6 py-2 border border-green-600 text-green-600 rounded-xl hover:bg-green-50 flex items-center space-x-2">
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

                        {detailActiveTab === 'schedule' && (
                            <div className="text-center py-12 text-gray-500">
                                Haftalık program görünümü yakında eklenecek
                            </div>
                        )}

                        {detailActiveTab === 'ai' && (
                            <div className="text-center py-12 text-gray-500">
                                AI Asistan özelliği yakında eklenecek
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrivateLessonSchedule;
