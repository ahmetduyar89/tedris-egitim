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
        if (students.length > 0) {
            loadRevenueData();
        } else {
            setLoading(false);
        }
    }, [students, tutorId]);

    const loadRevenueData = async () => {
        setLoading(true);
        try {
            const studentIds = students.map(s => s.id);

            // 1. Bulk fetch overall summaries
            const bulkSummaries = await privateLessonService.getBulkPaymentSummaries(studentIds, tutorId);

            const revenues: StudentRevenue[] = students.map(student => {
                const summary = bulkSummaries[student.id] || {
                    totalEarned: 0,
                    totalPending: 0,
                    totalLessons: 0,
                    paidLessons: 0,
                    unpaidLessons: 0
                };
                return {
                    studentId: student.id,
                    studentName: student.name,
                    totalEarned: summary.totalEarned,
                    totalPending: summary.totalPending,
                    totalLessons: summary.totalLessons,
                    paidLessons: summary.paidLessons,
                    unpaidLessons: summary.unpaidLessons,
                };
            });
            setStudentRevenues(revenues);

            // 2. Calculate weekly revenues for last 4 weeks
            // Optimization: Fetch ALL data for the last 4 weeks in one go, then process in memory
            // Instead of 4 weeks * N students queries, we do 4 queries total (one per week) or even 1 query for 4 weeks range.

            const weeks: WeeklyRevenue[] = [];
            const fourWeeksAgo = new Date();
            fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28); // 4 weeks
            fourWeeksAgo.setHours(0, 0, 0, 0);

            const today = new Date();
            today.setHours(23, 59, 59, 999);

            // Fetch all data for the last 4 weeks at once
            const last4WeeksSummaries = await privateLessonService.getBulkPaymentSummaries(
                studentIds,
                tutorId,
                { start: fourWeeksAgo.toISOString(), end: today.toISOString() }
            );

            // Note: getBulkPaymentSummaries aggregates by student, not by date. 
            // To get weekly breakdown properly without N+1, we would need a new service method 'getWeeklyRevenueStats'.
            // For now, to keep it simple but faster than before, we will stick to the loop but use the bulk method per week.

            for (let i = 0; i < 4; i++) {
                const weekEnd = new Date();
                weekEnd.setDate(weekEnd.getDate() - (i * 7));
                weekEnd.setHours(23, 59, 59, 999);

                const weekStart = new Date(weekEnd);
                weekStart.setDate(weekStart.getDate() - 6);
                weekStart.setHours(0, 0, 0, 0);

                // Bulk fetch for this specific week for ALL students
                const weekBulkSummaries = await privateLessonService.getBulkPaymentSummaries(
                    studentIds,
                    tutorId,
                    { start: weekStart.toISOString(), end: weekEnd.toISOString() }
                );

                let weekEarned = 0;
                let weekPending = 0;
                let weekLessons = 0;

                Object.values(weekBulkSummaries).forEach(summary => {
                    weekEarned += summary.totalEarned;
                    weekPending += summary.totalPending;
                    weekLessons += summary.totalLessons;
                });

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
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 h-full min-h-[200px] flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <svg className="animate-spin h-8 w-8 text-green-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-500 font-medium">Finansal veriler hesaplanıyor...</span>
                </div>
            </div>
        );
    }

    if (studentRevenues.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
                <h2 className="text-xl font-bold font-poppins text-gray-800 flex items-center">
                    <div className="bg-green-100 p-2 rounded-lg mr-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    Gelir Takibi
                </h2>

                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setSelectedView('summary')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${selectedView === 'summary'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Özet
                    </button>
                    <button
                        onClick={() => setSelectedView('students')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${selectedView === 'students'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Öğrenciler
                    </button>
                    <button
                        onClick={() => setSelectedView('weekly')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${selectedView === 'weekly'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Haftalık
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {/* Summary View */}
                {selectedView === 'summary' && (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                            <p className="text-sm text-green-800 font-medium mb-1">Toplam Tahsilat</p>
                            <p className="text-3xl font-bold text-green-700">{totalEarned.toFixed(2)} ₺</p>
                            <div className="mt-2 text-xs text-green-600 bg-green-100 inline-block px-2 py-1 rounded-md">
                                {totalLessons} toplam ders
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                                <p className="text-xs text-orange-800 font-medium mb-1">Bekleyen</p>
                                <p className="text-xl font-bold text-orange-700">{totalPending.toFixed(2)} ₺</p>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                <p className="text-xs text-blue-800 font-medium mb-1">Genel Toplam</p>
                                <p className="text-xl font-bold text-blue-700">{(totalEarned + totalPending).toFixed(2)} ₺</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Students View */}
                {selectedView === 'students' && (
                    <div className="space-y-3">
                        {studentRevenues
                            .sort((a, b) => (b.totalEarned + b.totalPending) - (a.totalEarned + a.totalPending))
                            .map((revenue) => (
                                <div key={revenue.studentId} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">{revenue.studentName}</p>
                                        <p className="text-xs text-gray-500">{revenue.paidLessons} ödenmiş / {revenue.totalLessons} ders</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-green-600">{revenue.totalEarned.toFixed(0)} ₺</p>
                                        {revenue.totalPending > 0 && (
                                            <p className="text-xs text-orange-500 font-medium">+{revenue.totalPending.toFixed(0)} ₺ bekleyen</p>
                                        )}
                                    </div>
                                </div>
                            ))}
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
                                    className={`p-3 rounded-xl border ${isCurrentWeek ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`text-xs font-bold ${isCurrentWeek ? 'text-green-800' : 'text-gray-500'}`}>
                                            {weekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - {weekEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                        </span>
                                        {isCurrentWeek && <span className="text-[10px] bg-green-200 text-green-800 px-1.5 py-0.5 rounded font-bold">BU HAFTA</span>}
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs text-gray-500">{week.lessonsCount} ders</span>
                                        <div className="text-right">
                                            <span className="block text-sm font-bold text-gray-900">{week.totalEarned.toFixed(0)} ₺</span>
                                            {week.totalPending > 0 && <span className="text-[10px] text-orange-500">+{week.totalPending.toFixed(0)} ₺ bekleyen</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RevenueOverview;
