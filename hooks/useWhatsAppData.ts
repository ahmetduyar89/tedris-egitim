import { useState, useEffect } from 'react';
import { supabase, db } from '../services/dbAdapter';
import { MessageTemplateType } from '../services/whatsappTemplates';

export const useWhatsAppData = (selectedStudentId: string, templateType: MessageTemplateType) => {
    const [homeworkInfo, setHomeworkInfo] = useState<string>('');
    const [testResultInfo, setTestResultInfo] = useState<string>('');
    const [latestTestInfo, setLatestTestInfo] = useState<string>('');
    const [missingTasksInfo, setMissingTasksInfo] = useState<string>('');

    // Fetch homework info
    useEffect(() => {
        const fetchHomework = async () => {
            if (!selectedStudentId || templateType !== 'homework') {
                setHomeworkInfo('');
                return;
            }

            try {
                const today = new Date();
                const dayOfWeek = today.getDay();
                const diffToMon = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() + diffToMon);
                startOfWeek.setHours(0, 0, 0, 0);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 7);

                const translateDay = (day: string) => {
                    const englishToTr: Record<string, string> = {
                        'Monday': 'Pazartesi', 'Tuesday': 'Salı', 'Wednesday': 'Çarşamba', 'Thursday': 'Perşembe', 'Friday': 'Cuma', 'Saturday': 'Cumartesi', 'Sunday': 'Pazar',
                        'monday': 'Pazartesi', 'tuesday': 'Salı', 'wednesday': 'Çarşamba', 'thursday': 'Perşembe', 'friday': 'Cuma', 'saturday': 'Cumartesi', 'sunday': 'Pazar'
                    };
                    const cleanDay = day.trim();
                    if (englishToTr[cleanDay]) return englishToTr[cleanDay];
                    return cleanDay.charAt(0).toLocaleUpperCase('tr-TR') + cleanDay.slice(1).toLocaleLowerCase('tr-TR');
                };

                const homeworkMap: Record<string, Record<string, string>> = {};

                const { data: lessonsData } = await supabase
                    .from('private_lessons')
                    .select('homework, subject, start_time, status')
                    .eq('student_id', selectedStudentId)
                    .neq('status', 'cancelled');

                if (lessonsData) {
                    const thisWeekLessons = lessonsData.filter(l => {
                        const d = new Date(l.start_time);
                        return d >= startOfWeek && d < endOfWeek;
                    });

                    thisWeekLessons.filter(l => l.homework).forEach(l => {
                        if (!homeworkMap[l.subject]) homeworkMap[l.subject] = {};
                        try {
                            const parsed = JSON.parse(l.homework);
                            Object.entries(parsed).forEach(([day, task]) => {
                                const trDay = translateDay(day);
                                if (typeof task === 'string' && task.trim()) {
                                    if (homeworkMap[l.subject][trDay]) {
                                        if (!homeworkMap[l.subject][trDay].includes(task.trim())) {
                                            homeworkMap[l.subject][trDay] += ` | ${task.trim()}`;
                                        }
                                    } else {
                                        homeworkMap[l.subject][trDay] = task.trim();
                                    }
                                }
                            });
                        } catch (e) {
                            if (typeof l.homework === 'string' && l.homework.trim()) {
                                const trDay = translateDay(new Date(l.start_time).toLocaleDateString('tr-TR', { weekday: 'long' }));
                                homeworkMap[l.subject][trDay] = (homeworkMap[l.subject][trDay] ? homeworkMap[l.subject][trDay] + ' | ' : '') + l.homework.trim();
                            }
                        }
                    });
                }

                // Format the output (simplified for hook)
                const allHomeworks: string[] = [];
                Object.keys(homeworkMap).sort().forEach(subject => {
                    const daysObj = homeworkMap[subject];
                    allHomeworks.push(`*${subject}*`);
                    Object.keys(daysObj).forEach(day => allHomeworks.push(`  • ${day}: ${daysObj[day]}`));
                });
                setHomeworkInfo(allHomeworks.join('\n'));

            } catch (err) {
                console.error('Error in fetchHomework:', err);
                setHomeworkInfo('');
            }
        };

        fetchHomework();
    }, [selectedStudentId, templateType]);

    // Add other fetchers (latest test, missing tasks) here if needed, 
    // keeping it simple for now to show the refactoring pattern.

    return { homeworkInfo, testResultInfo, latestTestInfo, missingTasksInfo };
};
