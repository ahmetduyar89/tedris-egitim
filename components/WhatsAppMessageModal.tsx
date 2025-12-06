import React, { useState, useEffect } from 'react';
import { Student } from '../types';

interface WhatsAppMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    students: Student[];
    initialStudentId?: string;
}

type MessageTemplateType = 'general' | 'homework' | 'payment' | 'exam_info' | 'absent';

const toTitleCase = (str: string) => {
    return str.toLocaleLowerCase('tr-TR').split(' ').map(word => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1)).join(' ');
};

const getFirstName = (fullName: string) => {
    return toTitleCase(fullName).split(' ')[0];
};

const getStudentSuffix = (name: string) => {
    const firstName = getFirstName(name);
    const lastChar = firstName.slice(-1).toLowerCase();
    const vowels = ['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü'];
    const backVowels = ['a', 'ı', 'o', 'u'];
    const frontVowels = ['e', 'i', 'ö', 'ü'];
    // const unrounded = ['a', 'e', 'ı', 'i'];
    // const rounded = ['o', 'ö', 'u', 'ü'];

    if (!vowels.includes(lastChar)) {
        // Ends with consonant
        // Find last vowel
        let lastVowel = 'e'; // fallback
        for (let i = firstName.length - 1; i >= 0; i--) {
            if (vowels.includes(firstName[i].toLowerCase())) {
                lastVowel = firstName[i].toLowerCase();
                break;
            }
        }
        if (backVowels.includes(lastVowel)) return "'ın";
        if (frontVowels.includes(lastVowel)) return "'in";
    } else {
        // Ends with vowel -> 'nın, 'nin
        if (backVowels.includes(lastChar)) return "'nın";
        if (frontVowels.includes(lastChar)) return "'nin";
    }
    return "'in"; // Default fallback
};

type Honorific = 'Sayın' | 'Hanım' | 'Bey';

import { supabase, db } from '../services/dbAdapter';

const TEMPLATES: Record<MessageTemplateType, { label: string; subject: string; body: (s: Student, target: 'parent' | 'student', honorific: Honorific, homeworkInfo?: string) => string }> = {
    general: {
        label: 'Genel Bilgilendirme',
        subject: 'Bilgilendirme',
        body: (s, target, honorific) => {
            let prefix = '';
            if (target === 'parent') {
                const pName = s.parentName ? toTitleCase(s.parentName) : '';
                if (honorific === 'Sayın') prefix = `Merhaba Sayın ${pName || 'Veli'}`;
                else if (pName) prefix = `Merhaba ${getFirstName(pName)} ${honorific}`;
                else prefix = `Merhaba Sayın Veli`;
            } else {
                prefix = `Merhaba ${getFirstName(s.name)}`;
            }

            const studentRef = `${getFirstName(s.name)}${getStudentSuffix(s.name)}`;

            return `${prefix},\n\n${studentRef} ile yaptığımız derslerde işlenilen konular ve ödev takibi hakkında sizi bilgilendirmek isterim.\n\nÖğrencimizin derse katılımı ve ödevlerini yapma durumu sürecin verimliliği açısından çok önemlidir. Bu konuda desteğinizi rica ederim.\n\nİyi günler dilerim.`;
        }
    },
    homework: {
        label: 'Ödev Hatırlatma',
        subject: 'Ödev Takibi',
        body: (s, target, honorific, homeworkInfo) => {
            let prefix = '';
            if (target === 'parent') {
                const pName = s.parentName ? toTitleCase(s.parentName) : '';
                if (honorific === 'Sayın') prefix = `Merhaba Sayın ${pName || 'Veli'}`;
                else if (pName) prefix = `Merhaba ${getFirstName(pName)} ${honorific}`;
                else prefix = `Merhaba Sayın Veli`;
            } else {
                prefix = `Merhaba ${getFirstName(s.name)}`;
            }

            const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long' });
            const studentRef = `${getFirstName(s.name)}${getStudentSuffix(s.name)}`;

            let homeworkText = '';
            if (homeworkInfo) {
                homeworkText = `\n\n📚 *Bu Haftanın Ödevleri:*\n\n${homeworkInfo}`;
            } else {
                homeworkText = `\n\n📚 Verilen ödevlerin düzenli olarak tamamlanması önemlidir.`;
            }

            return `${prefix},\n\n${target === 'parent' ? `${studentRef}` : 'Bugünkü'} ${today} günü için verilen ödevlerini tamamlaması konusunda hatırlatma yapmak istedim.${homeworkText}\n\nDüzenli tekrar ve ödev takibi başarımız için çok önemli.\n\nİyi günler dilerim.`;
        }
    },
    payment: {
        label: 'Ödeme Hatırlatma',
        subject: 'Ödeme Bilgilendirme',
        body: (s, target, honorific) => {
            let prefix = '';
            if (target === 'parent') {
                const pName = s.parentName ? toTitleCase(s.parentName) : '';
                if (honorific === 'Sayın') prefix = `Merhaba Sayın ${pName || 'Veli'}`;
                else if (pName) prefix = `Merhaba ${getFirstName(pName)} ${honorific}`;
                else prefix = `Merhaba Sayın Veli`;
            } else {
                prefix = `Merhaba ${getFirstName(s.name)}`;
            }

            return `${prefix},\n\nÖzel ders ödemesi ile ilgili kısa bir hatırlatma yapmak istedim.\n\nMüsait olduğunuzda bilgi verebilirseniz çok sevinirim.\n\nİyi günler dilerim.`;
        }
    },
    exam_info: {
        label: 'Sınav Bilgilendirme',
        subject: 'Sınav Hazırlığı',
        body: (s, target, honorific) => {
            let prefix = '';
            if (target === 'parent') {
                const pName = s.parentName ? toTitleCase(s.parentName) : '';
                if (honorific === 'Sayın') prefix = `Merhaba Sayın ${pName || 'Veli'}`;
                else if (pName) prefix = `Merhaba ${getFirstName(pName)} ${honorific}`;
                else prefix = `Merhaba Sayın Veli`;
            } else {
                prefix = `Merhaba ${getFirstName(s.name)}`;
            }

            return `${prefix},\n\nYaklaşan sınavlar için hazırlık programımız yoğun bir şekilde devam ediyor. ${target === 'parent' ? 'Öğrencimizin' : 'Senin'} evde yapacağı tekrarlar ve soru çözümleri bu süreçte çok kritik.\n\nBirlikte başaracağımıza inanıyorum.\n\nİyi çalışmalar dilerim.`;
        }
    },
    absent: {
        label: 'Devamsızlık',
        subject: 'Derse Katılım',
        body: (s, target, honorific) => {
            let prefix = '';
            if (target === 'parent') {
                const pName = s.parentName ? toTitleCase(s.parentName) : '';
                if (honorific === 'Sayın') prefix = `Merhaba Sayın ${pName || 'Veli'}`;
                else if (pName) prefix = `Merhaba ${getFirstName(pName)} ${honorific}`;
                else prefix = `Merhaba Sayın Veli`;
            } else {
                prefix = `Merhaba ${getFirstName(s.name)}`;
            }

            return `${prefix},\n\nBugünkü derse katılım ${target === 'parent' ? 'sağlanmadı' : 'sağlamadın'}. Bir sorun yoktur umarım?\n\nTelafi dersi veya sonraki programımız için haberleşebiliriz.\n\nİyi günler dilerim.`;
        }
    }
};

const WhatsAppMessageModal: React.FC<WhatsAppMessageModalProps> = ({ isOpen, onClose, students, initialStudentId }) => {
    const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId || '');
    const [templateType, setTemplateType] = useState<MessageTemplateType>('general');
    const [messageBody, setMessageBody] = useState('');
    const [targetPhone, setTargetPhone] = useState<'parent' | 'student'>('parent');
    const [honorific, setHonorific] = useState<Honorific>('Hanım');
    const [homeworkInfo, setHomeworkInfo] = useState<string>('');

    // Fetch homework info when student changes or template becomes homework
    useEffect(() => {
        const fetchHomework = async () => {
            if (!selectedStudentId || templateType !== 'homework') {
                setHomeworkInfo('');
                return;
            }

            try {
                // Determine "This Week" range (Monday to Sunday)
                const today = new Date();
                const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
                const diffToMon = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek; // Adjust to Monday

                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() + diffToMon);
                startOfWeek.setHours(0, 0, 0, 0);

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 7); // Next Monday 00:00

                console.log('[WhatsApp Homework] Fetching homework for student:', selectedStudentId);
                console.log('[WhatsApp Homework] Week range:', startOfWeek, 'to', endOfWeek);

                // Map to store merged homeworks: { "Subject": { "Day": "task" } }
                const homeworkMap: Record<string, Record<string, string>> = {};

                // ========================================
                // 1. Fetch from PRIVATE_LESSONS (Özel Ders Programı)
                // ========================================
                const { data: lessonsData, error: lessonsError } = await supabase
                    .from('private_lessons')
                    .select('homework, subject, start_time, status')
                    .eq('student_id', selectedStudentId)
                    .neq('status', 'cancelled');

                console.log('[WhatsApp Homework] Private lessons query result:', { data: lessonsData, error: lessonsError });

                if (!lessonsError && lessonsData && lessonsData.length > 0) {
                    // Filter for THIS WEEK's lessons first
                    const thisWeekLessons = lessonsData.filter(l => {
                        const d = new Date(l.start_time);
                        return d >= startOfWeek && d < endOfWeek;
                    });

                    // If we have lessons this week with homework, we prioritize them
                    let lessonsToProcess = thisWeekLessons.filter(l => l.homework);

                    if (lessonsToProcess.length === 0) {
                        // Fallback: Group by subject and take the latest lesson for each
                        const latestBySubject: Record<string, any> = {};
                        lessonsData.forEach(l => {
                            if (!l.homework) return;
                            if (!latestBySubject[l.subject] || new Date(l.start_time) > new Date(latestBySubject[l.subject].start_time)) {
                                latestBySubject[l.subject] = l;
                            }
                        });
                        lessonsToProcess = Object.values(latestBySubject);
                    }

                    // Process the selected lessons
                    lessonsToProcess.forEach(l => {
                        if (!homeworkMap[l.subject]) {
                            homeworkMap[l.subject] = {};
                        }

                        try {
                            const parsed = JSON.parse(l.homework);
                            Object.entries(parsed).forEach(([day, task]) => {
                                if (typeof task === 'string' && task.trim()) {
                                    if (homeworkMap[l.subject][day]) {
                                        if (!homeworkMap[l.subject][day].includes(task.trim())) {
                                            homeworkMap[l.subject][day] += ` | ${task.trim()}`;
                                        }
                                    } else {
                                        homeworkMap[l.subject][day] = task.trim();
                                    }
                                }
                            });
                        } catch (e) {
                            // Legacy text fallback
                            if (typeof l.homework === 'string' && l.homework.trim()) {
                                const lessonDate = new Date(l.start_time);
                                const dayName = lessonDate.toLocaleDateString('tr-TR', { weekday: 'long' });
                                const normalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase();

                                if (homeworkMap[l.subject][normalizedDay]) {
                                    homeworkMap[l.subject][normalizedDay] += ` | ${l.homework.trim()}`;
                                } else {
                                    homeworkMap[l.subject][normalizedDay] = l.homework.trim();
                                }
                            }
                        }
                    });
                }

                // ========================================
                // 2. Fetch from ASSIGNMENTS (Tedris Plan - Öğrenci Sayfası)
                // ========================================
                const { data: assignmentsData, error: assignmentsError } = await supabase
                    .from('assignments')
                    .select('title, description, subject, due_date, status')
                    .eq('student_id', selectedStudentId)
                    .gte('due_date', startOfWeek.toISOString())
                    .lt('due_date', endOfWeek.toISOString());

                console.log('[WhatsApp Homework] Assignments query result:', { data: assignmentsData, error: assignmentsError });

                if (!assignmentsError && assignmentsData && assignmentsData.length > 0) {
                    assignmentsData.forEach(assignment => {
                        const subject = assignment.subject || 'Genel';
                        const dueDate = new Date(assignment.due_date);
                        const dayName = dueDate.toLocaleDateString('tr-TR', { weekday: 'long' });
                        const normalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase();

                        if (!homeworkMap[subject]) {
                            homeworkMap[subject] = {};
                        }

                        const taskText = assignment.description || assignment.title;
                        if (taskText && taskText.trim()) {
                            if (homeworkMap[subject][normalizedDay]) {
                                if (!homeworkMap[subject][normalizedDay].includes(taskText.trim())) {
                                    homeworkMap[subject][normalizedDay] += ` | ${taskText.trim()}`;
                                }
                            } else {
                                homeworkMap[subject][normalizedDay] = taskText.trim();
                            }
                        }
                    });
                }

                // ========================================
                // 3. Fetch from WEEKLY_PROGRAMS (Tedris Plan - Haftalık Görevler)
                // ========================================
                // Use Firebase to match StudentDashboard data source
                try {
                    const programSnapshot = await db.collection('weeklyPrograms')
                        .where('studentId', '==', selectedStudentId)
                        .limit(1)
                        .get();

                    console.log('[WhatsApp Homework] Weekly programs query result:', {
                        empty: programSnapshot.empty
                    });

                    if (!programSnapshot.empty) {
                        const programDoc = programSnapshot.docs[0];
                        const weeklyProgramData = programDoc.data();

                        console.log('[WhatsApp Homework] Weekly program data:', weeklyProgramData);

                        if (weeklyProgramData && weeklyProgramData.days) {
                            const days = weeklyProgramData.days;

                            days.forEach((day: any) => {
                                const dayName = day.day;
                                const tasks = day.tasks || [];

                                tasks.forEach((task: any) => {
                                    // Only include tasks that are of type "Ödev" (homework)
                                    if (task.type === 'Ödev') {
                                        const subject = task.subject || 'Genel';
                                        const taskText = task.description || task.title;

                                        if (!homeworkMap[subject]) {
                                            homeworkMap[subject] = {};
                                        }

                                        if (taskText && taskText.trim()) {
                                            if (homeworkMap[subject][dayName]) {
                                                if (!homeworkMap[subject][dayName].includes(taskText.trim())) {
                                                    homeworkMap[subject][dayName] += ` | ${taskText.trim()}`;
                                                }
                                            } else {
                                                homeworkMap[subject][dayName] = taskText.trim();
                                            }
                                        }
                                    }
                                });
                            });
                        }
                    } else {
                        console.log('[WhatsApp Homework] No weekly program found for student');
                    }
                } catch (weeklyProgramError) {
                    console.error('[WhatsApp Homework] Error fetching weekly program:', weeklyProgramError);
                }

                // ========================================
                // 4. Format the output
                // ========================================
                const allHomeworks: string[] = [];
                const subjectEmojis: Record<string, string> = {
                    'Matematik': '🔢',
                    'Fizik': '⚛️',
                    'Kimya': '🧪',
                    'Biyoloji': '🧬',
                    'Türkçe': '📖',
                    'İngilizce': '🇬🇧',
                    'Tarih': '📜',
                    'Coğrafya': '🌍',
                    'Geometri': '📐',
                    'Edebiyat': '✍️',
                };

                console.log('[WhatsApp Homework] Final homework map:', homeworkMap);

                Object.keys(homeworkMap).sort().forEach(subject => {
                    const daysObj = homeworkMap[subject];
                    const days = Object.keys(daysObj);

                    if (days.length > 0) {
                        const emoji = subjectEmojis[subject] || '📝';
                        allHomeworks.push(`${emoji} *${subject}*`);

                        // Sort days by Turkish week order
                        const TR_DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
                        days.sort((a, b) => {
                            return TR_DAYS.indexOf(a) - TR_DAYS.indexOf(b);
                        });

                        days.forEach(day => {
                            allHomeworks.push(`  • ${day}: ${daysObj[day]}`);
                        });
                        allHomeworks.push(''); // spacing
                    }
                });

                console.log('[WhatsApp Homework] All homeworks array:', allHomeworks);

                if (allHomeworks.length > 0) {
                    const finalHomework = allHomeworks.join('\n').trim();
                    console.log('[WhatsApp Homework] Final homework info:', finalHomework);
                    setHomeworkInfo(finalHomework);
                } else {
                    console.log('[WhatsApp Homework] No homework found from any source');
                    setHomeworkInfo('');
                }


            } catch (err) {
                console.error('Error in fetchHomework:', err);
                setHomeworkInfo('');
            }
        };

        fetchHomework();
    }, [selectedStudentId, templateType]);

    // Update message body whenever dependencies change
    useEffect(() => {
        if (!isOpen) return;

        // If initialStudentId is provided but not yet selected (on first open)
        if (initialStudentId && !selectedStudentId) {
            setSelectedStudentId(initialStudentId);
            return;
        }

        const student = students.find(s => s.id === selectedStudentId);
        if (student) {
            setMessageBody(TEMPLATES[templateType].body(student, targetPhone, honorific, homeworkInfo));
        } else {
            setMessageBody('');
        }
    }, [isOpen, selectedStudentId, templateType, targetPhone, honorific, homeworkInfo, initialStudentId, students]);


    const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const sid = e.target.value;
        setSelectedStudentId(sid);
    };

    const handleTemplateChange = (type: MessageTemplateType) => {
        setTemplateType(type);
    };

    const handleSend = () => {
        const student = students.find(s => s.id === selectedStudentId);
        if (!student) return;

        let rawPhone = '';
        if (targetPhone === 'parent') {
            rawPhone = student.parentPhone || student.contact || '';
        } else {
            // Priority to student contact
            const studentContact = student.contact?.replace(/\D/g, '') || '';
            // If student contact is missing or looks too short to be valid (less than 10 digits), try parent
            if (studentContact.length < 10) {
                rawPhone = student.parentPhone || '';
            } else {
                rawPhone = student.contact || '';
            }
        }

        // Clean phone number
        let phone = rawPhone.replace(/\D/g, '');

        // Remove leading '00' if present (e.g., 0090...)
        if (phone.startsWith('00')) {
            phone = phone.substring(2);
        }

        // Basic formatting for TR numbers if missing country code
        if (phone.length === 10 && phone.startsWith('5')) {
            phone = '90' + phone;
        } else if (phone.length === 11 && phone.startsWith('0')) {
            phone = '9' + phone; // Converts 0532... to 90532...
        }

        if (!phone) {
            alert('Seçilen kişi için geçerli bir telefon numarası bulunamadı.');
            return;
        }

        const encodedMessage = encodeURIComponent(messageBody);
        const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        onClose();
    };

    if (!isOpen) return null;

    const selectedStudent = students.find(s => s.id === selectedStudentId);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <span className="bg-green-100 text-green-600 p-2 rounded-full mr-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                        </span>
                        WhatsApp Mesajı Gönder
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto">
                    {/* Student Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci Seç</label>
                        <select
                            value={selectedStudentId}
                            onChange={handleStudentChange}
                            className="w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="">Öğrenci Seçiniz...</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Template Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mesaj Şablonu</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {Object.entries(TEMPLATES).map(([key, template]) => (
                                <button
                                    key={key}
                                    onClick={() => handleTemplateChange(key as MessageTemplateType)}
                                    className={`px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors text-left ${templateType === key
                                        ? 'bg-primary/10 border-primary text-primary font-medium'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {template.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Target Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Alıcı Bilgileri</label>
                        <div className="flex flex-col space-y-3">
                            <div className="flex space-x-4">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={targetPhone === 'parent'}
                                        onChange={() => {
                                            setTargetPhone('parent');
                                        }}
                                        className="text-primary focus:ring-primary h-4 w-4"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        Veli
                                        {selectedStudent?.parentName && <span className="text-xs text-gray-500 ml-1">({selectedStudent.parentName})</span>}
                                        {selectedStudent?.parentPhone && <span className="text-xs text-gray-500 ml-1">({selectedStudent.parentPhone})</span>}
                                    </span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={targetPhone === 'student'}
                                        onChange={() => {
                                            setTargetPhone('student');
                                        }}
                                        className="text-primary focus:ring-primary h-4 w-4"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        Öğrenci
                                        {selectedStudent?.contact && <span className="text-xs text-gray-500 ml-1">({selectedStudent.contact})</span>}
                                    </span>
                                </label>
                            </div>

                            {targetPhone === 'parent' && (
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">Hitap Şekli:</span>
                                    {['Hanım', 'Bey', 'Sayın'].map((h) => (
                                        <button
                                            key={h}
                                            onClick={() => {
                                                setHonorific(h as Honorific);
                                            }}
                                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${honorific === h
                                                ? 'bg-primary/10 border-primary text-primary font-medium'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {h}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Message Body */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj İçeriği</label>
                        <textarea
                            value={messageBody}
                            onChange={(e) => setMessageBody(e.target.value)}
                            rows={6}
                            className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            placeholder="Mesajınızı buraya yazınız..."
                        />
                        <p className="text-xs text-gray-500 mt-1 text-right">
                            * WhatsApp Web açılacak ve mesaj otomatik doldurulacaktır.
                        </p>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-medium text-sm"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={!selectedStudentId || !messageBody}
                        className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium text-sm shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        WhatsApp ile Gönder
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppMessageModal;
