import React, { useState, useEffect } from 'react';
import { User, Student } from '../types';
import * as parentService from '../services/parentService';
import ParentLessonNotesView from '../components/ParentLessonNotesView';
import ParentPerformanceView from '../components/ParentPerformanceView';
import ParentAssignmentsView from '../components/ParentAssignmentsView';
import ParentWeeklyPlanView from '../components/ParentWeeklyPlanView';

interface ParentDashboardProps {
    user: User;
    onLogout: () => void;
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ user, onLogout }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'lessons' | 'performance' | 'assignments' | 'weekly_plan'>('weekly_plan');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        { id: 'performance', label: 'Performans', icon: '📊', color: 'from-purple-500 to-pink-500' },
        { id: 'assignments', label: 'Ödevler', icon: '✏️', color: 'from-orange-500 to-red-500' },
        { id: 'lessons', label: 'Ders Notları', icon: '📖', color: 'from-green-500 to-teal-500' },
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
                            <div className="hidden md:grid grid-cols-4 gap-4">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${activeTab === tab.id
                                                ? 'bg-white shadow-xl scale-105'
                                                : 'bg-white/60 hover:bg-white hover:shadow-lg'
                                            }`}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${tab.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                                        <div className="relative">
                                            <div className="text-4xl mb-3">{tab.icon}</div>
                                            <div className={`text-sm font-bold ${activeTab === tab.id
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
                                    <div className="grid grid-cols-2 gap-2">
                                        {tabs.map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id as any)}
                                                className={`relative overflow-hidden rounded-xl p-4 transition-all duration-300 ${activeTab === tab.id
                                                        ? 'bg-gradient-to-br from-primary/10 to-accent/10'
                                                        : 'bg-gray-50'
                                                    }`}
                                            >
                                                <div className="text-2xl mb-1">{tab.icon}</div>
                                                <div className={`text-xs font-bold ${activeTab === tab.id
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
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ParentDashboard;
