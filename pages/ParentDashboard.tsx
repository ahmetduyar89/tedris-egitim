import React, { useState, useEffect } from 'react';
import { User, Student, UserRole } from '../types';
import * as parentService from '../services/parentService';
import ParentLessonNotesView from '../components/ParentLessonNotesView';
import ParentPerformanceView from '../components/ParentPerformanceView';
import ParentAssignmentsView from '../components/ParentAssignmentsView';
import ParentWeeklyPlanView from '../components/ParentWeeklyPlanView';
import { assessmentService } from '../services/assessmentService';

interface ParentDashboardProps {
    user: User;
    onLogout: () => void;
}

const LockedOverlay: React.FC<{ title: string }> = ({ title }) => (
    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center p-6 text-center rounded-3xl border-2 border-dashed border-indigo-400/30 animate-fade-in">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg mb-4">
            👑
        </div>
        <h4 className="text-lg font-black text-gray-800 mb-1">{title}</h4>
        <p className="text-gray-600 text-xs max-w-[200px] mb-4 font-medium">Bu analiz sadece Premium öğrenciler içindir.</p>
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
            Premium'a Yükselt
        </button>
    </div>
);

const ParentDashboard: React.FC<ParentDashboardProps> = ({ user, onLogout }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'lessons' | 'performance' | 'assignments' | 'weekly_plan' | 'management' | 'analysis'>('weekly_plan');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [studentScores, setStudentScores] = useState<any[]>([]);
    const [studentProgress, setStudentProgress] = useState(0);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const data = await parentService.getParentStudents(user.id);
                setStudents(data);
                if (data.length > 0) {
                    setSelectedStudent(data[0]);
                }
            } catch (error) {
                console.error('Error fetching students:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [user.id]);

    useEffect(() => {
        const fetchStudentMetrics = async () => {
            if (!selectedStudent) return;
            try {
                const [scores, progress] = await Promise.all([
                    assessmentService.getStudentScores(selectedStudent.id),
                    assessmentService.getOverallProgress(selectedStudent.id)
                ]);
                setStudentScores(scores);
                setStudentProgress(progress);
            } catch (error) {
                console.error('Error fetching student metrics:', error);
            }
        };

        fetchStudentMetrics();
    }, [selectedStudent]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (students.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-7xl mb-6">👨‍👩‍👧‍👦</div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-3">
                        Hoş Geldiniz
                    </h2>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                        Henüz size bağlı bir öğrenci bulunmuyor. Lütfen öğretmeninizle iletişime geçin.
                    </p>
                    <button
                        onClick={onLogout}
                        className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                    >
                        Çıkış Yap
                    </button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'weekly_plan', label: 'Haftalık Plan', icon: '📅', color: 'from-blue-500 to-cyan-500' },
        { id: 'analysis', label: 'Gelişim Analizi', icon: '🎯', color: 'from-indigo-600 to-violet-600' },
        { id: 'performance', label: 'Performans', icon: '📊', color: 'from-purple-500 to-pink-500' },
        { id: 'assignments', label: 'Ödevler', icon: '✏️', color: 'from-orange-500 to-red-500' },
        { id: 'lessons', label: 'Ders Notları', icon: '📖', color: 'from-green-500 to-teal-500' },
        { id: 'management', label: 'Yönetim', icon: '⚙️', color: 'from-gray-500 to-slate-500' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            {/* Modern Header */}
            <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo & Title */}
                        <div className="flex items-center gap-4">
                            <img src="/logo-full.png" alt="TedrisEDU" className="h-8" />
                            <div className="hidden sm:block">
                                <span className="text-gray-300">|</span>
                                <span className="ml-3 text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                    Veli Portalı
                                </span>
                            </div>
                        </div>

                        {/* User Info & Actions */}
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl">
                                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {user.name.charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-gray-700">{user.name}</span>
                            </div>
                            <button
                                onClick={onLogout}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium"
                            >
                                Çıkış
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Student Selector - Modern Card */}
                {students.length > 1 && selectedStudent && (
                    <div className="mb-6">
                        <select
                            value={selectedStudent.id}
                            onChange={(e) => {
                                const student = students.find(s => s.id === e.target.value);
                                setSelectedStudent(student || null);
                            }}
                            className="w-full max-w-md px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 font-medium text-gray-700 shadow-sm hover:shadow-md"
                        >
                            {students.map((student) => (
                                <option key={student.id} value={student.id}>
                                    {student.name} - {student.grade}. Sınıf
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {selectedStudent && (
                    <>
                        {/* Student Info Card - Minimal & Colorful */}
                        <div className="mb-6 bg-gradient-to-r from-primary via-purple-600 to-accent rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl border-2 border-white/30">
                                        👨‍🎓
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-white mb-1">
                                            {selectedStudent.name}
                                        </h1>
                                        <p className="text-white/90 text-sm font-medium">
                                            {selectedStudent.grade}. Sınıf Öğrencisi
                                        </p>
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-6">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-white">
                                            {selectedStudent.level || 1}
                                        </div>
                                        <div className="text-xs text-white/80 font-medium">Seviye</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-white">
                                            {selectedStudent.xp || 0}
                                        </div>
                                        <div className="text-xs text-white/80 font-medium">XP</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modern Tab Navigation */}
                        <div className="mb-6">
                            {/* Desktop Tabs */}
                            <div className="hidden md:grid grid-cols-4 lg:grid-cols-6 gap-4">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 ${activeTab === tab.id
                                            ? 'bg-white shadow-xl scale-105'
                                            : 'bg-white/60 hover:bg-white hover:shadow-lg'
                                            }`}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${tab.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                                        <div className="relative">
                                            <div className="text-3xl mb-2">{tab.icon}</div>
                                            <div className={`text-xs font-bold ${activeTab === tab.id
                                                ? `bg-gradient-to-r ${tab.color} bg-clip-text text-transparent`
                                                : 'text-gray-600'
                                                }`}>
                                                {tab.label}
                                            </div>
                                        </div>
                                        {activeTab === tab.id && (
                                            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${tab.color}`}></div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Mobile Tabs */}
                            <div className="md:hidden">
                                <div className="bg-white rounded-2xl p-2 shadow-lg">
                                    <div className="grid grid-cols-3 gap-2">
                                        {tabs.map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id as any)}
                                                className={`relative overflow-hidden rounded-xl p-3 transition-all duration-300 ${activeTab === tab.id
                                                    ? 'bg-gradient-to-br from-primary/10 to-accent/10'
                                                    : 'bg-gray-50'
                                                    }`}
                                            >
                                                <div className="text-xl mb-1">{tab.icon}</div>
                                                <div className={`text-[10px] font-bold ${activeTab === tab.id
                                                    ? 'text-primary'
                                                    : 'text-gray-600'
                                                    }`}>
                                                    {tab.label}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Area - Clean & Minimal */}
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                            <div className="p-6 md:p-8">
                                {activeTab === 'analysis' && (
                                    <div className="space-y-8 animate-fade-in">
                                        <div className="flex justify-between items-center">
                                            <h2 className="text-2xl font-bold text-gray-800">Gelişim Analizi</h2>
                                            <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm">
                                                Tanı Testi Sonuçları
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-8">
                                            {/* Progress Box */}
                                            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
                                                {!selectedStudent.isPremium && <LockedOverlay title="İlerleme Analizi" />}
                                                <div className={`transition-all duration-500 flex flex-col items-center ${!selectedStudent.isPremium ? 'blur-md opacity-20 scale-95' : ''}`}>
                                                    <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                                                        <svg className="w-full h-full transform -rotate-90">
                                                            <circle
                                                                cx="80"
                                                                cy="80"
                                                                r="70"
                                                                stroke="currentColor"
                                                                strokeWidth="12"
                                                                fill="transparent"
                                                                className="text-gray-200"
                                                            />
                                                            <circle
                                                                cx="80"
                                                                cy="80"
                                                                r="70"
                                                                stroke="currentColor"
                                                                strokeWidth="12"
                                                                fill="transparent"
                                                                strokeDasharray={440}
                                                                strokeDashoffset={440 - (440 * studentProgress) / 100}
                                                                className="text-indigo-600 transition-all duration-1000 ease-out"
                                                                strokeLinecap="round"
                                                            />
                                                        </svg>
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                            <span className="text-4xl font-black text-gray-800">%{studentProgress}</span>
                                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Başarı</span>
                                                        </div>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-800 mb-2">Genel Çalışma İlerlemesi</h3>
                                                    <p className="text-sm text-gray-500">Planlanan tüm görevlerin tamamlanma oranı.</p>
                                                </div>
                                            </div>

                                            {/* Weakest Topics List */}
                                            <div className="space-y-4">
                                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                                    <span className="p-1 px-2 bg-rose-100 text-rose-600 rounded text-xs">!</span>
                                                    Öncelikli Gelişim Alanları
                                                </h3>
                                                <div className="grid gap-3">
                                                    {studentScores.slice(0, 4).map((score) => (
                                                        <div key={`${score.subject}-${score.topic}`} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex justify-between items-center group hover:border-indigo-200 transition-all">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${score.subject === 'math' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                                                    {score.subject === 'math' ? '🔢' : '🧬'}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-gray-800 text-sm">{score.topic}</p>
                                                                    <p className="text-xs text-gray-400 capitalize">{score.subject}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-xs text-gray-400 font-bold mb-1">Başarı</div>
                                                                <div className={`font-black text-sm ${score.accuracy < 50 ? 'text-rose-500' : 'text-orange-500'}`}>
                                                                    %{score.accuracy}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {studentScores.length === 0 && (
                                                        <div className="py-12 text-center text-gray-400">
                                                            <p>Henüz analiz verisi bulunmuyor.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* All Topics Accuracy Chart (Mini) */}
                                        <div className="mt-8 bg-indigo-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                                            {!selectedStudent.isPremium && <LockedOverlay title="Tam Konu Analizi" />}
                                            <div className={`transition-all duration-500 ${!selectedStudent.isPremium ? 'blur-lg opacity-10' : ''}`}>
                                                <h3 className="text-lg font-bold mb-6">Tüm Konular Başarı Analizi</h3>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                    {studentScores.map((score) => (
                                                        <div key={score.topic} className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                                                            <p className="text-[10px] text-indigo-200 uppercase font-black mb-1 truncate">{score.topic}</p>
                                                            <div className="flex items-end justify-between gap-2">
                                                                <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all duration-1000 ${score.accuracy > 70 ? 'bg-emerald-400' : score.accuracy > 40 ? 'bg-orange-400' : 'bg-rose-400'
                                                                            }`}
                                                                        style={{ width: `${score.accuracy}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-xs font-bold leading-none">%{score.accuracy}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'lessons' && (
                                    <ParentLessonNotesView student={selectedStudent} />
                                )}
                                {activeTab === 'performance' && (
                                    <ParentPerformanceView student={selectedStudent} />
                                )}
                                {activeTab === 'assignments' && (
                                    <ParentAssignmentsView student={selectedStudent} />
                                )}
                                {activeTab === 'weekly_plan' && (
                                    <ParentWeeklyPlanView student={selectedStudent} />
                                )}
                                {activeTab === 'management' && (
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-bold text-gray-800">Öğrenci Yönetimi</h2>
                                        <div className="grid gap-4">
                                            {students.map(student => (
                                                <div key={student.id} className="p-4 border rounded-xl flex justify-between items-center bg-gray-50">
                                                    <div>
                                                        <p className="font-bold text-gray-800">{student.name}</p>
                                                        <p className="text-sm text-gray-600">{student.grade}. Sınıf</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setSelectedStudent(student)}
                                                            className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                        >
                                                            Görüntüle
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

        </div>
    );
};


export default ParentDashboard;
