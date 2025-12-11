import React, { useMemo, useState } from 'react';
import { WeeklyProgram, Task, TaskStatus, Subject } from '../types';

interface WeeklyScheduleProps {
  program: WeeklyProgram;
  onTaskClick?: (task: Task) => void;
  isInteractive: boolean;
}

// Config now uses Tailwind classes for better maintainability and theme consistency
const subjectConfig: { [key in Subject]?: { borderColor: string; textColor: string; bgColor: string; icon: React.ReactNode } } = {
  [Subject.Mathematics]: {
    borderColor: 'border-secondary',
    textColor: 'text-secondary',
    bgColor: 'bg-red-50',
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 3h.008v.008H8.25v-.008Zm0 3h.008v.008H8.25v-.008Zm3-6h.008v.008H11.25v-.008Zm0 3h.008v.008H11.25v-.008Zm0 3h.008v.008H11.25v-.008Zm3-6h.008v.008H14.25v-.008Zm0 3h.008v.008H14.25v-.008Zm0 3h.008v.008H14.25v-.008ZM6 21a2.25 2.25 0 0 1-2.25-2.25V15a2.25 2.25 0 0 1 2.25-2.25h12A2.25 2.25 0 0 1 20.25 15v3.75a2.25 2.25 0 0 1-2.25 2.25H6Z" /></svg>
  },
  [Subject.Science]: {
    borderColor: 'border-primary',
    textColor: 'text-primary',
    bgColor: 'bg-primary/10',
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 10.5a8.85 8.85 0 0 1 6.3 2.653M3.75 10.5a8.85 8.85 0 0 0 6.3 2.653M10.5 3.75a8.85 8.85 0 0 1 6.3 2.653M3.75 3.75a8.85 8.85 0 0 0 6.3 2.653M10.5 20.25a8.85 8.85 0 0 0-6.3-2.653M20.25 20.25a8.85 8.85 0 0 1-6.3-2.653M14.25 10.5l-3.75 3.75-3.75-3.75M10.5 3.75v16.5" /></svg>
  },
  [Subject.Turkish]: {
    borderColor: 'border-accent',
    textColor: 'text-accent',
    bgColor: 'bg-amber-50',
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>
  },
};
const defaultConfig = {
  borderColor: 'border-gray-400',
  textColor: 'text-gray-500',
  bgColor: 'bg-gray-50',
  icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" /></svg>
};

const TaskCard: React.FC<{ task: Task; onClick: () => void }> = ({ task, onClick }) => {
  const config = subjectConfig[task.subject as Subject] || defaultConfig;
  const isCompleted = task.status === TaskStatus.Completed;
  const isTest = task.type === 'Test';

  const borderClass = isCompleted ? 'border-gray-400' : config.borderColor;
  const iconColorClass = isCompleted ? 'text-gray-400' : config.textColor;
  const bgColorClass = isCompleted ? 'bg-gray-100' : config.bgColor;

  const testIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
    </svg>
  );

  const displayTitle = task.title || task.description || 'Başlıksız Görev';
  const displayType = task.type || '';

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl flex items-center justify-between transition-all duration-300 transform hover:scale-105 cursor-pointer shadow-sm hover:shadow-md border-l-[5px] ${bgColorClass} ${borderClass}`}
    >
      <div className="flex items-center space-x-4">
        <div className={iconColorClass}>{isTest ? testIcon : config.icon}</div>
        <div>
          <p className={`font-semibold ${isCompleted ? 'line-through text-gray-500' : 'text-text-primary'}`}>
            {displayType && `${displayType}: `}'{displayTitle}'
          </p>
          <div className="flex items-center space-x-2 mt-1">
            {isTest && task.metadata?.totalQuestions && (
              <span className="text-xs font-medium text-gray-700">{task.metadata.totalQuestions} Soru</span>
            )}
            {isTest && !isCompleted && <span className="text-xs font-bold text-blue-600 px-2 py-0.5 rounded-full bg-blue-50">Test</span>}
            {task.isCompletionTask && <span className="text-xs font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10">AI Görevi</span>}
            {task.ai_recommended && !task.isCompletionTask && <span className="text-xs font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10">AI Önerisi</span>}
          </div>
        </div>
      </div>
      {isTest && !isCompleted ? (
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors">
          Sınava Başla
        </button>
      ) : (
        <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isCompleted ? 'bg-success text-white' : 'border-2 border-gray-300 text-gray-300 hover:border-success hover:text-success'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </button>
      )}
    </div>
  );
};


const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({ program, onTaskClick, isInteractive }) => {
  const [viewMode, setViewMode] = useState<'today' | 'weekly'>('today');

  const { weeklyTotal, dailyTotals, completedCount, todaysTasks, completionPercentage, dailyCompletionPercentage, todayCompletedCount, todayTotalCount } = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    const daily: { [day: string]: { total: number, completed: number } } = {};
    const dayOfWeek = new Date().toLocaleString('tr-TR', { weekday: 'long' });
    let today: Task[] = [];
    let todayCompleted = 0;
    let todayTotal = 0;

    (program.days || []).forEach(day => {
      const tasks = day.tasks || [];
      let dayTotal = 0;
      let dayCompleted = 0;
      tasks.forEach(task => {
        dayTotal++;
        if (task.status === TaskStatus.Completed) {
          dayCompleted++;
        }
      });
      daily[day.day] = { total: dayTotal, completed: dayCompleted };
      totalTasks += dayTotal;
      completedTasks += dayCompleted;

      if (day.day.toLowerCase() === dayOfWeek.toLowerCase()) {
        today = tasks;
        todayCompleted = dayCompleted;
        todayTotal = dayTotal;
      }
    });

    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const dailyPercentage = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;
    return {
      weeklyTotal: totalTasks,
      dailyTotals: daily,
      completedCount: completedTasks,
      todaysTasks: today,
      completionPercentage: percentage,
      dailyCompletionPercentage: dailyPercentage,
      todayCompletedCount: todayCompleted,
      todayTotalCount: todayTotal
    };
  }, [program]);

  const progressColor = completionPercentage > 80 ? 'var(--tw-color-success)' : completionPercentage > 40 ? 'var(--tw-color-accent)' : 'var(--tw-color-secondary)';
  const dailyProgressColor = dailyCompletionPercentage > 80 ? '#10b981' : dailyCompletionPercentage > 40 ? '#F5C542' : '#F05039';

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
        <h2 className="text-2xl font-bold font-poppins mb-1 flex items-center gap-2">
          <span className="bg-white/20 p-1.5 rounded-lg text-white">📅</span>
          Haftalık Plan
        </h2>
        <p className="text-blue-100 text-sm mb-4">{isInteractive ? `Bugün ${todaysTasks.length} görevin var.` : `${completedCount} / ${weeklyTotal} görev tamamlandı.`}</p>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-blue-100">Günlük İlerleme</span>
              <span className="text-xs font-bold text-white">{todayCompletedCount}/{todayTotalCount} ({dailyCompletionPercentage}%)</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden border border-white/10">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out bg-white"
                style={{
                  width: `${dailyCompletionPercentage}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-blue-100">Haftalık İlerleme</span>
              <span className="text-xs font-bold text-white">{completedCount}/{weeklyTotal} ({completionPercentage}%)</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden border border-white/10">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out bg-green-400"
                style={{
                  width: `${completionPercentage}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-card-background">
        <div className="mb-6">
          <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => setViewMode('today')}
              className={`w-1/2 py-2 rounded-lg font-bold text-sm transition-all ${viewMode === 'today' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Bugünün Görevleri
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`w-1/2 py-2 rounded-lg font-bold text-sm transition-all ${viewMode === 'weekly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Haftalık Bakış
            </button>
          </div>
        </div>

        {viewMode === 'today' && (
          <div className="space-y-3 animate-fade-in">
            <h3 className="font-bold font-poppins text-lg text-gray-800 flex items-center gap-2 mb-3">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
              Bugün
            </h3>
            {todaysTasks.length > 0 ? (
              todaysTasks.map(task => <TaskCard key={task.id} task={task} onClick={() => isInteractive && onTaskClick?.(task)} />)
            ) : (
              <p className="text-gray-500 p-8 bg-gray-50 rounded-xl text-center border border-dashed border-gray-200">
                <span className="block text-4xl mb-2">🎉</span>
                Bugün için planlanmış bir görevin yok. Harika bir gün!
              </p>
            )}
          </div>
        )}

        {viewMode === 'weekly' && (
          <div className="space-y-6 animate-fade-in">
            {program.days.map((day) => {
              const tasks = day.tasks || [];
              return (
                <div key={day.day}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold font-poppins text-md text-gray-700">{day.day}</h3>
                    {dailyTotals[day.day]?.total > 0 && (
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                        {dailyTotals[day.day].completed} / {dailyTotals[day.day].total} Görev
                      </span>
                    )}
                  </div>
                  {tasks.length > 0 ? (
                    <div className="space-y-2">
                      {tasks.map(task => {
                        const isCompleted = task.status === TaskStatus.Completed;
                        const config = subjectConfig[task.subject as Subject] || defaultConfig;
                        const displayTitle = task.title || task.description || 'Başlıksız Görev';
                        const displayType = task.type || '';
                        return (
                          <div key={task.id} onClick={() => isInteractive && onTaskClick?.(task)} className={`flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-blue-200 hover:shadow-sm transition-all ${isCompleted ? 'bg-gray-50' : 'bg-white border-gray-100 shadow-sm'} ${isInteractive ? 'cursor-pointer' : ''}`}>
                            <div className="flex items-center space-x-3">
                              <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-gray-400' : 'bg-blue-500'}`}></div>
                              <div>
                                <span className={`block font-medium text-sm ${isCompleted ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                  {displayType && `${displayType}: `}{displayTitle}
                                </span>
                                <span className="text-xs text-gray-400">{task.duration} dk · {task.subject}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {task.isCompletionTask && <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">AI</span>}
                              {isCompleted && <span className="text-green-500 text-lg">✓</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Görev yok.</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklySchedule;