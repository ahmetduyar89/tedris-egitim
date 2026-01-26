import { Student } from '../types';

export type MessageTemplateType = 'general' | 'homework' | 'payment' | 'exam_info' | 'absent' | 'test_reminder';
export type Honorific = 'Sayın' | 'Hanım' | 'Bey';

export const toTitleCase = (str: string) => {
    return str.toLocaleLowerCase('tr-TR').split(' ').map(word => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1)).join(' ');
};

export const getFirstName = (fullName: string) => {
    return toTitleCase(fullName).split(' ')[0];
};

export const getStudentSuffix = (name: string) => {
    const firstName = getFirstName(name);
    const lastChar = firstName.slice(-1).toLowerCase();
    const vowels = ['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü'];
    const backVowels = ['a', 'ı', 'o', 'u'];
    const frontVowels = ['e', 'i', 'ö', 'ü'];

    if (!vowels.includes(lastChar)) {
        let lastVowel = 'e';
        for (let i = firstName.length - 1; i >= 0; i--) {
            if (vowels.includes(firstName[i].toLowerCase())) {
                lastVowel = firstName[i].toLowerCase();
                break;
            }
        }
        if (backVowels.includes(lastVowel)) return "'ın";
        if (frontVowels.includes(lastVowel)) return "'in";
    } else {
        if (backVowels.includes(lastChar)) return "'nın";
        if (frontVowels.includes(lastChar)) return "'nin";
    }
    return "'in";
};

export const TEMPLATES: Record<MessageTemplateType, {
    label: string;
    subject: string;
    body: (s: Student, target: 'parent' | 'student', honorific: Honorific, homeworkInfo?: string, testResultInfo?: string, latestTestInfo?: string, missingTasksInfo?: string, lessonSubject?: string) => string
}> = {
    general: {
        label: 'Genel Bilgilendirme',
        subject: 'Bilgilendirme',
        body: (s, target, honorific, homeworkInfo, testResultInfo, latestTestInfo, missingTasksInfo) => {
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

            let message = `${prefix},\n\n${studentRef} ile yaptığımız derslerde işlenilen konular ve ödev takibi hakkında sizi bilgilendirmek isterim.\n\n`;

            if (missingTasksInfo) {
                message += `⚠️ *Tamamlanmayan Görevler:*\nBu hafta yapılması gereken ancak henüz tamamlanmamış çalışmalar aşağıdadır:\n${missingTasksInfo}\n\n`;
                message += `Bu çalışmaların tamamlanması öğrenme sürecinin devamlılığı için kritiktir. Desteğinizi rica ederim.\n\n`;
            } else {
                message += `Öğrencimizin derse katılımı ve ödevlerini yapma durumu sürecin verimliliği açısından çok önemlidir. Bu konuda desteğinizi rica ederim.\n\n`;
            }

            message += `İyi günler dilerim.`;
            return message;
        }
    },
    homework: {
        label: 'Ödev Hatırlatma',
        subject: 'Ödev Takibi',
        body: (s, target, honorific, homeworkInfo, _1, _2, _3, lessonSubject) => {
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
            const subjectPrefix = lessonSubject ? `*${lessonSubject}* dersi ` : '';

            let homeworkText = '';
            if (homeworkInfo) {
                homeworkText = `\n\n📚 *Bu Haftanın Ödevleri:*\n\n${homeworkInfo}`;
            } else {
                homeworkText = `\n\n📚 Verilen ödevlerin düzenli olarak tamamlanması önemlidir.`;
            }

            return `${prefix},\n\n${target === 'parent' ? `${studentRef}` : ''} ${subjectPrefix}verilen ödevlerin tamamlanması konusunda hatırlatma yapmak istedim.${homeworkText}\n\nDüzenli tekrar ve ödev takibi başarımız için çok önemli.\n\nİyi günler dilerim.`;
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
        body: (s, target, honorific, homeworkInfo, testResultInfo, _1, _2, lessonSubject) => {
            let prefix = '';
            if (target === 'parent') {
                const pName = s.parentName ? toTitleCase(s.parentName) : '';
                if (honorific === 'Sayın') prefix = `Merhaba Sayın ${pName || 'Veli'}`;
                else if (pName) prefix = `Merhaba ${getFirstName(pName)} ${honorific}`;
                else prefix = `Merhaba Sayın Veli`;
            } else {
                prefix = `Merhaba ${getFirstName(s.name)}`;
            }

            const studentName = target === 'parent' ? getFirstName(s.name) : '';
            const subjectPrefix = lessonSubject ? `*${lessonSubject}* ` : '';

            let message = `${prefix},\n\n`;

            if (testResultInfo) {
                if (target === 'parent') {
                    message += `${studentName}'nin en son yaptığı ${subjectPrefix}sınav sonucu aşağıdadır:`;
                } else {
                    message += `En son yaptığın ${subjectPrefix}sınav sonucu:`;
                }
                message += testResultInfo;
                message += `\n\n${target === 'parent' ? `${studentName}'nin` : 'Senin'} evde yapacağı tekrarlar ve soru çözümleri başarı için çok önemli.`;
            } else {
                message += `${target === 'parent' ? `${studentName}'nin` : 'Senin'} evde yapacağı tekrarlar ve soru çözümleri başarı için çok önemli.`;
            }

            message += `\n\nBirlikte başaracağımıza inanıyorum.\n\nİyi çalışmalar dilerim.`;

            return message;
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
    },
    test_reminder: {
        label: 'Test Hatırlatma',
        subject: 'Test Ataması',
        body: (s, target, honorific, homeworkInfo, testResultInfo, latestTestInfo) => {
            let prefix = '';
            if (target === 'parent') {
                const pName = s.parentName ? toTitleCase(s.parentName) : '';
                if (honorific === 'Sayın') prefix = `Merhaba Sayın ${pName || 'Veli'}`;
                else if (pName) prefix = `Merhaba ${getFirstName(pName)} ${honorific}`;
                else prefix = `Merhaba Sayın Veli`;
            } else {
                prefix = `Merhaba ${getFirstName(s.name)}`;
            }

            const studentRef = target === 'parent' ? `${getFirstName(s.name)}${getStudentSuffix(s.name)}` : 'sana';

            let message = `${prefix},\n\n`;

            if (latestTestInfo) {
                message += `${studentRef} atanan yeni bir test çalışması bulunmaktadır:\n${latestTestInfo}\n\n`;

                if (target === 'parent') {
                    message += `Öğrencimizin bu testi zamanında tamamlaması gelişim takibi için önemlidir. Kontrolünü rica ederim.`;
                } else {
                    message += `Testini en kısa sürede tamamlamanı bekliyorum. İyi çalışmalar!`;
                }
            } else {
                if (target === 'parent') {
                    message += `${studentRef} atanan testlerin takibi ve tamamlanması konusunda hatırlatma yapmak istedim. Düzenli çalışma başarımız için çok önemlidir.`;
                } else {
                    message += `Atanan testlerini tamamlaman konusunda hatırlatma yapmak istedim. Düzenli çalışma başarımız için çok önemlidir.`;
                }
            }

            message += `\n\nİyi günler dilerim.`;
            return message;
        }
    }
};
