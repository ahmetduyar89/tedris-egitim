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

import { supabase } from '../services/dbAdapter';

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

            const homeworkText = homeworkInfo ? `\n\nÖdev Detayı: ${homeworkInfo}` : '';

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
                // Get today's details
                const today = new Date();
                const currentDayOfWeek = today.getDay(); // 0=Sunday, 6=Saturday
                const dayName = today.toLocaleDateString('tr-TR', { weekday: 'long' });
                const normalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase();

                // Fetch ALL lessons for this student to find recurring templates
                // We emulate the PrivateLessonSchedule logic which projects past lessons to current week
                const { data, error } = await supabase
                    .from('private_lessons')
                    .select('homework, subject, start_time, status')
                    .eq('student_id', selectedStudentId)
                    .neq('status', 'cancelled'); // Ignore cancelled lessons

                if (error) {
                    console.error('Error fetching homework:', error);
                    setHomeworkInfo('');
                    return;
                }

                if (data && data.length > 0) {
                    const homeworks: string[] = [];
                    // Track unique subjects to avoid duplicates if multiple old lessons exist for same slot
                    const processedSubjects = new Set<string>();

                    // Sort by start_time descending to get most recent version of a lesson first
                    const sortedData = data.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

                    sortedData.forEach(l => {
                        const lessonDate = new Date(l.start_time);
                        // Check if this lesson falls on the same day of the week
                        if (lessonDate.getDay() === currentDayOfWeek) {
                            // If we already added homework for this subject (from a newer record), skip older ones
                            // This is a heuristic: usually one lesson per subject per day
                            if (processedSubjects.has(l.subject)) return;

                            if (!l.homework) return;

                            try {
                                const parsed = JSON.parse(l.homework);
                                const dailyHomework = parsed[normalizedDayName];

                                if (dailyHomework && dailyHomework.trim()) {
                                    homeworks.push(`${l.subject}: ${dailyHomework}`);
                                    processedSubjects.add(l.subject);
                                }
                            } catch (e) {
                                // Legacy text fallback
                                if (l.homework.trim()) {
                                    homeworks.push(`${l.subject}: ${l.homework}`);
                                    processedSubjects.add(l.subject);
                                }
                            }
                        }
                    });

                    if (homeworks.length > 0) {
                        setHomeworkInfo(homeworks.join('\n'));
                    } else {
                        setHomeworkInfo('');
                    }
                } else {
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
