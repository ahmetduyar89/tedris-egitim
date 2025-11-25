import React, { useState, useEffect, useCallback } from 'react';
import { User, Student, UserRole, LearningLoopStatus } from '../types';
import Header from '../components/Header';
import StudentDetailPage from './StudentDetailPage';
import ContentLibraryPage from './ContentLibraryPage';
import CreateInteractiveMaterialPage from './CreateInteractiveMaterialPage';
import QuestionBankPage from './QuestionBankPage';
import RiskAlertsPanel from '../components/RiskAlertsPanel';
import { supabase } from '../services/dbAdapter';

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
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.');
            return;
        }

        try {
            // 1. Use direct fetch to Supabase Auth API to avoid triggering global auth state changes
            // This is the most isolated way to create a user without affecting the current session
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

                // 2. We need to insert data into tables.
                // Since we can't use the main supabase client (it's logged in as tutor)
                // and we can't easily get a client for the new user without logging in (which we want to avoid),
                // we will use the "Allow profile creation during registration" policy we created.

                // To do this, we need a client authenticated as the NEW user.
                // We can create a temporary client using the access token we just got.

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

                // 3. Add to public.users table
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

                // 4. Add to students table
                const { error: studentError } = await tempClient
                    .from('students')
                    .insert([{
                        id: userId,
                        name: name.trim(),
                        grade: grade,
                        tutor_id: tutor.id,
                        level: 1,
                        xp: 0,
                        learning_loop_status: LearningLoopStatus.Initial
                    }]);

                if (studentError) throw studentError;

                // 5. Success!
                const newStudent: Student = {
                    id: userId,
                    name: name.trim(),
                    grade: grade,
                    tutorId: tutor.id,
                    level: 1,
                    xp: 0,
                    badges: [],
                    learningLoopStatus: LearningLoopStatus.Initial,
                    progressReports: [],
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
            } else {
                setError(error.message || 'Öğrenci oluşturulurken bir hata oluştu.');
            }
            console.error("Error creating student:", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold font-poppins mb-4">Yeni Öğrenci Ekle</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Öğrenci Adı Soyadı</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Sınıf Seviyesi</label>
                        <select value={grade} onChange={e => setGrade(parseInt(e.target.value, 10))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                            {[5, 6, 7, 8].map(g => <option key={g} value={g}>{g}. Sınıf</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Öğrenci E-posta (Giriş için)</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoComplete="off"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Öğrenci Şifresi (Giriş için)</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600">İptal</button>
                        <button type="submit" className="bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-dark">Öğrenciyi Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditStudentModal: React.FC<{ student: Student; onClose: () => void; onStudentUpdated: (updatedStudent: Student) => void }> = ({ student, onClose, onStudentUpdated }) => {
    const [name, setName] = useState(student.name);
    const [grade, setGrade] = useState(student.grade);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const { error: updateError } = await supabase
                .from('students')
                .update({ name, grade })
                .eq('id', student.id);

            if (updateError) throw updateError;

            const updatedStudent = { ...student, name, grade };
            onStudentUpdated(updatedStudent);
            onClose();
        } catch (error: any) {
            setError('Öğrenci güncellenirken bir hata oluştu.');
            console.error('Error updating student:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold font-poppins mb-4">Öğrenci Düzenle</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Öğrenci Adı Soyadı</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Sınıf Seviyesi</label>
                        <select value={grade} onChange={e => setGrade(parseInt(e.target.value, 10))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                            {[5, 6, 7, 8].map(g => <option key={g} value={g}>{g}. Sınıf</option>)}
                        </select>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600">İptal</button>
                        <button type="submit" className="bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-dark">Güncelle</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ConfirmDeleteModal: React.FC<{ studentName: string; onConfirm: () => void; onCancel: () => void }> = ({ studentName, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold font-poppins mb-4 text-red-600">Öğrenciyi Sil</h2>
            <p className="text-gray-700 mb-6">
                <span className="font-semibold">{studentName}</span> adlı öğrenciyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve öğrencinin tüm verileri silinecektir.
            </p>
            <div className="flex justify-end space-x-3">
                <button onClick={onCancel} className="bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600">
                    İptal
                </button>
                <button onClick={onConfirm} className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700">
                    Sil
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

const StudentCard: React.FC<{ student: Student; onSelect: () => void; onEdit: () => void; onDelete: () => void }> = ({ student, onSelect, onEdit, onDelete }) => {
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
            className="bg-card-background p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer transform hover:-translate-y-1"
            onClick={onSelect}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="bg-primary text-white rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold font-poppins">
                        {student.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold font-poppins text-text-primary">{student.name}</h3>
                        <p className="text-text-secondary">{student.grade}. Sınıf</p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={handleEdit}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Düzenle"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sil"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

type View = 'students' | 'studentDetail' | 'library' | 'createMaterial' | 'questionBank';

const SidebarContent: React.FC<{ currentView: View, setView: (view: View) => void }> = ({ currentView, setView }) => {
    const navItems = [
        { id: 'students', label: 'Öğrencilerim', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-2.253 9.5 9.5 0 0 0-4.12-9.337 9.38 9.38 0 0 0-2.625-.372M6.375 19.128a9.38 9.38 0 0 1 2.625-.372 9.337 9.337 0 0 1 4.121-2.253 9.5 9.5 0 0 1-4.12 9.337 9.38 9.38 0 0 1-2.625-.372Zm12.75 0a9.337 9.337 0 0 0 4.121-2.253 9.5 9.5 0 0 0-4.12-9.337 9.38 9.38 0 0 0-2.625-.372M6.375 7.5a9.337 9.337 0 0 0 4.121-2.253 9.5 9.5 0 0 0-4.12-9.337 9.38 9.38 0 0 0-2.625-.372M12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" /></svg> },
        { id: 'library', label: 'Kütüphane', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg> },
        { id: 'questionBank', label: 'Soru Bankası', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg> },
    ];

    const isActive = (id: 'students' | 'library' | 'questionBank') => {
        if (id === 'students') return ['students', 'studentDetail'].includes(currentView);
        if (id === 'library') return ['library', 'createMaterial'].includes(currentView);
        if (id === 'questionBank') return currentView === 'questionBank';
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
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition-colors ${isActive(item.id as 'students' | 'library')
                            ? 'bg-primary/10 text-primary'
                            : 'text-text-secondary hover:bg-gray-100'
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
    const [currentView, setCurrentView] = useState<View>('students');
    const [editingContentId, setEditingContentId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoadingStudents, setIsLoadingStudents] = useState(true);

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
                level: row.level,
                xp: row.xp,
                badges: [],
                learningLoopStatus: row.learning_loop_status,
                progressReports: [],
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
        await loadStudents();
    };

    const handleEditStudent = (student: Student) => {
        setEditingStudent(student);
    };

    const handleStudentEdited = async (updatedStudent: Student) => {
        await loadStudents();
        if (selectedStudent?.id === updatedStudent.id) {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('id', updatedStudent.id)
                .maybeSingle();

            if (!error && data) {
                setSelectedStudent({
                    id: data.id,
                    name: data.name,
                    grade: data.grade,
                    tutorId: data.tutor_id,
                    contact: data.contact,
                    level: data.level,
                    xp: data.xp,
                    badges: [],
                    learningLoopStatus: data.learning_loop_status,
                    progressReports: [],
                });
            }
        }
    };

    const handleDeleteStudent = (student: Student) => {
        setDeletingStudent(student);
    };

    const confirmDeleteStudent = async () => {
        if (!deletingStudent) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                alert('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
                return;
            }

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const apiUrl = `${supabaseUrl}/functions/v1/delete-student`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentId: deletingStudent.id,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Öğrenci silinirken bir hata oluştu');
            }

            setStudents(prev => prev.filter(s => s.id !== deletingStudent.id));
            if (selectedStudent?.id === deletingStudent.id) {
                setSelectedStudent(null);
                setCurrentView('students');
            }
            setDeletingStudent(null);
            alert('Öğrenci başarıyla silindi.');
        } catch (error) {
            console.error('Error deleting student:', error);
            alert(error instanceof Error ? error.message : 'Öğrenci silinirken bir hata oluştu.');
        }
    };

    const handleSelectStudent = (student: Student) => {
        setSelectedStudent(student);
        setCurrentView('studentDetail');
    };

    const handleBackToStudentList = () => {
        setSelectedStudent(null);
        setCurrentView('students');
        loadStudents(); // Reload students to see any updates
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

    const renderStudentsList = () => (
        <div className="p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {students.length > 0 && (
                    <RiskAlertsPanel students={students} onViewStudent={handleSelectStudent} />
                )}

                <div>
                    <h2 className="text-3xl font-bold font-poppins text-text-primary mb-6">Öğrencilerim</h2>
                    {isLoadingStudents ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <svg className="animate-spin h-12 w-12 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-gray-600 text-lg font-semibold">Öğrenciler yükleniyor...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {students.map(student => (
                                <StudentCard
                                    key={student.id}
                                    student={student}
                                    onSelect={() => handleSelectStudent(student)}
                                    onEdit={() => handleEditStudent(student)}
                                    onDelete={() => handleDeleteStudent(student)}
                                />
                            ))}
                            <div
                                className="bg-gray-50 border-2 border-dashed border-border p-6 rounded-xl flex items-center justify-center hover:border-primary hover:text-primary transition-colors duration-300 cursor-pointer"
                                onClick={() => setIsAddingStudent(true)}
                            >
                                <div className="text-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    <p className="mt-2 font-semibold">Yeni Öğrenci Ekle</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (currentView) {
            case 'studentDetail':
                return selectedStudent && <StudentDetailPage user={user} student={selectedStudent} onBack={handleBackToStudentList} onLogout={onLogout} onStudentUpdate={handleStudentUpdated} />;
            case 'library':
                return <ContentLibraryPage user={user} onNavigateToCreator={handleNavigateToCreator} students={students} onNavigateToContent={onNavigateToContent} />;
            case 'createMaterial':
                return <CreateInteractiveMaterialPage user={user} onBack={handleBackToLibrary} contentIdForEdit={editingContentId} />;
            case 'questionBank':
                return <QuestionBankPage user={user} onBack={() => setCurrentView('students')} onLogout={onLogout} />;
            case 'students':
            default:
                return renderStudentsList();
        }
    };

    return (
        <div className="flex h-screen bg-background">
            {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

            <aside className={`fixed z-40 inset-y-0 left-0 w-64 bg-card-background flex flex-col border-r border-border p-4 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <SidebarContent currentView={currentView} setView={(view) => { setCurrentView(view); setIsSidebarOpen(false); }} />
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header user={user} onLogout={onLogout} onMenuButtonClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                <main className="flex-1 overflow-y-auto">
                    {renderContent()}
                </main>
            </div>
            {isAddingStudent && <AddStudentModal tutor={user} onClose={() => setIsAddingStudent(false)} onStudentAdded={handleStudentAdded} />}
            {editingStudent && <EditStudentModal student={editingStudent} onClose={() => setEditingStudent(null)} onStudentUpdated={handleStudentEdited} />}
            {deletingStudent && <ConfirmDeleteModal studentName={deletingStudent.name} onConfirm={confirmDeleteStudent} onCancel={() => setDeletingStudent(null)} />}
        </div>
    );
};

export default TutorDashboard;