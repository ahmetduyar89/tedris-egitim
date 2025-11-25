import React, { useMemo } from 'react';
import { Student, WeeklyProgram, Test } from '../types';
import * as Recharts from 'recharts';

const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } = Recharts;

interface WeeklyReportProps {
    student: Student;
    weeklyProgram: WeeklyProgram;
    completedTests: Test[];
    onExport: () => void;
}

const WeeklyReport: React.FC<WeeklyReportProps> = ({ student, weeklyProgram, completedTests, onExport }) => {
    const taskCompletionData = useMemo(() => {
        if (!weeklyProgram) return [];
        return weeklyProgram.days.map(day => {
            const tasks = day.tasks || [];
            const total = tasks.length;
            const completed = tasks.filter(t => t.status === 'tamamlandı').length;
            return {
                name: day.day.substring(0, 3),
                tamamlanan: completed,
                toplam: total,
            };
        });
    }, [weeklyProgram]);

    const historicalProgressData = useMemo(() => {
        const reports = student.progressReports || [];
        const completed = completedTests || [];
        
        const progress = reports.map(r => ({
            name: new Date(r.weekStartDate).toLocaleDateString('tr-TR'),
            Puan: r.currentScore,
        }));
        
        if (completed.length > 0 && completed[0].submissionDate && completed[0].score) {
            const mostRecentTestDate = new Date(completed[0].submissionDate).toLocaleDateString('tr-TR');
            if (!progress.some(p => p.name === mostRecentTestDate)) {
                progress.push({
                    name: mostRecentTestDate,
                    Puan: completed[0].score,
                });
            }
        }
        return progress.slice(-5);
    }, [student, completedTests]);

    return (
        <div id="weekly-report-content" className="bg-card-background p-6 rounded-2xl shadow-lg space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-text-primary">Haftalık İlerleme Raporu</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="font-semibold text-lg mb-4">Günlük Görev Tamamlama</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={taskCompletionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false}/>
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="tamamlanan" fill="#10B981" name="Tamamlanan Görev" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                 <div>
                    <h3 className="font-semibold text-lg mb-4">Test Performans Gelişimi</h3>
                    {historicalProgressData.length > 1 ? (
                        <ResponsiveContainer width="100%" height={300}>
                           <LineChart data={historicalProgressData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 100]}/>
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="Puan" stroke="#3B82F6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : <p className="text-gray-500 text-center flex items-center justify-center h-[300px]">Gelişim grafiği için yeterli veri yok.</p>}
                 </div>
            </div>
             <div className="text-center mt-4">
                <button onClick={onExport} className="bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-dark transition-colors">Raporu PDF Olarak İndir</button>
            </div>
        </div>
    );
};

export default WeeklyReport;