import React, { useEffect, useState } from 'react';
import { User, Student, PrivateLesson } from '../types';
import { supabase } from '../services/dbAdapter';
import RiskAlertsPanel from './RiskAlertsPanel';
import RevenueOverview from './RevenueOverview';

interface DashboardOverviewProps {
    user: User;
    students: Student[];
    onNavigateToSchedule: () => void;
    onViewStudent: (student: Student) => void;
    onOpenMessageModal: () => void;
}

interface DashboardStats {
    todayLessons: number;
    weekLessons: number;
    completedTests: number;
    pendingHomework: number;
    averageScore: number;
    activeStudents: number;
}

interface RecentActivity {
    id: string;
    type: 'test' | 'homework' | 'lesson';
    studentName: string;
    description: string;
    timestamp: string;
    score?: number;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ user, students, onNavigateToSchedule, onViewStudent, onOpenMessageModal }) => {
    const [upcomingLessons, setUpcomingLessons] = useState<PrivateLesson[]>([]);
    const [todayLessons, setTodayLessons] = useState<PrivateLesson[]>([]);
    const [loadingLessons, setLoadingLessons] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        todayLessons: 0,
        weekLessons: 0,
        completedTests: 0,
        pendingHomework: 0,
        averageScore: 0,
        activeStudents: 0
    });
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        fetchAllData();
    }, [user.id, students]);

    const fetchAllData = async () => {
        await Promise.all([
            fetchUpcomingLessons(),
            fetchDashboardStats(),
            fetchRecentActivities()
        ]);
    };

    const fetchUpcomingLessons = async () => {
        try {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

            // Fetch all upcoming lessons
            const { data: allLessons, error } = await supabase
                .from('private_lessons')
                .select('*')
                .eq('tutor_id', user.id)
                .gte('start_time', now.toISOString())
                .neq('status', 'cancelled')
                .order('start_time', { ascending: true })
                .limit(10);

            if (error) throw error;

            if (allLessons) {
                const lessons = allLessons.map(l => ({
                    id: l.id,
                    tutorId: l.tutor_id,
                    studentId: l.student_id,
                    studentName: l.student_name,
                    startTime: l.start_time,
                    endTime: l.end_time,
                    subject: l.subject,
                    status: l.status,
                    color: l.color,
                    grade: l.grade
                } as PrivateLesson));

                // Separate today's lessons
                const today = lessons.filter(l => l.startTime >= todayStart && l.startTime <= todayEnd);
                const upcoming = lessons.slice(0, 5);

                setTodayLessons(today);
                setUpcomingLessons(upcoming);
            }
        } catch (error) {
            console.error('Error fetching upcoming lessons:', error);
        } finally {
            setLoadingLessons(false);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const studentIds = students.map(s => s.id);
            if (studentIds.length === 0) {
                setLoadingStats(false);
                return;
            }

            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
            const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

            // Today's lessons count
            const { count: todayCount } = await supabase
                .from('private_lessons')
                .select('*', { count: 'exact', head: true })
                .eq('tutor_id', user.id)
                .gte('start_time', todayStart)
                .lte('start_time', todayEnd)
                .neq('status', 'cancelled');

            // Week's lessons count
            const { count: weekCount } = await supabase
                .from('private_lessons')
                .select('*', { count: 'exact', head: true })
                .eq('tutor_id', user.id)
                .gte('start_time', weekStart)
                .neq('status', 'cancelled');

            // Completed tests
            const { data: completedTests } = await supabase
                .from('diagnosis_test_assignments')
                .select('score')
                .in('student_id', studentIds)
                .eq('status', 'completed');

            // PDF tests
            const { data: pdfTests } = await supabase
                .from('pdf_test_submissions')
                .select('score_percentage')
                .in('student_id', studentIds)
                .eq('status', 'completed');

            // Question bank tests
            const { data: qbTests } = await supabase
                .from('question_bank_assignments')
                .select('score')
                .in('student_id', studentIds)
                .eq('status', 'Tamamlandı');

            // Calculate average score
            let totalScore = 0;
            let totalTests = 0;

            (completedTests || []).forEach(t => {
                if (t.score) {
                    totalScore += t.score;
                    totalTests++;
                }
            });

            (pdfTests || []).forEach(t => {
                if (t.score_percentage) {
                    totalScore += t.score_percentage;
                    totalTests++;
                }
            });

            (qbTests || []).forEach(t => {
                if (t.score) {
                    totalScore += t.score;
                    totalTests++;
                }
            });

            const avgScore = totalTests > 0 ? Math.round(totalScore / totalTests) : 0;

            // Pending homework (PDF tests assigned but not completed)
            const { count: pendingCount } = await supabase
                .from('pdf_test_assignments')
                .select('*', { count: 'exact', head: true })
                .in('student_id', studentIds)
                .neq('status', 'completed');

            // Active students (students with XP > 500 or recent activity)
            const activeCount = students.filter(s => s.xp > 500).length;

            setStats({
                todayLessons: todayCount || 0,
                weekLessons: weekCount || 0,
                completedTests: totalTests,
                pendingHomework: pendingCount || 0,
                averageScore: avgScore,
                activeStudents: activeCount
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchRecentActivities = async () => {
        try {
            const studentIds = students.map(s => s.id);
            if (studentIds.length === 0) return;

            const activities: RecentActivity[] = [];

            // Recent completed tests
            const { data: recentTests } = await supabase
                .from('diagnosis_test_assignments')
                .select('id, student_id, score, completed_at')
                .in('student_id', studentIds)
                .eq('status', 'completed')
                .order('completed_at', { ascending: false })
                .limit(5);

            if (recentTests) {
                recentTests.forEach(test => {
                    const student = students.find(s => s.id === test.student_id);
                    if (student && test.completed_at) {
                        activities.push({
                            id: test.id,
                            type: 'test',
                            studentName: student.name,
                            description: 'Tanı testi tamamladı',
                            timestamp: test.completed_at,
                            score: test.score
                        });
                    }
                });
            }

            // Recent PDF submissions
            const { data: recentPDF } = await supabase
                .from('pdf_test_submissions')
                .select('id, student_id, score_percentage, submitted_at')
                .in('student_id', studentIds)
                .eq('status', 'completed')
                .order('submitted_at', { ascending: false })
                .limit(5);

            if (recentPDF) {
                recentPDF.forEach(pdf => {
                    const student = students.find(s => s.id === pdf.student_id);
                    if (student && pdf.submitted_at) {
                        activities.push({
                            id: pdf.id,
                            type: 'homework',
                            studentName: student.name,
                            description: 'Ödev gönderdi',
                            timestamp: pdf.submitted_at,
                            score: pdf.score_percentage
                        });
                    }
                });
            }

            // Sort by timestamp and take top 5
            activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setRecentActivities(activities.slice(0, 5));
        } catch (error) {
            console.error('Error fetching recent activities:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('tr-TR', {
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins} dakika önce`;
        if (diffHours < 24) return `${diffHours} saat önce`;
        if (diffDays < 7) return `${diffDays} gün önce`;
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold font-poppins bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                        Hoş Geldiniz, {user.name}
                    </h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <span className="text-lg">📅</span>
                        {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={onNavigateToSchedule}
                        className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary-dark hover:to-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/30 transition-all flex items-center gap-2 hover:scale-105 transform"
                    >
                        <span>📅</span>
                        <span>Programı Düzenle</span>
                    </button>
                    <button
                        onClick={onOpenMessageModal}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-green-200 transition-all flex items-center gap-2 hover:scale-105 transform"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Mesaj Gönder</span>
                    </button>
                </div>
            </div>

            {/* Performance Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Today's Lessons */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 transform cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                        <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl">
                            <span className="text-2xl">📚</span>
                        </div>
                        {stats.todayLessons > 0 && (
                            <span className="bg-white/30 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold">BUGÜN</span>
                        )}
                    </div>
                    <div className="text-3xl font-bold mb-1">{loadingStats ? '...' : stats.todayLessons}</div>
                    <div className="text-sm text-blue-100 font-medium">Bugünkü Ders</div>
                </div>

                {/* Week's Lessons */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 transform cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                        <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl">
                            <span className="text-2xl">📊</span>
                        </div>
                    </div>
                    <div className="text-3xl font-bold mb-1">{loadingStats ? '...' : stats.weekLessons}</div>
                    <div className="text-sm text-purple-100 font-medium">Bu Hafta</div>
                </div>

                {/* Completed Tests */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 transform cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                        <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl">
                            <span className="text-2xl">✅</span>
                        </div>
                    </div>
                    <div className="text-3xl font-bold mb-1">{loadingStats ? '...' : stats.completedTests}</div>
                    <div className="text-sm text-green-100 font-medium">Tamamlanan Test</div>
                </div>

                {/* Average Score */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 transform cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                        <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl">
                            <span className="text-2xl">🎯</span>
                        </div>
                    </div>
                    <div className="text-3xl font-bold mb-1">{loadingStats ? '...' : `%${stats.averageScore}`}</div>
                    <div className="text-sm text-orange-100 font-medium">Ortalama Başarı</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (2/3 width on large screens) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Today's Lessons - Special Section */}
                    {todayLessons.length > 0 && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border-2 border-blue-200 overflow-hidden">
                            <div className="p-5 border-b border-blue-200 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                                <h2 className="text-lg font-bold font-poppins text-blue-900 flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                    </span>
                                    Bugünkü Dersler
                                </h2>
                                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                    {todayLessons.length} Ders
                                </span>
                            </div>
                            <div className="p-4 space-y-3">
                                {todayLessons.map(lesson => (
                                    <div key={lesson.id} className="flex items-center p-4 rounded-xl bg-white border-2 border-blue-100 hover:border-blue-300 transition-all shadow-sm hover:shadow-md group">
                                        <div
                                            className="w-1.5 h-14 rounded-full mr-4 shadow-lg"
                                            style={{ backgroundColor: lesson.color || '#3B82F6' }}
                                        ></div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-900 text-lg truncate">{lesson.studentName}</h4>
                                            <p className="text-sm text-gray-600 truncate">{lesson.subject} • {lesson.grade}. Sınıf</p>
                                        </div>
                                        <div className="text-right pl-4">
                                            <div className="font-bold text-blue-700 bg-blue-100 px-4 py-2 rounded-xl text-base shadow-sm">
                                                {formatTime(lesson.startTime)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upcoming Lessons Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                            <h2 className="text-lg font-bold font-poppins text-gray-800 flex items-center gap-2">
                                <span className="text-2xl">⏰</span> Yaklaşan Dersler
                            </h2>
                            <button
                                onClick={onNavigateToSchedule}
                                className="text-sm text-primary font-semibold hover:underline flex items-center gap-1 hover:gap-2 transition-all"
                            >
                                Tümünü Gör
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4">
                            {loadingLessons ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
                                    <p className="text-gray-400 font-medium">Yükleniyor...</p>
                                </div>
                            ) : upcomingLessons.length > 0 ? (
                                <div className="space-y-2">
                                    {upcomingLessons.map(lesson => (
                                        <div key={lesson.id} className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition-all border border-gray-100 hover:border-gray-300 group cursor-pointer">
                                            <div
                                                className="w-1 h-12 rounded-full mr-4 group-hover:w-1.5 transition-all"
                                                style={{ backgroundColor: lesson.color || '#3B82F6' }}
                                            ></div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 truncate group-hover:text-primary transition-colors">{lesson.studentName}</h4>
                                                <p className="text-sm text-gray-500 truncate">{lesson.subject} • {lesson.grade}. Sınıf</p>
                                            </div>
                                            <div className="text-right pl-4">
                                                <div className="font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg text-sm group-hover:bg-primary group-hover:text-white transition-all">
                                                    {formatDate(lesson.startTime)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-200">
                                    <div className="text-5xl mb-3">📅</div>
                                    <p className="text-gray-600 font-semibold mb-2">Yaklaşan ders bulunmuyor</p>
                                    <button
                                        onClick={onNavigateToSchedule}
                                        className="mt-3 bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                                    >
                                        + Ders Programla
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                            <h2 className="text-lg font-bold font-poppins text-gray-800 flex items-center gap-2">
                                <span className="text-2xl">🔔</span> Son Aktiviteler
                            </h2>
                        </div>
                        <div className="p-4">
                            {recentActivities.length > 0 ? (
                                <div className="space-y-3">
                                    {recentActivities.map(activity => (
                                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all border border-gray-100 hover:border-gray-300 group">
                                            <div className={`p-2.5 rounded-xl ${activity.type === 'test' ? 'bg-blue-100 text-blue-600' :
                                                    activity.type === 'homework' ? 'bg-green-100 text-green-600' :
                                                        'bg-purple-100 text-purple-600'
                                                }`}>
                                                {activity.type === 'test' ? '📝' : activity.type === 'homework' ? '📄' : '📚'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 text-sm">{activity.studentName}</h4>
                                                <p className="text-sm text-gray-600">{activity.description}</p>
                                                <p className="text-xs text-gray-400 mt-1">{getRelativeTime(activity.timestamp)}</p>
                                            </div>
                                            {activity.score !== undefined && (
                                                <div className={`px-3 py-1.5 rounded-lg font-bold text-sm ${activity.score >= 80 ? 'bg-green-100 text-green-700' :
                                                        activity.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                    %{activity.score}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-400">
                                    <div className="text-4xl mb-2">🔕</div>
                                    <p className="font-medium">Henüz aktivite yok</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Risk Alerts */}
                    <RiskAlertsPanel students={students} onViewStudent={onViewStudent} />
                </div>

                {/* Right Column (1/3 width) */}
                <div className="space-y-6">
                    {/* Revenue/Financial Overview */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                        <RevenueOverview tutorId={user.id} students={students} />
                    </div>

                    {/* Quick Stats / Students Summary */}
                    <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 rounded-2xl shadow-xl text-white p-6 relative overflow-hidden hover:shadow-2xl transition-shadow">
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold font-poppins mb-5 text-white flex items-center gap-2">
                                <span className="text-xl">👥</span> Öğrenci Durumu
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-white/70 font-medium">Toplam Öğrenci</span>
                                        <span className="text-2xl">🎓</span>
                                    </div>
                                    <div className="text-4xl font-bold">{students.length}</div>
                                </div>
                                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-xl p-4 border border-green-400/30 hover:from-green-500/30 hover:to-emerald-500/30 transition-all">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-green-200 font-medium">Aktif Çalışan</span>
                                        <span className="text-2xl">⚡</span>
                                    </div>
                                    <div className="text-4xl font-bold text-green-300">{stats.activeStudents}</div>
                                    <div className="mt-2 text-xs text-green-200">
                                        %{students.length > 0 ? Math.round((stats.activeStudents / students.length) * 100) : 0} katılım
                                    </div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-white/70 font-medium">Bekleyen Ödev</span>
                                        <span className="text-2xl">📋</span>
                                    </div>
                                    <div className="text-4xl font-bold text-orange-300">{stats.pendingHomework}</div>
                                </div>
                            </div>
                        </div>
                        {/* Animated Decor */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse"></div>
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/20 rounded-full blur-3xl -ml-20 -mb-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
