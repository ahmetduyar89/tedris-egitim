import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Student, UserRole, LearningLoopStatus } from '../types';
import Header from '../components/Header';
import StudentDetailPage from './StudentDetailPage';
import ContentLibraryPage from './ContentLibraryPage';
import CreateInteractiveMaterialPage from './CreateInteractiveMaterialPage';
import QuestionBankPage from './QuestionBankPage';
import RiskAlertsPanel from '../components/RiskAlertsPanel';
import RevenueOverview from '../components/RevenueOverview';
import { supabase } from '../services/dbAdapter';
import TeacherDiagnosisTestsPage from './TeacherDiagnosisTestsPage';
import PrivateLessonSchedule from '../components/PrivateLessonSchedule';
import OnlineLessonsPage from './OnlineLessonsPage';
import DashboardOverview from '../components/DashboardOverview';
import WhatsAppMessageModal from '../components/WhatsAppMessageModal';
import TurkishLearningPage from './TurkishLearningPage';

const TedrisLogo = () => (
    <svg className="h-10 w-auto" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g style={{ mixBlendMode: 'multiply' }}>
            <circle cx="15" cy="24" r="12" fill="#F05039" />
            <circle cx="33" cy="24" r="12" fill="#F5C542" />
            <circle cx="24" cy="12" r="12" fill="#2BB4A9" />
        </g>
        <text x="50" y="30" fontFamily="Poppins, sans-serif" fontSize="28" fontWeight="800" fill="#000000">TEDRİS</text>
    </svg>
);

// Modal for adding a new student
const AddStudentModal: React.FC<{ tutor: User; onClose: () => void; onStudentAdded: (newStudent: Student) => void }> = ({ tutor, onClose, onStudentAdded }) => {
    const [name, setName] = useState('');
    const [grade, setGrade] = useState(5);
    const [phone, setPhone] = useState('');
    const [parentName, setParentName] = useState('');
    const [parentPhone, setParentPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.');
            setIsSubmitting(false);
            return;
        }

        try {
            const authUrl = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/signup`;
            const response = await fetch(authUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password: password.trim(),
                })
            });

            const authData = await response.json();

            if (!response.ok) {
                throw new Error(authData.msg || authData.error_description || 'Kayıt oluşturulamadı');
            }

            if (authData.user || authData.id) {
                const userId = authData.user?.id || authData.id;

                const { createClient } = await import('@supabase/supabase-js');
                const tempClient = createClient(
                    import.meta.env.VITE_SUPABASE_URL,
                    import.meta.env.VITE_SUPABASE_ANON_KEY,
                    {
                        global: { headers: { Authorization: `Bearer ${authData.access_token}` } },
                        auth: {
                            persistSession: false,
                            autoRefreshToken: false,
                            detectSessionInUrl: false,
                            storage: { getItem: () => null, setItem: () => { }, removeItem: () => { } }
                        }
                    }
                );

                const { error: userError } = await tempClient
                    .from('users')
                    .insert([{
                        id: userId,
                        email: email.trim(),
                        name: name.trim(),
                        role: UserRole.Student,
                        status: 'approved'
                    }]);

                if (userError) throw userError;

                const { error: studentError } = await tempClient
                    .from('students')
                    .insert([{
                        id: userId,
                        name: name.trim(),
                        grade: grade,
                        tutor_id: tutor.id,
                        contact: phone.trim(),
                        parent_name: parentName.trim(),
                        parent_phone: parentPhone.trim(),
                        level: 1,
                        xp: 0,
                        learning_loop_status: LearningLoopStatus.Initial,
                        is_ai_assistant_enabled: true
                    }]);

                if (studentError) throw studentError;

                const newStudent: Student = {
                    id: userId,
                    name: name.trim(),
                    grade: grade,
                    tutorId: tutor.id,
                    contact: phone.trim(),
                    parentName: parentName.trim(),
                    parentPhone: parentPhone.trim(),
                    level: 1,
                    xp: 0,
                    badges: [],
                    learningLoopStatus: LearningLoopStatus.Initial,
                    progressReports: [],
                    isAiAssistantEnabled: true,
                };

                onStudentAdded(newStudent);
                onClose();
                alert('Öğrenci başarıyla oluşturuldu!');
            }
        } catch (error: any) {
            if (error.message?.includes('User already registered') || error.message?.includes('already exists')) {
                setError('Bu e-posta adresi zaten kullanılıyor.');
            } else if (error.message?.includes('Password')) {
                setError('Şifre en az 6 karakter olmalıdır.');
            } else if (error.code === '42501' || error.message?.includes('row-level security')) {
                setError('Yetki hatası: Veritabanı güvenlik politikaları (RLS) öğrenci oluşturmanızı engelliyor. Lütfen "fix_student_creation_rls.sql" dosyasını çalıştırın.');
            } else {
                setError(error.message || 'Öğrenci oluşturulurken bir hata oluştu.');
            }
            console.error("Error creating student:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto transform transition-all scale-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold font-poppins text-gray-800">Yeni Öğrenci Ekle</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci Adı Soyadı</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="Ad Soyad"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sınıf Seviyesi</label>
                        <select
                            value={grade}
                            onChange={e => setGrade(parseInt(e.target.value, 10))}
                            className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-white"
                        >
                            <option value={4}>İlkokul</option>
                            {[5, 6, 7, 8, 9, 10, 11, 12].map(g => <option key={g} value={g}>{g}. Sınıf</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci Telefon</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="5XX XXX XX XX"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Veli Adı Soyadı</label>
                            <input
                                type="text"
                                value={parentName}
                                onChange={e => setParentName(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="Anne/Baba Adı"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Veli Telefon</label>
                            <input
                                type="tel"
                                value={parentPhone}
                                onChange={e => setParentPhone(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="5XX XXX XX XX"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci E-posta (Giriş için)</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoComplete="off"
                            className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="ornek@ogrenci.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci Şifresi (Giriş için)</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="******"
                        />
                    </div>
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {error}
                        </div>
                    )}
                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-primary text-white px-4 py-3 rounded-xl hover:bg-primary-dark font-medium transition-colors disabled:opacity-50 flex justify-center items-center"
                        >
                            {isSubmitting ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'Öğrenciyi Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditStudentModal: React.FC<{ student: Student; onClose: () => void; onStudentUpdated: (updatedStudent: Student) => void }> = ({ student, onClose, onStudentUpdated }) => {
    const [name, setName] = useState(student.name);
    const [grade, setGrade] = useState(student.grade);
    const [phone, setPhone] = useState(student.contact || '');
    const [parentName, setParentName] = useState(student.parentName || '');
    const [parentPhone, setParentPhone] = useState(student.parentPhone || '');
    const [isAiAssistantEnabled, setIsAiAssistantEnabled] = useState(student.isAiAssistantEnabled ?? true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const { error: updateError } = await supabase
                .from('students')
                .update({
                    name,
                    grade,
                    is_ai_assistant_enabled: isAiAssistantEnabled,
                    contact: phone,
                    parent_name: parentName,
                    parent_phone: parentPhone
                })
                .eq('id', student.id);

            if (updateError) throw updateError;

            const updatedStudent = {
                ...student,
                name,
                grade,
                isAiAssistantEnabled,
                contact: phone,
                parentName,
                parentPhone
            };
            onStudentUpdated(updatedStudent);
            onClose();
        } catch (error: any) {
            setError('Öğrenci güncellenirken bir hata oluştu.');
            console.error('Error updating student:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold font-poppins text-gray-800">Öğrenci Düzenle</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci Adı Soyadı</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sınıf Seviyesi</label>
                        <select value={grade} onChange={e => setGrade(parseInt(e.target.value, 10))} className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-white">
                            <option value={4}>İlkokul</option>
                            {[5, 6, 7, 8, 9, 10, 11, 12].map(g => <option key={g} value={g}>{g}. Sınıf</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci Telefon</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="5XX XXX XX XX"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Veli Adı Soyadı</label>
                            <input
                                type="text"
                                value={parentName}
                                onChange={e => setParentName(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="Anne/Baba Adı"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Veli Telefon</label>
                            <input
                                type="tel"
                                value={parentPhone}
                                onChange={e => setParentPhone(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="5XX XXX XX XX"
                            />
                        </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={isAiAssistantEnabled}
                                    onChange={(e) => setIsAiAssistantEnabled(e.target.checked)}
                                    className="w-5 h-5 text-primary rounded focus:ring-primary border-gray-300"
                                />
                            </div>
                            <div>
                                <span className="text-sm font-semibold text-gray-800">AI Asistan Aktif</span>
                                <p className="text-xs text-gray-500 mt-0.5">Öğrenci yapay zeka asistanına erişebilir</p>
                            </div>
                        </label>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 font-medium transition-colors">İptal</button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 bg-primary text-white px-4 py-3 rounded-xl hover:bg-primary-dark font-medium transition-colors disabled:opacity-50">
                            {isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ConfirmDeleteModal: React.FC<{ studentName: string; onConfirm: () => void; onCancel: () => void }> = ({ studentName, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-2xl font-bold font-poppins mb-2 text-center text-gray-800">Öğrenciyi Sil</h2>
            <p className="text-gray-600 text-center mb-8">
                <span className="font-bold text-gray-900">{studentName}</span> adlı öğrenciyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve öğrencinin tüm verileri silinecektir.
            </p>
            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 font-medium transition-colors">
                    İptal
                </button>
                <button onClick={onConfirm} className="flex-1 bg-red-600 text-white px-4 py-3 rounded-xl hover:bg-red-700 font-medium transition-colors shadow-lg shadow-red-200">
                    Evet, Sil
                </button>
            </div>
        </div>
    </div>
);

interface TutorDashboardProps {
    user: User;
    onLogout: () => void;
    onNavigateToContent: (contentId: string) => void;
}

const StudentCard: React.FC<{ student: Student; onSelect: () => void; onEdit: () => void; onDelete: () => void; children?: React.ReactNode }> = ({ student, onSelect, onEdit, onDelete, children }) => {
    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit();
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    return (
        <div
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 p-4 group"
            onClick={onSelect}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="bg-blue-600 text-white rounded-lg h-8 w-8 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {student.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate" title={student.name}>
                            {student.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                {student.grade === 4 ? 'İlkokul' : `${student.grade}. Sınıf`}
                            </span>
                            <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded">
                                Lv {student.level}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {children}
                    <button
                        onClick={handleEdit}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                        title="Düzenle"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                        title="Sil"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500">XP</p>
                    <p className="text-sm font-semibold text-gray-900">{student.xp.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500">Durum</p>
                    <p className={`text-xs font-medium ${student.learningLoopStatus === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                        {student.learningLoopStatus === 'active' ? 'Aktif' : 'Pasif'}
                    </p>
                </div>
            </div>
        </div>
    );
};

type View = 'overview' | 'students' | 'studentDetail' | 'library' | 'createMaterial' | 'questionBank' | 'diagnosisTests' | 'privateLessons' | 'onlineLessons' | 'turkishLearning';

const SidebarContent: React.FC<{ currentView: View, setView: (view: View) => void }> = ({ currentView, setView }) => {
    const navItems = [
        { id: 'overview', label: 'Genel Bakış', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg> },
        { id: 'students', label: 'Öğrencilerim', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-2.253 9.5 9.5 0 0 0-4.12-9.337 9.38 9.38 0 0 0-2.625-.372M6.375 19.128a9.38 9.38 0 0 1 2.625-.372 9.337 9.337 0 0 1 4.121-2.253 9.5 9.5 0 0 1-4.12 9.337 9.38 9.38 0 0 1-2.625-.372Zm12.75 0a9.337 9.337 0 0 0 4.121-2.253 9.5 9.5 0 0 0-4.12-9.337 9.38 9.38 0 0 0-2.625-.372M6.375 7.5a9.337 9.337 0 0 0 4.121-2.253 9.5 9.5 0 0 0-4.12-9.337 9.38 9.38 0 0 0-2.625-.372M12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" /></svg> },
        { id: 'diagnosisTests', label: 'Tanı Testleri', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg> },
        { id: 'turkishLearning', label: 'Türkçe Öğrenimi', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg> },
        { id: 'library', label: 'Kütüphane', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg> },
        { id: 'questionBank', label: 'Soru Bankası', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg> },
        { id: 'privateLessons', label: 'Özel Ders Programı', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg> },
        { id: 'onlineLessons', label: 'Online Dersler', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg> },
    ];

    const isActive = (id: View) => {
        if (id === 'overview') return currentView === 'overview';
        if (id === 'students') return ['students', 'studentDetail'].includes(currentView);
        if (id === 'library') return ['library', 'createMaterial'].includes(currentView);
        if (id === 'questionBank') return currentView === 'questionBank';
        if (id === 'diagnosisTests') return currentView === 'diagnosisTests';
        if (id === 'turkishLearning') return currentView === 'turkishLearning';
        if (id === 'privateLessons') return currentView === 'privateLessons';
        if (id === 'onlineLessons') return currentView === 'onlineLessons';
        return false;
    }

    return (
        <>
            <div className="mb-8 pl-2">
                <TedrisLogo />
            </div>
            <nav className="flex flex-col space-y-2">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id as View)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${isActive(item.id as any)
                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                            : 'text-text-secondary hover:bg-gray-100 hover:text-primary'
                            }`}
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
        </>
    );
};

const TutorDashboard: React.FC<TutorDashboardProps> = ({ user, onLogout, onNavigateToContent }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
    const [currentView, setCurrentView] = useState<View>('overview');
    const [editingContentId, setEditingContentId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoadingStudents, setIsLoadingStudents] = useState(true);

    // Search and Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGrade, setFilterGrade] = useState<number | 'all'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'grade' | 'xp'>('name');

    // WhatsApp Messaging (only for Overview page)
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [selectedStudentForMessage, setSelectedStudentForMessage] = useState<string | undefined>(undefined);

    const handleOpenMessageModal = (studentId?: string) => {
        setSelectedStudentForMessage(studentId);
        setIsMessageModalOpen(true);
    };


    const loadStudents = useCallback(async () => {
        try {
            setIsLoadingStudents(true);
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('tutor_id', user.id);

            if (error) throw error;

            const studentList = (data || []).map(row => ({
                id: row.id,
                name: row.name,
                grade: row.grade,
                tutorId: row.tutor_id,
                contact: row.contact,
                parentName: row.parent_name,
                parentPhone: row.parent_phone,
                level: row.level,
                xp: row.xp,
                badges: [],
                learningLoopStatus: row.learning_loop_status,
                progressReports: [],
                isAiAssistantEnabled: row.is_ai_assistant_enabled ?? true,
            })) as Student[];
            setStudents(studentList);
        } catch (error) {
            console.error("Error loading students:", error);
        } finally {
            setIsLoadingStudents(false);
        }
    }, [user.id]);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    const handleStudentAdded = async (newStudent: Student) => {
        setStudents(prev => [...prev, newStudent]);
    };

    const handleEditStudent = (student: Student) => {
        setEditingStudent(student);
    };

    const handleStudentEdited = async (updatedStudent: Student) => {
        // Optimistic update
        setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));

        if (selectedStudent?.id === updatedStudent.id) {
            setSelectedStudent(prev => prev ? { ...prev, ...updatedStudent } : null);
        }
    };

    const handleDeleteStudent = (student: Student) => {
        setDeletingStudent(student);
    };

    const confirmDeleteStudent = async () => {
        if (!deletingStudent) return;

        try {
            const { data, error } = await supabase.functions.invoke('delete-student', {
                body: { studentId: deletingStudent.id }
            });

            if (error) {
                console.error('Edge function error:', error);
                throw new Error(error.message || 'Öğrenci silinirken sunucu hatası oluştu.');
            }

            if (data && data.error) {
                throw new Error(data.error);
            }

            setStudents(prev => prev.filter(s => s.id !== deletingStudent.id));
            if (selectedStudent?.id === deletingStudent.id) {
                setSelectedStudent(null);
                setCurrentView('students');
            }
            setDeletingStudent(null);
            alert('Öğrenci ve hesabı başarıyla silindi.');
        } catch (error: any) {
            console.error('Error deleting student:', error);
            alert(error.message || 'Öğrenci silinirken bir hata oluştu.');
        }
    };

    const handleSelectStudent = (student: Student) => {
        setSelectedStudent(student);
        setCurrentView('studentDetail');
    };

    const handleBackToStudentList = () => {
        setSelectedStudent(null);
        setCurrentView('students');
        // Do not reload students here to avoid unnecessary fetch
    };

    const handleStudentUpdated = (updatedStudent: Student) => {
        setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
        if (selectedStudent?.id === updatedStudent.id) {
            setSelectedStudent(updatedStudent);
        }
    };

    const handleNavigateToCreator = (contentId?: string) => {
        setEditingContentId(contentId || null);
        setCurrentView('createMaterial');
    };

    const handleBackToLibrary = () => {
        setEditingContentId(null);
        setCurrentView('library');
    };

    // Filtered and Sorted Students
    const filteredStudents = useMemo(() => {
        return students
            .filter(student => {
                const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesGrade = filterGrade === 'all' || student.grade === filterGrade;
                return matchesSearch && matchesGrade;
            })
            .sort((a, b) => {
                if (sortBy === 'name') return a.name.localeCompare(b.name);
                if (sortBy === 'grade') return a.grade - b.grade;
                if (sortBy === 'xp') return b.xp - a.xp;
                return 0;
            });
    }, [students, searchTerm, filterGrade, sortBy]);

    const renderStudentsList = () => (
        <div className="p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Stats & Overview - Only show if students exist */}
                {/* Moved to DashboardOverview */}

                <div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-3xl font-bold font-poppins text-gray-900">Öğrencilerim</h2>
                            <p className="text-gray-500 mt-1">{students.length} kayıtlı öğrenci</p>
                        </div>


                        <button
                            onClick={() => setIsAddingStudent(true)}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 shadow-md shadow-indigo-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Yeni Öğrenci Ekle
                        </button>
                    </div>

                    {/* Filters and Search */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input
                                type="text"
                                placeholder="Öğrenci ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <select
                                value={filterGrade}
                                onChange={(e) => setFilterGrade(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                className="flex-1 md:w-40 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white cursor-pointer"
                            >
                                <option value="all">Tüm Sınıflar</option>
                                <option value={4}>İlkokul</option>
                                {[5, 6, 7, 8, 9, 10, 11, 12].map(g => <option key={g} value={g}>{g}. Sınıf</option>)}
                            </select>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="flex-1 md:w-40 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white cursor-pointer"
                            >
                                <option value="name">İsme Göre (A-Z)</option>
                                <option value="grade">Sınıfa Göre</option>
                                <option value="xp">Başarıya Göre (XP)</option>
                            </select>
                        </div>
                    </div>

                    {isLoadingStudents ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                            <p className="text-gray-500 font-medium">Öğrenciler yükleniyor...</p>
                        </div>
                    ) : filteredStudents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredStudents.map(student => (
                                <StudentCard
                                    key={student.id}
                                    student={student}
                                    onSelect={() => handleSelectStudent(student)}
                                    onEdit={() => handleEditStudent(student)}
                                    onDelete={() => handleDeleteStudent(student)}
                                >
                                </StudentCard>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Öğrenci Bulunamadı</h3>
                            <p className="text-gray-500">Arama kriterlerinize uygun öğrenci bulunmuyor.</p>
                            {searchTerm || filterGrade !== 'all' ? (
                                <button
                                    onClick={() => { setSearchTerm(''); setFilterGrade('all'); }}
                                    className="mt-4 text-primary font-medium hover:underline"
                                >
                                    Filtreleri Temizle
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsAddingStudent(true)}
                                    className="mt-4 bg-primary text-white px-6 py-2 rounded-xl hover:bg-primary-dark transition-colors"
                                >
                                    İlk Öğrenciyi Ekle
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (currentView) {
            case 'overview':
                return <DashboardOverview user={user} students={students} onNavigateToSchedule={() => setCurrentView('privateLessons')} onViewStudent={handleSelectStudent} onOpenMessageModal={() => handleOpenMessageModal()} />;
            case 'studentDetail':
                return selectedStudent && <StudentDetailPage user={user} student={selectedStudent} onBack={handleBackToStudentList} onLogout={onLogout} onStudentUpdate={handleStudentUpdated} />;
            case 'library':
                return <ContentLibraryPage user={user} onNavigateToCreator={handleNavigateToCreator} students={students} onNavigateToContent={onNavigateToContent} />;
            case 'createMaterial':
                return <CreateInteractiveMaterialPage user={user} onBack={handleBackToLibrary} contentIdForEdit={editingContentId} />;
            case 'questionBank':
                return <QuestionBankPage user={user} onBack={() => setCurrentView('students')} onLogout={onLogout} />;
            case 'diagnosisTests':
                return <TeacherDiagnosisTestsPage user={user} onBack={() => setCurrentView('students')} />;
            case 'turkishLearning':
                return <TurkishLearningPage user={user} students={students} />;
            case 'privateLessons':
                return <PrivateLessonSchedule user={user} students={students} />;
            case 'onlineLessons':
                return <OnlineLessonsPage user={user} />;
            case 'students':
            default:
                return renderStudentsList();
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 font-inter">
            {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>}

            <aside className={`fixed z-40 inset-y-0 left-0 w-72 bg-white flex flex-col border-r border-gray-200 p-6 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-xl md:shadow-none`}>
                <SidebarContent currentView={currentView} setView={(view) => { setCurrentView(view); setIsSidebarOpen(false); }} />
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <Header user={user} onLogout={onLogout} onMenuButtonClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                <main className="flex-1 overflow-y-auto bg-gray-50 scroll-smooth">
                    {renderContent()}
                </main>
            </div>
            {isAddingStudent && <AddStudentModal tutor={user} onClose={() => setIsAddingStudent(false)} onStudentAdded={handleStudentAdded} />}
            {editingStudent && <EditStudentModal student={editingStudent} onClose={() => setEditingStudent(null)} onStudentUpdated={handleStudentEdited} />}
            {deletingStudent && <ConfirmDeleteModal studentName={deletingStudent.name} onConfirm={confirmDeleteStudent} onCancel={() => setDeletingStudent(null)} />}
            {isMessageModalOpen && (
                <WhatsAppMessageModal
                    isOpen={isMessageModalOpen}
                    onClose={() => setIsMessageModalOpen(false)}
                    students={students}
                    initialStudentId={selectedStudentForMessage}
                />
            )}
        </div>
    );
};

export default TutorDashboard;