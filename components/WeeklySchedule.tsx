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
    <div className="bg-card-background p-6 rounded-2xl shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold font-poppins text-primary mb-4">Tedris Plan</h2>
        <p className="text-text-secondary mb-4">{isInteractive ? `Bugün ${todaysTasks.length} görevin var.` : `${completedCount} / ${weeklyTotal} görev tamamlandı.`}</p>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">Günlük İlerleme</span>
              <span className="text-sm font-bold" style={{color: dailyProgressColor}}>{todayCompletedCount}/{todayTotalCount} ({dailyCompletionPercentage}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${dailyCompletionPercentage}%`,
                  backgroundColor: dailyProgressColor
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">Haftalık İlerleme</span>
              <span className="text-sm font-bold" style={{color: progressColor}}>{completedCount}/{weeklyTotal} ({completionPercentage}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${completionPercentage}%`,
                  backgroundColor: progressColor
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex bg-gray-100 rounded-full p-1">
          <button onClick={() => setViewMode('today')} className={`w-1/2 py-2 rounded-full font-semibold transition-colors ${viewMode === 'today' ? 'bg-primary text-white shadow' : 'text-text-secondary'}`}>Bugünün Görevleri</button>
          <button onClick={() => setViewMode('weekly')} className={`w-1/2 py-2 rounded-full font-semibold transition-colors ${viewMode === 'weekly' ? 'bg-primary text-white shadow' : 'text-text-secondary'}`}>Haftalık Bakış</button>
        </div>
      </div>

      {viewMode === 'today' && (
        <div className="space-y-3 animate-fade-in">
          <h3 className="font-bold font-poppins text-lg text-gray-800">Bugün</h3>
          {todaysTasks.length > 0 ? (
            todaysTasks.map(task => <TaskCard key={task.id} task={task} onClick={() => isInteractive && onTaskClick?.(task)} />)
          ) : (
            <p className="text-text-secondary p-4 bg-gray-50 rounded-lg text-center">Bugün için planlanmış bir görevin yok. Harika bir gün!</p>
          )}
        </div>
      )}

      {viewMode === 'weekly' && (
        <div className="space-y-4 animate-fade-in">
          {program.days.map((day) => {
            const tasks = day.tasks || [];
            return (
              <div key={day.day}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold font-poppins text-lg text-gray-800">{day.day}</h3>
                  {dailyTotals[day.day]?.total > 0 && (
                      <span className="text-sm font-semibold text-text-secondary bg-gray-100 px-2 py-1 rounded-md">
                          {dailyTotals[day.day].completed} / {dailyTotals[day.day].total} dk
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
                          <div key={task.id} onClick={() => isInteractive && onTaskClick?.(task)} className={`flex items-center justify-between p-3 rounded-lg ${isCompleted ? 'bg-gray-100' : config.bgColor} ${isInteractive ? 'cursor-pointer' : ''}`}>
                            <div className="flex items-center space-x-2">
                                <span className={`font-medium text-sm ${isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                  {displayType && `${displayType}: `}'{displayTitle}' ({task.duration} dk)
                                </span>
                                {task.isCompletionTask && <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">AI Görevi</span>}
                            </div>
                            {isCompleted && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                          </div>
                        )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Görev yok.</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
};

export default WeeklySchedule;