import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import * as privateLessonService from '../services/privateLessonService';

interface RevenueOverviewProps {
    tutorId: string;
    students: Student[];
}

interface StudentRevenue {
    studentId: string;
    studentName: string;
    totalEarned: number;
    totalPending: number;
    totalLessons: number;
    paidLessons: number;
    unpaidLessons: number;
}

interface WeeklyRevenue {
    weekStart: string;
    weekEnd: string;
    totalEarned: number;
    totalPending: number;
    lessonsCount: number;
}

const RevenueOverview: React.FC<RevenueOverviewProps> = ({ tutorId, students }) => {
    const [studentRevenues, setStudentRevenues] = useState<StudentRevenue[]>([]);
    const [weeklyRevenues, setWeeklyRevenues] = useState<WeeklyRevenue[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedView, setSelectedView] = useState<'summary' | 'students' | 'weekly'>('summary');

    useEffect(() => {
        loadRevenueData();
    }, [students, tutorId]);

    const loadRevenueData = async () => {
        setLoading(true);
        try {
            // Load revenue for each student
            const revenuePromises = students.map(async (student) => {
                try {
                    const summary = await privateLessonService.getPaymentSummary(student.id, tutorId);
                    return {
                        studentId: student.id,
                        studentName: student.name,
                        totalEarned: summary.totalEarned,
                        totalPending: summary.totalPending,
                        totalLessons: summary.totalLessons,
                        paidLessons: summary.paidLessons,
                        unpaidLessons: summary.unpaidLessons,
                    };
                } catch (error) {
                    console.error(`Error loading revenue for student ${student.id}:`, error);
                    return null;
                }
            });

            const revenues = (await Promise.all(revenuePromises)).filter(Boolean) as StudentRevenue[];
            setStudentRevenues(revenues);

            // Calculate weekly revenues for last 4 weeks
            const weeks: WeeklyRevenue[] = [];
            for (let i = 0; i < 4; i++) {
                const weekEnd = new Date();
                weekEnd.setDate(weekEnd.getDate() - (i * 7));
                weekEnd.setHours(23, 59, 59, 999);

                const weekStart = new Date(weekEnd);
                weekStart.setDate(weekStart.getDate() - 6);
                weekStart.setHours(0, 0, 0, 0);

                let weekEarned = 0;
                let weekPending = 0;
                let weekLessons = 0;

                for (const student of students) {
                    try {
                        const summary = await privateLessonService.getPaymentSummary(
                            student.id,
                            tutorId,
                            {
                                start: weekStart.toISOString(),
                                end: weekEnd.toISOString()
                            }
                        );
                        weekEarned += summary.totalEarned;
                        weekPending += summary.totalPending;
                        weekLessons += summary.totalLessons;
                    } catch (error) {
                        console.error(`Error loading weekly revenue for student ${student.id}:`, error);
                    }
                }

                weeks.push({
                    weekStart: weekStart.toISOString(),
                    weekEnd: weekEnd.toISOString(),
                    totalEarned: weekEarned,
                    totalPending: weekPending,
                    lessonsCount: weekLessons,
                });
            }

            setWeeklyRevenues(weeks);
        } catch (error) {
            console.error('Error loading revenue data:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalEarned = studentRevenues.reduce((sum, s) => sum + s.totalEarned, 0);
    const totalPending = studentRevenues.reduce((sum, s) => sum + s.totalPending, 0);
    const totalLessons = studentRevenues.reduce((sum, s) => sum + s.totalLessons, 0);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-center py-8">
                    <svg className="animate-spin h-8 w-8 text-primary mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-600 font-semibold">Gelir verileri yükleniyor...</span>
                </div>
            </div>
        );
    }

    if (studentRevenues.length === 0) {
        return null; // Don't show if no revenue data
    }

    return (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-4 sm:p-6 mb-6 border border-green-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                <h2 className="text-xl sm:text-2xl font-bold font-poppins text-gray-800 flex items-center">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Gelir Takibi
                </h2>

                {/* View Tabs */}
                <div className="flex bg-white rounded-lg p-1 shadow-sm">
                    <button
                        onClick={() => setSelectedView('summary')}
                        className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${selectedView === 'summary'
                                ? 'bg-green-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        Özet
                    </button>
                    <button
                        onClick={() => setSelectedView('students')}
                        className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${selectedView === 'students'
                                ? 'bg-green-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        Öğrenciler
                    </button>
                    <button
                        onClick={() => setSelectedView('weekly')}
                        className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${selectedView === 'weekly'
                                ? 'bg-green-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        Haftalık
                    </button>
                </div>
            </div>

            {/* Summary View */}
            {selectedView === 'summary' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Toplam Kazanç</span>
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-green-600">{totalEarned.toFixed(2)} ₺</p>
                        <p className="text-xs text-gray-500 mt-1">{totalLessons} ders</p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Bekleyen Ödemeler</span>
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-orange-600">{totalPending.toFixed(2)} ₺</p>
                        <p className="text-xs text-gray-500 mt-1">Ödenmemiş dersler</p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Toplam Gelir</span>
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-blue-600">{(totalEarned + totalPending).toFixed(2)} ₺</p>
                        <p className="text-xs text-gray-500 mt-1">Kazanç + Bekleyen</p>
                    </div>
                </div>
            )}

            {/* Students View */}
            {selectedView === 'students' && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Öğrenci</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Kazanç</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Bekleyen</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Dersler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {studentRevenues
                                    .sort((a, b) => (b.totalEarned + b.totalPending) - (a.totalEarned + a.totalPending))
                                    .map((revenue) => (
                                        <tr key={revenue.studentId} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{revenue.studentName}</td>
                                            <td className="px-4 py-3 text-sm text-right">
                                                <span className="text-green-600 font-semibold">{revenue.totalEarned.toFixed(2)} ₺</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right">
                                                <span className="text-orange-600 font-semibold">{revenue.totalPending.toFixed(2)} ₺</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right text-gray-600">
                                                {revenue.paidLessons}/{revenue.totalLessons}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                                <tr>
                                    <td className="px-4 py-3 text-sm font-bold text-gray-900">TOPLAM</td>
                                    <td className="px-4 py-3 text-sm text-right">
                                        <span className="text-green-600 font-bold">{totalEarned.toFixed(2)} ₺</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right">
                                        <span className="text-orange-600 font-bold">{totalPending.toFixed(2)} ₺</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                                        {totalLessons}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* Weekly View */}
            {selectedView === 'weekly' && (
                <div className="space-y-3">
                    {weeklyRevenues.map((week, index) => {
                        const weekStart = new Date(week.weekStart);
                        const weekEnd = new Date(week.weekEnd);
                        const isCurrentWeek = index === 0;

                        return (
                            <div
                                key={week.weekStart}
                                className={`bg-white rounded-xl p-4 shadow-sm border ${isCurrentWeek ? 'border-green-300 ring-2 ring-green-200' : 'border-gray-200'
                                    }`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-900">
                                                {weekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - {weekEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </h3>
                                            {isCurrentWeek && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                                    Bu Hafta
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{week.lessonsCount} ders</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="text-right">
                                            <p className="text-xs text-gray-600">Kazanç</p>
                                            <p className="text-lg font-bold text-green-600">{week.totalEarned.toFixed(2)} ₺</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-600">Bekleyen</p>
                                            <p className="text-lg font-bold text-orange-600">{week.totalPending.toFixed(2)} ₺</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RevenueOverview;
