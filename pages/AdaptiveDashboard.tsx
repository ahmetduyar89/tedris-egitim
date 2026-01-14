import React, { useState, useEffect } from 'react';
import { User, Student } from '../types';
import { assessmentService } from '../services/assessmentService';

interface AdaptiveDashboardProps {
    user: User;
    student: Student;
    onStartTest: () => void;
}

const LockedOverlay: React.FC<{ title: string }> = ({ title }) => (
    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center p-6 text-center rounded-3xl border-2 border-dashed border-primary/30 animate-fade-in">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-4 animate-bounce">
            👑
        </div>
        <h4 className="text-xl font-black text-gray-800 mb-2">{title}</h4>
        <p className="text-gray-600 text-sm max-w-[240px] mb-6 font-medium">Bu özellik sadece Premium üyelerimize özeldir. Hemen yükseltin!</p>
        <button className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-xl hover:shadow-2xl active:scale-95 flex items-center gap-2">
            <span>Premium'a Geç</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </button>
    </div>
);

const AdaptiveDashboard: React.FC<AdaptiveDashboardProps> = ({ user, student, onStartTest }) => {
    const [todayTasks, setTodayTasks] = useState<any[]>([]);
    const [weakTopics, setWeakTopics] = useState<any[]>([]);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const isPremium = student.isPremium || false;

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [tasks, scores, prog] = await Promise.all([
                    assessmentService.getTodayTasks(user.id),
                    assessmentService.getStudentScores(user.id),
                    assessmentService.getOverallProgress(user.id)
                ]);
                setTodayTasks(tasks);
                setWeakTopics(scores.slice(0, 3)); // Top 3 weak topics
                setProgress(prog);
            } catch (error) {
                console.error('Error loading adaptive dashboard:', error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, [user.id]);

    const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
        if (!isPremium) return;
        try {
            await assessmentService.toggleTaskCompletion(taskId, !currentStatus);
            setTodayTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentStatus } : t));

            // Re-calculate progress
            const newProg = await assessmentService.getOverallProgress(user.id);
            setProgress(newProg);
        } catch (error) {
            console.error('Task update failed:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin h-10 w-10 border-b-2 border-primary rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 font-sans">
            {/* Header Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Progress Card */}
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden group">
                    {!isPremium && <LockedOverlay title="İlerleme Takibi" />}
                    <div className={`relative z-10 transition-all duration-500 ${!isPremium ? 'blur-md opacity-30 scale-95' : ''}`}>
                        <h3 className="text-gray-500 font-bold uppercase tracking-wider text-sm mb-4">Haftalık İlerleme</h3>
                        <div className="flex items-end gap-3 mb-6">
                            <span className="text-6xl font-black text-primary">%{progress}</span>
                            <span className="text-gray-400 font-medium mb-2">Tamamlandı</span>
                        </div>
                        <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-1000"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" /></svg>
                    </div>
                </div>

                {/* Weak Topics Card - ALWAYS UNLOCKED */}
                <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 p-8 rounded-3xl shadow-xl text-white">
                    <h3 className="text-indigo-200 font-bold uppercase tracking-wider text-sm mb-6 flex justify-between items-center">
                        <span>Gelişim Alanları</span>
                        <span className="bg-indigo-500/30 px-2 py-1 rounded-lg text-xs">Analiz Açık</span>
                    </h3>
                    {weakTopics.length > 0 ? (
                        <div className="space-y-4">
                            {weakTopics.map(topic => (
                                <div key={topic.topic} className="flex items-center justify-between bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${topic.subject === 'math' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'}`}>
                                            {topic.subject === 'math' ? '🔢' : '🧬'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{topic.topic}</p>
                                            <p className="text-xs text-indigo-300 capitalize">{topic.subject}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-indigo-300 font-bold">Accuracy</p>
                                        <p className="font-black text-rose-400">%{topic.accuracy}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-indigo-200 mb-6">Henüz bir analiz bulunmuyor.</p>
                            <button
                                onClick={onStartTest}
                                className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all"
                            >
                                Tanı Testini Başlat
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Daily Tasks */}
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
                {!isPremium && <LockedOverlay title="Kişiselleştirilmiş Çalışma Programı" />}
                <div className={`transition-all duration-500 ${!isPremium ? 'blur-lg opacity-20 pointer-events-none' : ''}`}>
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-gray-800">Bugünkü Hedeflerin</h2>
                            <p className="text-gray-500 font-medium">Başarıya giden yol, günlük küçük adımlardan geçer.</p>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-black text-gray-800">
                                {todayTasks.filter(t => t.completed).length} / {todayTasks.length}
                            </span>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Görevler</p>
                        </div>
                    </div>

                    {todayTasks.length > 0 ? (
                        <div className="grid gap-4">
                            {todayTasks.map(task => (
                                <div
                                    key={task.id}
                                    className={`flex items-center gap-6 p-6 rounded-2xl border-2 transition-all ${task.completed ? 'bg-gray-50 border-transparent opacity-60' : 'bg-white border-gray-50 hover:border-primary shadow-sm'
                                        }`}
                                >
                                    <button
                                        onClick={() => handleToggleTask(task.id, task.completed)}
                                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 hover:border-primary text-transparent'
                                            }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </button>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${task.subject === 'math' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                                                }`}>
                                                {task.subject}
                                            </span>
                                            <h4 className={`font-bold ${task.completed ? 'line-through text-gray-400' : 'text-gray-800 text-lg'}`}>
                                                {task.topic}
                                            </h4>
                                        </div>
                                        <p className={`text-sm ${task.completed ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {task.task_description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-3xl p-12 text-center">
                            <div className="text-6xl mb-4">☀️</div>
                            <h4 className="text-xl font-bold text-gray-800 mb-2">Bugün için görev planlanmamış.</h4>
                            <p className="text-gray-500 max-w-sm mx-auto">Yeni bir program oluşturmak için tanı testini tekrar çözebilir veya mevcut konuları tekrar edebilirsin.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdaptiveDashboard;
