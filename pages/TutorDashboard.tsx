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
import SubjectLearningPage from './SubjectLearningPage';

import AddStudentModal from '../components/tutor-dashboard/AddStudentModal';
import EditStudentModal from '../components/tutor-dashboard/EditStudentModal';
import ConfirmDeleteModal from '../components/tutor-dashboard/ConfirmDeleteModal';
import StudentCard from '../components/tutor-dashboard/StudentCard';
import SidebarContent, { View, TedrisLogo } from '../components/tutor-dashboard/SidebarContent';


interface TutorDashboardProps {
    user: User;
    onLogout: () => void;
    onNavigateToContent: (contentId: string) => void;
}

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
                subjects: row.subjects || [],
                parentId: row.parent_id,
                parentEmail: row.parent_email
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
                body: { student_id: deletingStudent.id }
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
            case 'subjectLearning':
                return <SubjectLearningPage user={user} students={students} />;
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