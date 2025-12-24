import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/dbAdapter';
import { User, Student, PrivateLesson, Subject, LessonAttendance, StudentPaymentConfig, WeeklyProgram, Task, TaskStatus } from '../types';
import * as optimizedAIService from '../services/optimizedAIService';
import * as privateLessonService from '../services/privateLessonService';
import EditableWeeklySchedule from './EditableWeeklySchedule'; // Verify path
import { db } from '../services/dbAdapter'; // Needed for fetching program



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

                const [currentSnapshot, pastSnapshot] = await Promise.all([
                    db.collection('weeklyPrograms')
                        .where('studentId', '==', studentId)
                        .where('weekId', '==', weekId)
                        .limit(1)
                        .get(),
                    db.collection('weeklyPrograms')
                        .where('studentId', '==', studentId)
                        .where('weekId', '==', pastWeekId)
                        .limit(1)
                        .get()
                ]);

                if (!currentSnapshot.empty) {
                    setCurrentWeeklyProgram({ id: currentSnapshot.docs[0].id, ...currentSnapshot.docs[0].data() } as WeeklyProgram);
                } else {
                    const newProgram: WeeklyProgram = {
                        id: `prog_${Date.now()}_${studentId}_${weekId}`,
                        studentId: studentId,
                        week: 1,
                        weekId: weekId,
                        days: DAYS_TR.map(day => ({ day, tasks: [] }))
                    };
                    await db.collection('weeklyPrograms').doc(newProgram.id).set(newProgram);
                    setCurrentWeeklyProgram(newProgram);
                }

                if (!pastSnapshot.empty) {
                    setPastWeeklyProgram({ id: pastSnapshot.docs[0].id, ...pastSnapshot.docs[0].data() } as WeeklyProgram);
                } else {
                    setPastWeeklyProgram(null);
                }

                setProgramViewMode('current');
            } catch (error) {
                console.error("Error fetching weekly program:", error);
                // Fallback object to prevent crash
                setCurrentWeeklyProgram({
                    id: `temp_${Date.now()}`,
                    studentId: studentId,
                    week: 1,
                    days: DAYS_TR.map(day => ({
                        day,
                        tasks: [] as Task[]
                    }))
                });
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

            {/* Header - Responsive */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold font-poppins text-gray-800">Özel Ders Programı</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                    <button
                        onClick={() => setIsAddLessonModalOpen(true)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium flex items-center justify-center space-x-2 text-sm sm:text-base"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        <span>Ders Ekle</span>
                    </button>
                    <div className="flex items-center justify-between sm:justify-start bg-gray-50 rounded-lg p-1">
                        <button onClick={handlePrevWeek} className="p-2 hover:bg-white rounded-md transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <span className="px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm text-center">
                            {weekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - {weekEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </span>
                        <button onClick={handleNextWeek} className="p-2 hover:bg-white rounded-md transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Weekly Schedule Grid - Desktop View */}
            <div className="hidden lg:block flex-1 overflow-auto">
                <div className="min-w-[1000px]">
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

                                    const isDropTarget = dropTarget?.day === dayIdx && dropTarget?.hour === hour;

                                    return (
                                        <div
                                            key={dayIdx}
                                            className={`border rounded-lg min-h-[80px] relative transition-colors ${isDropTarget ? 'bg-blue-50 border-blue-300 border-2 border-dashed' : 'border-gray-100'
                                                }`}
                                            onDragOver={(e) => handleDragOver(e, dayIdx, hour)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, dayIdx, hour)}
                                        >
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
                                                            title="Dersi Sil"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                        <div
                                                            onClick={() => handleLessonClick(lesson)}
                                                            className="w-full h-full flex flex-col"
                                                        >
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

            {/* Mobile View - List of Lessons by Day */}
            <div className="lg:hidden flex-1 overflow-auto">
                <div className="space-y-4">
                    {weekDays.map((day, dayIdx) => {
                        const dayLessons = getLessonsForDay(dayIdx);
                        const isToday = day.toDateString() === new Date().toDateString();

                        return (
                            <div key={dayIdx} className={`border rounded-xl overflow-hidden ${isToday ? 'border-primary border-2 shadow-md' : 'border-gray-200'}`}>
                                {/* Day Header */}
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

                                {/* Lessons for this day */}
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
                                                            title="Dersi Sil"
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
                                                                <div className="flex items-center space-x-3 text-xs text-gray-600 mb-2">
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
                                            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Ders yok
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Add Lesson Modal */}
            {isAddLessonModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg sm:text-xl font-bold font-poppins mb-2">Yeni Ders Ekle</h3>
                        <p className="text-xs sm:text-sm text-gray-500 mb-4">Programa ders ekle</p>

                        <form onSubmit={handleAddLesson} className="space-y-3 sm:space-y-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Gün</label>
                                <select
                                    value={lessonFormDay}
                                    onChange={e => setLessonFormDay(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm sm:text-base"
                                >
                                    {DAYS_TR.map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Öğrenci Seç</label>
                                <select
                                    value={lessonFormStudentId}
                                    onChange={e => setLessonFormStudentId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm sm:text-base"
                                    required
                                >
                                    <option value="">Öğrenci seçiniz...</option>
                                    {allStudents.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Ders</label>
                                <select
                                    value={lessonFormSubject}
                                    onChange={e => setLessonFormSubject(e.target.value as Subject)}
                                    className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm sm:text-base"
                                >
                                    {Object.values(Subject).map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Saat</label>
                                    <input
                                        type="time"
                                        value={lessonFormTime}
                                        onChange={e => setLessonFormTime(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm sm:text-base"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Süre (Dk)</label>
                                    <select
                                        value={lessonFormDuration}
                                        onChange={e => setLessonFormDuration(parseInt(e.target.value))}
                                        className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm sm:text-base"
                                    >
                                        {DURATION_OPTIONS.map(duration => (
                                            <option key={duration} value={duration}>{duration} dk</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Renk</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.slice(0, 7).map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setLessonFormColor(color)}
                                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 ${lessonFormColor === color ? 'border-gray-800 scale-110' : 'border-gray-200'} transition-transform`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-0 pt-4">
                                <button type="button" onClick={() => setIsAddLessonModalOpen(false)} className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm sm:text-base">
                                    İptal
                                </button>
                                <button type="submit" className="w-full sm:w-auto px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark text-sm sm:text-base">
                                    Ekle
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Student Detail Modal */}
            {isStudentDetailModalOpen && selectedStudent && selectedLesson && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1 flex-wrap">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: selectedLesson.color || '#FFB6C1' }}></div>
                                    <span className="text-xs sm:text-sm text-gray-500">{selectedLesson.subject}</span>
                                    <span className="text-xs sm:text-sm text-gray-500 truncate">
                                        {new Date(selectedLesson.startTime).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
                                    </span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold font-poppins truncate">{selectedStudent.name}</h3>
                            </div>
                            <button onClick={() => setIsStudentDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Tabs - Scrollable on mobile */}
                        <div className="flex border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
                            <button
                                onClick={() => setDetailActiveTab('notes')}
                                className={`px-3 sm:px-6 py-3 font-medium flex items-center space-x-1 sm:space-x-2 whitespace-nowrap flex-shrink-0 text-sm sm:text-base ${detailActiveTab === 'notes' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span>Ders Notları</span>
                            </button>
                            <button
                                onClick={() => setDetailActiveTab('homework')}
                                className={`px-3 sm:px-6 py-3 font-medium flex items-center space-x-1 sm:space-x-2 whitespace-nowrap flex-shrink-0 text-sm sm:text-base ${detailActiveTab === 'homework' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Haftalık Program</span>
                            </button>
                            <button
                                onClick={() => setDetailActiveTab('ai')}
                                className={`px-3 sm:px-6 py-3 font-medium flex items-center space-x-1 sm:space-x-2 whitespace-nowrap flex-shrink-0 text-sm sm:text-base ${detailActiveTab === 'ai' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <span>AI Asistan</span>
                            </button>
                            <button
                                onClick={() => setDetailActiveTab('attendance')}
                                className={`px-3 sm:px-6 py-3 font-medium flex items-center space-x-1 sm:space-x-2 whitespace-nowrap flex-shrink-0 text-sm sm:text-base ${detailActiveTab === 'attendance' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Katılım</span>
                            </button>
                        </div>

                        {/* Tab Content */}
                        {detailActiveTab === 'notes' && (
                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">İşlenen Konu</label>
                                    <input
                                        type="text"
                                        value={detailTopic}
                                        onChange={e => setDetailTopic(e.target.value)}
                                        placeholder="Bugün ne işlendi?"
                                        className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm sm:text-base"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Ders Notları</label>
                                    <textarea
                                        value={detailLessonNotes}
                                        onChange={e => setDetailLessonNotes(e.target.value)}
                                        placeholder="Ders notları..."
                                        className="w-full border border-gray-300 rounded-lg py-2 px-3 h-24 sm:h-32 text-sm sm:text-base"
                                    />
                                </div>

                                <div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700">Ödevler</label>
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
                                            className="text-xs text-primary hover:text-primary-dark flex items-center space-x-1 self-start sm:self-auto"
                                        >
                                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            <span>Haftalık Programdan Aktar</span>
                                        </button>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-40 sm:max-h-48 overflow-y-auto">
                                        {Object.entries(weeklyHomework).filter(([_, hw]) => hw.trim() !== '').length > 0 ? (
                                            <div className="space-y-2">
                                                {Object.entries(weeklyHomework)
                                                    .filter(([_, hw]) => hw.trim() !== '')
                                                    .map(([day, hw]) => (
                                                        <div key={day} className="bg-white rounded-lg p-2 border border-gray-200 group relative pr-8">
                                                            <div className="text-xs font-semibold text-primary mb-1">{day}</div>
                                                            <div className="text-xs sm:text-sm text-gray-700">{hw}</div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setWeeklyHomework(prev => ({ ...prev, [day]: '' }));
                                                                }}
                                                                className="absolute top-1 right-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                                title="Ödevi Sil"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-400 text-xs sm:text-sm py-4">
                                                Henüz ödev eklenmedi. "Haftalık Program" sekmesinden ödev ekleyebilirsiniz.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
                                    <button onClick={() => setIsStudentDetailModalOpen(false)} className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm sm:text-base">
                                        Vazgeç
                                    </button>
                                    <button onClick={handleSaveStudentDetail} className="w-full sm:w-auto px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark text-sm sm:text-base">
                                        Kaydet
                                    </button>
                                </div>
                            </div>
                        )}

                        {detailActiveTab === 'homework' && (
                            <div className="space-y-4">
                                <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                                    <button
                                        onClick={() => setProgramViewMode('past')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${programViewMode === 'past' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        ⏮ Geçen Haftanın Ödev Kontrolü
                                    </button>
                                    <button
                                        onClick={() => setProgramViewMode('current')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${programViewMode === 'current' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        ⏭ Bu Haftanın Ödev Programı
                                    </button>
                                </div>

                                {programViewMode === 'past' ? (
                                    pastWeeklyProgram ? (
                                        <div className="space-y-4 animate-fade-in">
                                            <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg text-sm text-orange-800 flex items-center gap-2">
                                                <span>ℹ️</span>
                                                Geçen haftanın ödevlerini buradan kontrol edip durumunu güncelleyebilirsiniz.
                                            </div>
                                            <EditableWeeklySchedule
                                                program={pastWeeklyProgram}
                                                onProgramUpdate={(updated) => setPastWeeklyProgram(updated)}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                            <span className="text-4xl mb-2">📭</span>
                                            <p>Geçen haftaya ait bir program bulunamadı.</p>
                                        </div>
                                    )
                                ) : (
                                    currentWeeklyProgram ? (
                                        <div className="space-y-4 animate-fade-in">
                                            <EditableWeeklySchedule
                                                program={currentWeeklyProgram}
                                                onProgramUpdate={(updated) => setCurrentWeeklyProgram(updated)}
                                                focusDay={DAYS_TR[(new Date(selectedLesson.startTime).getDay() + 6) % 7]}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                            <svg className="animate-spin h-8 w-8 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <p>Haftalık program yükleniyor...</p>
                                        </div>
                                    )
                                )}

                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                    <div className="text-xs text-gray-400 italic">
                                        * Yapılan değişiklikler otomatik olarak kaydedilir.
                                    </div>
                                    <button
                                        onClick={() => setIsStudentDetailModalOpen(false)}
                                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                                    >
                                        Kapat
                                    </button>
                                </div>
                            </div>
                        )}

                        {detailActiveTab === 'ai' && (
                            <div className="space-y-4 sm:space-y-6">
                                {/* AI Assistant Header */}
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-3 sm:mb-4">
                                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Yapay Zeka Asistanı</h3>
                                    <p className="text-sm sm:text-base text-gray-600">Mevcut konu ve notlarınıza göre ödev önerileri alın.</p>
                                </div>

                                {/* Generate Button */}
                                {!aiSummary && !aiHomeworkSuggestions && (
                                    <div className="text-center py-6 sm:py-8">
                                        <button
                                            onClick={handleGenerateAISuggestions}
                                            disabled={aiLoading || !detailTopic}
                                            className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2 mx-auto shadow-lg text-sm sm:text-base"
                                        >
                                            {aiLoading ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span>Öneriler Oluşturuluyor...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    <span>Öneri Oluştur</span>
                                                </>
                                            )}
                                        </button>
                                        {!detailTopic && (
                                            <p className="text-xs sm:text-sm text-orange-600 mt-4">
                                                ⚠️ Önce "Ders Notları" sekmesinden işlenen konuyu giriniz.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* AI Results */}
                                {(aiSummary || aiHomeworkSuggestions) && (
                                    <div className="space-y-3 sm:space-y-4">
                                        {/* Summary Section */}
                                        {aiSummary && (
                                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                                                <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <h4 className="font-semibold text-blue-900 text-sm sm:text-base">Ders Özeti</h4>
                                                </div>
                                                <p className="text-gray-700 whitespace-pre-wrap text-xs sm:text-sm">{aiSummary}</p>
                                            </div>
                                        )}

                                        {/* Homework Suggestions */}
                                        {aiHomeworkSuggestions && (
                                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 sm:p-4">
                                                <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                    </svg>
                                                    <h4 className="font-semibold text-green-900 text-sm sm:text-base">Ödev Önerileri</h4>
                                                </div>
                                                <p className="text-gray-700 whitespace-pre-wrap text-xs sm:text-sm">{aiHomeworkSuggestions}</p>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 pt-4 border-t">
                                            <button
                                                onClick={() => {
                                                    setAiSummary('');
                                                    setAiHomeworkSuggestions('');
                                                }}
                                                className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center justify-center space-x-2 text-sm sm:text-base order-2 sm:order-1"
                                            >
                                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                <span>Yeniden Oluştur</span>
                                            </button>
                                            <button
                                                onClick={handleApplyAISuggestions}
                                                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 flex items-center justify-center space-x-2 shadow-lg text-sm sm:text-base order-1 sm:order-2"
                                            >
                                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>Ders Notlarına Aktar</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Attendance Tab */}
                        {detailActiveTab === 'attendance' && (
                            <div className="space-y-4 min-h-[400px]">
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <h4 className="font-semibold text-blue-900">Ders Takibi</h4>
                                    </div>
                                    <p className="text-sm text-blue-800">
                                        Bu dersin yapılıp yapılmadığını ve ödeme durumunu buradan takip edebilirsiniz.
                                    </p>
                                </div>

                                {/* Attendance Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Ders Durumu</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAttendanceStatus('completed')}
                                            className={`px-4 py-3 rounded-lg border-2 transition-all ${attendanceStatus === 'completed'
                                                ? 'border-green-500 bg-green-50 text-green-700'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center space-y-1">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span className="text-xs font-medium">Yapıldı</span>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAttendanceStatus('missed')}
                                            className={`px-4 py-3 rounded-lg border-2 transition-all ${attendanceStatus === 'missed'
                                                ? 'border-red-500 bg-red-50 text-red-700'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center space-y-1">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                <span className="text-xs font-medium">Yapılmadı</span>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAttendanceStatus('cancelled')}
                                            className={`px-4 py-3 rounded-lg border-2 transition-all ${attendanceStatus === 'cancelled'
                                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center space-y-1">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                </svg>
                                                <span className="text-xs font-medium">İptal</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Payment Section - Only show if lesson was completed */}
                                {attendanceStatus === 'completed' && (
                                    <div className="space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                                        <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>Ödeme Bilgileri</span>
                                        </h4>

                                        {/* Payment Status */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Durumu</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentStatus('paid')}
                                                    className={`px-3 py-2 rounded-lg border-2 text-sm transition-all ${paymentStatus === 'paid'
                                                        ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                                        }`}
                                                >
                                                    ✓ Ödendi
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentStatus('unpaid')}
                                                    className={`px-3 py-2 rounded-lg border-2 text-sm transition-all ${paymentStatus === 'unpaid'
                                                        ? 'border-red-500 bg-red-50 text-red-700 font-semibold'
                                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                                        }`}
                                                >
                                                    ✗ Ödenmedi
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentStatus('partial')}
                                                    className={`px-3 py-2 rounded-lg border-2 text-sm transition-all ${paymentStatus === 'partial'
                                                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700 font-semibold'
                                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                                        }`}
                                                >
                                                    ◐ Kısmi
                                                </button>
                                            </div>
                                        </div>

                                        {/* Payment Amount */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Ücret (TL)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={paymentAmount}
                                                    onChange={e => setPaymentAmount(e.target.value)}
                                                    onFocus={e => e.target.select()}
                                                    placeholder="0.00"
                                                    className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm"
                                                />
                                                {studentPaymentConfig > 0 && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Varsayılan: {studentPaymentConfig} TL
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Tarihi</label>
                                                <input
                                                    type="date"
                                                    value={paymentDate}
                                                    onChange={e => setPaymentDate(e.target.value)}
                                                    className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Payment Notes */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Notları</label>
                                            <textarea
                                                value={paymentNotes}
                                                onChange={e => setPaymentNotes(e.target.value)}
                                                placeholder="Ödeme ile ilgili notlar..."
                                                className="w-full border border-gray-300 rounded-lg py-2 px-3 h-20 text-sm"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Save Button for Attendance */}
                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={async () => {
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
                                        }}
                                        className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark text-sm font-medium"
                                    >
                                        Katılım Bilgisini Kaydet
                                    </button>
                                </div>


                                {/* Bottom Actions */}
                                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
                                    <button onClick={() => setIsStudentDetailModalOpen(false)} className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm sm:text-base">
                                        Vazgeç
                                    </button>
                                    <button onClick={handleSaveStudentDetail} className="w-full sm:w-auto px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark text-sm sm:text-base">
                                        Kaydet
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )
            }
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
        </div>
    );
};

export default PrivateLessonSchedule;
