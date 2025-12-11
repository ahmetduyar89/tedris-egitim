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
            const todayDateStr = now.toLocaleDateString('en-CA');

            // Calculate week boundaries (Monday to Sunday)
            const weekStart = new Date(now);
            const day = weekStart.getDay();
            const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
            weekStart.setDate(diff);
            weekStart.setHours(0, 0, 0, 0);

            console.log('[DashboardOverview] Week start:', weekStart.toISOString());
            console.log('[DashboardOverview] User/Tutor ID:', user.id);

            // Fetch ALL lessons for this tutor
            const { data: allLessonsData, error } = await supabase
                .from('private_lessons')
                .select('*')
                .eq('tutor_id', user.id);

            if (error) {
                console.error('[DashboardOverview] Error fetching lessons:', error);
                throw error;
            }

            if (!allLessonsData || allLessonsData.length === 0) {
                console.log('[DashboardOverview] No lessons found');
                setTodayLessons([]);
                setUpcomingLessons([]);
                return;
            }

            const allLessons = allLessonsData.map(row => ({
                id: row.id,
                tutorId: row.tutor_id,
                studentId: row.student_id,
                studentName: row.student_name,
                startTime: row.start_time,
                endTime: row.end_time,
                subject: row.subject,
                topic: row.topic,
                status: row.status,
                notes: row.notes,
                duration: row.duration,
                color: row.color,
                contact: row.contact,
                grade: row.grade,
                lessonNotes: row.lesson_notes,
                homework: row.homework
            } as PrivateLesson));

            // Create lesson templates
            const lessonTemplates = new Map<string, PrivateLesson>();

            allLessons.forEach(lesson => {
                const lessonDate = new Date(lesson.startTime);
                const dayOfWeek = lessonDate.getDay();
                const hours = lessonDate.getHours();
                const minutes = lessonDate.getMinutes();
                const key = `${dayOfWeek}-${hours}-${minutes}-${lesson.studentId}`;

                if (!lessonTemplates.has(key) || new Date(lesson.startTime) > new Date(lessonTemplates.get(key)!.startTime)) {
                    lessonTemplates.set(key, lesson);
                }
            });

            // Project lessons onto current week
            const currentWeekLessons: PrivateLesson[] = [];

            lessonTemplates.forEach(template => {
                const templateDate = new Date(template.startTime);
                const dayOfWeek = templateDate.getDay();
                const hours = templateDate.getHours();
                const minutes = templateDate.getMinutes();

                const currentWeekDate = new Date(weekStart);
                const daysToAdd = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                currentWeekDate.setDate(currentWeekDate.getDate() + daysToAdd);
                currentWeekDate.setHours(hours, minutes, 0, 0);

                const endDate = new Date(currentWeekDate);
                endDate.setMinutes(endDate.getMinutes() + (template.duration || 60));

                // Find existing lesson with 1 minute tolerance
                const existingLesson = allLessons.find(l => {
                    const lDate = new Date(l.startTime);
                    const timeDiff = Math.abs(lDate.getTime() - currentWeekDate.getTime());
                    return timeDiff < 60000 && l.studentId === template.studentId;
                });

                if (existingLesson) {
                    // console.log('[DashboardOverview] Found existing lesson:', existingLesson.id, existingLesson.status);
                    if (existingLesson.status !== 'cancelled') {
                        currentWeekLessons.push(existingLesson);
                    }
                } else {
                    if (currentWeekDate >= weekStart) {
                        currentWeekLessons.push({
                            ...template,
                            id: `virtual-${template.id}-${currentWeekDate.getTime()}`,
                            startTime: currentWeekDate.toISOString(),
                            endTime: endDate.toISOString(),
                            status: 'scheduled',
                            lessonNotes: '',
                            homework: '',
                            topic: '',
                            notes: ''
                        });
                    }
                }
            });

            // Filter today's lessons
            const today = currentWeekLessons.filter(l => {
                const lessonDate = new Date(l.startTime);
                const lessonDateStr = lessonDate.toLocaleDateString('en-CA');

                // Show lesson if it matches today AND hasn't ended yet relative to now
                const endTime = new Date(l.endTime);
                return lessonDateStr === todayDateStr && endTime > now;
            });
            today.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

            // Upcoming lessons
            const upcoming = currentWeekLessons
                .filter(l => new Date(l.startTime) >= now)
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .slice(0, 5);

            // Calculate week end (Sunday 23:59:59)
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            console.log('[DashboardOverview] Today lessons:', today.length);
            console.log('[DashboardOverview] Upcoming lessons:', upcoming.length);

            // Count completed lessons for "Tamamlanan" card
            // SAFEST WAY: Count explicitly from raw DB data within this week range
            // Virtual lessons cannot be 'completed' anyway, so we check allLessons
            const completedLessonsCount = allLessons.filter(l => {
                const lDate = new Date(l.startTime);
                return l.status === 'completed' && lDate >= weekStart && lDate <= weekEnd;
            }).length;

            console.log('[DashboardOverview] Week stats:', {
                totalProjected: currentWeekLessons.length,
                completed: completedLessonsCount,
                today: today.length,
                weekStart: weekStart.toISOString(),
                weekEnd: weekEnd.toISOString()
            });

            setTodayLessons(today);
            setUpcomingLessons(upcoming);

            // Update stats
            setStats(prev => ({
                ...prev,
                todayLessons: today.length,
                weekLessons: currentWeekLessons.length,
                completedTests: completedLessonsCount
            }));
        } catch (error) {
            console.error('Error fetching upcoming lessons:', error);
        } finally {
            setLoadingLessons(false);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const studentIds = students.filter(s => s && s.id).map(s => s.id);
            if (studentIds.length === 0) {
                setLoadingStats(false);
                return;
            }

            // Other stats (Average Score, Pending Homework, Active Students)

            // Completed tests (for average score calculation only)
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

            setStats(prev => ({
                ...prev,
                pendingHomework: pendingCount || 0,
                averageScore: avgScore,
                activeStudents: activeCount
            }));
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchRecentActivities = async () => {
        try {
            const studentIds = students.filter(s => s && s.id).map(s => s.id);
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
        <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                        Hoş Geldiniz, {user.name}
                    </h1>
                    <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                        {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={fetchAllData}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors flex items-center gap-1.5"
                        title="Verileri Yenile"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="hidden sm:inline">Yenile</span>
                    </button>
                    <button
                        onClick={onNavigateToSchedule}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors flex items-center gap-1.5"
                    >
                        <span className="text-sm">📅</span>
                        <span>Program</span>
                    </button>
                    <button
                        onClick={onOpenMessageModal}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors flex items-center gap-1.5"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Mesaj</span>
                    </button>
                </div>
            </div>

            {/* Performance Metrics Cards */}
            {/* Performance Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Week's Lessons */}
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200 transform hover:-translate-y-1 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                            <span className="text-xl">📊</span>
                        </div>
                        <div className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full text-purple-50 border border-white/10">Bu Hafta</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold mb-1 tracking-tight">{loadingStats ? '...' : stats.weekLessons}</div>
                        <div className="text-sm text-purple-100 font-medium opacity-90">Toplam Ders Saati</div>
                    </div>
                </div>

                {/* Completed Tests */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-teal-200 transform hover:-translate-y-1 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                            <span className="text-xl">✅</span>
                        </div>
                        <div className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full text-emerald-50 border border-white/10">Tanı Testleri</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold mb-1 tracking-tight">{loadingStats ? '...' : stats.completedTests}</div>
                        <div className="text-sm text-emerald-100 font-medium opacity-90">Tamamlanan Test</div>
                    </div>
                </div>

                {/* Average Score */}
                <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl p-5 text-white shadow-lg shadow-orange-200 transform hover:-translate-y-1 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                            <span className="text-xl">🎯</span>
                        </div>
                        <div className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full text-orange-50 border border-white/10">Genel Başarı</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold mb-1 tracking-tight">{loadingStats ? '...' : `%${stats.averageScore}`}</div>
                        <div className="text-sm text-orange-100 font-medium opacity-90">Ortalama Puan</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column (2/3 width on large screens) */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Today's Lessons - Special Section */}
                    {todayLessons.length > 0 && (
                        <div className="bg-blue-50 rounded-lg border border-blue-200">
                            <div className="p-3 border-b border-blue-200 flex justify-between items-center bg-white/50">
                                <h2 className="text-sm font-semibold text-blue-900 flex items-center gap-1.5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                    </span>
                                    Bugünkü Dersler
                                </h2>
                                <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                                    {todayLessons.length}
                                </span>
                            </div>
                            <div className="p-3 space-y-2">
                                {todayLessons.map(lesson => (
                                    <div
                                        key={lesson.id}
                                        onClick={() => {
                                            const student = students.find(s => s.id === lesson.studentId);
                                            if (student) onViewStudent(student);
                                        }}
                                        className="flex items-center p-2.5 rounded-lg bg-white border border-blue-100 hover:border-blue-300 transition-colors cursor-pointer"
                                    >
                                        <div
                                            className="w-1 h-10 rounded-full mr-2.5"
                                            style={{ backgroundColor: lesson.color || '#3B82F6' }}
                                        ></div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-gray-900 truncate">{lesson.studentName}</h4>
                                            <p className="text-xs text-gray-600 truncate">{lesson.subject} • {lesson.grade}. Sınıf</p>
                                        </div>
                                        <div className="text-right pl-2">
                                            <div className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                                                {formatTime(lesson.startTime)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upcoming Lessons Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                                <span className="text-base">⏰</span> Yaklaşan Dersler
                            </h2>
                            <button
                                onClick={onNavigateToSchedule}
                                className="text-xs text-blue-600 font-medium hover:text-blue-700 flex items-center gap-0.5"
                            >
                                Tümünü Gör
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-3">
                            {loadingLessons ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    <p className="text-xs text-gray-400">Yükleniyor...</p>
                                </div>
                            ) : upcomingLessons.length > 0 ? (
                                <div className="space-y-1.5">
                                    {upcomingLessons.map(lesson => (
                                        <div
                                            key={lesson.id}
                                            onClick={() => {
                                                const student = students.find(s => s.id === lesson.studentId);
                                                if (student) onViewStudent(student);
                                            }}
                                            className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100 hover:border-gray-200 cursor-pointer"
                                        >
                                            <div
                                                className="w-0.5 h-8 rounded-full mr-2"
                                                style={{ backgroundColor: lesson.color || '#3B82F6' }}
                                            ></div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 truncate">{lesson.studentName}</h4>
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
                    {/* Quick Stats / Students Summary */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                <span className="text-xl">👥</span>
                            </div>
                            <h3 className="text-lg font-bold font-poppins text-gray-800">
                                Öğrenci Durumu
                            </h3>
                        </div>

                        <div className="space-y-3">
                            {/* Total Students */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 group hover:border-blue-200 hover:bg-blue-50/50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform text-blue-500">
                                        🎓
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">{students.length}</div>
                                        <div className="text-xs text-gray-500 font-medium group-hover:text-blue-600 transition-colors">Toplam Öğrenci</div>
                                    </div>
                                </div>
                            </div>

                            {/* Active Students */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 group hover:border-emerald-200 hover:bg-emerald-50/50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform text-emerald-500">
                                        ⚡
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">{stats.activeStudents}</div>
                                        <div className="text-xs text-gray-500 font-medium group-hover:text-emerald-600 transition-colors">Aktif Çalışan</div>
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                                    %{students.length > 0 ? Math.round((stats.activeStudents / students.length) * 100) : 0}
                                </div>
                            </div>

                            {/* Pending Homework */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 group hover:border-orange-200 hover:bg-orange-50/50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform text-orange-500">
                                        📋
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">{stats.pendingHomework}</div>
                                        <div className="text-xs text-gray-500 font-medium group-hover:text-orange-600 transition-colors">Bekleyen Ödev</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
