import React, { useState, useEffect } from 'react';
import { supabase } from '../services/dbAdapter';
import { User, PrivateLesson, Student } from '../types';
import OnlineLessonRoom from '../components/OnlineLessonRoom';

interface OnlineLessonsPageProps {
    user: User;
}

const OnlineLessonsPage: React.FC<OnlineLessonsPageProps> = ({ user }) => {
    const [lessons, setLessons] = useState<PrivateLesson[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeLesson, setActiveLesson] = useState<PrivateLesson | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<PrivateLesson | null>(null);

    // Form State
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState(60);

    useEffect(() => {
        fetchData();
    }, [user.id]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch Students
            const { data: studentsData, error: studentsError } = await supabase
                .from('students')
                .select('*')
                .eq('tutor_id', user.id);

            if (studentsError) throw studentsError;
            setStudents(studentsData || []);

            // Fetch Lessons (Only future or recent past, and not cancelled)
            // We'll fetch all and filter client side for simplicity or add filters here
            const { data: lessonsData, error: lessonsError } = await supabase
                .from('private_lessons')
                .select('*')
                .eq('tutor_id', user.id)
                .neq('status', 'cancelled')
                .order('start_time', { ascending: true });

            if (lessonsError) throw lessonsError;

            // Map DB fields to PrivateLesson type
            const mappedLessons = (lessonsData || []).map((l: any) => ({
                id: l.id,
                tutorId: l.tutor_id,
                studentId: l.student_id,
                studentName: studentsData?.find(s => s.id === l.student_id)?.name || 'Bilinmeyen Öğrenci',
                startTime: l.start_time,
                endTime: l.end_time,
                subject: l.subject,
                topic: l.topic,
                status: l.status,
                duration: l.duration || 60,
                color: l.color
            }));

            setLessons(mappedLessons);

        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Veriler yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (lesson?: PrivateLesson) => {
        if (lesson) {
            setEditingLesson(lesson);
            setSelectedStudentId(lesson.studentId || '');
            setSubject(lesson.subject);
            setTopic(lesson.topic || '');

            const d = new Date(lesson.startTime);
            setDate(d.toISOString().split('T')[0]);
            setTime(d.toTimeString().slice(0, 5));
            setDuration(lesson.duration || 60);
        } else {
            setEditingLesson(null);
            setSelectedStudentId('');
            setSubject('Matematik');
            setTopic('');
            setDate(new Date().toISOString().split('T')[0]);
            setTime('10:00');
            setDuration(60);
        }
        setIsModalOpen(true);
    };

    const handleSaveLesson = async () => {
        if (!selectedStudentId || !date || !time) {
            alert('Lütfen tüm zorunlu alanları doldurun.');
            return;
        }

        try {
            const startDateTime = new Date(`${date}T${time}`);
            const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

            const lessonData = {
                tutor_id: user.id,
                student_id: selectedStudentId,
                subject,
                topic,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                duration,
                status: 'scheduled',
                color: '#3B82F6' // Default blue for online lessons
            };

            if (editingLesson) {
                const { error } = await supabase
                    .from('private_lessons')
                    .update(lessonData)
                    .eq('id', editingLesson.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('private_lessons')
                    .insert([lessonData]);
                if (error) throw error;
            }

            setIsModalOpen(false);
            fetchData(); // Refresh list
        } catch (error) {
            console.error('Error saving lesson:', error);
            alert('Ders kaydedilirken bir hata oluştu.');
        }
    };

    const handleDeleteLesson = async (id: string) => {
        if (!window.confirm('Bu dersi silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('private_lessons')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setLessons(prev => prev.filter(l => l.id !== id));
        } catch (error) {
            console.error('Error deleting lesson:', error);
            alert('Ders silinirken bir hata oluştu.');
        }
    };

    const handleStartLesson = async (lesson: PrivateLesson) => {
        try {
            // Update status to 'started'
            const { error } = await supabase
                .from('private_lessons')
                .update({ status: 'started' })
                .eq('id', lesson.id);

            if (error) throw error;

            // Open room
            setActiveLesson(lesson);

            // Update local state
            setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, status: 'started' } : l));

        } catch (error) {
            console.error('Error starting lesson:', error);
            alert('Ders başlatılırken bir hata oluştu.');
        }
    };

    const handleCloseRoom = async () => {
        if (!activeLesson) return;

        // Optional: Ask if they want to mark as completed
        if (window.confirm('Dersi tamamlandı olarak işaretlemek ister misiniz?')) {
            try {
                await supabase
                    .from('private_lessons')
                    .update({ status: 'completed' })
                    .eq('id', activeLesson.id);

                setLessons(prev => prev.map(l => l.id === activeLesson.id ? { ...l, status: 'completed' } : l));
            } catch (e) {
                console.error('Error updating status:', e);
            }
        }

        setActiveLesson(null);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {activeLesson && (
                <OnlineLessonRoom
                    roomName={`Tedris-Ders-${activeLesson.id.replace(/[^a-zA-Z0-9]/g, '')}`}
                    userName={user.name}
                    userEmail={user.email}
                    isTeacher={true}
                    onClose={handleCloseRoom}
                />
            )}

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Online Dersler</h1>
                    <p className="text-gray-500">Öğrencilerinizle yapacağınız online dersleri buradan yönetin.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-md"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Yeni Ders Oluştur
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih / Saat</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Öğrenci</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ders / Konu</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {lessons.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        Henüz planlanmış bir online dersiniz yok.
                                    </td>
                                </tr>
                            ) : (
                                lessons.map((lesson) => {
                                    const startTime = new Date(lesson.startTime);
                                    const isToday = new Date().toDateString() === startTime.toDateString();

                                    return (
                                        <tr key={lesson.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {startTime.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' })}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {startTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} ({lesson.duration} dk)
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs mr-3">
                                                        {lesson.studentName?.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-900">{lesson.studentName}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{lesson.subject}</div>
                                                <div className="text-xs text-gray-500">{lesson.topic || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${lesson.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        lesson.status === 'started' ? 'bg-red-100 text-red-800 animate-pulse' :
                                                            'bg-blue-100 text-blue-800'}`}>
                                                    {lesson.status === 'completed' ? 'Tamamlandı' :
                                                        lesson.status === 'started' ? 'Devam Ediyor' : 'Planlandı'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                {lesson.status !== 'completed' && (
                                                    <button
                                                        onClick={() => handleStartLesson(lesson)}
                                                        className={`${lesson.status === 'started' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white px-3 py-1 rounded-md text-xs transition-colors`}
                                                    >
                                                        {lesson.status === 'started' ? 'Derse Dön' : 'Başlat'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleOpenModal(lesson)}
                                                    className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md text-xs transition-colors"
                                                >
                                                    Düzenle
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteLesson(lesson.id)}
                                                    className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md text-xs transition-colors"
                                                >
                                                    Sil
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">
                            {editingLesson ? 'Dersi Düzenle' : 'Yeni Online Ders'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci</label>
                                <select
                                    value={selectedStudentId}
                                    onChange={(e) => setSelectedStudentId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary"
                                >
                                    <option value="">Öğrenci Seçin</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ders</label>
                                <select
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary"
                                >
                                    <option value="Matematik">Matematik</option>
                                    <option value="Fen Bilimleri">Fen Bilimleri</option>
                                    <option value="Türkçe">Türkçe</option>
                                    <option value="İngilizce">İngilizce</option>
                                    <option value="Diğer">Diğer</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Konu (İsteğe Bağlı)</label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Örn: Kesirler"
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Saat</label>
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Süre (Dakika)</label>
                                <div className="flex gap-2">
                                    {[30, 45, 60, 90].map(d => (
                                        <button
                                            key={d}
                                            onClick={() => setDuration(d)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium border ${duration === d ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSaveLesson}
                                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium shadow-md"
                            >
                                {editingLesson ? 'Güncelle' : 'Oluştur'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OnlineLessonsPage;
