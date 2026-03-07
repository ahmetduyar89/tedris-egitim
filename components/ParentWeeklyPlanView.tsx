import React, { useState, useEffect } from 'react';
import { Student, WeeklyProgram, Task, TaskStatus } from '../types';
import { supabase } from '../services/dbAdapter';
import WeeklySchedule from './WeeklySchedule';

interface ParentWeeklyPlanViewProps {
    student: Student;
}

const ParentWeeklyPlanView: React.FC<ParentWeeklyPlanViewProps> = ({ student }) => {
    const [loading, setLoading] = useState(true);
    const [weeklyProgram, setWeeklyProgram] = useState<WeeklyProgram | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeeklyProgram = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch weekly program from Supabase
                const { data, error: fetchError } = await supabase
                    .from('weekly_programs')
                    .select('*')
                    .eq('student_id', student.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (fetchError) {
                    console.error('❌ Error fetching weekly program:', fetchError);
                    setError('Haftalık program yüklenirken hata oluştu');
                    return;
                }

                console.log('📅 Weekly program data:', data);

                if (data) {
                    // Transform database data to WeeklyProgram type
                    const program: WeeklyProgram = {
                        id: data.id,
                        studentId: data.student_id,
                        week: data.week || 1,
                        days: data.days || []
                    };
                    console.log('✅ Weekly program loaded:', program);
                    setWeeklyProgram(program);
                } else {
                    console.log('⚠️ No weekly program found for student:', student.id);
                    setWeeklyProgram(null);
                }
            } catch (error) {
                console.error('Error in fetchWeeklyProgram:', error);
                setError('Beklenmeyen bir hata oluştu');
            } finally {
                setLoading(false);
            }
        };

        fetchWeeklyProgram();
    }, [student.id, student.name]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">⚠️</div>
                <p className="text-red-600 font-medium">{error}</p>
            </div>
        );
    }

    if (!weeklyProgram || !weeklyProgram.days || weeklyProgram.days.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Henüz Haftalık Plan Yok</h3>
                <p className="text-gray-600">
                    Öğretmen henüz {student.name} için haftalık plan oluşturmamış.
                </p>
            </div>
        );
    }

    // Calculate statistics from days array
    const allTasks = weeklyProgram.days.flatMap(day => day.tasks || []);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === TaskStatus.Completed).length;
    const inProgressTasks = allTasks.filter(t => t.status === TaskStatus.Viewed).length;
    const pendingTasks = allTasks.filter(t => t.status === TaskStatus.Assigned).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate week dates (current week)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday

    return (
        <div className="space-y-6">
            {/* Header with Week Info */}
            <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">📅 Haftalık Çalışma Planı</h2>
                        <p className="text-white/90">
                            {weekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - {' '}
                            {weekEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold">{completionRate}%</div>
                        <div className="text-sm text-white/90">Tamamlanma</div>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm">
                    <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Toplam Görev</div>
                    <div className="text-xl sm:text-2xl font-black text-gray-900">{totalTasks}</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3 sm:p-4 border border-green-200 shadow-sm">
                    <div className="text-[10px] sm:text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Tamamlanan</div>
                    <div className="text-xl sm:text-2xl font-black text-green-900">{completedTasks}</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-200 shadow-sm">
                    <div className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Devam Eden</div>
                    <div className="text-xl sm:text-2xl font-black text-blue-900">{inProgressTasks}</div>
                </div>
                <div className="bg-yellow-50 rounded-xl p-3 sm:p-4 border border-yellow-200 shadow-sm">
                    <div className="text-[10px] sm:text-xs font-bold text-yellow-600 uppercase tracking-widest mb-1">Bekleyen</div>
                    <div className="text-xl sm:text-2xl font-black text-yellow-900">{pendingTasks}</div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Haftalık İlerleme</span>
                    <span className="text-sm font-bold text-primary">{completedTasks}/{totalTasks} Görev</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                    ></div>
                </div>
            </div>

            {/* Weekly Schedule */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">Günlük Görevler</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Çocuğunuzun haftalık çalışma programı
                    </p>
                </div>
                <div className="p-6">
                    <WeeklySchedule
                        program={weeklyProgram}
                        isInteractive={false}
                    />
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <div className="text-2xl">💡</div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-1">Bilgi</h4>
                        <p className="text-sm text-blue-800">
                            Bu haftalık plan öğretmen tarafından oluşturulmuştur. Görevlerin durumu öğrenci tarafından güncellenmektedir.
                            Çocuğunuzun düzenli olarak görevlerini tamamlamasını takip edebilirsiniz.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParentWeeklyPlanView;
