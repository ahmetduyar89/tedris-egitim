import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/dbAdapter';
import { User, Student, PrivateLesson, Subject, LessonAttendance, StudentPaymentConfig, WeeklyProgram, Task, TaskStatus } from '../types';
import * as optimizedAIService from '../services/optimizedAIService';
import * as privateLessonService from '../services/privateLessonService';
import EditableWeeklySchedule from './EditableWeeklySchedule';
import { db } from '../services/dbAdapter';

import AddLessonModal from './private-lesson/AddLessonModal';
import DeleteLessonModal from './private-lesson/DeleteLessonModal';
import StudentDetailModal from './private-lesson/StudentDetailModal';
import CalendarGrid from './private-lesson/CalendarGrid';
import LessonList from './private-lesson/LessonList';



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
    const [detailActiveTab, setDetailActiveTab] = useState<'notes' | 'homework' | 'ai' | 'attendance'>('notes');
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

    // Attendance Tracking states
    const [attendanceStatus, setAttendanceStatus] = useState<'completed' | 'missed' | 'cancelled'>('completed');
    const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | 'partial'>('unpaid');
    const [paymentAmount, setPaymentAmount] = useState<string>('0');
    const [paymentDate, setPaymentDate] = useState<string>('');
    const [paymentNotes, setPaymentNotes] = useState<string>('');
    const [studentPaymentConfig, setStudentPaymentConfig] = useState<number>(0);

    // Drag and Drop states
    const [draggedLesson, setDraggedLesson] = useState<PrivateLesson | null>(null);
    const [dropTarget, setDropTarget] = useState<{ day: number; hour: number } | null>(null);

    const [currentWeeklyProgram, setCurrentWeeklyProgram] = useState<WeeklyProgram | null>(null);
    const [pastWeeklyProgram, setPastWeeklyProgram] = useState<WeeklyProgram | null>(null);
    const [programViewMode, setProgramViewMode] = useState<'current' | 'past'>('current');

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
                    // If it's cancelled, we skip adding it to the schedule (effectively hiding it)
                    if (existingLesson.status !== 'cancelled') {
                        currentWeekLessons.push(existingLesson);
                    }
                } else {
                    // Create a virtual lesson based on template
                    // IMPORTANT: Clear specific content (notes, homework, topic) so they don't carry over to new weeks
                    currentWeekLessons.push({
                        ...template,
                        id: `virtual-${template.id}-${currentWeekDate.getTime()}`,
                        sourceLessonId: template.id, // Keep track of the source for "Delete All" functionality
                        startTime: currentWeekDate.toISOString(),
                        endTime: endDate.toISOString(),
                        status: 'scheduled',
                        // Clear content fields for the new week
                        lessonNotes: '',
                        homework: '',
                        topic: '',
                        notes: '' // internal notes if any
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
                    grade: student.grade,
                    type: 'face_to_face'
                }]);

            if (error) throw error;

            fetchLessons();
            setIsAddLessonModalOpen(false);
        } catch (error) {
            console.error('Error adding lesson:', error);
            alert('Ders eklenirken bir hata oluştu.');
        }
    };
    const handleLessonClick = async (lesson: PrivateLesson) => {
        setSelectedLesson(lesson);
        // Reset states immediately to show a clean modal while loading
        setCurrentWeeklyProgram(null);
        setPastWeeklyProgram(null);
        setAiSummary('');
        setAiHomeworkSuggestions('');
        setAiLoading(false);
        setIsStudentDetailModalOpen(true);

        const student = allStudents.find(s => s.id === lesson.studentId);
        if (student) {
            setSelectedStudent(student);
            setDetailLessonNotes(lesson.lessonNotes || '');
            setDetailTopic(lesson.topic || '');

            // Use the student's ID and tutor ID from the lesson
            const studentId = lesson.studentId;
            const tutorId = lesson.tutorId;

            // Fetch Weekly Program for the specific week of the lesson
            try {
                const lessonDate = new Date(lesson.startTime);
                // Calculate Monday of that week
                const day = lessonDate.getDay();
                const diff = lessonDate.getDate() - day + (day === 0 ? -6 : 1);
                const weekStartOfLesson = new Date(lessonDate.setDate(diff));
                weekStartOfLesson.setHours(0, 0, 0, 0);

                const weekId = weekStartOfLesson.toISOString().split('T')[0];

                // Also calculate Past Week Id
                const pastWeekStart = new Date(weekStartOfLesson);
                pastWeekStart.setDate(pastWeekStart.getDate() - 7);
                const pastWeekId = pastWeekStart.toISOString().split('T')[0];

                // Fetch all programs for this student to handle legacy and specific weeks
                const programSnapshot = await db.collection('weeklyPrograms')
                    .where('studentId', '==', studentId)
                    .orderBy('createdAt', 'desc')
                    .get();

                const allPrograms = programSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as WeeklyProgram));

                // 1. Find Current Week Program
                let current = allPrograms.find(p => p.weekId === weekId);

                // 2. Find Past Week Program
                let past = allPrograms.find(p => p.weekId === pastWeekId);

                // Migration/Fallback logic:
                // If no specific current week program found, take the most recent one as current
                if (!current && allPrograms.length > 0) {
                    current = allPrograms[0];
                }

                // If no specific past week program found, take the second most recent one
                if (!past && allPrograms.length > 1) {
                    // Make sure it's not the same as current
                    past = allPrograms.find(p => p.id !== current?.id);
                }

                // Self-healing function for local use
                const healProgram = async (program: WeeklyProgram) => {
                    if (program.id.startsWith('prog_') || program.id.startsWith('temp_')) {
                        try {
                            await db.collection('weeklyPrograms').doc(program.id).delete();
                            const { id } = await db.collection('weeklyPrograms').add(program);
                            return { ...program, id };
                        } catch (e) {
                            console.error("Self-healing failed:", e);
                            return program;
                        }
                    }
                    return program;
                };

                if (current) {
                    const healedCurrent = await healProgram(current);
                    // If the found program doesn't have a weekId, assign it this week's ID 
                    // This migrates legacy data to the first week it's accessed
                    if (!healedCurrent.weekId) {
                        try {
                            await db.collection('weeklyPrograms').doc(healedCurrent.id).update({ week_id: weekId });
                            healedCurrent.weekId = weekId;
                        } catch (e) { console.error("Migration failed:", e); }
                    }
                    setCurrentWeeklyProgram(healedCurrent);
                } else {
                    // Create New Program for current week
                    const newProgramData = {
                        studentId: studentId,
                        week: 1,
                        weekId: weekId,
                        days: DAYS_TR.map(day => ({ day, tasks: [] }))
                    };
                    const { id } = await db.collection('weeklyPrograms').add(newProgramData);
                    setCurrentWeeklyProgram({ id, ...newProgramData } as WeeklyProgram);
                }

                if (past) {
                    const healedPast = await healProgram(past);
                    setPastWeeklyProgram(healedPast);
                } else {
                    setPastWeeklyProgram(null);
                }

                setProgramViewMode('current');
            } catch (error) {
                console.error("Error fetching weekly program:", error);

                // Fallback: Create a local-only program so the UI doesn't hang
                const weekId = new Date(lesson.startTime).toISOString().split('T')[0];
                const fallbackProgram: WeeklyProgram = {
                    id: `fallback_${Date.now()}`,
                    studentId: lesson.studentId,
                    week: 1,
                    weekId: weekId,
                    days: DAYS_TR.map(day => ({ day, tasks: [] }))
                };
                setCurrentWeeklyProgram(fallbackProgram);
                setPastWeeklyProgram(null);
            }

            // Reset AI states
            setAiSummary('');
            setAiHomeworkSuggestions('');
            setAiLoading(false);

            // Parse homework if exists (LEGACY support)
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
            } else {
                setWeeklyHomework({
                    'Pazartesi': '', 'Salı': '', 'Çarşamba': '', 'Perşembe': '',
                    'Cuma': '', 'Cumartesi': '', 'Pazar': ''
                });
            }

            // Load student payment config first, as it might be needed for attendance
            let config = null;
            try {
                config = await privateLessonService.getStudentPaymentConfig(student.id, user.id);
                if (config) {
                    setStudentPaymentConfig(config.perLessonFee);
                } else {
                    setStudentPaymentConfig(0);
                }
            } catch (error) {
                console.error('Error loading payment config:', error);
            }

            // Load attendance data if exists
            try {
                const attendance = await privateLessonService.getLessonAttendance(lesson.id);
                if (attendance) {
                    setAttendanceStatus(attendance.attendanceStatus);
                    setPaymentStatus(attendance.paymentStatus || 'unpaid');
                    setPaymentAmount(attendance.paymentAmount ? attendance.paymentAmount.toString() : '0');
                    setPaymentDate(attendance.paymentDate || new Date().toISOString().split('T')[0]);
                    setPaymentNotes(attendance.paymentNotes || '');
                } else {
                    setAttendanceStatus('completed');
                    setPaymentStatus('unpaid');
                    setPaymentDate(new Date().toISOString().split('T')[0]);
                    setPaymentNotes('');
                    // Auto-fill amount if config exists
                    if (config) {
                        setPaymentAmount(config.perLessonFee.toString());
                    } else {
                        setPaymentAmount('0');
                    }
                }
            } catch (error) {
                console.error('Error loading attendance:', error);
            }
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

    const handleSaveAttendance = async () => {
        if (!selectedLesson || !selectedStudent) return;

        try {
            let targetLessonId = selectedLesson.id;

            // Check if this is a virtual lesson
            if (selectedLesson.id.startsWith('virtual-')) {
                // Create a real lesson record first
                const { data: newLesson, error: createError } = await supabase
                    .from('private_lessons')
                    .insert([{
                        tutor_id: selectedLesson.tutorId,
                        student_id: selectedLesson.studentId,
                        student_name: selectedLesson.studentName,
                        start_time: selectedLesson.startTime,
                        end_time: selectedLesson.endTime,
                        subject: selectedLesson.subject,
                        duration: selectedLesson.duration,
                        status: attendanceStatus,
                        color: selectedLesson.color,
                        contact: selectedLesson.contact,
                        grade: selectedLesson.grade,
                        lesson_notes: detailLessonNotes,
                        homework: JSON.stringify(weeklyHomework),
                        topic: detailTopic
                    }])
                    .select()
                    .single();

                if (createError) throw createError;
                targetLessonId = newLesson.id;
            }

            await privateLessonService.markLessonAttendance(
                targetLessonId,
                selectedStudent.id,
                user.id,
                attendanceStatus,
                attendanceStatus === 'completed' ? {
                    paymentAmount: parseFloat(paymentAmount) || 0,
                    paymentStatus,
                    paymentDate: paymentDate || undefined,
                    paymentNotes: paymentNotes || undefined
                } : undefined
            );

            alert('Katılım bilgisi kaydedildi!');
            fetchLessons();
            setIsStudentDetailModalOpen(false);
        } catch (error) {
            console.error('Error saving attendance:', error);
            alert('Katılım bilgisi kaydedilirken bir hata oluştu.');
        }
    };

    const handleMoveLesson = async (lesson: PrivateLesson, targetDay: number, targetHour: number, targetMinute: number = 0) => {
        try {
            // Calculate new date/time
            const newStartDate = new Date(weekStart);
            newStartDate.setDate(newStartDate.getDate() + targetDay);
            newStartDate.setHours(targetHour, targetMinute, 0, 0);

            const newEndDate = new Date(newStartDate);
            newEndDate.setMinutes(newEndDate.getMinutes() + (lesson.duration || 60));

            // If it's a virtual lesson, create a real one for this week
            if (lesson.id.startsWith('virtual-')) {
                const { error } = await supabase
                    .from('private_lessons')
                    .insert([{
                        tutor_id: lesson.tutorId,
                        student_id: lesson.studentId,
                        student_name: lesson.studentName,
                        start_time: newStartDate.toISOString(),
                        end_time: newEndDate.toISOString(),
                        subject: lesson.subject,
                        duration: lesson.duration,
                        status: lesson.status,
                        color: lesson.color,
                        contact: lesson.contact,
                        grade: lesson.grade,
                        lesson_notes: lesson.lessonNotes,
                        homework: lesson.homework,
                        topic: lesson.topic
                    }]);

                if (error) throw error;
            } else {
                // Update existing lesson
                const { error } = await supabase
                    .from('private_lessons')
                    .update({
                        start_time: newStartDate.toISOString(),
                        end_time: newEndDate.toISOString()
                    })
                    .eq('id', lesson.id);

                if (error) throw error;
            }

            fetchLessons();
            alert('Ders başarıyla taşındı!');
        } catch (error) {
            console.error('Error moving lesson:', error);
            alert('Ders taşınırken bir hata oluştu.');
        }
    };

    const handleDragStart = (e: React.DragEvent, lesson: PrivateLesson) => {
        setDraggedLesson(lesson);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
        // Add visual feedback
        (e.currentTarget as HTMLElement).style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        (e.currentTarget as HTMLElement).style.opacity = '1';
        setDraggedLesson(null);
        setDropTarget(null);
    };

    const handleDragOver = (e: React.DragEvent, day: number, hour: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropTarget({ day, hour });
    };

    const handleDragLeave = () => {
        setDropTarget(null);
    };

    const handleDrop = async (e: React.DragEvent, day: number, hour: number) => {
        e.preventDefault();
        setDropTarget(null);

        if (!draggedLesson) return;

        // Get the minute from the drop position (if clicking on a specific time)
        const targetMinute = 0; // Default to start of hour

        await handleMoveLesson(draggedLesson, day, hour, targetMinute);
        setDraggedLesson(null);
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

            const summaryResponseStr = await optimizedAIService.generateContent(summaryPrompt);
            let summary = '';
            try {
                const summaryResponse = JSON.parse(summaryResponseStr);
                summary = summaryResponse.text || summaryResponse.content || 'Özet oluşturulamadı.';
            } catch (e) {
                summary = summaryResponseStr;
            }
            setAiSummary(summary);

            // Generate homework suggestions
            const homeworkResponse = await optimizedAIService.suggestHomework(
                selectedStudent.grade || 9,
                selectedLesson.subject,
                [detailTopic]
            );

            let homework = '';
            if (typeof homeworkResponse === 'string') {
                homework = homeworkResponse;
            } else if (homeworkResponse.text) {
                homework = homeworkResponse.text;
            } else if (homeworkResponse.suggestions) {
                // Fallback for old format or if AI returns JSON despite instructions
                homework = Array.isArray(homeworkResponse.suggestions)
                    ? homeworkResponse.suggestions.map((s: any) => `- ${s.title}: ${s.description}`).join('\n')
                    : JSON.stringify(homeworkResponse.suggestions);
            } else {
                homework = JSON.stringify(homeworkResponse);
            }

            // Clean up JSON markdown if present
            homework = homework.replace(/```json\n|\n```/g, '').replace(/```/g, '');

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

        // Apply AI homework to weekly homework
        if (aiHomeworkSuggestions) {
            const lessonDate = new Date(selectedLesson.startTime);
            // Get the day index (0=Sunday, 1=Monday...)
            // Adjust for Turkish week starting Monday (0=Monday, 6=Sunday)
            let lessonDayIndex = lessonDate.getDay() - 1;
            if (lessonDayIndex === -1) lessonDayIndex = 6; // Sunday

            const newWeeklyHomework = { ...weeklyHomework };

            // Try to parse "1. Gün", "2. Gün" format
            const dayMatches = aiHomeworkSuggestions.split(/(\d+\.\s*Gün:)/g).filter(Boolean);

            if (dayMatches.length > 1 && dayMatches[0].match(/\d+\.\s*Gün:/)) {
                // We have a structured response
                for (let i = 0; i < dayMatches.length; i += 2) {
                    const dayLabel = dayMatches[i]; // "1. Gün:"
                    const content = dayMatches[i + 1]?.trim(); // "Do this..."

                    if (content) {
                        // Extract day offset from label (1-based)
                        const dayOffset = parseInt(dayLabel.match(/\d+/)?.[0] || '1') - 1;

                        // Calculate target day index
                        const targetDayIndex = (lessonDayIndex + dayOffset) % 7;
                        const targetDayName = DAYS_TR[targetDayIndex];

                        // Append to existing homework or set new
                        if (newWeeklyHomework[targetDayName]) {
                            newWeeklyHomework[targetDayName] += `\n\n${content}`;
                        } else {
                            newWeeklyHomework[targetDayName] = content;
                        }
                    }
                }
            } else {
                // Unstructured response, assign to lesson day
                const targetDayName = DAYS_TR[lessonDayIndex];
                if (newWeeklyHomework[targetDayName]) {
                    newWeeklyHomework[targetDayName] += `\n\n${aiHomeworkSuggestions}`;
                } else {
                    newWeeklyHomework[targetDayName] = aiHomeworkSuggestions;
                }
            }

            setWeeklyHomework(newWeeklyHomework);
        }

        // Switch to notes tab to show the changes
        setDetailActiveTab('notes');
        alert('AI önerileri ders notlarına ve ödev programına eklendi!');
    };

    const handleWhatsAppShare = () => {
        if (!selectedStudent || !selectedLesson) return;

        // Current week's homework from program
        let currentHomeworkText = '';
        if (currentWeeklyProgram) {
            currentHomeworkText = currentWeeklyProgram.days
                .filter(day => day.tasks.length > 0)
                .map(day => `*${day.day}:*\n${day.tasks.map(t => `- ${t.description}`).join('\n')}`)
                .join('\n\n');
        }

        // If program is empty, fallback to legacy homework list
        if (!currentHomeworkText) {
            currentHomeworkText = Object.entries(weeklyHomework)
                .filter(([_, hw]) => hw.trim() !== '')
                .map(([day, hw]) => `*${day}:*\n${hw}`)
                .join('\n\n');
        }

        // Past week's homework summary
        let pastHomeworkText = '';
        if (pastWeeklyProgram) {
            const completed: string[] = [];
            const pending: string[] = [];

            pastWeeklyProgram.days.forEach(day => {
                day.tasks.forEach(task => {
                    const taskStr = `${task.description} (${day.day})`;
                    if (task.status === TaskStatus.Completed) {
                        completed.push(taskStr);
                    } else {
                        pending.push(taskStr);
                    }
                });
            });

            if (completed.length > 0 || pending.length > 0) {
                pastHomeworkText = `✅ *Yapılan Ödevler:*\n${completed.length > 0 ? completed.map(t => `- ${t}`).join('\n') : 'Yok'}\n` +
                    `❌ *Eksik/Yapılanmayanlar:*\n${pending.length > 0 ? pending.map(t => `- ${t}`).join('\n') : 'Yok'}\n`;
            }
        }

        let message = `Merhaba ${selectedStudent.name},\n\n` +
            `📚 *${new Date(selectedLesson.startTime).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} Tarihli Ders Özeti*\n\n` +
            `📖 *İşlenen Konu:*\n${detailTopic || 'Belirtilmedi'}\n\n`;

        if (aiSummary) {
            message += `🤖 *AI Özeti:*\n${aiSummary}\n\n`;
        }

        message += `📝 *Ders Notları:*\n${detailLessonNotes || 'Not eklenmedi'}\n\n`;

        if (pastHomeworkText) {
            message += `📊 *Ödev Kontrol (Geçen Hafta):*\n${pastHomeworkText}\n`;
        }

        message += `✏️ *Yeni Haftalık Ödevler:*\n\n${currentHomeworkText || 'Ödev verilmedi'}\n\n` +
            `İyi çalışmalar! 📚✨`;

        const encodedMessage = encodeURIComponent(message);
        const phoneNumber = selectedStudent.contact?.replace(/\D/g, '') || '';

        if (!phoneNumber) {
            alert('Öğrenci telefon numarası bulunamadı. Lütfen öğrenci bilgilerini kontrol edin.');
            return;
        }

        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
    };

    const handleSendHomeworkReminder = () => {
        if (!selectedStudent || !selectedLesson) return;

        // Get today's homework from the weekly homework map
        // The keys in weeklyHomework are 'Pazartesi', 'Salı', etc.
        // We need to find which day matches today (or the lesson day if intended)

        // Strategy: Send the homework for the specific day of the lesson
        const lessonDate = new Date(selectedLesson.startTime);
        let dayIndex = lessonDate.getDay() - 1;
        if (dayIndex === -1) dayIndex = 6; // Sunday fix for Turkish week
        const dayName = DAYS_TR[dayIndex];

        const todaysHomework = weeklyHomework[dayName];

        if (!todaysHomework || todaysHomework.trim() === '') {
            alert('Bu güne ait herhangi bir ödev bulunamadı.');
            return;
        }

        let message = `Merhaba Sayın Veli,\n\n` +
            `📚 *${selectedStudent.name}* için ${dayName} günü ödev hatırlatmasıdır:\n\n` +
            `📝 *Ödev:* ${todaysHomework}\n\n` +
            `İyi akşamlar dileriz.`;

        const encodedMessage = encodeURIComponent(message);

        // Prioritize parent phone if available, fallback to student contact
        const phoneNumber = selectedStudent.parentPhone?.replace(/\D/g, '') || selectedStudent.contact?.replace(/\D/g, '') || '';

        if (!phoneNumber) {
            alert('Veli veya öğrenci telefon numarası bulunamadı. Lütfen öğrenci bilgilerini kontrol edin.');
            return;
        }

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

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [lessonToDelete, setLessonToDelete] = useState<PrivateLesson | null>(null);

    const handleDeleteLesson = (lessonId: string) => {
        const lesson = lessons.find(l => l.id === lessonId);
        if (lesson) {
            setLessonToDelete(lesson);
            setIsDeleteModalOpen(true);
        }
    };

    const confirmDeleteLesson = async (mode: 'single' | 'all') => {
        if (!lessonToDelete) return;

        try {
            if (mode === 'all') {
                // Delete the entire series
                // We need to find all lessons (real, cancelled, etc.) that match this slot
                // and delete them to stop recurrence and remove history for this slot.

                const targetDate = new Date(lessonToDelete.startTime);
                const targetDay = targetDate.getDay();
                const targetHours = targetDate.getHours();
                const targetMinutes = targetDate.getMinutes();
                const studentId = lessonToDelete.studentId;

                // 1. Fetch all lessons for this student/tutor to find matches
                const { data: allStudentLessons, error: fetchError } = await supabase
                    .from('private_lessons')
                    .select('id, start_time')
                    .eq('tutor_id', user.id)
                    .eq('student_id', studentId);

                if (fetchError) throw fetchError;

                // 2. Filter for same slot
                const idsToDelete = allStudentLessons
                    .filter(l => {
                        const d = new Date(l.start_time);
                        return d.getDay() === targetDay &&
                            d.getHours() === targetHours &&
                            d.getMinutes() === targetMinutes;
                    })
                    .map(l => l.id);

                if (idsToDelete.length > 0) {
                    const { error: deleteError } = await supabase
                        .from('private_lessons')
                        .delete()
                        .in('id', idsToDelete);

                    if (deleteError) throw deleteError;
                }

                // Also remove from local state
                // We remove anything that matches the slot
                setLessons(prev => prev.filter(l => {
                    if (l.studentId !== studentId) return true;
                    const d = new Date(l.startTime);
                    return !(d.getDay() === targetDay && d.getHours() === targetHours && d.getMinutes() === targetMinutes);
                }));

                alert('Ders programı tamamen silindi.');
            } else {
                // Single lesson deletion
                // Whether it's virtual or real, we want to "cancel" it for this specific date
                // so it doesn't show up, but acts as a template if it was the source.

                if (lessonToDelete.id.startsWith('virtual-')) {
                    // Insert 'cancelled' record
                    const { error } = await supabase
                        .from('private_lessons')
                        .insert([{
                            tutor_id: user.id,
                            student_id: lessonToDelete.studentId,
                            start_time: lessonToDelete.startTime,
                            end_time: lessonToDelete.endTime,
                            subject: lessonToDelete.subject,
                            status: 'cancelled',
                            color: lessonToDelete.color,
                            grade: lessonToDelete.grade
                        }]);

                    if (error) throw error;
                } else {
                    // Real lesson -> Update status to 'cancelled'
                    // We DO NOT delete it, because if it's the source of a chain, 
                    // deleting it would break the chain for future weeks (or make them disappear).
                    // By marking it cancelled, it stays as a template but is hidden for this week.
                    const { error } = await supabase
                        .from('private_lessons')
                        .update({ status: 'cancelled' })
                        .eq('id', lessonToDelete.id);

                    if (error) throw error;
                }

                // Remove from local state
                setLessons(prev => prev.filter(l => l.id !== lessonToDelete.id));
                alert('Ders bu hafta için silindi.');
            }

            setIsDeleteModalOpen(false);
            setLessonToDelete(null);
            if (selectedLesson?.id === lessonToDelete.id) {
                setIsStudentDetailModalOpen(false);
            }
        } catch (error) {
            console.error('Error deleting lesson:', error);
            alert('Ders silinirken bir hata oluştu.');
        }
    };



    return (
        <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold font-poppins text-gray-800">Özel Ders Programı</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                    <button
                        onClick={() => setIsAddLessonModalOpen(true)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium flex items-center justify-center space-x-2 text-sm sm:text-base"
                    >
                        <span>Ders Ekle</span>
                    </button>
                    <div className="flex items-center justify-between sm:justify-start bg-gray-50 rounded-lg p-1">
                        <button onClick={handlePrevWeek} className="p-2 hover:bg-white rounded-md transition-colors">
                            ◀
                        </button>
                        <span className="px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm text-center">
                            {weekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - {weekEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </span>
                        <button onClick={handleNextWeek} className="p-2 hover:bg-white rounded-md transition-colors">
                            ▶
                        </button>
                    </div>
                </div>
            </div>

            <CalendarGrid
                weekDays={weekDays}
                timeRange={timeRange}
                DAYS_TR={DAYS_TR}
                getLessonsForDay={getLessonsForDay}
                dropTarget={dropTarget}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
                handleDragStart={handleDragStart}
                handleDragEnd={handleDragEnd}
                handleLessonClick={handleLessonClick}
                handleDeleteLesson={handleDeleteLesson}
            />

            <LessonList
                weekDays={weekDays}
                DAYS_TR={DAYS_TR}
                getLessonsForDay={getLessonsForDay}
                handleLessonClick={handleLessonClick}
                handleDeleteLesson={handleDeleteLesson}
            />

            {isAddLessonModalOpen && (
                <AddLessonModal
                    onClose={() => setIsAddLessonModalOpen(false)}
                    onSubmit={handleAddLesson}
                    allStudents={allStudents}
                    formDay={lessonFormDay}
                    setFormDay={setLessonFormDay}
                    formStudentId={lessonFormStudentId}
                    setFormStudentId={setLessonFormStudentId}
                    formSubject={lessonFormSubject}
                    setFormSubject={setLessonFormSubject}
                    formTime={lessonFormTime}
                    setFormTime={setLessonFormTime}
                    formDuration={lessonFormDuration}
                    setFormDuration={setLessonFormDuration}
                    formColor={lessonFormColor}
                    setFormColor={setLessonFormColor}
                    DAYS_TR={DAYS_TR}
                    DURATION_OPTIONS={DURATION_OPTIONS}
                    COLORS={COLORS}
                />
            )}

            {isStudentDetailModalOpen && selectedStudent && selectedLesson && (
                <StudentDetailModal
                    onClose={() => setIsStudentDetailModalOpen(false)}
                    selectedStudent={selectedStudent}
                    selectedLesson={selectedLesson}
                    detailActiveTab={detailActiveTab}
                    setDetailActiveTab={setDetailActiveTab}
                    detailTopic={detailTopic}
                    setDetailTopic={setDetailTopic}
                    detailLessonNotes={detailLessonNotes}
                    setDetailLessonNotes={setDetailLessonNotes}
                    weeklyHomework={weeklyHomework}
                    setWeeklyHomework={setWeeklyHomework}
                    handleSaveStudentDetail={handleSaveStudentDetail}
                    programViewMode={programViewMode}
                    setProgramViewMode={setProgramViewMode}
                    pastWeeklyProgram={pastWeeklyProgram}
                    setPastWeeklyProgram={setPastWeeklyProgram}
                    currentWeeklyProgram={currentWeeklyProgram}
                    setCurrentWeeklyProgram={setCurrentWeeklyProgram}
                    DAYS_TR={DAYS_TR}
                    aiSummary={aiSummary}
                    aiHomeworkSuggestions={aiHomeworkSuggestions ? aiHomeworkSuggestions.split('\n') : []}
                    aiLoading={aiLoading}
                    handleGenerateAISuggestions={handleGenerateAISuggestions}
                    handleApplyAISuggestions={handleApplyAISuggestions}
                    attendanceStatus={attendanceStatus}
                    setAttendanceStatus={setAttendanceStatus}
                    paymentStatus={paymentStatus}
                    setPaymentStatus={setPaymentStatus}
                    paymentAmount={paymentAmount}
                    setPaymentAmount={setPaymentAmount}
                    paymentDate={paymentDate}
                    setPaymentDate={setPaymentDate}
                    paymentNotes={paymentNotes}
                    setPaymentNotes={setPaymentNotes}
                    studentPaymentConfig={studentPaymentConfig}
                    handleSaveAttendance={handleSaveAttendance}
                />
            )}
            {
                isDeleteModalOpen && lessonToDelete && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xl w-full max-w-md">
                            <h2 className="text-xl sm:text-2xl font-bold font-poppins mb-3 sm:mb-4 text-red-600">Dersi Sil</h2>
                            <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
                                Bu dersi nasıl silmek istersiniz?
                            </p>
                            <div className="flex flex-col space-y-3">
                                <button
                                    onClick={() => confirmDeleteLesson('single')}
                                    className="w-full px-3 sm:px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-primary hover:text-primary transition-colors flex items-center justify-between group"
                                >
                                    <div className="text-left flex-1">
                                        <span className="block font-semibold text-gray-900 group-hover:text-primary text-sm sm:text-base">Sadece Bu Dersi Sil</span>
                                        <span className="text-xs sm:text-sm text-gray-500">Sadece bu haftaki ders programdan kaldırılır.</span>
                                    </div>
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-primary flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                <button
                                    onClick={() => confirmDeleteLesson('all')}
                                    className="w-full px-3 sm:px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-red-500 hover:text-red-600 transition-colors flex items-center justify-between group"
                                >
                                    <div className="text-left flex-1">
                                        <span className="block font-semibold text-gray-900 group-hover:text-red-600 text-sm sm:text-base">Tüm Programdan Sil</span>
                                        <span className="text-xs sm:text-sm text-gray-500">Bu ders ve gelecekteki tüm tekrarları silinir.</span>
                                    </div>
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-red-600 flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                            <div className="mt-4 sm:mt-6 flex justify-end">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm sm:text-base"
                                >
                                    İptal
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default PrivateLessonSchedule;
