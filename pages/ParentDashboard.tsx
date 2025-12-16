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
    const [activeTab, setActiveTab] = useState<'lessons' | 'performance' | 'assignments' | 'weekly_plan'>('lessons');

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
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (students.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Hoş Geldiniz
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Henüz size bağlı bir öğrenci bulunmuyor. Lütfen öğretmeninizle iletişime geçin.
                    </p>
                    <button
                        onClick={onLogout}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                        Çıkış Yap
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <img src="/logo-full.png" alt="TedrisEDU" className="h-8" />
                            <span className="text-gray-400">|</span>
                            <span className="text-sm font-medium text-gray-600">Veli Portalı</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">
                                Merhaba, <span className="font-semibold">{user.name}</span>
                            </span>
                            <button
                                onClick={onLogout}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                            >
                                Çıkış
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Öğrenci Seçimi */}
                {students.length > 1 && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Öğrenci Seçin
                        </label>
                        <select
                            value={selectedStudent?.id || ''}
                            onChange={(e) => {
                                const student = students.find(s => s.id === e.target.value);
                                setSelectedStudent(student || null);
                            }}
                            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
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
                        {/* Öğrenci Bilgi Kartı */}
                        <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-6 mb-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold mb-1">
                                        {selectedStudent.name}
                                    </h1>
                                    <p className="text-white/90">
                                        {selectedStudent.grade}. Sınıf Öğrencisi
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold">
                                        {selectedStudent.level || 1}
                                    </div>
                                    <div className="text-sm text-white/90">Seviye</div>
                                </div>
                            </div>
                        </div>

                        {/* Tab Menüsü */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                            <div className="flex border-b border-gray-200">
                                <button
                                    onClick={() => setActiveTab('lessons')}
                                    className={`flex-1 px-6 py-4 text-sm font-medium transition ${activeTab === 'lessons'
                                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                        }`}
                                >
                                    📖 Ders Notları
                                </button>
                                <button
                                    onClick={() => setActiveTab('performance')}
                                    className={`flex-1 px-6 py-4 text-sm font-medium transition ${activeTab === 'performance'
                                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                        }`}
                                >
                                    📊 Performans
                                </button>
                                <button
                                    onClick={() => setActiveTab('assignments')}
                                    className={`flex-1 px-6 py-4 text-sm font-medium transition ${activeTab === 'assignments'
                                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                        }`}
                                >
                                    ✏️ Ödevler
                                </button>
                                <button
                                    onClick={() => setActiveTab('weekly_plan')}
                                    className={`flex-1 px-6 py-4 text-sm font-medium transition ${activeTab === 'weekly_plan'
                                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                        }`}
                                >
                                    📅 Haftalık Plan
                                </button>
                            </div>

                            <div className="p-6">
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
