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
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ user, students, onNavigateToSchedule, onViewStudent }) => {
    const [upcomingLessons, setUpcomingLessons] = useState<PrivateLesson[]>([]);
    const [loadingLessons, setLoadingLessons] = useState(true);

    useEffect(() => {
        const fetchUpcomingLessons = async () => {
            try {
                const now = new Date().toISOString();
                const { data, error } = await supabase
                    .from('private_lessons')
                    .select('*')
                    .eq('tutor_id', user.id)
                    .gte('start_time', now)
                    .neq('status', 'cancelled')
                    .order('start_time', { ascending: true })
                    .limit(5);

                if (error) throw error;

                if (data) {
                    setUpcomingLessons(data.map(l => ({
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
                    } as PrivateLesson)));
                }
            } catch (error) {
                console.error('Error fetching upcoming lessons:', error);
            } finally {
                setLoadingLessons(false);
            }
        };

        fetchUpcomingLessons();
    }, [user.id]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('tr-TR', {
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-poppins text-gray-900">Hoş Geldiniz, {user.name}</h1>
                    <p className="text-gray-500 mt-1">
                        {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onNavigateToSchedule}
                        className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                    >
                        <span>📅</span>
                        <span>Programı Düzenle</span>
                    </button>
                    {/* Add more quick actions here if needed */}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (2/3 width on large screens) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Upcoming Lessons Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-bold font-poppins text-gray-800 flex items-center gap-2">
                                <span className="text-xl">⏰</span> Yaklaşan Dersler
                            </h2>
                            <button
                                onClick={onNavigateToSchedule}
                                className="text-sm text-primary font-medium hover:underline"
                            >
                                Tümünü Gör
                            </button>
                        </div>
                        <div className="p-4">
                            {loadingLessons ? (
                                <div className="text-center py-8 text-gray-400">Yükleniyor...</div>
                            ) : upcomingLessons.length > 0 ? (
                                <div className="space-y-3">
                                    {upcomingLessons.map(lesson => (
                                        <div key={lesson.id} className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 hover:border-gray-200 group">
                                            <div
                                                className="w-2 h-12 rounded-full mr-4"
                                                style={{ backgroundColor: lesson.color || '#3B82F6' }}
                                            ></div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 truncate">{lesson.studentName}</h4>
                                                <p className="text-sm text-gray-500 truncate">{lesson.subject} • {lesson.grade}. Sınıf</p>
                                            </div>
                                            <div className="text-right pl-4">
                                                <div className="font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg text-sm">
                                                    {formatDate(lesson.startTime)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
                                    <p className="text-gray-500 font-medium">Yaklaşan ders bulunmuyor.</p>
                                    <button
                                        onClick={onNavigateToSchedule}
                                        className="mt-2 text-sm text-primary font-semibold"
                                    >
                                        + Ders Programla
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Risk Alerts */}
                    <RiskAlertsPanel students={students} onViewStudent={onViewStudent} />
                </div>

                {/* Right Column (1/3 width) */}
                <div className="space-y-8">
                    {/* Revenue/Financial Overview */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1">
                        <RevenueOverview tutorId={user.id} students={students} />
                    </div>

                    {/* Quick Stats / Students Summary */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg text-white p-6 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold font-poppins mb-4 text-white/90">Öğrenci Durumu</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                    <div className="text-3xl font-bold mb-1">{students.length}</div>
                                    <div className="text-xs text-white/60">Toplam Öğrenci</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                    <div className="text-3xl font-bold mb-1 text-green-400">
                                        {students.filter(s => s.xp > 500).length} {/* Arbitrary 'Active' metric for visual */}
                                    </div>
                                    <div className="text-xs text-white/60">Aktif Çalışan</div>
                                </div>
                            </div>
                        </div>
                        {/* Decor */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl -ml-16 -mb-16"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
